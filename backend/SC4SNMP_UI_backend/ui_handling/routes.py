from bson import json_util, ObjectId
from flask import Flask, request, Blueprint
from flask_cors import cross_origin
from SC4SNMP_UI_backend import mongo_client
from SC4SNMP_UI_backend.common.conversions import ProfileConversion, GroupConversion, GroupDeviceConversion, \
    InventoryConversion, get_group_name_from_backend
from copy import copy
from enum import Enum

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


@ui.route('/profiles/names')
@cross_origin()
def get_profile_names():
    profiles = mongo_profiles.find()
    profiles_list = []
    for pr in list(profiles):
        converted = profile_conversion.backend2ui(pr)
        if converted['conditions']['condition'] not in ['mandatory', 'base']:
            profiles_list.append(converted)
    return json_util.dumps([el["profileName"] for el in profiles_list])


@ui.route('/profiles')
@cross_origin()
def get_all_profiles_list():
    profiles = mongo_profiles.find()
    profiles_list = []
    for pr in list(profiles):
        converted = profile_conversion.backend2ui(pr)
        if converted['conditions']['condition'] not in ['mandatory']:
            profiles_list.append(converted)
    return json_util.dumps(profiles_list)


@ui.route('/profiles/add', methods=['POST'])
@cross_origin()
def add_profile_record():
    profile_obj = request.json
    profile_obj = profile_conversion.ui2backend(profile_obj)
    mongo_profiles.insert_one(profile_obj)
    return "success"


@ui.route('/profiles/delete/<profile_id>', methods=['POST'])
@cross_origin()
def delete_profile_record(profile_id):
    mongo_profiles.delete_one({'_id': ObjectId(profile_id)})
    return "success"


@ui.route('/profiles/update/<profile_id>', methods=['POST'])
@cross_origin()
def update_profile_record(profile_id):
    profile_obj = request.json
    new_profile_name = profile_obj['profileName']
    profile_obj = profile_conversion.ui2backend(profile_obj)

    old_profile = list(mongo_profiles.find({'_id': ObjectId(profile_id)}, {"_id": 0}))[0]
    old_profile_name = list(old_profile.keys())[0]

    # TODO: if profile name was changed, update all inventory records which used this profile
    if old_profile_name != new_profile_name:
        mongo_profiles.update_one({'_id': ObjectId(profile_id)},
                                  {"$rename": {f"{old_profile_name}": f"{new_profile_name}"}})
    mongo_profiles.update_one({'_id': ObjectId(profile_id)},
                              {"$set": {new_profile_name: profile_obj[new_profile_name]}})
    return "success"


@ui.route('/groups')
@cross_origin()
def get_groups_list():
    groups = mongo_groups.find()
    groups_list = []
    for gr in list(groups):
        groups_list.append(group_conversion.backend2ui(gr))
    return json_util.dumps(groups_list)


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
    old_group = mongo_groups.find({'_id': ObjectId(group_id)})
    old_group = list(old_group)[0]
    old_group_name = get_group_name_from_backend(old_group)
    mongo_groups.update_one({'_id': old_group['_id']}, {"$rename": {f"{old_group_name}": f"{group_obj['groupName']}"}})

    # rename corresponding group in inventory
    mongo_inventory.update_one({"address": old_group_name}, {"$set": {"address": group_obj['groupName']}})
    return json_util.dumps({"message": f"{old_group_name} was also renamed to {group_obj['groupName']} in the inventory"}), 200


@ui.route('/groups/delete/<group_id>', methods=['POST'])
@cross_origin()
def delete_group_and_devices(group_id):
    group = mongo_groups.find({'_id': ObjectId(group_id)})
    group = list(group)[0]
    group_name = get_group_name_from_backend(group)
    with mongo_client.start_session() as session:
        with session.start_transaction():
            mongo_groups.delete_one({'_id': ObjectId(group_id)})
            existing_inventory = list(mongo_inventory.find({"address": group_name, "delete": False}))
            if len(existing_inventory) > 0:
                # TODO: It is not working from the sc4snmp side
                mongo_inventory.update_one({"address": group_name}, {"$set": {"delete": True}})
    return json_util.dumps({"message": f"{group_name} was also deleted from inventory"}), 200


@ui.route('/group/<group_id>/devices/count')
@cross_origin()
def get_devices_count_for_group(group_id):
    group = mongo_groups.find({"_id": ObjectId(group_id)})
    group = list(group)[0]
    group_name = get_group_name_from_backend(group)
    total_count = len(group[group_name])
    return json_util.dumps(total_count)


@ui.route('/group/<group_id>/devices/<page_num>/<dev_per_page>')
@cross_origin()
def get_devices_of_group(group_id, page_num, dev_per_page):
    page_num = int(page_num)
    dev_per_page = int(dev_per_page)
    skips = dev_per_page * (page_num - 1)
    group = mongo_groups.find({"_id": ObjectId(group_id)})
    group = list(group)[0]
    try:
        group_name = get_group_name_from_backend(group)
        devices_list = []
        i = 0
        for device in group[group_name]:
            devices_list.append(group_device_conversion.backend2ui(device, group_id=group_id, device_id=copy(i)))
            i += 1
        devices_list = devices_list[skips:skips+dev_per_page]
        return json_util.dumps(devices_list)
    except ValueError as e:
        print(str(e))
        return 500


@ui.route('/devices/add', methods=['POST'])
@cross_origin()
def add_device_to_group():
    device_obj = request.json
    group_id = device_obj["groupId"]
    group = mongo_groups.find({'_id': ObjectId(group_id)}, {"_id": 0})
    group = list(group)[0]
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
    group = mongo_groups.find({'_id': ObjectId(group_id)}, {"_id": 0})
    group = list(group)[0]
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
    group = mongo_groups.find({'_id': ObjectId(group_id)}, {"_id": 0})
    group = list(group)[0]
    group_name = get_group_name_from_backend(group)
    group[group_name].pop(int(device_id))
    new_values = {"$set": group}
    mongo_groups.update_one({"_id": ObjectId(group_id)}, new_values)
    return "success"


# @cross_origin(origins='*', headers=['access-control-allow-origin', 'Content-Type'])
@ui.route('/inventory/<page_num>/<dev_per_page>')
@cross_origin()
def get_inventory_list(page_num, dev_per_page):
    page_num = int(page_num)
    dev_per_page = int(dev_per_page)
    skips = dev_per_page * (page_num - 1)

    inventory = mongo_inventory.find({"delete": False}).skip(skips).limit(dev_per_page)
    inventory_list = []
    for inv in list(inventory):
        inventory_list.append(inventory_conversion.backend2ui(inv))
    return json_util.dumps(inventory_list)


@ui.route('/inventory/count')
@cross_origin()
def get_inventory_count():
    total_count = mongo_inventory.count_documents({"delete": False})
    return json_util.dumps(total_count)

# TODO: In the inventory_ui there should be only one document for the specific record. If user adds a record,
#  then removes it and then adds it once again, there will be three documents in the inventory_ui with different
#  delete flags. -> Done, but requires more testing


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
    address = inventory_obj['address']
    port = inventory_obj['port']
    message = "added" if change_type == InventoryAddEdit.ADD else "edited"
    inventory_id = ObjectId(inventory_id) if change_type == InventoryAddEdit.EDIT else None

    check_duplicates = False
    if address[0].isdigit():
        # record is a single host
        existing_inventory_record = list(mongo_inventory.find({'address': address, 'port': port, "delete": False}))
        deleted_inventory_record = list(mongo_inventory.find({'address': address, 'port': port, "delete": True}))
        identifier = f"{address}:{port}"
        check_duplicates = True
    else:
        # record is a group
        existing_inventory_record = list(mongo_inventory.find({'address': address, "delete": False}))
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
            result = json_util.dumps(
                {"message": f"Inventory record for {identifier} already exists. Record was not {message}."}), 400

    return result
