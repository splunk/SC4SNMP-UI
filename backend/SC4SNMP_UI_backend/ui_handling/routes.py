from bson import json_util, ObjectId
from flask import Flask, request, Blueprint
from flask_cors import cross_origin
from SC4SNMP_UI_backend import mongo_client
from SC4SNMP_UI_backend.common.conversions import ProfileConversion, GroupConversion, GroupDeviceConversion, \
    InventoryConversion, get_group_name_from_backend
from copy import copy

ui = Blueprint('ui', __name__)

profile_conversion = ProfileConversion()
group_conversion = GroupConversion()
group_device_conversion = GroupDeviceConversion()
inventory_conversion = InventoryConversion()


@ui.route('/profiles/names')
@cross_origin()
def get_profile_names():
    profiles = mongo_client.sc4snmp.profiles.find()
    profiles_list = []
    for pr in list(profiles):
        converted = profile_conversion.backend2ui(pr)
        if converted['conditions']['condition'] not in ['mandatory', 'base']:
            profiles_list.append(converted)
    return json_util.dumps([el["profileName"] for el in profiles_list])


@ui.route('/profiles')
@cross_origin()
def get_all_profiles_list():
    profiles = mongo_client.sc4snmp.profiles.find()
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
    mongo_client.sc4snmp.profiles.insert_one(profile_obj)
    return "success"


@ui.route('/profiles/delete/<profile_id>', methods=['POST'])
@cross_origin()
def delete_profile_record(profile_id):
    mongo_client.sc4snmp.profiles.delete_one({'_id': ObjectId(profile_id)})
    return "success"


@ui.route('/profiles/update/<profile_id>', methods=['POST'])
@cross_origin()
def update_profile_record(profile_id):
    profile_obj = request.json
    profile_obj = profile_conversion.ui2backend(profile_obj)
    new_values = {"$set": profile_obj}
    mongo_client.sc4snmp.profiles.update_one({'_id': ObjectId(profile_id)}, new_values)
    return "success"


@ui.route('/groups')
@cross_origin()
def get_groups_list():
    groups = mongo_client.sc4snmp.groups.find()
    groups_list = []
    for gr in list(groups):
        groups_list.append(group_conversion.backend2ui(gr))
    return json_util.dumps(groups_list)


@ui.route('/groups/add', methods=['POST'])
@cross_origin()
def add_group_record():
    group_obj = request.json
    group_obj = group_conversion.ui2backend(group_obj)
    mongo_client.sc4snmp.groups.insert_one(group_obj)
    return "success"


@ui.route('/groups/update/<group_id>', methods=['POST'])
@cross_origin()
def update_group(group_id):
    group_obj = request.json
    old_group = mongo_client.sc4snmp.groups.find({'_id': ObjectId(group_id)})
    old_group = list(old_group)[0]
    old_group_name = get_group_name_from_backend(old_group)
    mongo_client.sc4snmp.groups.update_one({'_id': old_group['_id']}, {"$rename": {f"{old_group_name}": f"{group_obj['groupName']}"}})

    # rename corresponding group in inventory
    mongo_client.sc4snmp.inventory_ui.update_one({"address": old_group_name}, {"$set": {"address": group_obj['groupName']}})
    return "success"


@ui.route('/groups/delete/<group_id>', methods=['POST'])
@cross_origin()
def delete_group_and_devices(group_id):
    group = mongo_client.sc4snmp.groups.find({'_id': ObjectId(group_id)})
    group = list(group)[0]
    group_name = get_group_name_from_backend(group)
    with mongo_client.start_session() as session:
        with session.start_transaction():
            mongo_client.sc4snmp.groups.delete_one({'_id': ObjectId(group_id)})
            mongo_client.sc4snmp.inventory_ui.update_one({"address": group_name}, {"$set": {"delete": True}})
    return json_util.dumps({"message": f"{group_name} was also deleted from inventory"}), 200


@ui.route('/group/<group_id>/devices/count')
@cross_origin()
def get_devices_count_for_group(group_id):
    group = mongo_client.sc4snmp.groups.find({"_id": ObjectId(group_id)})
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
    group = mongo_client.sc4snmp.groups.find({"_id": ObjectId(group_id)})
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
    group = mongo_client.sc4snmp.groups.find({'_id': ObjectId(group_id)}, {"_id": 0})
    group = list(group)[0]
    device_obj = group_device_conversion.ui2backend(device_obj)

    group_name = get_group_name_from_backend(group)
    group[group_name].append(device_obj)
    new_values = {"$set": group}
    print(group_id, new_values)
    mongo_client.sc4snmp.groups.update_one({"_id": ObjectId(group_id)}, new_values)
    return "success"


@ui.route('/devices/update/<device_id>', methods=['POST'])
@cross_origin()
def update_device_from_group(device_id):
    device_obj = request.json
    group_id = device_id.split("-")[0]
    device_id = device_id.split("-")[1]
    group = mongo_client.sc4snmp.groups.find({'_id': ObjectId(group_id)}, {"_id": 0})
    group = list(group)[0]
    device_obj = group_device_conversion.ui2backend(device_obj)

    group_name = get_group_name_from_backend(group)
    group[group_name][int(device_id)] = device_obj
    new_values = {"$set": group}
    mongo_client.sc4snmp.groups.update_one({"_id": ObjectId(group_id)}, new_values)
    return "success"


@ui.route('/devices/delete/<device_id>', methods=['POST'])
@cross_origin()
def delete_device_from_group_record(device_id: str):
    group_id = device_id.split("-")[0]
    device_id = device_id.split("-")[1]
    group = mongo_client.sc4snmp.groups.find({'_id': ObjectId(group_id)}, {"_id": 0})
    group = list(group)[0]
    group_name = get_group_name_from_backend(group)
    group[group_name].pop(int(device_id))
    new_values = {"$set": group}
    mongo_client.sc4snmp.groups.update_one({"_id": ObjectId(group_id)}, new_values)
    return "success"


# @cross_origin(origins='*', headers=['access-control-allow-origin', 'Content-Type'])
@ui.route('/inventory/<page_num>/<dev_per_page>')
@cross_origin()
def get_inventory_list(page_num, dev_per_page):
    page_num = int(page_num)
    dev_per_page = int(dev_per_page)
    skips = dev_per_page * (page_num - 1)

    inventory = mongo_client.sc4snmp.inventory_ui.find({"delete": False}).skip(skips).limit(dev_per_page)
    inventory_list = []
    for inv in list(inventory):
        inventory_list.append(inventory_conversion.backend2ui(inv))
    return json_util.dumps(inventory_list)


@ui.route('/inventory/count')
@cross_origin()
def get_inventory_count():
    total_count = mongo_client.sc4snmp.inventory_ui.count_documents({"delete": False})
    return json_util.dumps(total_count)


@ui.route('/inventory/add', methods=['POST'])
@cross_origin()
def add_inventory_record():
    inventory_obj = request.json
    inventory_obj = inventory_conversion.ui2backend(inventory_obj, delete=False)
    address = inventory_obj['address']
    port = inventory_obj['port']
    inventory_record = mongo_client.sc4snmp.inventory_ui.find({'address': address, "port": port, "delete": False})

    if not address[0].isdigit():
        group = list(mongo_client.sc4snmp.groups.find({address: {"$exists": 1}}))
        if len(group) == 0:
            return json_util.dumps({"message": f"There is no group {address} configured. Record was not added."}), 400

    if len(list(inventory_record)) == 0:
        mongo_client.sc4snmp.inventory_ui.insert_one(inventory_obj)
        return "success"
    else:
        identifier = f"{address}:{port}" if address[0].isdigit() else address
        return json_util.dumps({"message": f"Inventory record for {identifier} already exists. Record was not added."}), 400



@ui.route('/inventory/delete/<inventory_id>', methods=['POST'])
@cross_origin()
def delete_inventory_record(inventory_id):
    mongo_client.sc4snmp.inventory_ui.update_one({"_id": ObjectId(inventory_id)}, {"$set": {"delete": True}})
    return "success"


@ui.route('/inventory/update/<inventory_id>', methods=['POST'])
@cross_origin()
def update_inventory_record(inventory_id):
    inventory_obj = request.json
    inventory_obj = inventory_conversion.ui2backend(inventory_obj, delete=False)
    mongo_client.sc4snmp.inventory_ui.update_one({"_id": ObjectId(inventory_id)}, {"$set": inventory_obj})
    return "success"
