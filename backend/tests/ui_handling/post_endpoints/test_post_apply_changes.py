from unittest import mock
from unittest.mock import call
from bson import ObjectId
from copy import copy
import ruamel
import datetime
import os
from SC4SNMP_UI_backend.apply_changes.handling_chain import TMP_FILE_PREFIX

VALUES_TEST_DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                             "../../yamls_for_tests/values_test")
REFERENCE_FILES_DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                         "../../yamls_for_tests/reference_files")

def return_generated_and_reference_files():
    reference_files_names = ["poller_inventory.yaml", "scheduler_profiles.yaml", "scheduler_groups.yaml"]
    reference_files = []
    generated_files = []
    yaml = ruamel.yaml.YAML()

    for file_name in reference_files_names:
        # add temporary files
        reference_file_path = os.path.join(REFERENCE_FILES_DIRECTORY, file_name)
        with open(reference_file_path, "r") as file:
            data = yaml.load(file)
        reference_files.append(copy(data))

        generated_file_path = os.path.join(VALUES_TEST_DIRECTORY, f"{TMP_FILE_PREFIX}{file_name}")
        with open(generated_file_path, "r") as file:
            data = yaml.load(file)
        generated_files.append(copy(data))

    # add values files
    edited_values_path = os.path.join(VALUES_TEST_DIRECTORY, "values.yaml")
    original_values_path = os.path.join(REFERENCE_FILES_DIRECTORY, "values.yaml")
    with open(original_values_path, "r") as file:
        data = yaml.load(file)
    reference_files.append(copy(data))
    with open(edited_values_path, "r") as file:
        data = yaml.load(file)
    generated_files.append(copy(data))
    return reference_files, generated_files

def delete_generated_files():
    reference_files_names = ["poller_inventory.yaml", "scheduler_profiles.yaml", "scheduler_groups.yaml"]
    for file_name in reference_files_names:
        generated_file_path = os.path.join(VALUES_TEST_DIRECTORY, f"{TMP_FILE_PREFIX}{file_name}")
        if os.path.exists(generated_file_path):
            os.remove(generated_file_path)

def reset_generated_values():
    edited_values_path = os.path.join(VALUES_TEST_DIRECTORY, "values.yaml")
    original_values_path = os.path.join(VALUES_TEST_DIRECTORY, "values-before-edit.yaml")
    yaml = ruamel.yaml.YAML()
    with open(original_values_path, "r") as file:
        original_data = yaml.load(file)
    with open(edited_values_path, "w") as file:
        yaml.dump(original_data, file)


common_id = "635916b2c8cb7a15f28af40a"

groups_collection = [
    {
        "_id": ObjectId(common_id),
        "group1": [
            {"address": "52.14.243.157", "port": 1163},
            {"address": "20.14.10.0", "port": 161},
        ],
    },
    {
        "_id": ObjectId(common_id),
        "group2": [
            {"address": "0.10.20.30"},
            {"address": "52.14.243.157", "port": 1165, "version": "3", "secret": "mysecret", "security_engine": "aabbccdd1234"},
        ]
    }
]

profiles_collection = [
    {
        "_id": ObjectId(common_id),
        "single_metric":{
            "frequency": 60,
            "varBinds":[['IF-MIB', 'ifMtu', '1']]
        }
    },
    {
        "_id": ObjectId(common_id),
        "small_walk":{
            "condition":{
                "type": "walk"
            },
            "varBinds":[['IP-MIB'],['IF-MIB']]
        }
    },
    {
        "_id": ObjectId(common_id),
        "gt_profile":{
            "frequency": 10,
            "conditions":[
                {"field": "IF-MIB.ifIndex", "operation": "gt", "value": 1}
            ],
            "varBinds":[['IF-MIB', 'ifOutDiscards']]
        }
    },
    {
        "_id": ObjectId(common_id),
        "lt_profile":{
            "frequency": 10,
            "conditions":[
                {"field": "IF-MIB.ifIndex", "operation": "lt", "value": 2}
            ],
            "varBinds":[['IF-MIB', 'ifOutDiscards']]
        }
    },
    {
        "_id": ObjectId(common_id),
        "in_profile":{
            "frequency": 10,
            "conditions":[
                {"field": "IF-MIB.ifDescr", "operation": "in", "value": ["eth0", "test value"]}
            ],
            "varBinds":[['IF-MIB', 'ifOutDiscards']]
        }
    },
    {
        "_id": ObjectId(common_id),
        "multiple_conditions":{
            "frequency": 10,
            "conditions":[
                {"field": "IF-MIB.ifIndex", "operation": "gt", "value": 1},
                {"field": "IF-MIB.ifDescr", "operation": "in", "value": ["eth0", "test value"]}
            ],
            "varBinds":[['IF-MIB', 'ifOutDiscards'],['IF-MIB', 'ifOutErrors'],['IF-MIB', 'ifOutOctets']]
        }
    }
]

inventory_collection = [
    {
        "_id": ObjectId(common_id),
        "address": "1.1.1.1",
        "port": 161,
        "version": "2c",
        "community": "public",
        "secret": "",
        "security_engine": "",
        "walk_interval": 1800,
        "profiles": "small_walk;in_profile",
        "smart_profiles": True,
        "delete": False
    },
    {
        "_id": ObjectId(common_id),
        "address": "group1",
        "port": 1161,
        "version": "2c",
        "community": "public",
        "secret": "",
        "security_engine": "",
        "walk_interval": 1800,
        "profiles": "single_metric;multiple_conditions",
        "smart_profiles": False,
        "delete": False
    }
]

@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.VALUES_DIRECTORY", VALUES_TEST_DIRECTORY)
@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.TMP_DIR", VALUES_TEST_DIRECTORY)
@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.VALUES_FILE", "values.yaml")
@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.KEEP_TEMP_FILES", "true")
@mock.patch("datetime.datetime")
@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.run_job")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_apply_changes_first_call(m_find, m_update, m_run_job, m_datetime, client):
    datetime_object = datetime.datetime(2020, 7, 10, 10, 30, 0, 0)
    m_datetime.utcnow = mock.Mock(return_value=datetime_object)
    collection = {
        "_id": ObjectId(common_id),
        "previous_job_start_time": None,
        "currently_scheduled": False
    }
    m_find.side_effect = [
        groups_collection, # call from SaveConfigToFileHandler
        profiles_collection,  # call from SaveConfigToFileHandler
        inventory_collection,  # call from SaveConfigToFileHandler
        [collection],
        [collection],
        [collection]
    ]
    calls_find = [
        call(),
        call(),
        call()
    ]
    calls_update = [
        call({"_id": ObjectId(common_id)},{"$set": {"previous_job_start_time": datetime_object}}),
        call({"_id": ObjectId(common_id)},{"$set": {"currently_scheduled": True}})
    ]
    apply_async_calls = [
        call(countdown=300, queue='apply_changes')
    ]

    m_run_job.apply_async.return_value = None
    m_update.return_value = None

    response = client.post("/apply-changes")
    m_find.assert_has_calls(calls_find)
    m_update.assert_has_calls(calls_update)
    m_run_job.apply_async.assert_has_calls(apply_async_calls)
    assert response.json == {"message": "Configuration will be updated in approximately 300 seconds."}
    reference_files, generated_files = return_generated_and_reference_files()
    for ref_f, gen_f in zip(reference_files, generated_files):
        assert ref_f == gen_f
    delete_generated_files()
    reset_generated_values()

@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.VALUES_DIRECTORY", VALUES_TEST_DIRECTORY)
@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.TMP_DIR", VALUES_TEST_DIRECTORY)
@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.datetime")
@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.run_job")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_apply_changes_job_currently_scheduled(m_find, m_update, m_run_job, m_datetime, client):
    datetime_object_old = datetime.datetime(2020, 7, 10, 10, 27, 10, 0)
    datetime_object_new = datetime.datetime(2020, 7, 10, 10, 30, 0, 0)
    m_datetime.datetime.utcnow = mock.Mock(return_value=datetime_object_new)
    collection = {
        "_id": ObjectId(common_id),
        "previous_job_start_time": datetime_object_old,
        "currently_scheduled": True
    }
    m_find.side_effect = [
        groups_collection,  # call from SaveConfigToFileHandler
        profiles_collection,  # call from SaveConfigToFileHandler
        inventory_collection,  # call from SaveConfigToFileHandler
        [collection],
        [collection],
        [collection]
    ]
    calls_find = [
        call(),
        call(),
        call()
    ]
    m_run_job.apply_async.return_value = None
    m_update.return_value = None

    response = client.post("/apply-changes")
    m_find.assert_has_calls(calls_find)
    assert not m_run_job.apply_async.called
    assert response.json == {"message": "Configuration will be updated in approximately 130 seconds."}
    delete_generated_files()
    reset_generated_values()


@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.VALUES_DIRECTORY", VALUES_TEST_DIRECTORY)
@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.TMP_DIR", VALUES_TEST_DIRECTORY)
@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.datetime")
@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.run_job")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_apply_changes_new_job_delay_1(m_find, m_update, m_run_job, m_datetime, client):
    datetime_object_old = datetime.datetime(2020, 7, 10, 10, 20, 0, 0)
    datetime_object_new = datetime.datetime(2020, 7, 10, 10, 30, 0, 0)
    m_datetime.datetime.utcnow = mock.Mock(return_value=datetime_object_new)
    collection = {
        "_id": ObjectId(common_id),
        "previous_job_start_time": datetime_object_old,
        "currently_scheduled": False
    }
    m_find.side_effect = [
        groups_collection,  # call from SaveConfigToFileHandler
        profiles_collection,  # call from SaveConfigToFileHandler
        inventory_collection,  # call from SaveConfigToFileHandler
        [collection],
        [collection],
        [collection]
    ]
    calls_find = [
        call(),
        call(),
        call()
    ]
    apply_async_calls = [
        call(countdown=1, queue='apply_changes')
    ]

    m_run_job.apply_async.return_value = None
    m_update.return_value = None

    response = client.post("/apply-changes")
    m_find.assert_has_calls(calls_find)
    m_run_job.apply_async.assert_has_calls(apply_async_calls)
    assert response.json == {"message": "Configuration will be updated in approximately 1 seconds."}
    delete_generated_files()
    reset_generated_values()
