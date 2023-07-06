from unittest import mock
from unittest.mock import call
from bson import ObjectId


# TEST ADDING PROFILE
@mock.patch("pymongo.collection.Collection.find")
@mock.patch("pymongo.collection.Collection.insert_one")
def test_add_profile_record_success(m_insert, m_find, client):
    m_insert.return_value = None
    m_find.return_value = []
    ui_prof = {
        "profileName": "profile_1",
        "frequency": 10,
        "conditions": {
            "condition": "standard",
            "field": "",
            "patterns": None
        },
        "varBinds": [{"family": "IF-MIB", "category": "ifInDiscards", "index": "1"},
                     {"family": "IF-MIB", "category": "", "index": ""},
                     {"family": "IF-MIB", "category": "ifOutErrors", "index": ""}]
    }
    backend_prof = {
        "profile_1": {
            "frequency": 10,
            "varBinds": [["IF-MIB", "ifInDiscards", "1"], ["IF-MIB"], ["IF-MIB", "ifOutErrors"]]
        }
    }

    response = client.post("/profiles/add", json=ui_prof)
    assert m_find.call_args == call({"profile_1": {"$exists": True}})
    assert m_insert.call_args == call(backend_prof)
    assert response.json == "success"


@mock.patch("pymongo.collection.Collection.find")
@mock.patch("pymongo.collection.Collection.insert_one")
def test_add_profile_record_failure(m_insert, m_find, client):
    ui_prof = {
        "profileName": "profile_1",
        "frequency": 10,
        "conditions": {
            "condition": "None",
            "field": "",
            "patterns": None
        },
        "varBinds": [{"family": "IF-MIB", "category": "ifInDiscards", "index": "1"},
                     {"family": "IF-MIB", "category": "", "index": ""},
                     {"family": "IF-MIB", "category": "ifOutErrors", "index": ""}]
    }
    backend_prof = {
        "profile_1": {
            "frequency": 10,
            "varBinds": [["IF-MIB", "ifInDiscards", 1], ["IF-MIB"], ["IF-MIB", "ifOutErrors"]]
        }
    }
    m_insert.return_value = None
    m_find.return_value = [backend_prof]

    response = client.post("/profiles/add", json=ui_prof)
    assert m_find.call_args == call({"profile_1": {"$exists": True}})
    assert not m_insert.called
    assert response.json == {"message": f"Profile with name profile_1 already exists. Profile was not added."}


# TEST DELETING PROFILE
@mock.patch("pymongo.collection.Collection.find")
@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.update_one")
def test_delete_profile_record(m_update, m_delete, m_find, client):
    common_id = "635916b2c8cb7a15f28af40a"
    profile = {
        "profile_1": {
            "frequency": 10,
            "varBinds": [["IF-MIB", "ifInDiscards", 1], ["IF-MIB"], ["IF-MIB", "ifOutErrors"]]
        }
    }

    backend_inventory = {
        "_id": ObjectId(common_id),
        "address": "11.0.78.114",
        "port": 161,
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walk_interval": 1800,
        "security_engine": "1234aabbccd",
        "profiles": "profile_1;profile_2",
        "smart_profiles": False,
        "delete": False
    }

    backend_inventory_update = {
        "address": "11.0.78.114",
        "port": 161,
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walk_interval": 1800,
        "security_engine": "1234aabbccd",
        "profiles": "profile_2",
        "smart_profiles": False,
        "delete": False
    }

    m_find.side_effect = [
        [profile],
        [backend_inventory]
    ]
    m_delete.return_value = None
    m_update.return_value = None

    response = client.post(f'/profiles/delete/{common_id}')

    calls = [call({'_id': ObjectId(common_id)}, {"_id": 0}), call({"profiles": {"$regex": '.*profile_1.*'}})]
    m_find.assert_has_calls(calls)
    assert m_delete.call_args == call({"_id": ObjectId(common_id)})
    assert m_update.call_args == call({"_id": ObjectId(common_id)}, {"$set": backend_inventory_update})
    assert response.json == {"message": f"Profile profile_1 was deleted. If profile_1 was used in some records in the inventory,"
                                        f" those records were updated."}


# TEST UPDATING PROFILE
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_update_profile_record_no_name_change_success(m_find, m_update, client):
    common_id = "635916b2c8cb7a15f28af40a"
    ui_prof_1_new = {
        "profileName": "profile_1",
        "frequency": 20,
        "conditions": {
            "condition": "smart",
            "field": "SNMPv2-MIB.sysObjectID",
            "patterns": [{"pattern": "^MIKROTIK"}, {"pattern": "^MIKROTIK2"}]
        },
        "varBinds": [{"family": "IF-MIB", "category": "ifInDiscards", "index": "1"}]
    }

    backend_prof_1_old = {
        "profile_1": {
            "frequency": 10,
            "varBinds": [["IF-MIB", "ifInDiscards", "1"], ["IF-MIB"], ["IF-MIB", "ifOutErrors"]]
        }
    }

    backend_prof_1_new = {
        "profile_1": {
            "frequency": 20,
            "condition": {"type": "field",
                          "field": "SNMPv2-MIB.sysObjectID",
                          "patterns": ["^MIKROTIK", "^MIKROTIK2"]},
            "varBinds": [["IF-MIB", "ifInDiscards", "1"]]
        }
    }

    m_find.side_effect = [[], [backend_prof_1_old]]
    m_update.return_value = None

    response = client.post(f"/profiles/update/{common_id}", json=ui_prof_1_new)
    assert m_update.call_args == call({'_id': ObjectId(common_id)},
                                      {"$set": {"profile_1": backend_prof_1_new["profile_1"]}})
    assert response.json == "success"
    assert m_find.call_args == call({'_id': ObjectId(common_id)}, {"_id": 0})


@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_update_profile_record_with_name_change_success(m_find, m_update, client):
    common_id = "635916b2c8cb7a15f28af40a"

    backend_prof_1_old = {
        "profile_1": {
            "frequency": 10,
            "varBinds": [["IF-MIB", "ifInDiscards", 1], ["IF-MIB"], ["IF-MIB", "ifOutErrors"]]
        }
    }

    ui_prof_1_new = {
        "profileName": "profile_1_edit",
        "frequency": 20,
        "conditions": {
            "condition": "smart",
            "field": "SNMPv2-MIB.sysObjectID",
            "patterns": [{"pattern": "^MIKROTIK"}, {"pattern": "^MIKROTIK2"}]
        },
        "varBinds": [{"family": "IF-MIB", "category": "ifInDiscards", "index": "1"}]
    }

    backend_prof_1_new = {
        "profile_1_edit": {
            "frequency": 20,
            "condition": {"type": "field",
                          "field": "SNMPv2-MIB.sysObjectID",
                          "patterns": ["^MIKROTIK", "^MIKROTIK2"]},
            "varBinds": [["IF-MIB", "ifInDiscards", "1"]]
        }
    }

    backend_inventory = {
        "_id": ObjectId(common_id),
        "address": "11.0.78.114",
        "port": 161,
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walk_interval": 1800,
        "security_engine": "1234aabbccd",
        "profiles": "profile_1;profile_2",
        "smart_profiles": False,
        "delete": False
    }

    backend_inventory_update = {
        "address": "11.0.78.114",
        "port": 161,
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walk_interval": 1800,
        "security_engine": "1234aabbccd",
        "profiles": "profile_1_edit;profile_2",
        "smart_profiles": False,
        "delete": False
    }

    m_find.side_effect = [
        [],
        [backend_prof_1_old],
        [backend_inventory]
    ]
    m_update.return_value = None

    calls_find = [call({f"profile_1_edit": {"$exists": True}, "_id": {"$ne": ObjectId(common_id)}}),
                  call({'_id': ObjectId(common_id)}, {"_id": 0}),
                  call({"profiles": {"$regex": '.*profile_1.*'}})]

    calls_update = [call({'_id': ObjectId(common_id)}, {"$rename": {"profile_1": "profile_1_edit"}}),
                    call({"_id": ObjectId(common_id)}, {"$set": backend_inventory_update}),
                    call({'_id': ObjectId(common_id)},
                         {"$set": {"profile_1_edit": backend_prof_1_new["profile_1_edit"]}})]

    response = client.post(f"/profiles/update/{common_id}", json=ui_prof_1_new)

    m_find.assert_has_calls(calls_find)
    m_update.assert_has_calls(calls_update)
    assert response.json == {"message": f"If profile_1 was used in some records in the inventory,"
                                        f" it was updated to profile_1_edit"}

@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_update_profile_record_failure(m_find, m_update, client):
    common_id = "635916b2c8cb7a15f28af40a"
    ui_prof_1_new = {
        "profileName": "profile_1",
        "frequency": 20,
        "conditions": {
            "condition": "field",
            "field": "SNMPv2-MIB.sysObjectID",
            "patterns": [{"pattern": "^MIKROTIK"}, {"pattern": "^MIKROTIK2"}]
        },
        "varBinds": [{"family": "IF-MIB", "category": "ifInDiscards", "index": "1"}]
    }

    backend_prof_1_old = {
        "profile_1": {
            "frequency": 10,
            "varBinds": [["IF-MIB", "ifInDiscards", 1], ["IF-MIB"], ["IF-MIB", "ifOutErrors"]]
        }
    }

    m_find.return_value = [backend_prof_1_old]
    response = client.post(f"/profiles/update/{common_id}", json=ui_prof_1_new)
    assert not m_update.called
    assert response.json == {"message": "Profile with name profile_1 already exists. Profile was not edited."}