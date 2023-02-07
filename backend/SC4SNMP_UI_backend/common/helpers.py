from SC4SNMP_UI_backend import mongo_client
from enum import Enum
from collections import defaultdict
from typing import Callable
from bson import ObjectId
from flask import jsonify
from SC4SNMP_UI_backend.common.conversions import InventoryConversion, get_group_name_from_backend

mongo_groups = mongo_client.sc4snmp.groups_ui
mongo_inventory = mongo_client.sc4snmp.inventory_ui
inventory_conversion = InventoryConversion()

class InventoryAddEdit(Enum):
    ADD = 1
    EDIT = 2

class DeviceAddEdit(Enum):
    ADD = 1
    EDIT = 2

class ChangeCollection(Enum):
    GROUPS = 1
    INVENTORY = 2

class ChangeHostGroup(Enum):
    HOST = 1
    GROUP = 2

class ChangeType(Enum):
    ADD = 1
    EDIT = 2

def check_if_inventory_can_be_added(inventory_obj, change_type: InventoryAddEdit, inventory_id):
    """
    Before updating or adding new inventory check if it can be done. For example users shouldn't add new
    inventory if the same inventory already exists.

    :param inventory_obj: new inventory object to be added/updated
    :param change_type: InventoryAddEdit.EDIT or InventoryAddEdit.ADD
    :param inventory_id: id of the inventory to be edited
    :return:
    """

    address = inventory_obj['address']
    port = inventory_obj['port']
    message = "added" if change_type == InventoryAddEdit.ADD else "edited"
    inventory_id = ObjectId(inventory_id) if change_type == InventoryAddEdit.EDIT else None

    check_duplicates = False
    if address[0].isdigit():
        # record is a single host
        existing_inventory_record = list(mongo_inventory.find({'address': address, 'port': port, "delete": False}))

        # check if there is any record for this device which has been assigned to be deleted
        deleted_inventory_record = list(mongo_inventory.find({'address': address, 'port': port, "delete": True}))
        identifier = f"{address}:{port}"
        check_duplicates = True
    else:
        # record is a group
        existing_inventory_record = list(mongo_inventory.find({'address': address, "delete": False}))

        # check if there is any record for this group which has been assigned to be deleted
        deleted_inventory_record = list(mongo_inventory.find({'address': address, "delete": True}))
        identifier = address
        group = list(mongo_groups.find({address: {"$exists": 1}}))
        if len(group) == 0:
            result = jsonify({"message": f"There is no group {address} configured. Record was not {message}."}), 400
        else:
            check_duplicates = True

    if check_duplicates:
        # check if the same record already exist in the inventory
        if len(existing_inventory_record) == 0:
            make_change = True
        elif existing_inventory_record[0]["_id"] == inventory_id and change_type == InventoryAddEdit.EDIT:
            make_change = True
        else:
            make_change = False

        if make_change:
            if change_type == InventoryAddEdit.ADD:
                mongo_inventory.insert_one(inventory_obj)
            else:
                mongo_inventory.update_one({"_id": inventory_id}, {"$set": inventory_obj})

            if len(deleted_inventory_record) > 0:
                mongo_inventory.delete_one({"_id": deleted_inventory_record[0]["_id"]})
            result = jsonify("success"), 200
        else:
            result = jsonify(
                {"message": f"Inventory record for {identifier} already exists. Record was not {message}."}), 400

    return result


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


class ValidateNewDevices:
    def __init__(self, mongo_groups, mongo_inventory):
        self._mongo_groups = mongo_groups
        self._mongo_inventory = mongo_inventory

    def _is_host_in_group(self, address, port) -> (bool, str, str):
        groups_from_inventory = list(self._mongo_inventory.find({"address": {"$regex": "/^[a-zA-Z].*/"}, "delete": False}))
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
        existing_inventory_record = list(self._mongo_inventory.find({'address': address, 'port': port, "delete": False}))
        deleted_inventory_record = list(self._mongo_inventory.find({'address': address, 'port': port, "delete": True}))

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
            host_location_message = "as a single host in the inventory." if host_configuration == HostConfiguration.SINGLE else \
                f"in group {group_name}."
            message = f"Host {address}:{port} already exists {host_location_message}. Record was not added."
            host_added = False
        else:
            if len(deleted_inventory_record) > 0:
                self._mongo_inventory.delete_one({"_id": deleted_inventory_record[0]["_id"]})
            if add and device_object is not None:
                self._mongo_inventory.insert_one(device_object)
            message = None
            host_added = True
        return host_added, message

    def edit_single_host(self, address: str, port: str, host_id: str, device_object=None, edit: bool=True):
        host_configured, deleted_inventory_record, host_configuration, existing_id_string, group_name =\
            self._is_host_configured(address, port)

        if not host_configured or (host_configured and host_id == existing_id_string):
            if len(deleted_inventory_record) > 0:
                self._mongo_inventory.delete_one({"_id": deleted_inventory_record[0]["_id"]})
            if edit and device_object is not None:
                self._mongo_inventory.update_one({"_id": host_id}, {"$set": device_object})
            message = None
            host_edited = True
        else:
            host_location_message = "as a single host in the inventory." if host_configuration == HostConfiguration.SINGLE else \
                f"in group {group_name}."
            message = f"Host {address}:{port} already exists {host_location_message}. Record was not edited."
            host_edited = False
        return host_edited, message

    def add_group_host(self, group_name: str, group_id: ObjectId, address: str, port: str = ""):
        group_from_inventory = list(self._mongo_inventory.find({"address": group_name, "delete": False}))
        if len(group_from_inventory) > 0:
            device_port = port if len(port)>0 else str(group_from_inventory[0]["port"])
            host_added, message = self.add_single_host(address, device_port, add=False)
        else:
            group = list(self._mongo_groups.find({"_id": group_id}))
            new_device_port = int(port) if len(port) > 0 else -1
            host_added = True
            message = None
            for device in group[0][group_name]:
                old_device_port = device.get('port', -1)
                if device["address"] == address and old_device_port == new_device_port:
                    message = f"Host {address}:{port} already exists in group {group_name}. Record was not added."
                    host_added = False
        return host_added, message

    def edit_group_host(self, group_name: str, group_id: str, device_id: str, address: str, port: str = ""):
        group_id = ObjectId(group_id)
        group_from_inventory = list(self._mongo_inventory.find({"address": group_name, "delete": False}))
        if len(group_from_inventory) > 0:
            device_port = port if len(port) > 0 else str(group_from_inventory[0]["port"])
            host_edited, message = self.edit_single_host(address, device_port, device_id, edit=False)
        else:
            group = list(self._mongo_groups.find({"_id": group_id}))
            new_device_port = int(port) if len(port) > 0 else -1
            host_edited = True
            message = None
            for i, device in enumerate(group[0][group_name]):
                old_device_port = device.get('port', -1)
                old_device_id = f"{group_id}-{i}"
                if device["address"] == address and old_device_port == new_device_port and old_device_id != device_id:
                    message = f"Host {address}:{port} already exists in group {group_name}. Record was not edited."
                    host_edited = False
        return host_edited, message

    def add_group_to_inventory(self, group_name: str, group_port: str, group_object=None, add: bool = True):
        group_added = True
        message = None
        existing_inventory_record = list(self._mongo_inventory.find({'address': group_name, "delete": False}))
        deleted_inventory_record = list(self._mongo_inventory.find({'address': group_name, "delete": True}))

        group = list(self._mongo_groups.find({group_name: {"$exists": 1}}))
        if len(group) == 0:
            group_added = False
            message = f"There is no group {group_name} configured. Record was not added."
        elif len(existing_inventory_record) > 0:
            group_added = False
            message = f"Group {group_name} has already been added to the inventory. Record was not added."
        else:
            group = group[0]
            devices_in_group = dict()
            for i, device in group[group_name]:
                device_port = str(device.get("port", group_port))
                address = device["address"]
                device_added, message = self.add_single_host(address, device_port, add=False)
                if not device_added:
                    group_added = False
                    message = f"Can't add group {group_name}. {message}"
                    break
                else:
                    if f"{address}:{device_port}" in devices_in_group:
                        message = f"Can't add group {group_name}. Device {address}:{device_port} was configured twice in this group. Record was not added."
                        group_added = False
                        break
                    else:
                        devices_in_group[f"{address}:{device_port}"] = 1

        if group_added:
            if len(deleted_inventory_record) > 0:
                self._mongo_inventory.delete_one({"_id": deleted_inventory_record[0]["_id"]})
            if add and group_object is not None:
                self._mongo_inventory.insert_one(group_object)
        return group_added, message

    def edit_group_in_inventory(self, group_name: str, group_id: str, group_object=None, edit: bool = True):
        group_id = ObjectId(group_id)
        existing_inventory_record = list(self._mongo_inventory.find({'address': group_name, "delete": False}))
        deleted_inventory_record = list(self._mongo_inventory.find({'address': group_name, "delete": True}))

        # while editing group name or port in the inventory, mark previous group as deleted. Same for single hosts
        raise NotImplemented




class HostConfiguration(Enum):
    SINGLE = 1
    GROUP = 2
