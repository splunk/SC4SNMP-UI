import os

from bson import json_util, ObjectId
from flask import Flask, request
from flask_cors import cross_origin
from pymongo import MongoClient


app = Flask(__name__)
mongo_ip = os.getenv('MONGO_IP', "127.0.0.1")
mongo_port = os.getenv('MONGO_PORT', 27017)
client = MongoClient(mongo_ip, mongo_port)
db = client.sc4snmp


@app.route('/')
@cross_origin()
#@cross_origin(origins='*', headers=['access-control-allow-origin', 'Content-Type'])
def hello_world():
    return 'Hello World!'


@app.route('/inventory/<page_num>/<dev_per_page>')
@cross_origin()
#@cross_origin(origins='*', headers=['access-control-allow-origin', 'Content-Type'])
def get_inventory_list(page_num, dev_per_page):
    page_num = int(page_num)
    dev_per_page = int(dev_per_page)
    skips = dev_per_page * (page_num - 1)
    inventory = db.inventory.find().skip(skips).limit(dev_per_page)
    inventory_list = list(inventory)
    return json_util.dumps(inventory_list)

@app.route('/inventory/count')
@cross_origin()
def get_inventory_count():
    total_count = db.inventory.count_documents({})
    return json_util.dumps(total_count)


@app.route('/inventory/add', methods=['POST'])
#@cross_origin(origins='*', headers=['access-control-allow-origin', 'Content-Type'])
@cross_origin()
def add_inventory_record():
    inventory_obj = request.json
    print(inventory_obj)
    db.inventory.insert_one(inventory_obj)
    return "success"


@app.route('/inventory/delete/<inventory_id>', methods=['POST'])
#@cross_origin(origins='*', headers=['access-control-allow-origin', 'Content-Type'])
@cross_origin()
def delete_inventory_record(inventory_id):
    db.inventory.delete_one({'_id': ObjectId(inventory_id)})
    return "success"


@app.route('/inventory/update/<inventory_id>', methods=['POST'])
#@cross_origin(origins='*', headers=['access-control-allow-origin', 'Content-Type'])
@cross_origin()
def update_inventory_record(inventory_id):
    inventory_obj = request.json
    print(f"{inventory_obj}")
    new_values = {"$set": inventory_obj}
    db.inventory.update_one({'_id': ObjectId(inventory_id)}, new_values)
    return "success"


@app.route('/profiles/names')
#@cross_origin(origins='*', headers=['access-control-allow-origin', 'Content-Type'])
@cross_origin()
def get_profiles_list():
    profiles = db.profiles.find()
    profiles_list = list(profiles)
    print(profiles_list)
    return json_util.dumps([el["profileName"] for el in profiles_list])


@app.route('/profiles')
@cross_origin(origins="*", headers=['access-control-allow-origin', 'Content-Type'])
def get_all_profiles_list():
    profiles = db.profiles.find()
    profiles_list = list(profiles)
    print(profiles_list)
    return json_util.dumps(profiles_list)


# @cross_origin(origin='*', headers=['access-control-allow-origin', 'Content-Type'])
@app.route('/profiles/add', methods=['POST'])
#@cross_origin(origins='*', headers=['access-control-allow-origin', 'Content-Type'])
@cross_origin()
def add_profile_record():
    profile_obj = request.json
    print(profile_obj)
    db.profiles.insert_one(profile_obj)
    return "success"


@app.route('/profiles/delete/<profile_id>', methods=['POST'])
#@cross_origin(origins='*', headers=['access-control-allow-origin', 'Content-Type'])
@cross_origin()
def delete_profile_record(profile_id):
    db.profiles.delete_one({'_id': ObjectId(profile_id)})
    return "success"


@app.route('/profiles/update/<profile_id>', methods=['POST'])
#@cross_origin(origins='*', headers=['access-control-allow-origin', 'Content-Type'])
@cross_origin()
def update_profile_record(profile_id):
    profile_obj = request.json
    print(f"{profile_obj}")
    new_values = {"$set": profile_obj}
    db.profiles.update_one({'_id': ObjectId(profile_id)}, new_values)
    return "success"


@app.route('/groups')
@cross_origin()
def get_groups_list():
    groups = db.groups.find()
    groups_list = list(groups)
    return json_util.dumps(groups_list)


@app.route('/groups/add', methods=['POST'])
#@cross_origin(origins='*', headers=['access-control-allow-origin', 'Content-Type'])
@cross_origin()
def add_group_record():
    group_obj = request.json
    print(group_obj)
    db.groups.insert_one(group_obj)
    return "success"


@app.route('/groups/update/<group_id>', methods=['POST'])
#@cross_origin(origins='*', headers=['access-control-allow-origin', 'Content-Type'])
@cross_origin()
def update_group(group_id):
    group_obj = request.json
    print(f"{group_obj}")
    new_values = {"$set": group_obj}
    db.groups.update_one({'_id': ObjectId(group_id)}, new_values)
    return "success"


@app.route('/groups/delete/<group_id>', methods=['POST'])
#@cross_origin(origins='*', headers=['access-control-allow-origin', 'Content-Type'])
@cross_origin()
def delete_group_and_devices(group_id):
    db.groups.delete_one({'_id': ObjectId(group_id)})
    db.devices.delete_many({"groupId": group_id})
    return "success"


@app.route('/group/<group_id>/devices/count')
@cross_origin()
def get_devices_count_for_group(group_id):
    total_count = db.devices.count_documents({"groupId": group_id})
    return json_util.dumps(total_count)


@app.route('/group/<group_id>/devices/<page_num>/<dev_per_page>')
@cross_origin()
def get_devices_of_groups_list(group_id, page_num, dev_per_page):
    page_num = int(page_num)
    dev_per_page = int(dev_per_page)
    skips = dev_per_page * (page_num - 1)
    devices = db.devices.find({"groupId": group_id}).skip(skips).limit(dev_per_page)
    devices_list = list(devices)
    return json_util.dumps(devices_list)


@app.route('/devices/add', methods=['POST'])
#@cross_origin(origins='*', headers=['access-control-allow-origin', 'Content-Type'])
@cross_origin()
def add_device_to_group_record():
    device_obj = request.json
    print(device_obj)
    db.devices.insert_one(device_obj)
    return "success"


@app.route('/devices/update/<device_id>', methods=['POST'])
#@cross_origin(origins='*', headers=['access-control-allow-origin', 'Content-Type'])
@cross_origin()
def update_device_from_group(device_id):
    device_obj = request.json
    print(f"{device_obj}")
    new_values = {"$set": device_obj}
    db.devices.update_one({'_id': ObjectId(device_id)}, new_values)
    return "success"


@app.route('/devices/delete/<device_id>', methods=['POST'])
@cross_origin()
#@cross_origin(origins='*', headers=['access-control-allow-origin', 'Content-Type'])
def delete_device_from_group_record(device_id):
    db.devices.delete_one({'_id': ObjectId(device_id)})
    return "success"


if __name__ == '__main__':
    app.run()
