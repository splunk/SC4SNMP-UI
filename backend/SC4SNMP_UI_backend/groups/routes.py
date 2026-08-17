from bson import ObjectId
from flask import request, Blueprint, jsonify
from SC4SNMP_UI_backend import mongo_client
from SC4SNMP_UI_backend.auth.utils import login_required
from SC4SNMP_UI_backend.common.backend_ui_conversions import GroupConversion, GroupDeviceConversion, InventoryConversion, \
    get_group_or_profile_name_from_backend
from copy import copy
from SC4SNMP_UI_backend.common.inventory_utils import HandleNewDevice, get_inventory_type
from SC4SNMP_UI_backend.common.mongo_utils import run_write

groups_blueprint = Blueprint('groups_blueprint', __name__)

group_conversion = GroupConversion()
group_device_conversion = GroupDeviceConversion()
inventory_conversion = InventoryConversion()
mongo_groups = mongo_client.sc4snmp.groups_ui
mongo_inventory = mongo_client.sc4snmp.inventory_ui

@groups_blueprint.route('/groups/count')
@login_required
def get_groups_count():
    total_count = mongo_groups.count_documents({})
    return jsonify(total_count)


@groups_blueprint.route('/groups/<page_num>/<groups_per_page>')
@login_required
def get_groups_list(page_num, groups_per_page):
    page_num = int(page_num)
    groups_per_page = int(groups_per_page)
    skips = groups_per_page * (page_num - 1)

    # Sorting by _id keeps skip/limit deterministic across refetches (group name is a
    # dynamic top-level key, so it can't be sorted on directly); _id order matches the
    # existing insertion-order behavior.
    page_groups = list(mongo_groups.find().sort("_id", 1).skip(skips).limit(groups_per_page))

    group_names = [get_group_or_profile_name_from_backend(gr) for gr in page_groups]
    # Single batched lookup instead of one query per group: fetch every non-deleted
    # inventory address used by this page's groups, then check membership in memory.
    in_inventory = set()
    if group_names:
        in_inventory = {
            doc["address"] for doc in
            mongo_inventory.find({"address": {"$in": group_names}, "delete": False}, {"address": 1, "_id": 0})
        }

    groups_list = []
    for gr, group_name in zip(page_groups, group_names):
        group_in_inventory = group_name in in_inventory
        groups_list.append(group_conversion.backend2ui(gr, group_in_inventory=group_in_inventory))
    return jsonify(groups_list)


@groups_blueprint.route('/groups/add', methods=['POST'])
@login_required
def add_group_record():
    group_obj = request.json
    same_name_groups = list(mongo_groups.find({f"{group_obj['groupName']}": {"$exists": True}}))
    if len(same_name_groups) > 0:
        result = jsonify(
            {"message": f"Group with name {group_obj['groupName']} already exists. Group was not added."}), 400
    elif list(mongo_inventory.find({"address": group_obj['groupName'], "delete": False})):
        result = jsonify(
            {"message": f"In the inventory there is a record with name {group_obj['groupName']}. Group was not added."}
        ), 400
    else:
        group_obj = group_conversion.ui2backend(group_obj)
        mongo_groups.insert_one(group_obj)
        result = jsonify("success")
    return result


@groups_blueprint.route('/groups/update/<group_id>', methods=['POST'])
@login_required
def update_group(group_id):
    group_obj = request.json
    same_name_groups = list(mongo_groups.find({f"{group_obj['groupName']}": {"$exists": True}}))
    if len(same_name_groups) > 0:
        result = jsonify(
            {"message": f"Group with name {group_obj['groupName']} already exists. Group was not edited."}), 400
    elif list(mongo_inventory.find({"address": group_obj['groupName'], "delete": False})):
        result = jsonify(
            {"message": f"In the inventory there is a record with name {group_obj['groupName']}. Group was not edited."}
        ), 400
    else:
        old_group = list(mongo_groups.find({'_id': ObjectId(group_id)}))[0]
        old_group_name = get_group_or_profile_name_from_backend(old_group)
        mongo_groups.update_one({'_id': old_group['_id']}, {"$rename": {f"{old_group_name}": f"{group_obj['groupName']}"}})

        # Rename corresponding group in the inventory
        mongo_inventory.update_one({"address": old_group_name}, {"$set": {"address": group_obj['groupName']}})
        result = jsonify({"message": f"{old_group_name} was also renamed to {group_obj['groupName']} in the inventory"}), 200
    return result


@groups_blueprint.route('/groups/delete/<group_id>', methods=['POST'])
@login_required
def delete_group_and_devices(group_id):
    group = list(mongo_groups.find({'_id': ObjectId(group_id)}))[0]
    group_name = get_group_or_profile_name_from_backend(group)

    def _delete(session):
        mongo_groups.delete_one({'_id': ObjectId(group_id)}, session=session)
        configured = bool(list(mongo_inventory.find({"address": group_name}, session=session)))
        mongo_inventory.update_one({"address": group_name}, {"$set": {"delete": True}}, session=session)
        return configured

    configured_in_inventory = run_write(_delete)
    if configured_in_inventory:
        message = f"Group {group_name} was deleted. It was also deleted from the inventory."
    else:
        message = f"Group {group_name} was deleted."
    return jsonify({"message": message}), 200


@groups_blueprint.route('/group/<group_id>/devices/count')
@login_required
def get_devices_count_for_group(group_id):
    group = list(mongo_groups.find({"_id": ObjectId(group_id)}))[0]
    group_name = get_group_or_profile_name_from_backend(group)
    total_count = len(group[group_name])
    return jsonify(total_count)


@groups_blueprint.route('/group/<group_id>/devices/<page_num>/<dev_per_page>')
@login_required
def get_devices_of_group(group_id, page_num, dev_per_page):
    page_num = int(page_num)
    dev_per_page = int(dev_per_page)
    skips = dev_per_page * (page_num - 1)
    group = list(mongo_groups.find({"_id": ObjectId(group_id)}))[0]

    group_name = get_group_or_profile_name_from_backend(group)
    devices_list = []
    for i, device in enumerate(group[group_name]):
        devices_list.append(group_device_conversion.backend2ui(device, group_id=group_id, device_id=copy(i)))
    devices_list = devices_list[skips:skips+dev_per_page]
    return jsonify(devices_list)


@groups_blueprint.route('/group/inventory/<group_name>')
@login_required
def get_group_config_from_inventory(group_name):
    group_from_inventory = list(mongo_inventory.find({"address": group_name, "delete": False}))
    if len(group_from_inventory) > 0:
        inventory_type = get_inventory_type(group_from_inventory[0])
        result = jsonify(inventory_conversion.backend2ui(group_from_inventory[0], inventory_type=inventory_type)), 200
    else:
        result = "", 204
    return result


@groups_blueprint.route('/devices/add', methods=['POST'])
@login_required
def add_device_to_group():
    device_obj = request.json
    group_id = device_obj["groupId"]
    group = list(mongo_groups.find({'_id': ObjectId(group_id)}, {"_id": 0}))[0]
    group_name = get_group_or_profile_name_from_backend(group)
    device_obj = group_device_conversion.ui2backend(device_obj)
    handler = HandleNewDevice(mongo_groups, mongo_inventory)
    host_added, message = handler.add_group_host(group_name, ObjectId(group_id), device_obj)
    if host_added:
        result = jsonify("success"), 200
    else:
        result = jsonify({"message": message}), 400
    return result


@groups_blueprint.route('/devices/add/bulk', methods=['POST'])
@login_required
def add_devices_to_group_bulk():
    payload = request.json or {}
    group_id = payload.get("groupId")
    devices = payload.get("devices")
    if not group_id or not devices:
        return jsonify({"message": "groupId and a non-empty devices list are required."}), 400

    group_records = list(mongo_groups.find({'_id': ObjectId(group_id)}, {"_id": 0}))
    if not group_records:
        return jsonify({"message": f"Group with id {group_id} was not found."}), 400
    group_name = get_group_or_profile_name_from_backend(group_records[0])

    # Normalize each device defensively before ui2backend: it does len(document[key])
    # and int(port), which raises on a missing/non-string field - a real risk from
    # the paste/CSV adapters rather than the manual grid. A device missing address
    # entirely is rejected here rather than crashing ui2backend.
    backend_devices = []
    results_by_index = {}
    for index, device in enumerate(devices):
        address = str(device.get("address") or "").strip()
        if not address:
            results_by_index[index] = {
                "index": index, "address": address, "port": device.get("port"),
                "added": False, "message": "Address is required.",
            }
            continue
        normalized = {
            "address": address,
            "port": str(device.get("port") or ""),
            "version": str(device.get("version") or ""),
            "community": str(device.get("community") or ""),
            "secret": str(device.get("secret") or ""),
            "securityEngine": str(device.get("securityEngine") or ""),
        }
        backend_devices.append((index, group_device_conversion.ui2backend(normalized)))

    handler = HandleNewDevice(mongo_groups, mongo_inventory)
    bulk_results = handler.add_group_hosts_bulk(group_name, ObjectId(group_id), [d for _, d in backend_devices])

    for (original_index, _), result in zip(backend_devices, bulk_results):
        results_by_index[original_index] = {"index": original_index, **result}

    ordered_results = [results_by_index[i] for i in range(len(devices))]
    added = sum(1 for r in ordered_results if r["added"])
    failed = len(ordered_results) - added

    return jsonify({"added": added, "failed": failed, "results": ordered_results}), 200


@groups_blueprint.route('/devices/update/<device_id>', methods=['POST'])
@login_required
def update_device_from_group(device_id):
    device_obj = request.json
    group_id = device_id.split("-")[0]
    device_id = device_id.split("-")[1]
    group = list(mongo_groups.find({'_id': ObjectId(group_id)}, {"_id": 0}))[0]
    device_obj = group_device_conversion.ui2backend(device_obj)
    group_name = get_group_or_profile_name_from_backend(group)
    handler = HandleNewDevice(mongo_groups, mongo_inventory)

    host_edited, message = handler.edit_group_host(group_name, ObjectId(group_id), device_id, device_obj, )
    if host_edited:
        result = jsonify("success"), 200
    else:
        result = jsonify({"message": message}), 400
    return result


@groups_blueprint.route('/devices/delete/<device_id>', methods=['POST'])
@login_required
def delete_device_from_group_record(device_id: str):
    group_id = device_id.split("-")[0]
    device_id = device_id.split("-")[1]
    group = list(mongo_groups.find({'_id': ObjectId(group_id)}, {"_id": 0}))[0]
    group_name = get_group_or_profile_name_from_backend(group)
    removed_device = group[group_name].pop(int(device_id))
    device_name = f"{removed_device['address']}:{removed_device.get('port','')}"
    new_values = {"$set": group}
    mongo_groups.update_one({"_id": ObjectId(group_id)}, new_values)
    return jsonify({"message": f"Device {device_name} from group {group_name} was deleted."}), 200