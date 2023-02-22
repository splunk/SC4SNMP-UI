from bson import ObjectId
from flask import request, Blueprint, jsonify
from flask_cors import cross_origin
from SC4SNMP_UI_backend import mongo_client
from SC4SNMP_UI_backend.common.conversions import GroupConversion, GroupDeviceConversion, InventoryConversion, \
    get_group_name_from_backend
from copy import copy
from SC4SNMP_UI_backend.common.helpers import HandleNewDevice

groups_blueprint = Blueprint('groups_blueprint', __name__)

group_conversion = GroupConversion()
group_device_conversion = GroupDeviceConversion()
inventory_conversion = InventoryConversion()
mongo_groups = mongo_client.sc4snmp.groups_ui
mongo_inventory = mongo_client.sc4snmp.inventory_ui

@groups_blueprint.route('/groups')
@cross_origin()
def get_groups_list():
    groups = mongo_groups.find()
    groups_list = []
    for gr in list(groups):
        groups_list.append(group_conversion.backend2ui(gr))
    return jsonify(groups_list)


@groups_blueprint.route('/groups/add', methods=['POST'])
@cross_origin()
def add_group_record():
    group_obj = request.json
    same_name_groups = list(mongo_groups.find({f"{group_obj['groupName']}": {"$exists": True}}))
    if len(same_name_groups) > 0:
        result = jsonify(
            {"message": f"Group with name {group_obj['groupName']} already exists. Group was not added."}), 400
    else:
        group_obj = group_conversion.ui2backend(group_obj)
        mongo_groups.insert_one(group_obj)
        result = jsonify("success")
    return result


@groups_blueprint.route('/groups/update/<group_id>', methods=['POST'])
@cross_origin()
def update_group(group_id):
    group_obj = request.json
    same_name_groups = list(mongo_groups.find({f"{group_obj['groupName']}": {"$exists": True}}))
    if len(same_name_groups) > 0:
        result = jsonify(
            {"message": f"Group with name {group_obj['groupName']} already exists. Group was not edited."}), 400
    else:
        old_group = list(mongo_groups.find({'_id': ObjectId(group_id)}))[0]
        old_group_name = get_group_name_from_backend(old_group)
        mongo_groups.update_one({'_id': old_group['_id']}, {"$rename": {f"{old_group_name}": f"{group_obj['groupName']}"}})

        # Rename corresponding group in the inventory
        mongo_inventory.update_one({"address": old_group_name}, {"$set": {"address": group_obj['groupName']}})
        result = jsonify({"message": f"{old_group_name} was also renamed to {group_obj['groupName']} in the inventory"}), 200
    return result


@groups_blueprint.route('/groups/delete/<group_id>', methods=['POST'])
@cross_origin()
def delete_group_and_devices(group_id):
    group = list(mongo_groups.find({'_id': ObjectId(group_id)}))[0]
    group_name = get_group_name_from_backend(group)
    with mongo_client.start_session() as session:
        with session.start_transaction():
            mongo_groups.delete_one({'_id': ObjectId(group_id)})
            mongo_inventory.update_one({"address": group_name}, {"$set": {"delete": True}})
    return jsonify({"message": f"Group {group_name} was deleted. If {group_name} was configured in the inventory, it was deleted from there."}), 200


@groups_blueprint.route('/group/<group_id>/devices/count')
@cross_origin()
def get_devices_count_for_group(group_id):
    group = list(mongo_groups.find({"_id": ObjectId(group_id)}))[0]
    group_name = get_group_name_from_backend(group)
    total_count = len(group[group_name])
    return jsonify(total_count)


@groups_blueprint.route('/group/<group_id>/devices/<page_num>/<dev_per_page>')
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


@groups_blueprint.route('/group/inventory/<group_name>')
@cross_origin()
def get_group_config_from_inventory(group_name):
    group_from_inventory = list(mongo_inventory.find({"address": group_name, "delete": False}))
    if len(group_from_inventory) > 0:
        result = jsonify(inventory_conversion.backend2ui(group_from_inventory[0])), 200
    else:
        result = "", 204
    return result


@groups_blueprint.route('/devices/add', methods=['POST'])
@cross_origin()
def add_device_to_group():
    device_obj = request.json
    group_id = device_obj["groupId"]
    group = list(mongo_groups.find({'_id': ObjectId(group_id)}, {"_id": 0}))[0]
    group_name = get_group_name_from_backend(group)
    device_obj = group_device_conversion.ui2backend(device_obj)
    handler = HandleNewDevice(mongo_groups, mongo_inventory)
    host_added, message = handler.add_group_host(group_name, ObjectId(group_id), device_obj)
    if host_added:
        result = jsonify("success"), 200
    else:
        result = jsonify({"message": message}), 400
    return result


@groups_blueprint.route('/devices/update/<device_id>', methods=['POST'])
@cross_origin()
def update_device_from_group(device_id):
    device_obj = request.json
    group_id = device_id.split("-")[0]
    device_id = device_id.split("-")[1]
    group = list(mongo_groups.find({'_id': ObjectId(group_id)}, {"_id": 0}))[0]
    device_obj = group_device_conversion.ui2backend(device_obj)
    group_name = get_group_name_from_backend(group)
    handler = HandleNewDevice(mongo_groups, mongo_inventory)

    host_edited, message = handler.edit_group_host(group_name, ObjectId(group_id), device_id, device_obj, )
    if host_edited:
        result = jsonify("success"), 200
    else:
        result = jsonify({"message": message}), 400
    return result


@groups_blueprint.route('/devices/delete/<device_id>', methods=['POST'])
@cross_origin()
def delete_device_from_group_record(device_id: str):
    group_id = device_id.split("-")[0]
    device_id = device_id.split("-")[1]
    group = list(mongo_groups.find({'_id': ObjectId(group_id)}, {"_id": 0}))[0]
    group_name = get_group_name_from_backend(group)
    removed_device = group[group_name].pop(int(device_id))
    device_name = f"{removed_device['address']}:{removed_device.get('port','')}"
    new_values = {"$set": group}
    mongo_groups.update_one({"_id": ObjectId(group_id)}, new_values)
    return jsonify({"message": f"Device {device_name} from group {group_name} was deleted."}), 200