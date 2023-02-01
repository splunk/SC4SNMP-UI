from bson import ObjectId
from flask import request, Blueprint, jsonify
from flask_cors import cross_origin
from SC4SNMP_UI_backend import mongo_client
from SC4SNMP_UI_backend.common.conversions import InventoryConversion
from SC4SNMP_UI_backend.common.helpers import check_if_inventory_can_be_added, InventoryAddEdit

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
    return check_if_inventory_can_be_added(inventory_obj, InventoryAddEdit.ADD, None)


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
    return check_if_inventory_can_be_added(inventory_obj, InventoryAddEdit.EDIT, inventory_id)
