from abc import abstractmethod, ABC
import ruamel.yaml
from flask import current_app
from SC4SNMP_UI_backend import mongo_client
from SC4SNMP_UI_backend.apply_changes.tasks import run_job
import datetime
import os


CHANGES_INTERVAL_SECONDS = 300
TMP_FILE_PREFIX = "sc4snmp_ui"
TMP_DIR = "/tmp"
VALUES_DIRECTORY = os.getenv("VALUES_DIRECTORY", "")
VALUES_FILE = os.getenv("VALUES_FILE", "")
mongo_config_collection = mongo_client.sc4snmp.config_collection
mongo_groups = mongo_client.sc4snmp.groups_ui
mongo_inventory = mongo_client.sc4snmp.inventory_ui
mongo_profiles = mongo_client.sc4snmp.profiles_ui

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

        :yaml_sections = {
            "<values.yaml.key>": (mongo_collection, MongoToYamlDictConversion, TempFileHandling)
        }
        """
        if len(VALUES_DIRECTORY) == 0:
            raise ValueError("VALUES_DIRECTORY must be provided.")

        yaml = ruamel.yaml.YAML()
        values_file_resolved = True
        values_file_path = os.path.join(VALUES_DIRECTORY, VALUES_FILE)
        if len(VALUES_FILE) == 0 or (VALUES_FILE.split(".")[1] != "yaml" and VALUES_FILE.split(".")[1] != "yml") or \
                not os.path.exists(os.path.join(VALUES_DIRECTORY, VALUES_FILE)):
            values_file_resolved = False
        values = {}
        if values_file_resolved:
            with open(values_file_path, "r") as file:
                values = yaml.load(file)

        for key, value in request["yaml_sections"].items():
            tmp_file_name = TMP_FILE_PREFIX + key.replace(".", "_") + ".yaml"
            directory = VALUES_DIRECTORY if not values_file_resolved else TMP_DIR
            tmp_file_path = os.path.join(directory, tmp_file_name)

            mongo_collection = value[0]
            mongo_to_yaml_conversion = value[1]()
            tmp_file_handling = value[2](tmp_file_path)

            documents = list(mongo_collection.find())
            converted = mongo_to_yaml_conversion.convert(documents)
            parsed_values = tmp_file_handling.parse_dict_to_yaml(converted, values_file_resolved)

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
                job_delay = int(CHANGES_INTERVAL_SECONDS - time_difference)

        result = {
            "job_delay": job_delay,
            "time_from_last_update": time_difference
        }

        current_app.logger.info(f"CheckJobHandler: {result}")
        return super().handle(result)


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
            current_app.logger.info(
                f"ScheduleHandler: scheduling new task with the delay of {request['job_delay']} seconds.")
        else:
            current_app.logger.info("ScheduleHandler: new job wasn't scheduled.")
        return request["job_delay"], record["currently_scheduled"]