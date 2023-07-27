from SC4SNMP_UI_backend import mongo_client
from enum import Enum
from typing import Callable
from bson import ObjectId
from SC4SNMP_UI_backend.common.backend_ui_conversions import InventoryConversion

mongo_groups = mongo_client.sc4snmp.groups_ui
mongo_inventory = mongo_client.sc4snmp.inventory_ui
inventory_conversion = InventoryConversion()

class HostConfiguration(Enum):
    SINGLE = 1
    GROUP = 2

def update_profiles_in_inventory(profile_to_search: str, process_record: Callable, **kwargs):
    """
    When profile is edited, then in some cases inventory records using this profile should be updated.

    :param profile_to_search: name of the profile which should be updated in the inventory
    :param process_record: function to process profiles in record. It should accept index of the profile to update,
    the whole record dictionary and kwargs passed by user.
    :param kwargs: additional variables which user can pass to process_record function
    :return:
    """
    inventory_records = list(mongo_inventory.find({"profiles": {"$regex": f'.*{profile_to_search}.*'}}))
    for record in inventory_records:
        record_id = record["_id"]
        record_updated = inventory_conversion.backend2ui(record)
        index_to_update = record_updated["profiles"].index(profile_to_search)
        record_updated = process_record(index_to_update, record_updated, kwargs)
        record_updated = inventory_conversion.ui2backend(record_updated, delete=False)
        mongo_inventory.update_one({"_id": ObjectId(record_id)}, {"$set": record_updated})
    return inventory_records


class HandleNewDevice:
    def __init__(self, mongo_groups, mongo_inventory):
        self._mongo_groups = mongo_groups
        self._mongo_inventory = mongo_inventory

    def _is_host_in_group(self, address, port) -> (bool, str, str):
        groups_from_inventory = list(self._mongo_inventory.find({"address": {"$regex": "^[a-zA-Z].*"}, "delete": False}))
        break_occurred = False

        host_in_group = False
        group_id = None
        device_id = None
        group_name = None

        for group_config in groups_from_inventory:
            group_config_name = group_config["address"]
            group_name = group_config_name
            group_port = group_config["port"]
            group = list(self._mongo_groups.find({group_config_name: {"$exists": 1}}))
            if len(group) > 0:
                group = group[0]
                for i, device in enumerate(group[group_config_name]):
                    device_port = device.get("port", group_port)
                    if device["address"] == address and int(device_port) == int(port):
                        host_in_group = True
                        group_id = str(group["_id"])
                        device_id = i
                        break_occurred = True
                        break
            if break_occurred:
                break

        return host_in_group, group_id, device_id, group_name

    def _is_host_configured(self, address: str, port: str):
        existing_inventory_record = list(self._mongo_inventory.find({'address': address, 'port': int(port), "delete": False}))
        deleted_inventory_record = list(self._mongo_inventory.find({'address': address, 'port': int(port), "delete": True}))

        host_configured = False
        host_configuration = None
        existing_id_string = None
        group_name = None

        if len(existing_inventory_record) > 0:
            host_configured = True
            host_configuration = HostConfiguration.SINGLE
            existing_id_string = str(existing_inventory_record[0]["_id"])
        else:
            host_in_group, group_id, device_id, group_name = self._is_host_in_group(address, port)
            if host_in_group:
                host_configured = True
                host_configuration = HostConfiguration.GROUP
                existing_id_string = f"{group_id}-{device_id}"

        return host_configured, deleted_inventory_record, host_configuration, existing_id_string, group_name

    def add_single_host(self, address, port, device_object=None, add: bool=True):
        host_configured, deleted_inventory_record, host_configuration, existing_id_string, group_name = \
            self._is_host_configured(address, port)
        if host_configured:
            host_location_message = "as a single host in the inventory" if host_configuration == HostConfiguration.SINGLE else \
                f"in group {group_name}"
            message = f"Host {address}:{port} already exists {host_location_message}. Record was not added."
            host_added = False
        else:
            if add and device_object is not None:
                self._mongo_inventory.insert_one(device_object)
                if len(deleted_inventory_record) > 0:
                    self._mongo_inventory.delete_one({"_id": deleted_inventory_record[0]["_id"]})
            message = None
            host_added = True
        return host_added, message

    def edit_single_host(self, address: str, port: str, host_id: str, device_object=None, edit: bool=True):
        host_configured, deleted_inventory_record, host_configuration, existing_id_string, group_name =\
            self._is_host_configured(address, port)

        if not host_configured or (host_configured and host_id == existing_id_string):
            message = "success"
            host_edited = True
            if edit and device_object is not None:
                host_id = ObjectId(host_id)
                previous_device_object = list(self._mongo_inventory.find({"_id": host_id}))[0]
                if int(port) != int(previous_device_object["port"]) or address != previous_device_object["address"]:
                    host_added, add_message = self.add_single_host(address, port, device_object, True)
                    if not host_added:
                        host_edited = False
                        message = add_message
                    else:
                        self._mongo_inventory.update_one({"_id": ObjectId(host_id)}, {"$set": {"delete": True}})
                        message = "Address or port was edited which resulted in deleting the old device and creating " \
                                  "the new one at the end of the list."
                else:
                    self._mongo_inventory.update_one({"_id": host_id}, {"$set": device_object})
                    if len(deleted_inventory_record) > 0:
                        self._mongo_inventory.delete_one({"_id": deleted_inventory_record[0]["_id"]})
        else:
            host_location_message = "as a single host in the inventory" if host_configuration == HostConfiguration.SINGLE else \
                f"in group {group_name}"
            message = f"Host {address}:{port} already exists {host_location_message}. Record was not edited."
            host_edited = False
        return host_edited, message

    def add_group_host(self, group_name: str, group_id: ObjectId, device_object: dict):
        group_from_inventory = list(self._mongo_inventory.find({"address": group_name, "delete": False}))
        group = list(self._mongo_groups.find({"_id": group_id}, {"_id": 0}))
        group = group[0]
        address = device_object["address"]
        port = str(device_object.get("port", ""))
        if len(group_from_inventory) > 0:
            device_port = port if len(port)>0 else str(group_from_inventory[0]["port"])
            host_added, message = self.add_single_host(address, device_port, add=False)
        else:
            new_device_port = int(port) if len(port) > 0 else -1
            host_added = True
            message = None
            for device in group[group_name]:
                old_device_port = device.get('port', -1)
                if device["address"] == address and old_device_port == new_device_port:
                    message = f"Host {address}:{port} already exists in group {group_name}. Record was not added."
                    host_added = False
        if host_added:
            group[group_name].append(device_object)
            new_values = {"$set": group}
            self._mongo_groups.update_one({"_id": group_id}, new_values)
        return host_added, message

    def edit_group_host(self, group_name: str, group_id: ObjectId, device_id: str, device_object: dict):
        group_from_inventory = list(self._mongo_inventory.find({"address": group_name, "delete": False}))
        group = list(self._mongo_groups.find({"_id": group_id}))
        group = group[0]
        address = device_object["address"]
        port = str(device_object.get("port", ""))
        if len(group_from_inventory) > 0:
            device_port = port if len(port) > 0 else str(group_from_inventory[0]["port"])
            host_edited, message = self.edit_single_host(address, device_port, device_id, edit=False)
        else:
            new_device_port = int(port) if len(port) > 0 else -1
            host_edited = True
            message = None
            for i, device in enumerate(group[group_name]):
                old_device_port = device.get('port', -1)
                old_device_id = f"{i}"
                if device["address"] == address and old_device_port == new_device_port and old_device_id != device_id:
                    message = f"Host {address}:{port} already exists in group {group_name}. Record was not edited."
                    host_edited = False
        if host_edited:
            group[group_name][int(device_id)] = device_object
            new_values = {"$set": group}
            mongo_groups.update_one({"_id": ObjectId(group_id)}, new_values)
        return host_edited, message

    def add_group_to_inventory(self, group_name: str, group_port: str, group_object=None, add: bool = True):
        group_added = True
        message = None
        existing_inventory_record = list(self._mongo_inventory.find({'address': group_name, "delete": False}))
        deleted_inventory_record = list(self._mongo_inventory.find({'address': group_name, "delete": True}))
        group = list(self._mongo_groups.find({group_name: {"$exists": 1}}))
        if len(group) == 0 and len(existing_inventory_record) == 0:
            group_added = True
            message = f"Group {group_name} doesn't exist in the configuration. Treating {group_name} as a hostname."
        elif len(group) == 0 and len(existing_inventory_record) > 0:
            group_added = False
            message = f"{group_name} has already been configured. Record was not added."
        elif len(existing_inventory_record) > 0:
            group_added = False
            message = f"Group {group_name} has already been added to the inventory. Record was not added."
        else:
            group = group[0]
            devices_in_group = dict()
            for i, device in enumerate(group[group_name]):
                device_port = str(device.get("port", group_port))
                address = device["address"]
                device_added, message = self.add_single_host(address, device_port, add=False)
                if not device_added:
                    group_added = False
                    message = f"Can't add group {group_name}. {message}"
                    break
                else:
                    if f"{address}:{device_port}" in devices_in_group:
                        message = f"Can't add group {group_name}. Device {address}:{device_port} was configured multiple times in this group. Record was not added."
                        group_added = False
                        break
                    else:
                        devices_in_group[f"{address}:{device_port}"] = 1

        if group_added and add and group_object is not None:
            if len(deleted_inventory_record) > 0:
                self._mongo_inventory.delete_one({"_id": deleted_inventory_record[0]["_id"]})
            self._mongo_inventory.insert_one(group_object)
        return group_added, message

    def edit_group_in_inventory(self, group_name: str, group_id: str, group_object=None, edit: bool = True):
        group_id = ObjectId(group_id)
        existing_inventory_record = list(self._mongo_inventory.find({'address': group_name, "delete": False}))
        deleted_inventory_record = list(self._mongo_inventory.find({'address': group_name, "delete": True}))

        if len(existing_inventory_record) == 0 or (len(existing_inventory_record) > 0 and existing_inventory_record[0]["_id"] == group_id):
            message = "success"
            group_edited = True
            if edit and group_object is not None:
                previous_group_object = list(self._mongo_inventory.find({"_id": group_id}))[0]
                if group_name != previous_group_object["address"]:
                    group_added, add_message = self.add_group_to_inventory(group_name, str(group_object["port"]), group_object, True)
                    if not group_added:
                        group_edited = False
                        message = add_message
                    else:
                        self._mongo_inventory.update_one({"_id": ObjectId(group_id)}, {"$set": {"delete": True}})
                        message = "Group name was edited which resulted in deleting the old group and creating new " \
                                  "one at the end of the list."
                else:
                    self._mongo_inventory.update_one({"_id": group_id}, {"$set": group_object})
                    if len(deleted_inventory_record) > 0:
                        self._mongo_inventory.delete_one({"_id": deleted_inventory_record[0]["_id"]})
        else:
            message = f"Group wit name {group_name} already exists. Record was not edited."
            group_edited = False

        return group_edited, message
