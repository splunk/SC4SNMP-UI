from abc import abstractmethod, ABC
import ruamel.yaml
from flask import current_app
from SC4SNMP_UI_backend import mongo_client
from SC4SNMP_UI_backend.apply_changes.tasks import run_job, get_job_config
from SC4SNMP_UI_backend.apply_changes.kubernetes_job import create_job
from kubernetes.client import ApiException
import datetime
import os


CHANGES_INTERVAL_SECONDS = 300
TMP_FILE_PREFIX = "sc4snmp_ui_"
TMP_DIR = "/tmp"
VALUES_DIRECTORY = os.getenv("VALUES_DIRECTORY", "")
VALUES_FILE = os.getenv("VALUES_FILE", "")
KEEP_TEMP_FILES = os.getenv("KEEP_TEMP_FILES", "false")
JOB_NAMESPACE = os.getenv("JOB_NAMESPACE", "sc4snmp")
mongo_config_collection = mongo_client.sc4snmp.config_collection
mongo_groups = mongo_client.sc4snmp.groups_ui
mongo_inventory = mongo_client.sc4snmp.inventory_ui
mongo_profiles = mongo_client.sc4snmp.profiles_ui


class EmptyValuesFileException(Exception):
    def __init__(self, filename):
        self.message = f"{filename} cannot be empty. Check sc4snmp documentation for template."
        super().__init__(self.message)

class YamlParserException(Exception):
    def __init__(self, filename):
        self.message = f"Error occurred while reading {filename}. Check yaml syntax."
        super().__init__(self.message)

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


class SaveConfigToFileHandler(AbstractHandler):
    def handle(self, request: dict):
        """
        SaveConfigToFileHandler saves current configuration of profiles, groups and inventory from mongo
        to files on the host machine.

        :param request: dictionary with at least one key "yaml_sections". Under this key there should be dictionary
        with the following structure
        {
            "key.to.section": (mongo_collection, MongoToYamlDictConversion, TempFileHandling)
        }
        where:
            - "key.to.section": a key to section of values.yaml file that should be updated (e.g. "scheduler.profiles")
            - mongo_collection: mongo collection with configuration of given section
            - MongoToYamlDictConversion: implementation of this abstract class
            - TempFileHandling: implementation of this abstract class
        """

        yaml = ruamel.yaml.YAML()
        values_file_resolved = True
        values_file_path = os.path.join(VALUES_DIRECTORY, VALUES_FILE)

        if len(VALUES_FILE) == 0 or (VALUES_FILE.split(".")[1] != "yaml" and VALUES_FILE.split(".")[1] != "yml") or \
                not os.path.exists(os.path.join(VALUES_DIRECTORY, VALUES_FILE)):
            # If VALUES_FILE can't be found or wasn't provided, it won't be updated. In this case separate files
            # with configuration of specific section will be saved in the hosts machine.
            values_file_resolved = False
        values = {}
        if values_file_resolved:
            try:
                with open(values_file_path, "r") as file:
                    values = yaml.load(file)
            except ruamel.yaml.parser.ParserError as e:
                current_app.logger.error(f"Error occurred while reading {VALUES_FILE}. Check yaml syntax.")
                raise YamlParserException(VALUES_FILE)
            if values is None:
                current_app.logger.error(f"{VALUES_FILE} cannot be empty. Check sc4snmp documentation for template.")
                raise EmptyValuesFileException(VALUES_FILE)

        if not values_file_resolved or KEEP_TEMP_FILES.lower() in ["t", "true", "y", "yes", "1"]:
            delete_temp_files = False
        else:
            delete_temp_files = True

        for key, value in request["yaml_sections"].items():
            tmp_file_name = TMP_FILE_PREFIX + key.replace(".", "_") + ".yaml"
            directory = VALUES_DIRECTORY if not delete_temp_files else TMP_DIR
            tmp_file_path = os.path.join(directory, tmp_file_name)

            mongo_collection = value[0]
            mongo_to_yaml_conversion = value[1]()
            tmp_file_handling = value[2](tmp_file_path)

            documents = list(mongo_collection.find())
            converted = mongo_to_yaml_conversion.convert(documents)
            parsed_values = tmp_file_handling.parse_dict_to_yaml(converted, delete_temp_files)

            # update appropriate section values dictionary
            values_keys = key.split(".")
            sub_dict = values
            for value_index, value_key in enumerate(values_keys):
                if value_index == len(values_keys)-1:
                    sub_dict[value_key] = parsed_values
                else:
                    sub_dict = sub_dict.get(value_key, {})

        if values_file_resolved:
            with open(values_file_path, "w") as file:
                yaml.dump(values, file)

        next_chain_request = {}
        if "next" in request:
            next_chain_request = request["next"]
        return super().handle(next_chain_request)


class CheckJobHandler(AbstractHandler):
    def handle(self, request: dict = None):
        """
        CheckJobHandler checks whether a new kubernetes job with updated sc4snmp configuration can be run immediately
         or should it be scheduled for the future.

        :return: pass dictionary with job_delay in seconds to the next handler
        """
        record = list(mongo_config_collection.find())[0]
        schedule_new_job = True
        # get_job_config return job configuration in "job" variable and BatchV1Api from kubernetes client
        job, batch_v1 = get_job_config()
        if job is None or batch_v1 is None:
            raise ValueError("CheckJobHandler: Job configuration is empty")
        try:
            # Try creating a new kubernetes job immediately. If the previous job is still present in the namespace,
            # ApiException will be thrown.
            create_job(batch_v1, job, JOB_NAMESPACE)
            task_id = record["task_id"]
            if task_id is not None:
                # revoke existing Celery task with the previously scheduled job
                current_app.extensions["celery"].control.revoke(task_id,
                   terminate=True, signal='SIGKILL')
            mongo_config_collection.update_one({"_id": record["_id"]},
                                               {"$set": {"previous_job_start_time": datetime.datetime.utcnow(),
                                                         "currently_scheduled": False,
                                                         "task_id": None}})
            job_delay = 1
            time_difference = 0
            schedule_new_job = False
        except ApiException:
            # Check how many seconds have elapsed since the last time that the job was run. If the time difference
            # is greater than CHANGES_INTERVAL_SECONDS then job can be scheduled within 1 second. Otherwise, calculate how
            # many seconds are left until minimum time difference between updates (CHANGES_INTERVAL_SECONDS).
            last_update = record["previous_job_start_time"]
            if last_update is None:
                # If it's the first time that the job is run (record in mongo_config_collection has been created
                # in ApplyChanges class and last_update attribute is None) but the previous job is still in the namespace
                # then job delay should be equal to CHANGES_INTERVAL_SECONDS.
                # Update the mongo record with job state accordingly.
                job_delay = CHANGES_INTERVAL_SECONDS
                mongo_config_collection.update_one({"_id": record["_id"]},
                                                   {"$set": {"previous_job_start_time": datetime.datetime.utcnow()}})
                # time from the last update
                time_difference = 0
            else:
                current_time = datetime.datetime.utcnow()
                delta = current_time - last_update
                time_difference = delta.total_seconds()
                if time_difference > CHANGES_INTERVAL_SECONDS:
                    job_delay = 1
                else:
                    job_delay = int(CHANGES_INTERVAL_SECONDS - time_difference)

        result = {
            "job_delay": job_delay,
            "time_from_last_update": time_difference,
            "schedule_new_job": schedule_new_job
        }

        current_app.logger.info(f"CheckJobHandler: {result}")
        return super().handle(result)


class ScheduleHandler(AbstractHandler):
    def handle(self, request: dict):
        """
        ScheduleHandler schedules the kubernetes job with updated sc4snmp configuration
        """
        record = list(mongo_config_collection.find())[0]
        if not record["currently_scheduled"] and request["schedule_new_job"]:
            # If the task isn't currently scheduled, schedule it and update its state in mongo.
            async_result = run_job.apply_async(countdown=request["job_delay"], queue='apply_changes')
            mongo_config_collection.update_one({"_id": record["_id"]},
                                               {"$set": {"currently_scheduled": True, "task_id": async_result.id}})
            current_app.logger.info(
                f"ScheduleHandler: scheduling new task with the delay of {request['job_delay']} seconds.")
        else:
            current_app.logger.info("ScheduleHandler: new job wasn't scheduled.")
        return request["job_delay"], record["currently_scheduled"]