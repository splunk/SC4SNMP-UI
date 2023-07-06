from unittest import mock
from unittest.mock import call, Mock
from bson import ObjectId

common_id = "635916b2c8cb7a15f28af40a"

# TEST ADDING GROUP
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_add_group_record_success(m_find, m_insert, client):
    ui_group = {
        "groupName": "group_1"
    }

    backend_group = {
        "group_1": []
    }

    response = client.post(f"/groups/add", json=ui_group)
    m_find.return_value = []
    m_insert.return_value = None
    assert m_find.call_args == call({f"group_1": {"$exists": True}})
    assert m_insert.call_args == call(backend_group)
    assert response.json == "success"

@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_add_group_record_success(m_find, m_insert, client):
    ui_group = {
        "groupName": "group_1"
    }

    backend_group = {
        "group_1": []
    }

    m_find.side_effect = [
        [backend_group]
    ]

    response = client.post(f"/groups/add", json=ui_group)
    assert not m_insert.called
    assert response.json == {"message": "Group with name group_1 already exists. Group was not added."}

# TEST UPDATING GROUP
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_update_group_success(m_find, m_update, client):

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

@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_update_group_failure(m_find, m_update, client):
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

    backend_group_existing = {
        "_id": ObjectId(common_id),
        "group_1_edit": [
            {"address": "1.2.3.4"},
        ]
    }

    m_find.side_effect = [
        [backend_group_old],
        [backend_group_existing]
    ]

    response = client.post(f"/groups/update/{common_id}", json=ui_group_new)
    #m_update.assert_has_calls(calls_update)
    assert not m_update.called
    assert response.json == {"message": "Group with name group_1_edit already exists. Group was not edited."}

# TEST DELETING GROUP
@mock.patch("pymongo.collection.Collection.find")
@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.MongoClient.start_session")
def test_delete_group_and_devices(m_session, m_update, m_delete, m_find, client):
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
    assert response.json == {
        "message": "Group group_1 was deleted. If group_1 was configured in the inventory, it was deleted from there."}


# TEST ADDING DEVICE
ui_group_device_add_new_success = lambda : {
        "address": "2.2.2.2",
        "port": "",
        "version": "3",
        "community": "",
        "secret": "snmpv3",
        "securityEngine": "",
        "groupId": str(common_id)
    }

backend_group_add_device_old = lambda : {
        "_id": ObjectId(common_id),
        "group_1": [
            {"address": "1.2.3.4", "port": 161},
        ]
    }

backend_group_add_device_success_new = lambda : {
        "_id": ObjectId(common_id),
        "group_1": [
            {"address": "1.2.3.4", 'port': 161},
            {"address": "2.2.2.2", "version": "3", "secret": "snmpv3"}
        ]
    }

group_inventory = lambda : {
        "_id": ObjectId(common_id),
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
    }

@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_add_device_to_group_not_configured_in_inventory_success(m_find, m_update, client):
    m_find.side_effect = [
        [backend_group_add_device_old()],
        [],
        [backend_group_add_device_old()]
    ]
    calls_find = [
        call({'_id': ObjectId(common_id)}, {"_id": 0}),
        call({"address": "group_1", "delete": False}),
        call({'_id': ObjectId(common_id)}, {"_id": 0})
    ]
    m_update.return_value = None

    response = client.post(f"/devices/add", json=ui_group_device_add_new_success())
    m_find.assert_has_calls(calls_find)
    assert m_update.call_args == call({"_id": ObjectId(common_id)}, {"$set": backend_group_add_device_success_new()})
    assert response.json == "success"


@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_add_device_to_group_configured_in_inventory_success(m_find, m_update, client):

    m_find.side_effect = [
        [backend_group_add_device_old()],  # call from group/routes.add_device_to_group
        [group_inventory()],  # call from HandleNewDevice.add_group_host
        [backend_group_add_device_old()],  # call from HandleNewDevice.add_group_host
        [],  # call from HandleNewDevice._is_host_configured
        [],  # call from HandleNewDevice._is_host_configured
        [group_inventory()],  # call from HandleNewDevice._is_host_in_group
        [backend_group_add_device_old()]  # call from HandleNewDevice._is_host_in_group
    ]
    calls_find = [
        call({'_id': ObjectId(common_id)}, {"_id": 0}),  # call from group/routes.add_device_to_group
        call({"address": "group_1", "delete": False}),  # call from HandleNewDevice.add_group_host
        call({'_id': ObjectId(common_id)}, {"_id": 0}),  # call from HandleNewDevice.add_group_host
        call({'address': "2.2.2.2", 'port': 1161, "delete": False}),  # call from HandleNewDevice._is_host_configured
        call({'address': "2.2.2.2", 'port': 1161, "delete": True}),  # call from HandleNewDevice._is_host_configured
        call({"address": {"$regex": "^[a-zA-Z].*"}, "delete": False}),  # call from HandleNewDevice._is_host_in_group
        call({"group_1": {"$exists": 1}})  # call from HandleNewDevice._is_host_in_group
    ]
    m_update.return_value = None

    response = client.post(f"/devices/add", json=ui_group_device_add_new_success())
    m_find.assert_has_calls(calls_find)
    assert m_update.call_args == call({"_id": ObjectId(common_id)}, {"$set": backend_group_add_device_success_new()})
    assert response.json == "success"


@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_add_device_to_group_not_configured_in_inventory_failed(m_find, m_update, client):
    ui_group_device_new = {
        "address": "1.2.3.4",
        "port": "161",
        "version": "3",
        "community": "",
        "secret": "snmpv3",
        "securityEngine": "",
        "groupId": str(common_id)
    }

    m_find.side_effect = [
        [backend_group_add_device_old()],  # call from group/routes.add_device_to_group
        [],  # call from HandleNewDevice.add_group_host
        [backend_group_add_device_old()]  # call from HandleNewDevice.add_group_host
    ]
    calls_find = [
        call({'_id': ObjectId(common_id)}, {"_id": 0}),  # call from group/routes.add_device_to_group
        call({"address": "group_1", "delete": False}),  # call from HandleNewDevice.add_group_host
        call({'_id': ObjectId(common_id)}, {"_id": 0})  # call from HandleNewDevice.add_group_host
    ]
    m_update.return_value = None

    response = client.post(f"/devices/add", json=ui_group_device_new)
    m_find.assert_has_calls(calls_find)
    assert not m_update.called
    assert response.json == {'message': 'Host 1.2.3.4:161 already exists in group group_1. Record was not added.'}


@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_add_device_to_group_configured_in_inventory_failed(m_find, m_update, client):

    ui_group_device_new = {
        "address": "5.5.5.5",
        "port": "161",
        "version": "3",
        "community": "",
        "secret": "snmpv3",
        "securityEngine": "",
        "groupId": str(common_id)
    }

    existing_device_inventory = {
        "_id": ObjectId(common_id),
        "address": "5.5.5.5",
        "port": 161,
        "version": "2c",
        "community": "public",
        "secret": "",
        "walk_interval": 1800,
        "security_engine": "",
        "profiles": "prof1",
        "smart_profiles": False,
        "delete": False
    }

    m_find.side_effect = [
        [backend_group_add_device_old()],  # call from group/routes.add_device_to_group
        [group_inventory()],  # call from HandleNewDevice.add_group_host
        [backend_group_add_device_old()],  # call from HandleNewDevice.add_group_host
        [existing_device_inventory],  # call from HandleNewDevice._is_host_configured
        [],  # call from HandleNewDevice._is_host_configured
    ]
    calls_find = [
        call({'_id': ObjectId(common_id)}, {"_id": 0}),  # call from group/routes.add_device_to_groupp
        call({"address": "group_1", "delete": False}),  # call from HandleNewDevice.add_group_host
        call({'_id': ObjectId(common_id)}, {"_id": 0}),  # call from HandleNewDevice.add_group_host
        call({'address': "5.5.5.5", 'port': 161, "delete": False}),  # call from HandleNewDevice._is_host_configured
        call({'address': "5.5.5.5", 'port': 161, "delete": True}),  # call from HandleNewDevice._is_host_configured
    ]

    response = client.post(f"/devices/add", json=ui_group_device_new)
    m_find.assert_has_calls(calls_find)
    assert not m_update.called
    assert response.json == {'message': 'Host 5.5.5.5:161 already exists as a single host in the inventory. Record was not added.'}


# TEST UPDATING DEVICES
backend_group_update_device_old = lambda : {
        "_id": ObjectId(common_id),
        "group_1": [
            {"address": "1.1.1.1"},
            {"address": "2.2.2.2"},
            {"address": "3.3.3.3"}
        ]
    }

backend_group_update_device_success_new = lambda : {
        "_id": ObjectId(common_id),
        "group_1": [
            {"address": "1.1.1.1"},
            {"address": "2.2.2.3", "port": 1161, "version": "2c", "community": "public",
             "security_engine": "1112233aabbccdee"},
            {"address": "3.3.3.3"}
        ]
    }

ui_group_device_update_new_success = lambda : {
        "address": "2.2.2.3",
        "port": "1161",
        "version": "2c",
        "community": "public",
        "secret": "",
        "securityEngine": "1112233aabbccdee",
        "groupId": str(common_id)
    }

@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_update_device_from_group_not_configured_in_inventory_success(m_find, m_update, client):

    m_find.side_effect = [
        [backend_group_update_device_old()],  # call from group/routes.update_device_from_group
        [],  # call from HandleNewDevice.edit_group_host
        [backend_group_update_device_old()]  # call from HandleNewDevice.edit_group_host
    ]
    calls_find = [
        call({'_id': ObjectId(common_id)}, {"_id": 0}),  # call from group/routes.update_device_from_group
        call({"address": "group_1", "delete": False}),  # call from HandleNewDevice.edit_group_host
        call({'_id': ObjectId(common_id)})  # call from HandleNewDevice.edit_group_host
    ]
    m_update.return_value = None

    response = client.post(f"/devices/update/{common_id}-1", json=ui_group_device_update_new_success())
    m_find.assert_has_calls(calls_find)
    assert m_update.call_args == call({"_id": ObjectId(common_id)}, {"$set": backend_group_update_device_success_new()})
    assert response.json == "success"


@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_update_device_from_group_configured_in_inventory_success(m_find, m_update, client):
    m_find.side_effect = [
        [backend_group_update_device_old()],  # call from group/routes.update_device_from_group
        [group_inventory()],  # call from HandleNewDevice.edit_group_host
        [backend_group_update_device_old()],  # call from HandleNewDevice.edit_group_host
        [],  # call from HandleNewDevice._is_host_configured
        [],  # call from HandleNewDevice._is_host_configured
        [group_inventory()],  # call from HandleNewDevice._is_host_in_group
        [backend_group_update_device_old()]  # call from HandleNewDevice._is_host_in_group
    ]
    calls_find = [
        call({'_id': ObjectId(common_id)}, {"_id": 0}),  # call from group/routes.update_device_from_group
        call({"address": "group_1", "delete": False}),  # call from HandleNewDevice.edit_group_host
        call({'_id': ObjectId(common_id)}),  # call from HandleNewDevice.edit_group_host
        call({'address': "2.2.2.3", 'port': 1161, "delete": False}),  # call from HandleNewDevice._is_host_configured
        call({'address': "2.2.2.3", 'port': 1161, "delete": True}),  # call from HandleNewDevice._is_host_configured
        call({"address": {"$regex": "^[a-zA-Z].*"}, "delete": False}),  # call from HandleNewDevice._is_host_in_group
        call({"group_1": {"$exists": 1}})  # call from HandleNewDevice._is_host_in_group
    ]
    m_update.return_value = None

    response = client.post(f"/devices/update/{common_id}-1", json=ui_group_device_update_new_success())
    m_find.assert_has_calls(calls_find)
    assert m_update.call_args == call({"_id": ObjectId(common_id)}, {"$set": backend_group_update_device_success_new()})
    assert response.json == "success"

@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_update_device_from_group_not_configured_in_inventory_failed(m_find, m_update, client):
    ui_group_device_new = {
        "address": "3.3.3.3",
        "port": "",
        "version": "3",
        "community": "",
        "secret": "snmpv3",
        "securityEngine": "",
        "groupId": str(common_id)
    }
    m_find.side_effect = [
        [backend_group_update_device_old()],  # call from group/routes.update_device_from_group
        [],  # call from HandleNewDevice.edit_group_host
        [backend_group_update_device_old()]  # call from HandleNewDevice.edit_group_host
    ]
    calls_find = [
        call({'_id': ObjectId(common_id)}, {"_id": 0}),  # call from group/routes.add_device_to_group
        call({"address": "group_1", "delete": False}),  # call from HandleNewDevice.edit_group_host
        call({'_id': ObjectId(common_id)})  # call from HandleNewDevice.edit_group_host
    ]
    m_update.return_value = None

    response = client.post(f"/devices/update/{common_id}-1", json=ui_group_device_new)
    m_find.assert_has_calls(calls_find)
    assert not m_update.called
    assert response.json == {'message': 'Host 3.3.3.3: already exists in group group_1. Record was not edited.'}

@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_update_device_from_group_configured_in_inventory_failed(m_find, m_update, client):
    ui_group_device_new = {
        "address": "5.5.5.5",
        "port": "161",
        "version": "3",
        "community": "",
        "secret": "snmpv3",
        "securityEngine": "",
        "groupId": str(common_id)
    }

    second_group_inventory = {
        "_id": ObjectId(common_id),
        "address": "group_2",
        "port": 1161,
        "version": "2c",
        "community": "public",
        "secret": "",
        "walk_interval": 1800,
        "security_engine": "",
        "profiles": "prof1",
        "smart_profiles": False,
        "delete": False
    }

    second_group_inventory_backend= {
        "_id": ObjectId(common_id),
        "group_2": [
            {"address": "5.5.5.5", "port": 161},
        ]
    }

    m_find.side_effect = [
        [backend_group_update_device_old()],  # call from group/routes.update_device_from_group
        [group_inventory()],  # call from HandleNewDevice.edit_group_host
        [backend_group_update_device_old()],  # call from HandleNewDevice.edit_group_host
        [],  # call from HandleNewDevice._is_host_configured
        [],  # call from HandleNewDevice._is_host_configured
        [second_group_inventory],  # call from HandleNewDevice._is_host_in_group
        [second_group_inventory_backend]  # call from HandleNewDevice._is_host_in_group
    ]
    calls_find = [
        call({'_id': ObjectId(common_id)}, {"_id": 0}),  # call from group/routes.update_device_from_group
        call({"address": "group_1", "delete": False}),  # call from HandleNewDevice.edit_group_host
        call({'_id': ObjectId(common_id)}),  # call from HandleNewDevice.edit_group_host
        call({'address': "5.5.5.5", 'port': 161, "delete": False}),  # call from HandleNewDevice._is_host_configured
        call({'address': "5.5.5.5", 'port': 161, "delete": True}),  # call from HandleNewDevice._is_host_configured
        call({"address": {"$regex": "^[a-zA-Z].*"}, "delete": False}),  # call from HandleNewDevice._is_host_in_group
        call({"group_2": {"$exists": 1}})  # call from HandleNewDevice._is_host_in_group
    ]

    response = client.post(f"/devices/update/{common_id}-1", json=ui_group_device_new)
    m_find.assert_has_calls(calls_find)
    assert not m_update.called
    assert response.json == {'message': 'Host 5.5.5.5:161 already exists in group group_2. Record was not edited.'}


# TEST DELETING DEVICE
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_delete_device_from_group_record(m_find, m_update, client):

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
    assert response.json == {'message': 'Device 2.2.2.3:1161 from group group_1 was deleted.'}

    m_find.return_value = [backend_group_new1]
    response = client.post(f"/devices/delete/{common_id}-0")
    assert m_find.call_args == call({'_id': ObjectId(common_id)}, {"_id": 0})
    assert m_update.call_args == call({"_id": ObjectId(common_id)}, {"$set": backend_group_new2})
    assert response.json == {'message': 'Device 1.1.1.1: from group group_1 was deleted.'}