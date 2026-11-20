import time
from celery import shared_task
import datetime
from kubernetes import client, config
import yaml
from kubernetes.client import ApiException
from SC4SNMP_UI_backend.apply_changes.kubernetes_job import create_job_object, create_job
from pymongo import MongoClient
import os
from celery.utils.log import get_task_logger
from SC4SNMP_UI_backend.common.change_tracking import get_job_state, set_job_state, mark_applied

MONGO_URI = os.getenv("MONGO_URI")
JOB_NAMESPACE = os.getenv("JOB_NAMESPACE", "sc4snmp")
JOB_CREATION_RETRIES = int(os.getenv("JOB_CREATION_RETRIES", 10))
JOB_CONFIG_PATH = os.getenv("JOB_CONFIG_PATH", "/config/job_config.yaml")
DISCOVERY_JOB_CONFIG_PATH = os.getenv("DISCOVERY_JOB_CONFIG_PATH", "/config/discovery_job_config.yaml")
celery_logger = get_task_logger(__name__)

class JobNotConfiguredException(Exception):
    def __init__(self, job_type):
        self.job_type = job_type
        self.message = f"Kubernetes job configuration for {job_type} is not available."
        super().__init__(self.message)


def get_job_config_path(job_type="inventory"):
    if job_type == "discovery":
        return DISCOVERY_JOB_CONFIG_PATH
    return JOB_CONFIG_PATH


def job_available(job_type):
    """
    Inventory job is always available. The discovery job manifest is rendered by the helm chart only when
    discovery.enabled is true, so its absence means that discovery is disabled.
    """
    return job_type != "discovery" or os.path.exists(DISCOVERY_JOB_CONFIG_PATH)


def get_job_config(job_type="inventory"):
    """
    :return: job - configuration of the job
             batch_v1 - BatchV1Api object from kubernetes client
    """
    path = get_job_config_path(job_type)
    if not job_available(job_type):
        raise JobNotConfiguredException(job_type)
    with open(path, encoding="utf-8") as file:
        config_file = yaml.safe_load(file)
    if not isinstance(config_file, dict):
        raise JobNotConfiguredException(job_type)
    if config_file["apiVersion"] != "batch/v1":
        raise ValueError("api version is different from batch/v1")
    config.load_incluster_config()
    batch_v1 = client.BatchV1Api()
    job = create_job_object(config_file)
    return job, batch_v1


@shared_task()
def run_job(job_type="inventory"):
    job, batch_v1 = get_job_config(job_type)
    if job is None or batch_v1 is None:
        raise ValueError("Scheduled kubernetes job: Job configuration is empty")

    with MongoClient(MONGO_URI) as connection:
        config_collection = connection.sc4snmp.config_collection
        try_creating = True
        iteration = 0
        while try_creating and iteration < JOB_CREATION_RETRIES:
            # Try creating a new job. If the previous job is still present in the namespace,
            # ApiException will we be raised. In that happens wait for 10 seconds and try creating the job again
            try:
                create_job(batch_v1, job, JOB_NAMESPACE)
                try_creating = False
                try:
                    state = get_job_state(job_type, config_collection)
                    set_job_state(job_type, config_collection,
                                  previous_job_start_time=datetime.datetime.utcnow(),
                                  currently_scheduled=False, task_id=None)
                    # values.yaml was saved at pending_revision by the apply that scheduled this task
                    mark_applied(job_type, state.get("pending_revision", 0), config_collection)
                except Exception as e:
                    celery_logger.info(f"Error occurred while updating job state after job creation: {str(e)}")
            except ApiException:
                iteration += 1
                if iteration == JOB_CREATION_RETRIES:
                    try_creating = False
                    celery_logger.info(f"Kubernetes job was not created. Max retries ({JOB_CREATION_RETRIES}) exceeded.")
                    set_job_state(job_type, config_collection, currently_scheduled=False, task_id=None)
                else:
                    time.sleep(10)
