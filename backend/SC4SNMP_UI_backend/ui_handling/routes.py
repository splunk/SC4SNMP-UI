from bson import json_util, ObjectId
from flask import Flask, request, Blueprint
from flask_cors import cross_origin
from SC4SNMP_UI_backend import db

ui = Blueprint('ui', __name__)


# @cross_origin(origins='*', headers=['access-control-allow-origin', 'Content-Type'])
@ui.route('/inventory/<page_num>/<dev_per_page>')
@cross_origin()
def get_inventory_list(page_num, dev_per_page):
    page_num = int(page_num)
    dev_per_page = int(dev_per_page)
    skips = dev_per_page * (page_num - 1)
    inventory = db.inventory_ui.find().skip(skips).limit(dev_per_page)
    inventory_list = list(inventory)
    return json_util.dumps(inventory_list)


@ui.route('/inventory/count')
@cross_origin()
def get_inventory_count():
    total_count = db.inventory_ui.count_documents({})
    return json_util.dumps(total_count)


@ui.route('/inventory/add', methods=['POST'])
@cross_origin()
def add_inventory_record():
    inventory_obj = request.json
    print(inventory_obj)
    db.inventory_ui.insert_one(inventory_obj)
    return "success"


@ui.route('/inventory/delete/<inventory_id>', methods=['POST'])
@cross_origin()
def delete_inventory_record(inventory_id):
    db.inventory_ui.delete_one({'_id': ObjectId(inventory_id)})
    return "success"


@ui.route('/inventory/update/<inventory_id>', methods=['POST'])
@cross_origin()
def update_inventory_record(inventory_id):
    inventory_obj = request.json
    print(f"{inventory_obj}")
    new_values = {"$set": inventory_obj}
    db.inventory_ui.update_one({'_id': ObjectId(inventory_id)}, new_values)
    return "success"


@ui.route('/profiles/names')
@cross_origin()
def get_profiles_list():
    profiles = db.profiles_ui.find()
    profiles_list = list(profiles)
    print(profiles_list)
    return json_util.dumps([el["profileName"] for el in profiles_list])


@ui.route('/profiles')
@cross_origin()
def get_all_profiles_list():
    profiles = db.profiles_ui.find()
    profiles_list = list(profiles)
    print(profiles_list)
    return json_util.dumps(profiles_list)


@ui.route('/profiles/add', methods=['POST'])
@cross_origin()
def add_profile_record():
    profile_obj = request.json
    print(profile_obj)
    db.profiles_ui.insert_one(profile_obj)
    return "success"


@ui.route('/profiles/delete/<profile_id>', methods=['POST'])
@cross_origin()
def delete_profile_record(profile_id):
    db.profiles_ui.delete_one({'_id': ObjectId(profile_id)})
    return "success"


@ui.route('/profiles/update/<profile_id>', methods=['POST'])
@cross_origin()
def update_profile_record(profile_id):
    profile_obj = request.json
    print(f"{profile_obj}")
    new_values = {"$set": profile_obj}
    db.profiles_ui.update_one({'_id': ObjectId(profile_id)}, new_values)
    return "success"


@ui.route('/groups')
@cross_origin()
def get_groups_list():
    groups = db.groups_ui.find()
    groups_list = list(groups)
    return json_util.dumps(groups_list)


@ui.route('/groups/add', methods=['POST'])
@cross_origin()
def add_group_record():
    group_obj = request.json
    print(group_obj)
    db.groups_ui.insert_one(group_obj)
    return "success"


@ui.route('/groups/update/<group_id>', methods=['POST'])
@cross_origin()
def update_group(group_id):
    group_obj = request.json
    print(f"{group_obj}")
    new_values = {"$set": group_obj}
    db.groups_ui.update_one({'_id': ObjectId(group_id)}, new_values)
    return "success"


@ui.route('/groups/delete/<group_id>', methods=['POST'])
@cross_origin()
def delete_group_and_devices(group_id):
    db.groups_ui.delete_one({'_id': ObjectId(group_id)})
    db.devices_ui.delete_many({"groupId": group_id})
    return "success"


@ui.route('/group/<group_id>/devices/count')
@cross_origin()
def get_devices_count_for_group(group_id):
    total_count = db.devices_ui.count_documents({"groupId": group_id})
    return json_util.dumps(total_count)


@ui.route('/group/<group_id>/devices/<page_num>/<dev_per_page>')
@cross_origin()
def get_devices_of_groups_list(group_id, page_num, dev_per_page):
    page_num = int(page_num)
    dev_per_page = int(dev_per_page)
    skips = dev_per_page * (page_num - 1)
    devices = db.devices_ui.find({"groupId": group_id}).skip(skips).limit(dev_per_page)
    devices_list = list(devices)
    return json_util.dumps(devices_list)


@ui.route('/devices/add', methods=['POST'])
@cross_origin()
def add_device_to_group_record():
    device_obj = request.json
    print(device_obj)
    db.devices_ui.insert_one(device_obj)
    return "success"


@ui.route('/devices/update/<device_id>', methods=['POST'])
@cross_origin()
def update_device_from_group(device_id):
    device_obj = request.json
    print(f"{device_obj}")
    new_values = {"$set": device_obj}
    db.devices_ui.update_one({'_id': ObjectId(device_id)}, new_values)
    return "success"


@ui.route('/devices/delete/<device_id>', methods=['POST'])
@cross_origin()
def delete_device_from_group_record(device_id):
    db.devices_ui.delete_one({'_id': ObjectId(device_id)})
    return "success"

