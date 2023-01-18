from unittest import mock
from unittest.mock import call, Mock
from bson import ObjectId


@mock.patch("pymongo.collection.Collection.insert_one")
def test_add_profile_record(m_client, client):
    m_client.return_value = None
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

    response = client.post("/profiles/add", json=ui_prof)

    assert m_client.call_args == call(backend_prof)
    assert response.json == "success"


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
    assert response.json == {"message": f"If profile_1 was used in some records in the inventory,"
                                        f" those records were updated"}


@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_update_profile_record_no_name_change(m_find, m_update, client):
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

    backend_prof_1_new = {
        "profile_1": {
            "frequency": 20,
            "condition": {"type": "field",
                          "field": "SNMPv2-MIB.sysObjectID",
                          "patterns": ["^MIKROTIK", "^MIKROTIK2"]},
            "varBinds": [["IF-MIB", "ifInDiscards", 1]]
        }
    }

    m_find.return_value = [backend_prof_1_old]
    m_update.return_value = None

    response = client.post(f"/profiles/update/{common_id}", json=ui_prof_1_new)
    assert m_update.call_args == call({'_id': ObjectId(common_id)},
                                      {"$set": {"profile_1": backend_prof_1_new["profile_1"]}})
    assert response.json == "success"
    assert m_find.call_args == call({'_id': ObjectId(common_id)}, {"_id": 0})


@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_update_profile_record_with_name_change(m_find, m_update, client):
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
            "condition": "field",
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
            "varBinds": [["IF-MIB", "ifInDiscards", 1]]
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
        [backend_prof_1_old],
        [backend_inventory]
    ]
    m_update.return_value = None

    calls_find = [call({'_id': ObjectId(common_id)}, {"_id": 0}),
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


@mock.patch("pymongo.collection.Collection.insert_one")
def test_add_group_record(m_insert, client):
    ui_group = {
        "groupName": "group_1"
    }

    backend_group = {
        "group_1": []
    }

    response = client.post(f"/groups/add", json=ui_group)
    m_insert.return_value = None
    assert m_insert.call_args == call(backend_group)
    assert response.json == "success"


@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_update_group(m_find, m_update, client):
    common_id = "635916b2c8cb7a15f28af40a"

    ui_group_new = {
        "_id": common_id,
        "groupName": "group_1_edit"
    }

    backend_group_old = {
        "_id": ObjectId(common_id),
        "group_1": [
            {"address": "1.2.3.4"},
        ]
    }

    calls_update = [
        call({'_id': ObjectId(common_id)}, {"$rename": {"group_1": "group_1_edit"}}),
        call({"address": "group_1"}, {"$set": {"address": 'group_1_edit'}})
    ]

    m_find.side_effect = [
        [],
        [backend_group_old]
    ]

    response = client.post(f"/groups/update/{common_id}", json=ui_group_new)
    m_update.assert_has_calls(calls_update)
    assert response.json == {"message": "group_1 was also renamed to group_1_edit in the inventory"}


@mock.patch("pymongo.collection.Collection.find")
@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.MongoClient.start_session")
def test_delete_group_and_devices(m_session, m_update, m_delete, m_find, client):
    common_id = "635916b2c8cb7a15f28af40a"
    backend_group = {
        "_id": ObjectId(common_id),
        "group_1": [
            {"address": "1.2.3.4"},
        ]
    }
    m_session.return_value.__enter__.return_value.start_transaction.__enter__ = Mock()

    m_find.return_value = [backend_group]
    m_delete.return_value = None
    m_update.return_value = None

    response = client.post(f"/groups/delete/{common_id}")
    assert m_find.call_args == call({'_id': ObjectId(common_id)})
    assert m_delete.call_args == call({'_id': ObjectId(common_id)})
    assert m_update.call_args == call({"address": "group_1"}, {"$set": {"delete": True}})
    assert response.json == {"message": "If group_1 was configured in the inventory, it was deleted from there"}


@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_add_device_to_group(m_find, m_update, client):
    common_id = "635916b2c8cb7a15f28af40a"

    ui_group_device_new = {
        "address": "2.2.2.2",
        "port": "",
        "version": "3",
        "community": "",
        "secret": "snmpv3",
        "securityEngine": "",
        "groupId": str(common_id)
    }

    backend_group_old = {
        "_id": ObjectId(common_id),
        "group_1": [
            {"address": "1.2.3.4"},
        ]
    }

    backend_group_new = {
        "_id": ObjectId(common_id),
        "group_1": [
            {"address": "1.2.3.4"},
            {"address": "2.2.2.2", "version": "3", "secret": "snmpv3"}
        ]
    }

    m_find.return_value = [backend_group_old]
    m_update.return_value = None

    response = client.post(f"/devices/add", json=ui_group_device_new)
    assert m_find.call_args == call({'_id': ObjectId(common_id)}, {"_id": 0})
    assert m_update.call_args == call({"_id": ObjectId(common_id)}, {"$set": backend_group_new})
    assert response.json == "success"


@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_update_device_from_group(m_find, m_update, client):
    common_id = "635916b2c8cb7a15f28af40a"

    ui_group_device_update = {
        "address": "2.2.2.3",
        "port": "1161",
        "version": "2c",
        "community": "public",
        "secret": "",
        "securityEngine": "1112233aabbccdee",
        "groupId": str(common_id)
    }

    backend_group_old = {
        "_id": ObjectId(common_id),
        "group_1": [
            {"address": "1.1.1.1"},
            {"address": "2.2.2.2"},
            {"address": "3.3.3.3"}
        ]
    }

    backend_group_new = {
        "_id": ObjectId(common_id),
        "group_1": [
            {"address": "1.1.1.1"},
            {"address": "2.2.2.3", "port": 1161, "version": "2c", "community": "public",
             "security_engine": "1112233aabbccdee"},
            {"address": "3.3.3.3"}
        ]
    }

    m_find.return_value = [backend_group_old]
    m_update.return_value = None

    response = client.post(f"/devices/update/{common_id}-1", json=ui_group_device_update)
    assert m_find.call_args == call({'_id': ObjectId(common_id)}, {"_id": 0})
    assert m_update.call_args == call({"_id": ObjectId(common_id)}, {"$set": backend_group_new})
    assert response.json == "success"


@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_delete_device_from_group_record(m_find, m_update, client):
    common_id = "635916b2c8cb7a15f28af40a"

    backend_group_old = {
        "_id": ObjectId(common_id),
        "group_1": [
            {"address": "1.1.1.1"},
            {"address": "2.2.2.3", "port": 1161, "version": "2c", "community": "public",
             "security_engine": "1112233aabbccdee"},
            {"address": "3.3.3.3"}
        ]
    }

    backend_group_new1 = {
        "_id": ObjectId(common_id),
        "group_1": [
            {"address": "1.1.1.1"},
            {"address": "3.3.3.3"}
        ]
    }

    backend_group_new2 = {
        "_id": ObjectId(common_id),
        "group_1": [
            {"address": "3.3.3.3"}
        ]
    }

    m_find.return_value = [backend_group_old]
    m_update.return_value = None
    response = client.post(f"/devices/delete/{common_id}-1")

    assert m_find.call_args == call({'_id': ObjectId(common_id)}, {"_id": 0})
    assert m_update.call_args == call({"_id": ObjectId(common_id)}, {"$set": backend_group_new1})
    assert response.json == "success"

    m_find.return_value = [backend_group_new1]
    response = client.post(f"/devices/delete/{common_id}-0")
    assert m_find.call_args == call({'_id': ObjectId(common_id)}, {"_id": 0})
    assert m_update.call_args == call({"_id": ObjectId(common_id)}, {"$set": backend_group_new2})
    assert response.json == "success"


@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_add_inventory_record_single_host_success(m_find, m_insert, m_update, m_delete, client):
    common_id = "635916b2c8cb7a15f28af40a"

    ui_inventory_new = {
        "address": "11.0.78.114",
        "port": "161",
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walkInterval": 1800,
        "securityEngine": "1234aabbccd",
        "profiles": ["prof1", "prof2", "prof3"],
        "smartProfiles": False
    }

    backend_inventory_new = {
        "address": "11.0.78.114",
        "port": 161,
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walk_interval": 1800,
        "security_engine": "1234aabbccd",
        "profiles": "prof1;prof2;prof3",
        "smart_profiles": False,
        "delete": False
    }

    m_insert.return_value = None
    m_update.return_value = None
    m_delete.return_value = None

    calls_find = [
        call({'address': "11.0.78.114", 'port': 161, "delete": False}),
        call({'address': "11.0.78.114", 'port': 161, "delete": True})
    ]

    m_find.side_effect = [[], []]
    # Test adding a new device, when there was no device with the same address and port with deleted flag set to True
    response = client.post(f"/inventory/add", json=ui_inventory_new)
    m_find.assert_has_calls(calls_find)
    assert m_insert.call_args == call(backend_inventory_new)
    assert not m_update.called
    assert not m_delete.called
    assert response.json == "success"

    m_find.side_effect = [
        [],
        [{
            "_id": ObjectId(common_id),
            "address": "11.0.78.114",
            "port": 161,
            "version": "3",
            "community": "",
            "secret": "my_secret",
            "walk_interval": 1800,
            "security_engine": "1234aabbccd",
            "profiles": "prof1;prof2;prof3",
            "smart_profiles": False,
            "delete": True
        }]
    ]

    # Test adding a new device, when there was a device with the same address and port with deleted flag set to True
    response = client.post(f"/inventory/add", json=ui_inventory_new)
    m_find.assert_has_calls(calls_find)
    assert m_insert.call_args == call(backend_inventory_new)
    assert not m_update.called
    assert m_delete.call_args == call({"_id": ObjectId(common_id)})
    assert response.json == "success"


@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_edit_inventory_record_single_host_success(m_find, m_insert, m_update, m_delete, client):
    common_id = "635916b2c8cb7a15f28af40a"

    ui_inventory_new = {
        "address": "11.0.78.114",
        "port": "161",
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walkInterval": 1800,
        "securityEngine": "1234aabbccd",
        "profiles": ["prof1", "prof2", "prof3"],
        "smartProfiles": False
    }

    backend_inventory_new = {
        "address": "11.0.78.114",
        "port": 161,
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walk_interval": 1800,
        "security_engine": "1234aabbccd",
        "profiles": "prof1;prof2;prof3",
        "smart_profiles": False,
        "delete": False
    }

    m_insert.return_value = None
    m_update.return_value = None
    m_delete.return_value = None

    calls_find = [
        call({'address': "11.0.78.114", 'port': 161, "delete": False}),
        call({'address': "11.0.78.114", 'port': 161, "delete": True})
    ]

    m_find.side_effect = [[], []]

    # Test editing a device with changing its address and port
    response = client.post(f"/inventory/update/{common_id}", json=ui_inventory_new)
    m_find.assert_has_calls(calls_find)
    assert m_update.call_args == call({"_id": ObjectId(common_id)}, {"$set": backend_inventory_new})
    assert not m_insert.called
    assert not m_delete.called
    assert response.json == "success"

    m_find.side_effect = [
        [{
            "_id": ObjectId(common_id),
            "address": "11.0.78.114",
            "port": 161,
            "version": "3",
            "community": "",
            "secret": "my_secret",
            "walk_interval": 1800,
            "security_engine": "",
            "profiles": "prof1",
            "smart_profiles": False,
            "delete": True
        }],
        []
    ]

    # Test editing a device without changing its address and port
    response = client.post(f"/inventory/update/{common_id}", json=ui_inventory_new)
    m_find.assert_has_calls(calls_find)
    assert m_update.call_args == call({"_id": ObjectId(common_id)}, {"$set": backend_inventory_new})
    assert not m_insert.called
    assert not m_delete.called
    assert response.json == "success"


@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_add_inventory_record_single_host_failed(m_find, m_insert, m_update, m_delete, client):
    common_id = "635916b2c8cb7a15f28af40a"

    ui_inventory_new = {
        "address": "11.0.78.114",
        "port": "1161",
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walkInterval": 1800,
        "securityEngine": "1234aabbccd",
        "profiles": ["prof1", "prof2", "prof3"],
        "smartProfiles": False
    }

    m_insert.return_value = None
    m_update.return_value = None
    m_delete.return_value = None

    m_find.side_effect = [
        [{
            "_id": ObjectId(common_id),
            "address": "11.0.78.114",
            "port": 1161,
            "version": "2c",
            "community": "public",
            "secret": "",
            "walk_interval": 1800,
            "security_engine": "",
            "profiles": "prof1",
            "smart_profiles": False,
            "delete": False
        }],
        []
    ]

    calls_find = [
        call({'address': "11.0.78.114", 'port': 1161, "delete": False}),
        call({'address': "11.0.78.114", 'port': 1161, "delete": True})
    ]

    response = client.post(f"/inventory/add", json=ui_inventory_new)
    m_find.assert_has_calls(calls_find)
    assert response.json == {"message": f"Inventory record for 11.0.78.114:1161 already exists. Record was not added."}
    assert response.status_code == 400
    assert not m_insert.called
    assert not m_update.called
    assert not m_delete.called


@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_edit_inventory_record_single_host_failed(m_find, m_insert, m_update, m_delete, client):
    edit_id = "635916b2c8cb7a15f28af40a"
    existing_id = "035916b2c8cb7a15f28af40b"

    ui_inventory_new = {
        "address": "11.0.78.114",
        "port": "1161",
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walkInterval": 1800,
        "securityEngine": "1234aabbccd",
        "profiles": ["prof1", "prof2", "prof3"],
        "smartProfiles": False
    }

    m_insert.return_value = None
    m_update.return_value = None
    m_delete.return_value = None

    m_find.side_effect = [
        [{
            "_id": ObjectId(existing_id),
            "address": "11.0.78.114",
            "port": 1161,
            "version": "2c",
            "community": "public",
            "secret": "",
            "walk_interval": 1800,
            "security_engine": "",
            "profiles": "prof1",
            "smart_profiles": False,
            "delete": False
        }],
        []
    ]

    calls_find = [
        call({'address': "11.0.78.114", 'port': 1161, "delete": False}),
        call({'address': "11.0.78.114", 'port': 1161, "delete": True})
    ]

    response = client.post(f"/inventory/update/{edit_id}", json=ui_inventory_new)
    m_find.assert_has_calls(calls_find)
    assert response.json == {"message": f"Inventory record for 11.0.78.114:1161 already exists. Record was not edited."}
    assert response.status_code == 400
    assert not m_insert.called
    assert not m_update.called
    assert not m_delete.called


@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_add_inventory_record_group_success(m_find, m_insert, m_update, m_delete, client):
    common_id = "635916b2c8cb7a15f28af40a"

    ui_inventory_new = {
        "address": "group_1",
        "port": "161",
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walkInterval": 1800,
        "securityEngine": "1234aabbccd",
        "profiles": ["prof1", "prof2", "prof3"],
        "smartProfiles": False
    }

    backend_inventory_new = {
        "address": "group_1",
        "port": 161,
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walk_interval": 1800,
        "security_engine": "1234aabbccd",
        "profiles": "prof1;prof2;prof3",
        "smart_profiles": False,
        "delete": False
    }

    m_insert.return_value = None
    m_update.return_value = None
    m_delete.return_value = None

    m_find.side_effect = [
        [],
        [],
        [{
            "_id": ObjectId(common_id),
            "group_1": [{"address": "1.2.3.4"}]
        }]
    ]

    calls_find = [
        call({'address': "group_1", "delete": False}),
        call({'address': "group_1", "delete": True}),
        call({'group_1': {"$exists": 1}})
    ]

    # Test adding a new group, when there was no group with the same name with deleted flag set to True
    response = client.post(f"/inventory/add", json=ui_inventory_new)
    m_find.assert_has_calls(calls_find)
    assert m_insert.call_args == call(backend_inventory_new)
    assert not m_update.called
    assert not m_delete.called
    assert response.json == "success"

    # Test adding a new group, when there was a group with the same name with deleted flag set to True
    m_find.side_effect = [
        [],
        [{
            "_id": ObjectId(common_id),
            "address": "group_1",
            "port": 1161,
            "version": "3",
            "community": "",
            "secret": "my_secret",
            "walk_interval": 1800,
            "security_engine": "1234aabbccd",
            "profiles": "prof1;prof2;prof3",
            "smart_profiles": False,
            "delete": True
        }],
        [{
            "_id": ObjectId(common_id),
            "group_1": [{"address": "1.2.3.4"}]
        }]
    ]

    response = client.post(f"/inventory/add", json=ui_inventory_new)
    m_find.assert_has_calls(calls_find)
    assert m_insert.call_args == call(backend_inventory_new)
    assert not m_update.called
    assert m_delete.call_args == call({"_id": ObjectId(common_id)})
    assert response.json == "success"


@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_edit_inventory_record_group_success(m_find, m_insert, m_update, m_delete, client):
    common_id = "635916b2c8cb7a15f28af40a"

    ui_inventory_new = {
        "address": "group_1",
        "port": "161",
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walkInterval": 1800,
        "securityEngine": "1234aabbccd",
        "profiles": ["prof1", "prof2", "prof3"],
        "smartProfiles": False
    }

    backend_inventory_new = {
        "address": "group_1",
        "port": 161,
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walk_interval": 1800,
        "security_engine": "1234aabbccd",
        "profiles": "prof1;prof2;prof3",
        "smart_profiles": False,
        "delete": False
    }

    m_insert.return_value = None
    m_update.return_value = None
    m_delete.return_value = None

    m_find.side_effect = [[], [], [{"_id": ObjectId(common_id), "group_1": [{"address": "1.2.3.4"}]}]]

    calls_find = [
        call({'address': "group_1", "delete": False}),
        call({'address': "group_1", "delete": True}),
        call({'group_1': {"$exists": 1}})
    ]

    # Test editing a group with changing group name
    response = client.post(f"/inventory/update/{common_id}", json=ui_inventory_new)
    m_find.assert_has_calls(calls_find)
    assert m_update.call_args == call({"_id": ObjectId(common_id)}, {"$set": backend_inventory_new})
    assert not m_insert.called
    assert not m_delete.called
    assert response.json == "success"

    m_find.side_effect = [[{
        "_id": ObjectId(common_id),
        "address": "group_1",
        "port": 1161,
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walk_interval": 1800,
        "security_engine": "",
        "profiles": "prof1",
        "smart_profiles": False,
        "delete": True
    }],
        [],
        [{"_id": ObjectId(common_id), "group_1": [{"address": "1.2.3.4"}]}]]

    # Test editing a group without changing group name
    response = client.post(f"/inventory/update/{common_id}", json=ui_inventory_new)
    m_find.assert_has_calls(calls_find)
    assert m_update.call_args == call({"_id": ObjectId(common_id)}, {"$set": backend_inventory_new})
    assert not m_insert.called
    assert not m_delete.called
    assert response.json == "success"


@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_add_inventory_record_group_failed(m_find, m_insert, m_update, m_delete, client):
    common_id = "635916b2c8cb7a15f28af40a"

    ui_inventory_new = {
        "address": "group_1",
        "port": "1161",
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walkInterval": 1800,
        "securityEngine": "1234aabbccd",
        "profiles": ["prof1", "prof2", "prof3"],
        "smartProfiles": False
    }

    m_insert.return_value = None
    m_update.return_value = None
    m_delete.return_value = None

    # Test adding a new group, when the same group is already in the inventory.
    m_find.side_effect = [
        [{
            "_id": ObjectId(common_id),
            "address": "group_1",
            "port": 161,
            "version": "2c",
            "community": "public",
            "secret": "",
            "walk_interval": 1800,
            "security_engine": "",
            "profiles": "prof1",
            "smart_profiles": False,
            "delete": False
        }],
        [],
        [{
            "_id": ObjectId(common_id),
            "group_1": [{"address": "1.2.3.4"}]
        }]
    ]

    calls_find = [
        call({'address': "group_1", "delete": False}),
        call({'address': "group_1", "delete": True}),
        call({'group_1': {"$exists": 1}})
    ]

    response = client.post(f"/inventory/add", json=ui_inventory_new)
    m_find.assert_has_calls(calls_find)
    assert response.json == {"message": f"Inventory record for group_1 already exists. Record was not added."}
    assert response.status_code == 400
    assert not m_insert.called
    assert not m_update.called
    assert not m_delete.called

    # Test adding a new group, when there is no group configured.
    m_find.side_effect = [
        [],
        [],
        []
    ]

    response = client.post(f"/inventory/add", json=ui_inventory_new)
    m_find.assert_has_calls(calls_find)
    assert response.json == {"message": f"There is no group group_1 configured. Record was not added."}
    assert response.status_code == 400
    assert not m_insert.called
    assert not m_update.called
    assert not m_delete.called


@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_edit_inventory_record_group_failed(m_find, m_insert, m_update, m_delete, client):
    edit_id = "635916b2c8cb7a15f28af40a"
    existing_id = "035916b2c8cb7a15f28af40b"

    ui_inventory_new = {
        "address": "group_1",
        "port": "1161",
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walkInterval": 1800,
        "securityEngine": "1234aabbccd",
        "profiles": ["prof1", "prof2", "prof3"],
        "smartProfiles": False
    }

    m_insert.return_value = None
    m_update.return_value = None
    m_delete.return_value = None

    m_find.side_effect = [
        [{
            "_id": ObjectId(existing_id),
            "address": "group_1",
            "port": 1161,
            "version": "2c",
            "community": "public",
            "secret": "",
            "walk_interval": 1800,
            "security_engine": "",
            "profiles": "prof1",
            "smart_profiles": False,
            "delete": False
        }],
        [],
        [{
            "_id": ObjectId(existing_id),
            "group_1": [{"address": "1.2.3.4"}]
        }]
    ]

    calls_find = [
        call({'address': "group_1", "delete": False}),
        call({'address': "group_1", "delete": True})
    ]

    response = client.post(f"/inventory/update/{edit_id}", json=ui_inventory_new)
    m_find.assert_has_calls(calls_find)
    assert response.json == {"message": f"Inventory record for group_1 already exists. Record was not edited."}
    assert response.status_code == 400
    assert not m_insert.called
    assert not m_update.called
    assert not m_delete.called

    m_find.side_effect = [
        [],
        [],
        []
    ]

    # Test editing a group, when there is no group configured.
    response = client.post(f"/inventory/update/{edit_id}", json=ui_inventory_new)
    m_find.assert_has_calls(calls_find)
    assert response.json == {"message": f"There is no group group_1 configured. Record was not edited."}
    assert response.status_code == 400
    assert not m_insert.called
    assert not m_update.called
    assert not m_delete.called


@mock.patch("pymongo.collection.Collection.update_one")
def test_delete_inventory_record(m_update, client):
    common_id = "635916b2c8cb7a15f28af40a"
    m_update.return_value = None
    response = client.post(f"/inventory/delete/{common_id}")
    assert m_update.call_args == call({"_id": ObjectId(common_id)}, {"$set": {"delete": True}})
    assert response.json == "success"
