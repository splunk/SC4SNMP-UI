import datetime
import os
import shutil
from unittest import mock
from unittest.mock import call, Mock

import pytest
from bson import ObjectId

from SC4SNMP_UI_backend.apply_changes.apply_changes import SingletonMeta
from SC4SNMP_UI_backend.apply_changes import handling_chain
from SC4SNMP_UI_backend.apply_changes.handling_chain import TMP_FILE_PREFIX

REFERENCE_FILES_DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                          "../../yamls_for_tests/reference_files")

common_id = "635916b2c8cb7a15f28af40a"

# Documents expected to be parsed out of the reference section files (mirrors
# tests/ui_handling/post_endpoints/test_post_apply_changes.py's fixtures, minus "_id"
# since the inverse conversions never produce one).
groups_collection_no_id = [
    {
        "group1": [
            {"address": "52.14.243.157", "port": 1163},
            {"address": "20.14.10.0", "port": 161},
        ],
    },
    {
        "group2": [
            {"address": "0.10.20.30"},
            {"address": "52.14.243.157", "port": 1165, "version": "3", "secret": "mysecret", "security_engine": "aabbccdd1234"},
        ]
    }
]

profiles_collection_no_id = [
    {"single_metric": {"frequency": 60, "varBinds": [['IF-MIB', 'ifMtu', '1']]}},
    {"small_walk": {"condition": {"type": "walk"}, "varBinds": [['IP-MIB'], ['IF-MIB']]}},
    {"gt_profile": {"frequency": 10, "conditions": [{"field": "IF-MIB.ifIndex", "operation": "gt", "value": 1}],
                    "varBinds": [['IF-MIB', 'ifOutDiscards']]}},
    {"lt_profile": {"frequency": 10, "conditions": [{"field": "IF-MIB.ifIndex", "operation": "lt", "value": 2}],
                    "varBinds": [['IF-MIB', 'ifOutDiscards']]}},
    {"in_profile": {"frequency": 10,
                    "conditions": [{"field": "IF-MIB.ifDescr", "operation": "in", "value": ["eth0", "test value"]}],
                    "varBinds": [['IF-MIB', 'ifOutDiscards']]}},
    {"multiple_conditions": {
        "frequency": 10,
        "conditions": [
            {"field": "IF-MIB.ifIndex", "operation": "gt", "value": 1},
            {"field": "IF-MIB.ifDescr", "operation": "in", "value": ["eth0", "test value"]}
        ],
        "varBinds": [['IF-MIB', 'ifOutDiscards'], ['IF-MIB', 'ifOutErrors'], ['IF-MIB', 'ifOutOctets']]
    }},
]

inventory_collection_no_id = [
    {
        "address": "1.1.1.1", "port": 161, "version": "2c", "community": "public", "secret": "",
        "security_engine": "", "walk_interval": 1800, "profiles": "small_walk;in_profile",
        "smart_profiles": True, "delete": False
    },
    {
        "address": "group1", "port": 1161, "version": "2c", "community": "public", "secret": "",
        "security_engine": "", "walk_interval": 1800, "profiles": "single_metric;multiple_conditions",
        "smart_profiles": False, "delete": False
    }
]

config_record = {
    "_id": ObjectId(common_id),
    "previous_job_start_time": None,
    "currently_scheduled": False,
    "task_id": None
}


@pytest.fixture(autouse=True)
def reset_singleton():
    yield
    SingletonMeta._instances = {}


def _write_section_files(directory):
    """
    Copies the reference section-file fixtures into `directory` under the
    sc4snmp_ui_<section>.yaml naming /load-config expects, so the route reads
    the same fixture content used elsewhere for the Mongo<->YAML round trip.
    """
    for file_name in ("scheduler_groups.yaml", "scheduler_profiles.yaml", "poller_inventory.yaml"):
        shutil.copy(
            os.path.join(REFERENCE_FILES_DIRECTORY, file_name),
            os.path.join(directory, f"{TMP_FILE_PREFIX}{file_name}"),
        )


@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.VALUES_FILE", "")
@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.KEEP_TEMP_FILES", "true")
@mock.patch("datetime.datetime")
@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.create_job")
@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.get_job_config")
@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.run_job")
@mock.patch("pymongo.collection.Collection.delete_many")
@mock.patch("pymongo.collection.Collection.insert_many")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_load_config_restores_from_section_files(m_find, m_update, m_insert_many, m_delete_many, m_run_job,
                                                   m_get_job_config, m_create_job, m_datetime,
                                                   client, tmp_path, monkeypatch):
    # conftest.py sets MONGODB_MODE=standalone, so this exercises the
    # non-transactional fallback path (no session threaded through writes).
    monkeypatch.setattr(handling_chain, "VALUES_DIRECTORY", str(tmp_path))
    monkeypatch.setattr(handling_chain, "TMP_DIR", str(tmp_path))
    _write_section_files(tmp_path)

    datetime_object = datetime.datetime(2020, 7, 10, 10, 30, 0, 0)
    m_datetime.utcnow = mock.Mock(return_value=datetime_object)

    m_find.side_effect = [
        [],                        # mongo_inventory.find({"delete": False}) - reconciliation read, no existing rows
        groups_collection_no_id,   # mongo_groups.find() from SaveConfigToFileHandler
        profiles_collection_no_id, # mongo_profiles.find() from SaveConfigToFileHandler
        inventory_collection_no_id,  # mongo_inventory.find() from SaveConfigToFileHandler
        [config_record],           # mongo_config_collection.find() from CheckJobHandler
        [config_record],           # mongo_config_collection.find() from ScheduleHandler
    ]
    m_get_job_config.return_value = ("val2", "val1")
    m_create_job.return_value = None
    m_update.return_value = None
    m_insert_many.return_value = None
    m_delete_many.return_value = None

    response = client.post("/load-config")

    m_delete_many.assert_has_calls([call({}, session=None), call({}, session=None)])
    m_insert_many.assert_has_calls([
        call(groups_collection_no_id, session=None),
        call(profiles_collection_no_id, session=None),
    ])

    reconciliation_find_call = call({"delete": False}, session=None)
    assert reconciliation_find_call in m_find.call_args_list

    upsert_calls = [
        call({"address": doc["address"], "port": doc["port"]}, {"$set": doc}, upsert=True, session=None)
        for doc in inventory_collection_no_id
    ]
    m_update.assert_has_calls(upsert_calls)

    assert response.status_code == 200
    assert response.json == {
        "message": "Configuration was restored from section files. It will be updated in approximately 1 seconds."
    }


@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.VALUES_FILE", "")
@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.KEEP_TEMP_FILES", "true")
@mock.patch("datetime.datetime")
@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.create_job")
@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.get_job_config")
@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.run_job")
@mock.patch("pymongo.collection.Collection.delete_many")
@mock.patch("pymongo.collection.Collection.insert_many")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
@mock.patch("pymongo.MongoClient.start_session")
def test_load_config_restores_from_section_files_uses_transaction_in_replication_mode(
        m_session, m_find, m_update, m_insert_many, m_delete_many, m_run_job,
        m_get_job_config, m_create_job, m_datetime, client, tmp_path, monkeypatch):
    # When the deployment is a replica set, the writes must run inside a
    # Mongo transaction (session threaded through every write) so a
    # mid-restore failure rolls back instead of leaving partial state.
    monkeypatch.setenv("MONGODB_MODE", "replication")
    monkeypatch.setattr(handling_chain, "VALUES_DIRECTORY", str(tmp_path))
    monkeypatch.setattr(handling_chain, "TMP_DIR", str(tmp_path))
    _write_section_files(tmp_path)

    datetime_object = datetime.datetime(2020, 7, 10, 10, 30, 0, 0)
    m_datetime.utcnow = mock.Mock(return_value=datetime_object)

    m_session.return_value.__enter__.return_value.start_transaction.__enter__ = Mock()

    m_find.side_effect = [
        [],                        # mongo_inventory.find({"delete": False}) - reconciliation read, no existing rows
        groups_collection_no_id,   # mongo_groups.find() from SaveConfigToFileHandler
        profiles_collection_no_id, # mongo_profiles.find() from SaveConfigToFileHandler
        inventory_collection_no_id,  # mongo_inventory.find() from SaveConfigToFileHandler
        [config_record],           # mongo_config_collection.find() from CheckJobHandler
        [config_record],           # mongo_config_collection.find() from ScheduleHandler
    ]
    m_get_job_config.return_value = ("val2", "val1")
    m_create_job.return_value = None
    m_update.return_value = None
    m_insert_many.return_value = None
    m_delete_many.return_value = None

    response = client.post("/load-config")

    session = m_session.return_value.__enter__.return_value
    m_delete_many.assert_has_calls([call({}, session=session), call({}, session=session)])
    m_insert_many.assert_has_calls([
        call(groups_collection_no_id, session=session),
        call(profiles_collection_no_id, session=session),
    ])

    reconciliation_find_call = call({"delete": False}, session=session)
    assert reconciliation_find_call in m_find.call_args_list

    upsert_calls = [
        call({"address": doc["address"], "port": doc["port"]}, {"$set": doc}, upsert=True, session=session)
        for doc in inventory_collection_no_id
    ]
    m_update.assert_has_calls(upsert_calls)

    assert response.status_code == 200
    assert response.json == {
        "message": "Configuration was restored from section files. It will be updated in approximately 1 seconds."
    }


@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.VALUES_FILE", "")
@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.KEEP_TEMP_FILES", "true")
@mock.patch("datetime.datetime")
@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.create_job")
@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.get_job_config")
@mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.run_job")
@mock.patch("pymongo.collection.Collection.delete_many")
@mock.patch("pymongo.collection.Collection.insert_many")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_load_config_soft_deletes_hosts_missing_from_files(m_find, m_update, m_insert_many, m_delete_many, m_run_job,
                                                             m_get_job_config, m_create_job, m_datetime,
                                                             client, tmp_path, monkeypatch):
    monkeypatch.setattr(handling_chain, "VALUES_DIRECTORY", str(tmp_path))
    monkeypatch.setattr(handling_chain, "TMP_DIR", str(tmp_path))
    _write_section_files(tmp_path)

    datetime_object = datetime.datetime(2020, 7, 10, 10, 30, 0, 0)
    m_datetime.utcnow = mock.Mock(return_value=datetime_object)

    orphan_id = ObjectId("635916b2c8cb7a15f28af40b")
    orphan_record = {"_id": orphan_id, "address": "orphan_host", "port": 9999, "delete": False}

    m_find.side_effect = [
        [orphan_record],           # mongo_inventory.find({"delete": False}) - one host not present in files
        groups_collection_no_id,
        profiles_collection_no_id,
        inventory_collection_no_id,
        [config_record],
        [config_record],
    ]
    m_get_job_config.return_value = ("val2", "val1")
    m_create_job.return_value = None
    m_update.return_value = None
    m_insert_many.return_value = None
    m_delete_many.return_value = None

    response = client.post("/load-config")

    soft_delete_call = call({"_id": orphan_id}, {"$set": {"delete": True}}, session=None)
    assert soft_delete_call in m_update.call_args_list

    upsert_calls = [
        call({"address": doc["address"], "port": doc["port"]}, {"$set": doc}, upsert=True, session=None)
        for doc in inventory_collection_no_id
    ]
    m_update.assert_has_calls(upsert_calls)
    assert response.status_code == 200


def test_load_config_returns_400_when_no_section_files_present(client, tmp_path, monkeypatch):
    monkeypatch.setattr(handling_chain, "VALUES_DIRECTORY", str(tmp_path))

    response = client.post("/load-config")

    assert response.status_code == 400
    assert response.json == {"message": "No section files found in the values directory to restore from."}
