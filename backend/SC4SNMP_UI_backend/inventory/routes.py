from bson import ObjectId
from flask import request, Blueprint, jsonify
from flask_cors import cross_origin
from SC4SNMP_UI_backend import mongo_client
from SC4SNMP_UI_backend.common.backend_ui_conversions import InventoryConversion
from SC4SNMP_UI_backend.common.inventory_utils import HandleNewDevice

inventory_blueprint = Blueprint('inventory_blueprint', __name__)

inventory_conversion = InventoryConversion()
mongo_groups = mongo_client.sc4snmp.groups_ui
mongo_inventory = mongo_client.sc4snmp.inventory_ui


@inventory_blueprint.route('/inventory/<page_num>/<dev_per_page>')
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


@inventory_blueprint.route('/inventory/count')
@cross_origin()
def get_inventory_count():
    total_count = mongo_inventory.count_documents({"delete": False})
    return jsonify(total_count)


@inventory_blueprint.route('/inventory/add', methods=['POST'])
@cross_origin()
def add_inventory_record():
    inventory_obj = request.json
    inventory_obj = inventory_conversion.ui2backend(inventory_obj, delete=False)
    handler = HandleNewDevice(mongo_groups, mongo_inventory)
    if inventory_obj["address"][0].isdigit():
        record_added, message = handler.add_single_host(inventory_obj["address"], str(inventory_obj["port"]),
                                                        inventory_obj, True)
    else:
        record_added, message = handler.add_group_to_inventory(inventory_obj["address"], str(inventory_obj["port"]),
                                                        inventory_obj, True)
    if record_added and message is not None:
        result = jsonify({"message": message}), 200
    elif record_added:
        result = jsonify("success"), 200
    else:
        result = jsonify({"message": message}), 400
    return result


@inventory_blueprint.route('/inventory/delete/<inventory_id>', methods=['POST'])
@cross_origin()
def delete_inventory_record(inventory_id):
    mongo_inventory.update_one({"_id": ObjectId(inventory_id)}, {"$set": {"delete": True}})
    inventory_item = list(mongo_inventory.find({"_id": ObjectId(inventory_id)}))[0]
    address = inventory_item['address']
    port = f":{inventory_item['port']}" if address[0].isnumeric() else ""
    return jsonify({"message": f"{address}{port} was deleted."}), 200


@inventory_blueprint.route('/inventory/update/<inventory_id>', methods=['POST'])
@cross_origin()
def update_inventory_record(inventory_id):
    inventory_obj = request.json
    inventory_obj = inventory_conversion.ui2backend(inventory_obj, delete=False)
    current_inventory = list(mongo_inventory.find({"_id": ObjectId(inventory_id)}))[0]
    handler = HandleNewDevice(mongo_groups, mongo_inventory)

    is_current_a_single_host = current_inventory["address"][0].isdigit()
    is_new_a_single_host = inventory_obj["address"][0].isdigit()
    if is_current_a_single_host != is_new_a_single_host:
        result = jsonify({"message": "Can't edit single host to the group or group to the single host"}), 400
    else:
        if is_new_a_single_host:
            record_edited, message = handler.edit_single_host(inventory_obj["address"], str(inventory_obj["port"]),
                                                              str(inventory_id), inventory_obj, True)
        else:
            record_edited, message = handler.edit_group_in_inventory(inventory_obj["address"], str(inventory_id), inventory_obj, True)
        if record_edited:
            if message == "success" or message is None:
                print(message)
                result = jsonify("success"), 200
            else:
                result = jsonify({"message": message}), 200
        else:
            result = jsonify({"message": message}), 400
    return result
