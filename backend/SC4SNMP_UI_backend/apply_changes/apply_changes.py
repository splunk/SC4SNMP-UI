from threading import Lock
import os
from SC4SNMP_UI_backend import mongo_client
from SC4SNMP_UI_backend.apply_changes.handling_chain import CheckJobHandler, ScheduleHandler, SaveConfigToFileHandler
from SC4SNMP_UI_backend.apply_changes.config_to_yaml_utils import ProfilesToYamlDictConversion, ProfilesTempHandling, \
    GroupsToYamlDictConversion, GroupsTempHandling, InventoryToYamlDictConversion, InventoryTempHandling


MONGO_URI = os.getenv("MONGO_URI")
JOB_CREATION_RETRIES = int(os.getenv("JOB_CREATION_RETRIES", 10))
mongo_config_collection = mongo_client.sc4snmp.config_collection
mongo_groups = mongo_client.sc4snmp.groups_ui
mongo_inventory = mongo_client.sc4snmp.inventory_ui
mongo_profiles = mongo_client.sc4snmp.profiles_ui



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
        self.__handling_chain = SaveConfigToFileHandler()
        check_job_handler = CheckJobHandler()
        schedule_handler = ScheduleHandler()
        self.__handling_chain.set_next(check_job_handler).set_next(schedule_handler)
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
        yaml_sections = {
            "scheduler.groups": (mongo_groups, GroupsToYamlDictConversion, GroupsTempHandling),
            "scheduler.profiles": (mongo_profiles, ProfilesToYamlDictConversion, ProfilesTempHandling),
            "poller.inventory": (mongo_inventory, InventoryToYamlDictConversion, InventoryTempHandling)
        }
        return self.__handling_chain.handle({
            "yaml_sections": yaml_sections
        })

