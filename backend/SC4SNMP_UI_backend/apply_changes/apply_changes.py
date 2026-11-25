from threading import Lock
import os
from SC4SNMP_UI_backend import mongo_client
from SC4SNMP_UI_backend.apply_changes.handling_chain import CheckJobHandler, ScheduleHandler, SaveConfigToFileHandler
from SC4SNMP_UI_backend.apply_changes.config_to_yaml_utils import ProfilesToYamlDictConversion, ProfilesTempHandling, \
    GroupsToYamlDictConversion, GroupsTempHandling, InventoryToYamlDictConversion, InventoryTempHandling, \
    DiscoveryToYamlDictConversion, DiscoveryTempHandling
from SC4SNMP_UI_backend.common.change_tracking import JOB_TYPES, ensure_config_record, get_revisions, dirty_sections
from SC4SNMP_UI_backend.apply_changes.tasks import job_available


MONGO_URI = os.getenv("MONGO_URI")
JOB_CREATION_RETRIES = int(os.getenv("JOB_CREATION_RETRIES", 10))
mongo_config_collection = mongo_client.sc4snmp.config_collection
mongo_groups = mongo_client.sc4snmp.groups_ui
mongo_inventory = mongo_client.sc4snmp.inventory_ui
mongo_profiles = mongo_client.sc4snmp.profiles_ui
mongo_discovery = mongo_client.sc4snmp.discovery_ui
mongo_used_ui_discovery = mongo_client.sc4snmp.used_ui_discovery


def discovery_seeded():
    """Whether the connector switched discovery to MongoDB mode and seeded discovery_ui."""
    document = mongo_used_ui_discovery.find_one({}) or {}
    return bool(document.get("used_ui_discovery", False))



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
        ApplyChanges is a singleton responsible for saving the configuration to values.yaml and creating (or
        scheduling) kubernetes jobs. State of the jobs and revisions of the sections are kept in a single mongo
        record, see common.change_tracking.
        """
        self.__save_handler = SaveConfigToFileHandler()
        self.__job_chain = CheckJobHandler()
        self.__job_chain.set_next(ScheduleHandler())
        ensure_config_record()

    def apply_changes(self, section=None):
        """
        Saves and applies the requested section. An explicit section can also be retried with no new edits.
        Restore and callers without a section apply all dirty sections, or retry all available jobs when none
        of the dirty sections can be applied.

        :return: dictionary {job_type: (job_delay, currently_scheduled)} for the jobs that were handled and a list of
                 job types with unapplied changes that were skipped because their job is not available (e.g.
                 discovery disabled in helm values)
        """
        if section is not None:
            if not job_available(section):
                return {}, [section]
            available = [section]
            job_types, skipped = available, []
        else:
            dirty = dirty_sections()
            available = [job_type for job_type in JOB_TYPES if job_available(job_type)]
            job_types = [job_type for job_type in available if job_type in dirty] or available
            skipped = [job_type for job_type in dirty if job_type not in available]

        revisions = {job_type: revision for job_type, (revision, _) in get_revisions().items()}
        yaml_sections = {}
        if section != "discovery":
            yaml_sections.update({
                "scheduler.groups": (mongo_groups, GroupsToYamlDictConversion, GroupsTempHandling),
                "scheduler.profiles": (mongo_profiles, ProfilesToYamlDictConversion, ProfilesTempHandling),
                "poller.inventory": (mongo_inventory, InventoryToYamlDictConversion, InventoryTempHandling),
            })
        if "discovery" in available and discovery_seeded():
            # Discovery section is written only after discovery_ui was seeded from the configuration by the
            # connector. Otherwise empty collection would overwrite entries defined in values.yaml.
            yaml_sections["discovery.autodiscovery"] = (
                mongo_discovery, DiscoveryToYamlDictConversion, DiscoveryTempHandling)
        if yaml_sections:
            self.__save_handler.handle({"yaml_sections": yaml_sections})

        results = {}
        for job_type in job_types:
            results[job_type] = self.__job_chain.handle({"job_type": job_type, "revision": revisions[job_type]})
        return results, skipped
