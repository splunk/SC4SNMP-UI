from bson import json_util, ObjectId
from flask import Flask, request, Blueprint, jsonify
from flask_cors import cross_origin
from SC4SNMP_UI_backend import mongo_client
from SC4SNMP_UI_backend.common.conversions import ProfileConversion, GroupConversion, GroupDeviceConversion, \
    InventoryConversion, get_group_name_from_backend
from copy import copy
from enum import Enum
from typing import Callable

ui = Blueprint('ui', __name__)

profile_conversion = ProfileConversion()
group_conversion = GroupConversion()
group_device_conversion = GroupDeviceConversion()
inventory_conversion = InventoryConversion()
mongo_profiles = mongo_client.sc4snmp.profiles_ui
mongo_groups = mongo_client.sc4snmp.groups_ui
mongo_inventory = mongo_client.sc4snmp.inventory_ui


class InventoryAddEdit(Enum):
    ADD = 1
    EDIT = 2


# @cross_origin(origins='*', headers=['access-control-allow-origin', 'Content-Type'])
@ui.route('/profiles/names')
@cross_origin()
def get_profile_names():
    profiles = list(mongo_profiles.find())
    profiles_list = []
    for pr in profiles:
        converted = profile_conversion.backend2ui(pr)
        if converted['conditions']['condition'] not in ['mandatory', 'base']:
            profiles_list.append(converted)
    return jsonify([el["profileName"] for el in profiles_list])


@ui.route('/profiles')
@cross_origin()
def get_all_profiles_list():
    profiles = list(mongo_profiles.find())
    profiles_list = []
    for pr in profiles:
        converted = profile_conversion.backend2ui(pr)
        if converted['conditions']['condition'] not in ['mandatory']:
            profiles_list.append(converted)
    return jsonify(profiles_list)


@ui.route('/profiles/add', methods=['POST'])
@cross_origin()
def add_profile_record():
    profile_obj = request.json
    profile_obj = profile_conversion.ui2backend(profile_obj)
    mongo_profiles.insert_one(profile_obj)
    return jsonify("success")


@ui.route('/profiles/delete/<profile_id>', methods=['POST'])
@cross_origin()
def delete_profile_record(profile_id):
    profile = list(mongo_profiles.find({'_id': ObjectId(profile_id)}, {"_id": 0}))[0]
    profile_name = list(profile.keys())[0]

    # Find records from inventory where this profile was used.
    def delete_profile(index, record_to_update, kwargs):
        record_to_update["profiles"].pop(index)
        return record_to_update
    update_profiles_in_inventory(profile_name, delete_profile)

    mongo_profiles.delete_one({'_id': ObjectId(profile_id)})
    return jsonify({"message": f"If {profile_name} was used in some records in the inventory,"
                                       f" those records were updated"}), 200


@ui.route('/profiles/update/<profile_id>', methods=['POST'])
@cross_origin()
def update_profile_record(profile_id):
    profile_obj = request.json
    new_profile_name = profile_obj['profileName']
    profile_obj = profile_conversion.ui2backend(profile_obj)

    old_profile = list(mongo_profiles.find({'_id': ObjectId(profile_id)}, {"_id": 0}))[0]
    old_profile_name = list(old_profile.keys())[0]

    # If profile name was changed update it and also update all inventory records where this profile is used
    if old_profile_name != new_profile_name:
        mongo_profiles.update_one({'_id': ObjectId(profile_id)},
                                  {"$rename": {f"{old_profile_name}": f"{new_profile_name}"}})

        def update_name(index, record_to_update, kwargs):
            record_to_update["profiles"][index] = kwargs["new_name"]
            return record_to_update
        update_profiles_in_inventory(old_profile_name, update_name, new_name=new_profile_name)

        result = jsonify({"message": f"If {old_profile_name} was used in some records in the inventory,"
                                       f" it was updated to {new_profile_name}"}), 200
    else:
        result = jsonify("success"), 200

    mongo_profiles.update_one({'_id': ObjectId(profile_id)},
                              {"$set": {new_profile_name: profile_obj[new_profile_name]}})
    return result


@ui.route('/groups')
@cross_origin()
def get_groups_list():
    groups = mongo_groups.find()
    groups_list = []
    for gr in list(groups):
        groups_list.append(group_conversion.backend2ui(gr))
    return jsonify(groups_list)


@ui.route('/groups/add', methods=['POST'])
@cross_origin()
def add_group_record():
    group_obj = request.json
    group_obj = group_conversion.ui2backend(group_obj)
    mongo_groups.insert_one(group_obj)
    return "success"


@ui.route('/groups/update/<group_id>', methods=['POST'])
@cross_origin()
def update_group(group_id):
    group_obj = request.json
    old_group = list(mongo_groups.find({'_id': ObjectId(group_id)}))[0]
    old_group_name = get_group_name_from_backend(old_group)
    mongo_groups.update_one({'_id': old_group['_id']}, {"$rename": {f"{old_group_name}": f"{group_obj['groupName']}"}})

    # Rename corresponding group in the inventory
    mongo_inventory.update_one({"address": old_group_name}, {"$set": {"address": group_obj['groupName']}})
    return jsonify({"message": f"{old_group_name} was also renamed to {group_obj['groupName']} in the inventory"}), 200


@ui.route('/groups/delete/<group_id>', methods=['POST'])
@cross_origin()
def delete_group_and_devices(group_id):
    group = list(mongo_groups.find({'_id': ObjectId(group_id)}))[0]
    group_name = get_group_name_from_backend(group)
    with mongo_client.start_session() as session:
        with session.start_transaction():
            mongo_groups.delete_one({'_id': ObjectId(group_id)})
            mongo_inventory.update_one({"address": group_name}, {"$set": {"delete": True}})
    return jsonify({"message": f"If {group_name} was configured in the inventory, it was deleted from there"}), 200


@ui.route('/group/<group_id>/devices/count')
@cross_origin()
def get_devices_count_for_group(group_id):
    group = list(mongo_groups.find({"_id": ObjectId(group_id)}))[0]
    group_name = get_group_name_from_backend(group)
    total_count = len(group[group_name])
    return jsonify(total_count)


@ui.route('/group/<group_id>/devices/<page_num>/<dev_per_page>')
@cross_origin()
def get_devices_of_group(group_id, page_num, dev_per_page):
    page_num = int(page_num)
    dev_per_page = int(dev_per_page)
    skips = dev_per_page * (page_num - 1)
    group = list(mongo_groups.find({"_id": ObjectId(group_id)}))[0]

    group_name = get_group_name_from_backend(group)
    devices_list = []
    for i, device in enumerate(group[group_name]):
        devices_list.append(group_device_conversion.backend2ui(device, group_id=group_id, device_id=copy(i)))
    devices_list = devices_list[skips:skips+dev_per_page]
    return jsonify(devices_list)


@ui.route('/devices/add', methods=['POST'])
@cross_origin()
def add_device_to_group():
    device_obj = request.json
    group_id = device_obj["groupId"]
    group = list(mongo_groups.find({'_id': ObjectId(group_id)}, {"_id": 0}))[0]
    device_obj = group_device_conversion.ui2backend(device_obj)

    group_name = get_group_name_from_backend(group)
    group[group_name].append(device_obj)
    new_values = {"$set": group}
    mongo_groups.update_one({"_id": ObjectId(group_id)}, new_values)
    return "success"


@ui.route('/devices/update/<device_id>', methods=['POST'])
@cross_origin()
def update_device_from_group(device_id):
    device_obj = request.json
    group_id = device_id.split("-")[0]
    device_id = device_id.split("-")[1]
    group = list(mongo_groups.find({'_id': ObjectId(group_id)}, {"_id": 0}))[0]
    device_obj = group_device_conversion.ui2backend(device_obj)

    group_name = get_group_name_from_backend(group)
    group[group_name][int(device_id)] = device_obj
    new_values = {"$set": group}
    mongo_groups.update_one({"_id": ObjectId(group_id)}, new_values)
    return "success"


@ui.route('/devices/delete/<device_id>', methods=['POST'])
@cross_origin()
def delete_device_from_group_record(device_id: str):
    group_id = device_id.split("-")[0]
    device_id = device_id.split("-")[1]
    group = list(mongo_groups.find({'_id': ObjectId(group_id)}, {"_id": 0}))[0]
    group_name = get_group_name_from_backend(group)
    group[group_name].pop(int(device_id))
    new_values = {"$set": group}
    mongo_groups.update_one({"_id": ObjectId(group_id)}, new_values)
    return "success"


@ui.route('/inventory/<page_num>/<dev_per_page>')
@cross_origin()
def get_inventory_list(page_num, dev_per_page):
    page_num = int(page_num)
    dev_per_page = int(dev_per_page)
    skips = dev_per_page * (page_num - 1)

    inventory = list(mongo_inventory.find({"delete": False}).skip(skips).limit(dev_per_page))
    inventory_list = []
    for inv in inventory:
        inventory_list.append(inventory_conversion.backend2ui(inv))
    return jsonify(inventory_list)


@ui.route('/inventory/count')
@cross_origin()
def get_inventory_count():
    total_count = mongo_inventory.count_documents({"delete": False})
    return jsonify(total_count)


@ui.route('/inventory/add', methods=['POST'])
@cross_origin()
def add_inventory_record():
    inventory_obj = request.json
    inventory_obj = inventory_conversion.ui2backend(inventory_obj, delete=False)
    return check_if_inventory_can_be_added(inventory_obj, InventoryAddEdit.ADD, None)


@ui.route('/inventory/delete/<inventory_id>', methods=['POST'])
@cross_origin()
def delete_inventory_record(inventory_id):
    mongo_inventory.update_one({"_id": ObjectId(inventory_id)}, {"$set": {"delete": True}})
    return "success"


@ui.route('/inventory/update/<inventory_id>', methods=['POST'])
@cross_origin()
def update_inventory_record(inventory_id):
    inventory_obj = request.json
    inventory_obj = inventory_conversion.ui2backend(inventory_obj, delete=False)
    return check_if_inventory_can_be_added(inventory_obj, InventoryAddEdit.EDIT, inventory_id)


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
            result = json_util.dumps({"message": f"There is no group {address} configured. Record was not {message}."}), 400
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
            result = "success", 200
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