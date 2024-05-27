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

MONGO_URI = os.getenv("MONGO_URI")
JOB_NAMESPACE = os.getenv("JOB_NAMESPACE", "sc4snmp")
JOB_CREATION_RETRIES = int(os.getenv("JOB_CREATION_RETRIES", 10))
JOB_CONFIG_PATH = os.getenv("JOB_CONFIG_PATH", "/config/job_config.yaml")
celery_logger = get_task_logger(__name__)

def get_job_config():
    """
    :return: job - configuration of the job
             batch_v1 - BatchV1Api object from kubernetes client
    """
    job = None
    batch_v1 = None
    with open(JOB_CONFIG_PATH, encoding="utf-8") as file:
        config_file = yaml.safe_load(file)
        if config_file["apiVersion"] != "batch/v1":
            raise ValueError("api version is different from batch/v1")
        config.load_incluster_config()
        batch_v1 = client.BatchV1Api()
        job = create_job_object(config_file)
    return job, batch_v1

@shared_task()
def run_job():
    job, batch_v1 = get_job_config()
    if job is None or batch_v1 is None:
        raise ValueError("Scheduled kubernetes job: Job configuration is empty")

    with MongoClient(MONGO_URI) as connection:
        try_creating = True
        iteration = 0
        while try_creating and iteration < JOB_CREATION_RETRIES:
            # Try creating a new job. If the previous job is still present in the namespace,
            # ApiException will we be raised. In that happens wait for 10 seconds and try creating the job again
            try:
                create_job(batch_v1, job, JOB_NAMESPACE)
                try_creating = False
                try:
                    record = list(connection.sc4snmp.config_collection.find())[0]
                    connection.sc4snmp.config_collection.update_one({"_id": record["_id"]},
                                                   {"$set": {"previous_job_start_time": datetime.datetime.utcnow(),
                                                             "currently_scheduled": False,
                                                             "task_id": None}})
                except Exception as e:
                    celery_logger.info(f"Error occurred while updating job state after job creation: {str(e)}")
            except ApiException:
                iteration += 1
                if iteration == JOB_CREATION_RETRIES:
                    try_creating = False
                    celery_logger.info(f"Kubernetes job was not created. Max retries ({JOB_CREATION_RETRIES}) exceeded.")
                    record = list(connection.sc4snmp.config_collection.find())[0]
                    connection.sc4snmp.config_collection.update_one({"_id": record["_id"]},
                                                                    {"$set": {"currently_scheduled": False, "task_id": None}})
                else:
                    time.sleep(10)
