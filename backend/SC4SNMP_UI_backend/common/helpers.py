from SC4SNMP_UI_backend import mongo_client
from enum import Enum
from typing import Callable
from bson import ObjectId
from flask import jsonify
from SC4SNMP_UI_backend.common.conversions import InventoryConversion

mongo_groups = mongo_client.sc4snmp.groups_ui
mongo_inventory = mongo_client.sc4snmp.inventory_ui
inventory_conversion = InventoryConversion()

class InventoryAddEdit(Enum):
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
    :param process_record: function to process profiles in record. It should accept index of profile to update,
    whole record dictionary and kwargs passed by user.
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