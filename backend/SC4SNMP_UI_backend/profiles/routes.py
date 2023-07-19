from bson import ObjectId
from flask import request, Blueprint, jsonify
from flask_cors import cross_origin
from SC4SNMP_UI_backend import mongo_client
from SC4SNMP_UI_backend.common.backend_ui_conversions import ProfileConversion, get_group_or_profile_name_from_backend
from SC4SNMP_UI_backend.common.inventory_utils import update_profiles_in_inventory

profiles_blueprint = Blueprint('profiles_blueprint', __name__)

profile_conversion = ProfileConversion()
mongo_profiles = mongo_client.sc4snmp.profiles_ui
mongo_inventory = mongo_client.sc4snmp.inventory_ui

# @cross_origin(origins='*', headers=['access-control-allow-origin', 'Content-Type'])
@profiles_blueprint.route('/profiles/names')
@cross_origin()
def get_profile_names():
    profiles = list(mongo_profiles.find())
    profiles_list = []
    for pr in profiles:
        converted = profile_conversion.backend2ui(pr, profile_in_inventory=True)
        if converted['conditions']['condition'] not in ['mandatory', 'base']:
            profiles_list.append(converted)
    return jsonify([el["profileName"] for el in profiles_list])

@profiles_blueprint.route('/profiles/count')
@cross_origin()
def get_profiles_count():
    total_count = mongo_profiles.count_documents({})
    return jsonify(total_count)

@profiles_blueprint.route('/profiles/<page_num>/<prof_per_page>')
@cross_origin()
def get_profiles_list(page_num, prof_per_page):
    page_num = int(page_num)
    prof_per_page = int(prof_per_page)
    skips = prof_per_page * (page_num - 1)

    profiles = list(mongo_profiles.find().skip(skips).limit(prof_per_page))
    profiles_list = []
    for pr in profiles:
        profile_name = get_group_or_profile_name_from_backend(pr)
        profile_in_inventory = True if list(mongo_inventory.find({"profiles": {"$regex": f'.*{profile_name}.*'},
                                                                  "delete": False})) else False
        converted = profile_conversion.backend2ui(pr, profile_in_inventory=profile_in_inventory)
        if converted['conditions']['condition'] not in ['mandatory']:
            profiles_list.append(converted)
    return jsonify(profiles_list)


@profiles_blueprint.route('/profiles')
@cross_origin()
def get_all_profiles_list():
    profiles = list(mongo_profiles.find())
    profiles_list = []
    for pr in profiles:
        converted = profile_conversion.backend2ui(pr, profile_in_inventory=True)
        if converted['conditions']['condition'] not in ['mandatory']:
            profiles_list.append(converted)
    return jsonify(profiles_list)


@profiles_blueprint.route('/profiles/add', methods=['POST'])
@cross_origin()
def add_profile_record():
    profile_obj = request.json
    same_name_profiles = list(mongo_profiles.find({f"{profile_obj['profileName']}": {"$exists": True}}))
    if len(same_name_profiles) > 0:
        result = jsonify(
            {"message": f"Profile with name {profile_obj['profileName']} already exists. Profile was not added."}), 400
    else:
        profile_obj = profile_conversion.ui2backend(profile_obj)
        mongo_profiles.insert_one(profile_obj)
        result = jsonify("success")
    return result

@profiles_blueprint.route('/profiles/delete/<profile_id>', methods=['POST'])
@cross_origin()
def delete_profile_record(profile_id):
    profile = list(mongo_profiles.find({'_id': ObjectId(profile_id)}, {"_id": 0}))[0]
    profile_name = list(profile.keys())[0]

    # Find records from inventory where this profile was used.
    def delete_profile(index, record_to_update, kwargs):
        record_to_update["profiles"].pop(index)
        return record_to_update
    inventory_records = update_profiles_in_inventory(profile_name, delete_profile)
    if inventory_records:
        message = f"Profile {profile_name} was deleted. It was also deleted from some inventory records."
    else:
        message = f"Profile {profile_name} was deleted."

    mongo_profiles.delete_one({'_id': ObjectId(profile_id)})
    return jsonify({"message": message}), 200


@profiles_blueprint.route('/profiles/update/<profile_id>', methods=['POST'])
@cross_origin()
def update_profile_record(profile_id):
    profile_obj = request.json
    new_profile_name = profile_obj['profileName']

    same_name_profiles = list(mongo_profiles.find({f"{new_profile_name}": {"$exists": True}, "_id": {"$ne": ObjectId(profile_id)}}))
    if len(same_name_profiles) > 0:
        return jsonify(
            {"message": f"Profile with name {new_profile_name} already exists. Profile was not edited."}), 400

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