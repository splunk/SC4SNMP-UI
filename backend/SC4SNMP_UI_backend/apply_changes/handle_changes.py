import time
from abc import abstractmethod, ABC
from celery import shared_task
from threading import Lock
import datetime
import os
from kubernetes import client, config
import yaml
from kubernetes.client import ApiException
from SC4SNMP_UI_backend import mongo_client
from SC4SNMP_UI_backend.apply_changes.kubernetes_job import create_job_object, create_job
from pymongo import MongoClient
from celery.utils.log import get_task_logger

CHANGES_INTERVAL_SECONDS = 300
MONGO_URI = os.getenv("MONGO_URI")
JOB_CONFIG_PATH = os.getenv("JOB_CONFIG_PATH", "/config/job_config.yaml")
JOB_NAMESPACE = os.getenv("JOB_NAMESPACE", "sc4snmp")
JOB_CREATION_RETRIES = int(os.getenv("JOB_CREATION_RETRIES", 10))
mongo_config_collection = mongo_client.sc4snmp.config_collection
logger = get_task_logger(__name__)

class Handler(ABC):
    @abstractmethod
    def set_next(self, handler):
        pass

    @abstractmethod
    def handle(self, request):
        pass


class AbstractHandler(Handler):
    _next_handler: Handler = None
    def set_next(self, handler: Handler) -> Handler:
        self._next_handler = handler
        return handler

    @abstractmethod
    def handle(self, request: dict):
        if self._next_handler:
            return self._next_handler.handle(request)
        return None


class CheckJobHandler(AbstractHandler):
    def handle(self, request: dict=None):
        """
        CheckJobHandler checks whether a new kubernetes job with updated sc4snmp configuration can be run immediately
         or should it be scheduled for the future.

        :return: pass dictionary with job_delay in seconds to the next handler
        """
        record = list(mongo_config_collection.find())[0]
        last_update = record["previous_job_start_time"]
        if last_update is None:
            # If it's the first time that the job is run (record in mongo_config_collection has been created
            # in ApplyChanges class and last_update attribute is None) then job delay should be equal to
            # CHANGES_INTERVAL_SECONDS. Update the mongo record with job state accordingly.
            job_delay = CHANGES_INTERVAL_SECONDS
            mongo_config_collection.update_one({"_id": record["_id"]},
                                               {"$set": {"previous_job_start_time": datetime.datetime.utcnow()}})
            # time from the last update
            time_difference = 0
        else:
            # Check how many seconds have elapsed since the last time that the job was run. If the time difference
            # is greater than CHANGES_INTERVAL_SECONDS then job can be run immediately. Otherwise, calculate how
            # many seconds are left until minimum time difference between updates (CHANGES_INTERVAL_SECONDS).
            current_time = datetime.datetime.utcnow()
            delta = current_time - last_update
            time_difference = delta.total_seconds()
            if time_difference > CHANGES_INTERVAL_SECONDS:
                job_delay = 1
            else:
                job_delay = int(CHANGES_INTERVAL_SECONDS-time_difference)

        result = {
            "job_delay": job_delay,
            "time_from_last_update": time_difference
        }

        return super().handle(result)

class CheckIfPreviousJobFailed(AbstractHandler):
    def handle(self, request: dict):
        """
        If previously scheduled task had failed to create the kubernetes job, then currently_scheduled parameter in mongo
        would still be set to True. In this scenario the new job will never be scheduled. CheckIfPreviousJobFailed checks
        whether this situation happened and if so, updates currently_scheduled to False.
        :param request:
        :return:
        """
        record = list(mongo_config_collection.find())[0]
        time_from_last_update = request["time_from_last_update"]
        if time_from_last_update > CHANGES_INTERVAL_SECONDS+10*JOB_CREATION_RETRIES and record["currently_scheduled"]:
            # if currently_scheduled is set to True and time_from_last_update is greater than CHANGES_INTERVAL_SECONDS
            # plus JOB_CREATION_RETRIES times 10s of wait time between retries, then previous task failed to create the job.
            mongo_config_collection.update_one({"_id": record["_id"]},
                                               {"$set": {"currently_scheduled": False}})
        return super().handle(request)


class ScheduleHandler(AbstractHandler):
    def handle(self, request: dict):
        """
        ScheduleHandler schedules the kubernetes job with updated sc4snmp configuration
        """
        record = list(mongo_config_collection.find())[0]
        if not record["currently_scheduled"]:
            # If the task isn't currently scheduled, schedule it and update its state in mongo.
            mongo_config_collection.update_one({"_id": record["_id"]},
                                         {"$set": {"currently_scheduled": True}})
            run_job.apply_async(countdown=request["job_delay"], queue='apply_changes')
        return request["job_delay"]


class SingletonMeta(type):
    _instances = {}
    _lock: Lock = Lock()

    def __call__(cls, *args, **kwargs):
        with cls._lock:
            if cls not in cls._instances:
                instance = super().__call__(*args, **kwargs)
                cls._instances[cls] = instance
        return cls._instances[cls]

class ApplyChanges(metaclass=SingletonMeta):
    def __init__(self) -> None:
        """
        ApplyChanges is a singleton responsible for creating mongo record with a current state of kubernetes job.
        Structure of the record:
        {
            "previous_job_start_time": datetime.datetime or None if job hasn't been scheduled yet,
            "currently_scheduled": bool
        }
        """
        self.__handling_chain = CheckJobHandler()
        previous_job_failure = CheckIfPreviousJobFailed()
        schedule_handler = ScheduleHandler()
        self.__handling_chain.set_next(previous_job_failure).set_next(schedule_handler)
        mongo_config_collection.update_one(
            {
                "previous_job_start_time": {"$exists": True},
                "currently_scheduled": {"$exists": True}}
            ,{
                "$set":{
                    "previous_job_start_time": None,
                    "currently_scheduled": False
                }
            },
            upsert=True
        )


    def apply_changes(self):
        """
        Run chain of actions to schedule new kubernetes job.
        """
        job_delay = self.__handling_chain.handle()
        return job_delay

@shared_task()
def run_job():
    job = None
    batch_v1 = None
    with open(JOB_CONFIG_PATH, encoding="utf-8") as file:
        config_file = yaml.safe_load(file)
        if config_file["apiVersion"] != "batch/v1":
            raise ValueError("api version is different from batch/v1")
        config.load_incluster_config()
        batch_v1 = client.BatchV1Api()
        job = create_job_object(config_file)

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
                                                           "currently_scheduled": False}})
                except Exception as e:
                    logger.info(f"Error occurred while updating job state after job creation: {str(e)}")
            except ApiException:
                iteration += 1
                if iteration == JOB_CREATION_RETRIES:
                    logger.info(f"Kubernetes job was not created. Max retries ({JOB_CREATION_RETRIES}) exceeded.")
                else:
                    time.sleep(10)

