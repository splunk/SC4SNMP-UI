from bson import json_util
from flask import Flask, request
from flask_cors import cross_origin
from pymongo import MongoClient


app = Flask(__name__)
client = MongoClient('localhost', 27017)
db = client.sc4snmp


@app.route('/')
def hello_world():
    return 'Hello World!'


@app.route('/inventory')
@cross_origin()
def get_inventory_list():
    inventory = db.inventory.find()
    return json_util.dumps(list(inventory))


@app.route('/inventory/add', methods=['POST'])
@cross_origin(origin='*', headers=['access-control-allow-origin', 'Content-Type'])
def add_inventory_record():
    inventory_obj = request.json
    print(inventory_obj)
    db.inventory.insert_one(inventory_obj)
    return "success"


@app.route('/profiles')
@cross_origin()
def get_profiles_list():
    profiles = db.profiles.find()
    profiles_list = list(profiles)
    print(profiles_list)
    return json_util.dumps([el["profileName"] for el in profiles_list])


@app.route('/profiles/all')
@cross_origin()
def get_all_profiles_list():
    profiles = db.profiles.find()
    profiles_list = list(profiles)
    print(profiles_list)
    return json_util.dumps(profiles_list)


@app.route('/profiles/add', methods=['POST'])
@cross_origin(origin='*', headers=['access-control-allow-origin', 'Content-Type'])
def add_profile_record():
    profile_obj = request.json
    print(profile_obj)
    db.profiles.insert_one(profile_obj)
    return "success"


if __name__ == '__main__':
    app.run()
