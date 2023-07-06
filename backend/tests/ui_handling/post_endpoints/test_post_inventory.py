from unittest import mock
from unittest.mock import call, Mock
from bson import ObjectId


common_id = "635916b2c8cb7a15f28af40a"

# TEST ADDING A SINGLE HOST
ui_inventory_new = lambda : {
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

backend_inventory_new = lambda : {
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

@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_add_single_host_success(m_find, m_insert, m_delete, client):

    # Test adding a new device, when there was no device with the same
    # address and port with deleted flag set to True.
    m_insert.return_value = None
    m_delete.return_value = None

    m_find.side_effect = [
        [],  # call from HandleNewDevice._is_host_configured
        [],  # call from HandleNewDevice._is_host_configured
        []  # call from  HandleNewDevice._is_host_in_group
    ]
    calls_find = [
        call({'address': "11.0.78.114", 'port': 161, "delete": False}),  # call from HandleNewDevice._is_host_configured
        call({'address': "11.0.78.114", 'port': 161, "delete": True}),  # call from HandleNewDevice._is_host_configured
        call({"address": {"$regex": "^[a-zA-Z].*"}, "delete": False})  # call from  HandleNewDevice._is_host_in_group
    ]


    response = client.post(f"/inventory/add", json=ui_inventory_new())
    m_find.assert_has_calls(calls_find)
    assert m_insert.call_args == call(backend_inventory_new())
    assert not m_delete.called
    assert response.json == "success"

    # Test adding a new device when there was a device with the same
    # address and port with deleted flag set to True.
    m_find.side_effect = [
        [],  # call from HandleNewDevice._is_host_configured
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
        }],  # call from HandleNewDevice._is_host_configured
        [] # call from  HandleNewDevice._is_host_in_group
    ]


    response = client.post(f"/inventory/add", json=ui_inventory_new())
    m_find.assert_has_calls(calls_find)
    assert m_insert.call_args == call(backend_inventory_new())
    assert m_delete.call_args == call({"_id": ObjectId(common_id)})
    assert response.json == "success"

@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_add_single_host_failure(m_find, m_insert, m_delete, client):

    m_insert.return_value = None
    m_delete.return_value = None

    m_find.side_effect = [
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
            "delete": False
        }],  # call from HandleNewDevice._is_host_configured
        [],  # call from HandleNewDevice._is_host_configured
    ]
    calls_find = [
        call({'address': "11.0.78.114", 'port': 161, "delete": False}),  # call from HandleNewDevice._is_host_configured
        call({'address': "11.0.78.114", 'port': 161, "delete": True}),  # call from HandleNewDevice._is_host_configured
    ]

    response = client.post(f"/inventory/add", json=ui_inventory_new())
    m_find.assert_has_calls(calls_find)
    assert not m_delete.called
    assert not m_insert.called
    assert response.json == {"message": "Host 11.0.78.114:161 already exists as a single host in the inventory. "
                                        "Record was not added."}


# TEST UPDATING A SINGLE HOST
backend_inventory_old = lambda : {
        "_id": ObjectId(common_id),
        "address": "11.0.78.114",
        "port": 161,
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walk_interval": 2000,
        "security_engine": "1234aabbccd",
        "profiles": "prof1",
        "smart_profiles": False,
        "delete": False
    }
@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_edit_single_host_success(m_find, m_insert, m_update, m_delete, client):
    # Test editing a device without changing its address and port
    m_insert.return_value = None
    m_update.return_value = None
    m_delete.return_value = None
    m_find.side_effect = [
        [backend_inventory_old()],  # call from inventory/routes.update_inventory_record
        [backend_inventory_old()],  # call from HandleNewDevice._is_host_configured
        [],  # call from HandleNewDevice._is_host_configured
        [backend_inventory_old()],  # call from HandleNewDevice.edit_single_host
    ]

    calls_find = [
        call({"_id": ObjectId(common_id)}),  # call from inventory/routes.update_inventory_record
        call({'address': "11.0.78.114", 'port': 161, "delete": False}),  # call from HandleNewDevice._is_host_configured
        call({'address': "11.0.78.114", 'port': 161, "delete": True}),  # call from HandleNewDevice._is_host_configured
        call({"_id": ObjectId(common_id)}),  # call from HandleNewDevice.edit_single_host
    ]

    response = client.post(f"/inventory/update/{common_id}", json=ui_inventory_new())
    m_find.assert_has_calls(calls_find)
    assert m_update.call_args == call({"_id": ObjectId(common_id)}, {"$set": backend_inventory_new()})
    assert not m_insert.called
    assert not m_delete.called
    assert response.json == "success"


@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_edit_single_host_address_and_port_success(m_find, m_insert, m_update, m_delete, client):
    # Test editing a device with changing its address and port
    m_insert.return_value = None
    m_update.return_value = None
    m_delete.return_value = None
    ui_inventory_new_address_port = {
        "address": "1.0.0.0",
        "port": "1111",
        "version": "3",
        "community": "",
        "secret": "my_secret_new",
        "walkInterval": 1800,
        "securityEngine": "1234aabbccd",
        "profiles": ["prof1", "prof2", "prof3"],
        "smartProfiles": False
    }
    backend_inventory_new_address_port = {
        "address": "1.0.0.0",
        "port": 1111,
        "version": "3",
        "community": "",
        "secret": "my_secret_new",
        "walk_interval": 1800,
        "security_engine": "1234aabbccd",
        "profiles": "prof1;prof2;prof3",
        "smart_profiles": False,
        "delete": False
    }
    deleted_host_backend = {
        "_id": ObjectId("43EE0BCBA668527E7106E4F5"),
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
    }

    m_find.side_effect = [
        [backend_inventory_old()],  # call from inventory/routes.update_inventory_record
        [],  # call from HandleNewDevice._is_host_configured
        [deleted_host_backend],  # call from HandleNewDevice._is_host_configured
        [],  # call from HandleNewDevice._is_host_in_group
        [backend_inventory_old()],  # call from HandleNewDevice.edit_single_host
        [],  # call from HandleNewDevice._is_host_configured
        [deleted_host_backend],  # call from HandleNewDevice._is_host_configured
        [],  # call from HandleNewDevice._is_host_in_group
    ]

    calls_find = [
        call({"_id": ObjectId(common_id)}),  # call from inventory/routes.update_inventory_record
        call({'address': "1.0.0.0", 'port': 1111, "delete": False}),  # call from HandleNewDevice._is_host_configured
        call({'address': "1.0.0.0", 'port': 1111, "delete": True}),  # call from HandleNewDevice._is_host_configured
        call({"address": {"$regex": "^[a-zA-Z].*"}, "delete": False}),  # call from HandleNewDevice._is_host_in_group
        call({"_id": ObjectId(common_id)}),
        call({'address': "1.0.0.0", 'port': 1111, "delete": False}),  # call from HandleNewDevice._is_host_configured
        call({'address': "1.0.0.0", 'port': 1111, "delete": True}),  # call from HandleNewDevice._is_host_configured
        call({"address": {"$regex": "^[a-zA-Z].*"}, "delete": False}),  # call from HandleNewDevice._is_host_in_group
    ]

    response = client.post(f"/inventory/update/{common_id}", json=ui_inventory_new_address_port)
    m_find.assert_has_calls(calls_find)
    assert m_insert.call_args == call(backend_inventory_new_address_port)
    assert m_delete.call_args == call({"_id": ObjectId("43EE0BCBA668527E7106E4F5")})
    assert m_update.call_args == call({"_id": ObjectId(common_id)}, {"$set": {"delete": True}})
    assert response.json == {
        "message": "Address or port was edited which resulted in deleting the old device and creating " \
                   "the new one at the end of the list."}


backend_inventory_old = lambda : {
        "_id": ObjectId(common_id),
        "address": "11.0.78.114",
        "port": 161,
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walk_interval": 2000,
        "security_engine": "1234aabbccd",
        "profiles": "prof1",
        "smart_profiles": False,
        "delete": False
    }
@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_edit_single_host_failed(m_find, m_insert, m_update, m_delete, client):
    existing_id = "035916b2c8cb7a15f28af40b"

    ui_inventory_new = {
        "address": "0.0.0.0",
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
        [backend_inventory_old()],  # call from inventory/routes.update_inventory_record
        [{
            "_id": ObjectId(existing_id),
            "address": "0.0.0.0",
            "port": 1161,
            "version": "2c",
            "community": "public",
            "secret": "",
            "walk_interval": 1800,
            "security_engine": "",
            "profiles": "prof1",
            "smart_profiles": False,
            "delete": False
        }],  # call from HandleNewDevice._is_host_configured
        [],  # call from HandleNewDevice._is_host_configured
    ]

    calls_find = [
        call({"_id": ObjectId(common_id)}),  # call from inventory/routes.update_inventory_record
        call({'address': "0.0.0.0", 'port': 1161, "delete": False}),  # call from HandleNewDevice._is_host_configured
        call({'address': "0.0.0.0", 'port': 1161, "delete": True}),  # call from HandleNewDevice._is_host_configured

    ]

    response = client.post(f"/inventory/update/{common_id}", json=ui_inventory_new)
    m_find.assert_has_calls(calls_find)
    assert response.json == {"message": "Host 0.0.0.0:1161 already exists as a single host in the inventory. "
                                        "Record was not edited."}
    assert response.status_code == 400
    assert not m_insert.called
    assert not m_update.called
    assert not m_delete.called


# TEST ADDING A GROUP
new_group_ui_inventory = lambda : {
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

new_group_backend_inventory = lambda :{
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

new_group_backend = lambda : {
    "_id": ObjectId(common_id),
    "group_1": [{"address": "1.2.3.4"}]
}

existing_group_backend = lambda : {
    "_id": ObjectId("43EE0BCBA668527E7106E4F5"),
    "group_2": [{"address": "0.0.0.0"}]
}

existing_group_inventory_backend = lambda : {
    "_id": ObjectId("43EE0BCBA668527E7106E4F5"),
    "address": "group_2",
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

@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_add_group_success(m_find, m_insert, m_delete, client):

    m_insert.return_value = None
    m_delete.return_value = None

    # Test adding a new group, when there was no group with the same name with deleted flag set to True
    m_find.side_effect = [
        [],  # call from HandleNewDevice.add_group_to_inventory
        [],  # call from HandleNewDevice.add_group_to_inventory
        [new_group_backend()],  # call from HandleNewDevice.add_group_to_inventory
        [],  # call from HandleNewDevice._is_host_configured
        [],  # call from HandleNewDevice._is_host_configured
        [existing_group_inventory_backend()],  # call from HandleNewDevice._is_host_in_group
        [existing_group_backend()]  # call from HandleNewDevice._is_host_in_group
    ]

    calls_find = [
        call({'address': "group_1", "delete": False}),  # call from HandleNewDevice.add_group_to_inventory
        call({'address': "group_1", "delete": True}),  # call from HandleNewDevice.add_group_to_inventory
        call({'group_1': {"$exists": 1}}),  # call from HandleNewDevice.add_group_to_inventory
        call({'address': "1.2.3.4", 'port': 161, "delete": False}),  # call from HandleNewDevice._is_host_configured
        call({'address': "1.2.3.4", 'port': 161, "delete": True}),  # call from HandleNewDevice._is_host_configured
        call({"address": {"$regex": "^[a-zA-Z].*"}, "delete": False}),  # call from HandleNewDevice._is_host_in_group
        call({"group_2": {"$exists": 1}})  # call from HandleNewDevice._is_host_in_group
    ]

    response = client.post(f"/inventory/add", json=new_group_ui_inventory())
    m_find.assert_has_calls(calls_find)
    assert m_insert.call_args == call(new_group_backend_inventory())
    assert not m_delete.called
    assert response.json == "success"

    # Test adding a new group, when there was a group with the same name with deleted flag set to True
    m_find.side_effect = [
        [],  # call from HandleNewDevice.add_group_to_inventory
        [{
            "_id": ObjectId("83EE0BCBA668527E7106E4F5"),
            "address": "group_3",
            "port": 161,
            "version": "3",
            "community": "",
            "secret": "my_secret",
            "walk_interval": 1800,
            "security_engine": "1234aabbccd",
            "profiles": "prof1;prof2;prof3",
            "smart_profiles": False,
            "delete": True
        }],  # call from HandleNewDevice.add_group_to_inventory
        [new_group_backend()],  # call from HandleNewDevice.add_group_to_inventory
        [],  # call from HandleNewDevice._is_host_configured
        [],  # call from HandleNewDevice._is_host_configured
        [existing_group_inventory_backend()],  # call from HandleNewDevice._is_host_in_group
        [existing_group_backend()]  # call from HandleNewDevice._is_host_in_group
    ]

    response = client.post(f"/inventory/add", json=new_group_ui_inventory())
    m_find.assert_has_calls(calls_find)
    assert m_insert.call_args == call(new_group_backend_inventory())
    assert m_delete.call_args == call({"_id": ObjectId("83EE0BCBA668527E7106E4F5")})
    assert response.json == "success"


@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_add_group_which_exists_failure(m_find, m_insert, m_delete, client):
    m_insert.return_value = None
    m_delete.return_value = None

    m_find.side_effect = [
        [new_group_backend_inventory()],  # call from HandleNewDevice.add_group_to_inventory
        [],  # call from HandleNewDevice.add_group_to_inventory
        [new_group_backend()],  # call from HandleNewDevice.add_group_to_inventory
    ]

    calls_find = [
        call({'address': "group_1", "delete": False}),  # call from HandleNewDevice.add_group_to_inventory
        call({'address': "group_1", "delete": True}),  # call from HandleNewDevice.add_group_to_inventory
        call({'group_1': {"$exists": 1}}),  # call from HandleNewDevice.add_group_to_inventory
    ]

    response = client.post(f"/inventory/add", json=new_group_ui_inventory())
    m_find.assert_has_calls(calls_find)
    assert not m_insert.called
    assert not m_delete.called
    assert response.json == {"message": "Group group_1 has already been added to the inventory. "
                                        "Record was not added."}


@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_add_group_with_hosts_configured_failure(m_find, m_insert, m_delete, client):
    m_insert.return_value = None
    m_delete.return_value = None

    new_group_ui_failure = {
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

    new_group_backend_failure =  {
        "_id": ObjectId(common_id),
        "group_1": [{"address": "0.0.0.0"}]
    }

    m_find.side_effect = [
        [],  # call from HandleNewDevice.add_group_to_inventory
        [],  # call from HandleNewDevice.add_group_to_inventory
        [new_group_backend_failure],  # call from HandleNewDevice.add_group_to_inventory
        [],  # call from HandleNewDevice._is_host_configured
        [],  # call from HandleNewDevice._is_host_configured
        [existing_group_inventory_backend()],  # call from HandleNewDevice._is_host_in_group
        [existing_group_backend()]  # call from HandleNewDevice._is_host_in_group
    ]

    calls_find = [
        call({'address': "group_1", "delete": False}),  # call from HandleNewDevice.add_group_to_inventory
        call({'address': "group_1", "delete": True}),  # call from HandleNewDevice.add_group_to_inventory
        call({'group_1': {"$exists": 1}}),  # call from HandleNewDevice.add_group_to_inventory
        call({'address': "0.0.0.0", 'port': 161, "delete": False}),  # call from HandleNewDevice._is_host_configured
        call({'address': "0.0.0.0", 'port': 161, "delete": True}),  # call from HandleNewDevice._is_host_configured
        call({"address": {"$regex": "^[a-zA-Z].*"}, "delete": False}),  # call from HandleNewDevice._is_host_in_group
        call({"group_2": {"$exists": 1}})  # call from HandleNewDevice._is_host_in_group
    ]

    response = client.post(f"/inventory/add", json=new_group_ui_failure)
    m_find.assert_has_calls(calls_find)
    assert not m_insert.called
    assert not m_delete.called
    assert response.json == {"message": "Can't add group group_1. "
                                        "Host 0.0.0.0:161 already exists in group group_2. Record was not added."}


@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_add_group_with_host_configured_multiple_times_failure(m_find, m_insert, m_delete, client):
    m_insert.return_value = None
    m_delete.return_value = None

    new_group_ui_failure = {
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

    new_group_backend_failure =  {
        "_id": ObjectId(common_id),
        "group_1": [
            {"address": "1.1.1.1"},
            {"address": "1.1.1.1"}
        ]
    }

    m_find.side_effect = [
        [],  # call from HandleNewDevice.add_group_to_inventory
        [],  # call from HandleNewDevice.add_group_to_inventory
        [new_group_backend_failure],  # call from HandleNewDevice.add_group_to_inventory

        # first iteration in HandleNewDevice.add_group_to_inventory
        [],  # call from HandleNewDevice._is_host_configured
        [],  # call from HandleNewDevice._is_host_configured
        [existing_group_inventory_backend()],  # call from HandleNewDevice._is_host_in_group
        [existing_group_backend()],  # call from HandleNewDevice._is_host_in_group

        # second iteration in HandleNewDevice.add_group_to_inventory
        [],  # call from HandleNewDevice._is_host_configured
        [],  # call from HandleNewDevice._is_host_configured
        [existing_group_inventory_backend()],  # call from HandleNewDevice._is_host_in_group
        [existing_group_backend()]  # call from HandleNewDevice._is_host_in_group
    ]

    calls_find = [
        call({'address': "group_1", "delete": False}),  # call from HandleNewDevice.add_group_to_inventory
        call({'address': "group_1", "delete": True}),  # call from HandleNewDevice.add_group_to_inventory
        call({'group_1': {"$exists": 1}}),  # call from HandleNewDevice.add_group_to_inventory

        # first iteration in HandleNewDevice.add_group_to_inventory
        call({'address': "1.1.1.1", 'port': 161, "delete": False}),  # call from HandleNewDevice._is_host_configured
        call({'address': "1.1.1.1", 'port': 161, "delete": True}),  # call from HandleNewDevice._is_host_configured
        call({"address": {"$regex": "^[a-zA-Z].*"}, "delete": False}),  # call from HandleNewDevice._is_host_in_group
        call({"group_2": {"$exists": 1}}),  # call from HandleNewDevice._is_host_in_group

        # second iteration in HandleNewDevice.add_group_to_inventory
        call({'address': "1.1.1.1", 'port': 161, "delete": False}),  # call from HandleNewDevice._is_host_configured
        call({'address': "1.1.1.1", 'port': 161, "delete": True}),  # call from HandleNewDevice._is_host_configured
        call({"address": {"$regex": "^[a-zA-Z].*"}, "delete": False}),  # call from HandleNewDevice._is_host_in_group
        call({"group_2": {"$exists": 1}})  # call from HandleNewDevice._is_host_in_group
    ]

    response = client.post(f"/inventory/add", json=new_group_ui_failure)
    m_find.assert_has_calls(calls_find)
    assert not m_insert.called
    assert not m_delete.called
    assert response.json == {"message": "Can't add group group_1. "
                                        "Device 1.1.1.1:161 was configured multiple times in this group. "
                                        "Record was not added."}


@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_add_group_without_configuration(m_find, m_insert, m_delete, client):
    m_insert.return_value = None
    m_delete.return_value = None

    m_find.side_effect = [
        [],  # call from HandleNewDevice.add_group_to_inventory
        [],  # call from HandleNewDevice.add_group_to_inventory
        [],  # call from HandleNewDevice.add_group_to_inventory
    ]

    calls_find = [
        call({'address': "group_1", "delete": False}),  # call from HandleNewDevice.add_group_to_inventory
        call({'address': "group_1", "delete": True}),  # call from HandleNewDevice.add_group_to_inventory
        call({'group_1': {"$exists": 1}}),  # call from HandleNewDevice.add_group_to_inventory
    ]

    response = client.post(f"/inventory/add", json=new_group_ui_inventory())
    m_find.assert_has_calls(calls_find)
    assert m_insert.call_args == call(new_group_backend_inventory())
    assert not m_delete.called
    assert response.json == {"message": "Group group_1 doesn't exist in the configuration. "
                                        "Treating group_1 as a hostname."}


@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_add_group_without_configuration_failure(m_find, m_insert, m_delete, client):
    m_insert.return_value = None
    m_delete.return_value = None

    m_find.side_effect = [
        [new_group_backend_inventory()],  # call from HandleNewDevice.add_group_to_inventory
        [],  # call from HandleNewDevice.add_group_to_inventory
        [],  # call from HandleNewDevice.add_group_to_inventory
    ]

    calls_find = [
        call({'address': "group_1", "delete": False}),  # call from HandleNewDevice.add_group_to_inventory
        call({'address': "group_1", "delete": True}),  # call from HandleNewDevice.add_group_to_inventory
        call({'group_1': {"$exists": 1}}),  # call from HandleNewDevice.add_group_to_inventory
    ]

    response = client.post(f"/inventory/add", json=new_group_ui_inventory())
    m_find.assert_has_calls(calls_find)
    assert not m_insert.called
    assert not m_delete.called
    assert response.json == {"message": "group_1 has already been configured. Record was not added."}



# TEST UPDATING A GROUP

ui_edited_group = lambda : {
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

edited_group = lambda : {
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

backend_existing_edit_group = lambda : {
    "_id": ObjectId(common_id),
    "address": "group_1",
    "port": 161,
    "version": "2",
    "community": "public",
    "secret": "",
    "walk_interval": 1800,
    "security_engine": "",
    "profiles": "prof1;prof2;prof3",
    "smart_profiles": False,
    "delete": False
}

@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_update_group_without_changing_name_success(m_find, m_insert, m_update, m_delete, client):

    m_insert.return_value = None
    m_update.return_value = None
    m_delete.return_value = None

    m_find.side_effect = [
        [backend_existing_edit_group()],  # call from HandleNewDevice.update_inventory_record
        [backend_existing_edit_group()],  # call from HandleNewDevice.edit_group_in_inventory
        [],  # call from HandleNewDevice.edit_group_in_inventory
        [backend_existing_edit_group()]  # call from HandleNewDevice.edit_group_in_inventory
    ]

    calls_find = [
        call({"_id": ObjectId(common_id)}),   # call from HandleNewDevice.update_inventory_record
        call({'address': "group_1", "delete": False}),  # call from HandleNewDevice.edit_group_in_inventory
        call({'address': "group_1", "delete": True}),  # call from HandleNewDevice.edit_group_in_inventory
        call({"_id": ObjectId(common_id)})  # call from HandleNewDevice.edit_group_in_inventory
    ]

    response = client.post(f"/inventory/update/{common_id}", json=ui_edited_group())
    m_find.assert_has_calls(calls_find)
    assert m_update.call_args == call({"_id": ObjectId(common_id)}, {"$set": edited_group()})
    assert not m_insert.called
    assert not m_delete.called
    assert response.json == "success"


@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_update_group_with_changing_name_success(m_find, m_insert, m_update, m_delete, client):

    m_insert.return_value = None
    m_update.return_value = None
    m_delete.return_value = None

    new_name_group_ui = {
        "address": "group_2",
        "port": "161",
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walkInterval": 1800,
        "securityEngine": "1234aabbccd",
        "profiles": ["prof1", "prof2", "prof3"],
        "smartProfiles": False
    }

    new_name_group = {
        "address": "group_2",
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

    second_group_backend = {
        "_id": ObjectId("19E121BD031284F3CE845B72"),
        "group_2": []
    }

    m_find.side_effect = [
        [backend_existing_edit_group()],  # call from HandleNewDevice.update_inventory_record
        [],  # call from HandleNewDevice.edit_group_in_inventory
        [],  # call from HandleNewDevice.edit_group_in_inventory
        [backend_existing_edit_group()],  # call from HandleNewDevice.edit_group_in_inventory
        [],  # call from HandleNewDevice.add_group_to_inventory
        [],  # call from HandleNewDevice.add_group_to_inventory
        [second_group_backend]  # call from HandleNewDevice.add_group_to_inventory
    ]

    calls_find = [
        call({"_id": ObjectId(common_id)}),   # call from HandleNewDevice.update_inventory_record
        call({'address': "group_2", "delete": False}),  # call from HandleNewDevice.edit_group_in_inventory
        call({'address': "group_2", "delete": True}),  # call from HandleNewDevice.edit_group_in_inventory
        call({"_id": ObjectId(common_id)}),  # call from HandleNewDevice.edit_group_in_inventory
        call({'address': "group_2", "delete": False}),  # call from HandleNewDevice.add_group_to_inventory
        call({'address': "group_2", "delete": True}),  # call from HandleNewDevice.add_group_to_inventory
        call({"group_2": {"$exists": 1}})  # call from HandleNewDevice.add_group_to_inventory
    ]

    response = client.post(f"/inventory/update/{common_id}", json=new_name_group_ui)
    m_find.assert_has_calls(calls_find)
    assert m_update.call_args == call({"_id": ObjectId(common_id)}, {"$set": {"delete": True}})
    assert m_insert.call_args == call(new_name_group)
    assert not m_delete.called
    assert response.json == {"message": "Group name was edited which resulted in deleting the old group and creating new " \
                                  "one at the end of the list."}

@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_update_group_to_already_configured_failure(m_find, m_insert, m_update, m_delete, client):
    m_insert.return_value = None
    m_update.return_value = None
    m_delete.return_value = None

    new_name_group_ui = {
        "address": "group_2",
        "port": "161",
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walkInterval": 1800,
        "securityEngine": "1234aabbccd",
        "profiles": ["prof1", "prof2", "prof3"],
        "smartProfiles": False
    }

    inventory_existing_other_group = {
        "_id": ObjectId("83EE0BCBA668527E7106E4F5"),
        "address": "group_2",
        "port": 161,
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walk_interval": 1800,
        "security_engine": "1234aabbccd",
        "profiles": "prof1;prof2;prof3",
        "smart_profiles": False,
        "delete": True
    }

    m_find.side_effect = [
        [backend_existing_edit_group()],  # call from HandleNewDevice.update_inventory_record
        [inventory_existing_other_group],  # call from HandleNewDevice.edit_group_in_inventory
        []  # call from HandleNewDevice.edit_group_in_inventory
    ]

    calls_find = [
        call({"_id": ObjectId(common_id)}),  # call from HandleNewDevice.update_inventory_record
        call({'address': "group_2", "delete": False}),  # call from HandleNewDevice.edit_group_in_inventory
        call({'address': "group_2", "delete": True}),  # call from HandleNewDevice.edit_group_in_inventory
    ]

    response = client.post(f"/inventory/update/{common_id}", json=new_name_group_ui)
    m_find.assert_has_calls(calls_find)
    assert not m_update.called
    assert not m_insert.called
    assert not m_delete.called
    assert response.json == {"message": "Group wit name group_2 already exists. Record was not edited."}

@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_update_group_to_other_group_with_host_already_configured_failure(m_find, m_insert, m_update, m_delete, client):
    m_insert.return_value = None
    m_update.return_value = None
    m_delete.return_value = None

    new_group_ui_failure = {
        "address": "group_3",
        "port": "161",
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walkInterval": 1800,
        "securityEngine": "1234aabbccd",
        "profiles": ["prof1", "prof2", "prof3"],
        "smartProfiles": False
    }

    new_group_backend_failure =  {
        "_id": ObjectId(common_id),
        "group_3": [{"address": "0.0.0.0"}]
    }

    m_find.side_effect = [
        [backend_existing_edit_group()],  # call from HandleNewDevice.update_inventory_record
        [],  # call from HandleNewDevice.edit_group_in_inventory
        [],  # call from HandleNewDevice.edit_group_in_inventory
        [backend_existing_edit_group()],  # call from HandleNewDevice.edit_group_in_inventory

        [],  # call from HandleNewDevice.add_group_to_inventory
        [],  # call from HandleNewDevice.add_group_to_inventory
        [new_group_backend_failure],  # call from HandleNewDevice.add_group_to_inventory
        [],  # call from HandleNewDevice._is_host_configured
        [],  # call from HandleNewDevice._is_host_configured
        [existing_group_inventory_backend()],  # call from HandleNewDevice._is_host_in_group
        [existing_group_backend()]  # call from HandleNewDevice._is_host_in_group
    ]

    calls_find = [
        call({"_id": ObjectId(common_id)}),  # call from HandleNewDevice.update_inventory_record
        call({'address': "group_3", "delete": False}),  # call from HandleNewDevice.edit_group_in_inventory
        call({'address': "group_3", "delete": True}),  # call from HandleNewDevice.edit_group_in_inventory
        call({"_id": ObjectId(common_id)}),  # call from HandleNewDevice.edit_group_in_inventory

        call({'address': "group_3", "delete": False}),  # call from HandleNewDevice.add_group_to_inventory
        call({'address': "group_3", "delete": True}),  # call from HandleNewDevice.add_group_to_inventory
        call({'group_3': {"$exists": 1}}),  # call from HandleNewDevice.add_group_to_inventory
        call({'address': "0.0.0.0", 'port': 161, "delete": False}),  # call from HandleNewDevice._is_host_configured
        call({'address': "0.0.0.0", 'port': 161, "delete": True}),  # call from HandleNewDevice._is_host_configured
        call({"address": {"$regex": "^[a-zA-Z].*"}, "delete": False}),  # call from HandleNewDevice._is_host_in_group
        call({"group_2": {"$exists": 1}})  # call from HandleNewDevice._is_host_in_group
    ]

    response = client.post(f"/inventory/update/{common_id}", json=new_group_ui_failure)
    m_find.assert_has_calls(calls_find)
    assert not m_insert.called
    assert not m_delete.called
    assert response.json == {"message": "Can't add group group_3. "
                                        "Host 0.0.0.0:161 already exists in group group_2. Record was not added."}


@mock.patch("pymongo.collection.Collection.delete_one")
@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.insert_one")
@mock.patch("pymongo.collection.Collection.find")
def test_update_group_host_or_host_to_group_failure(m_find, m_insert, m_update, m_delete, client):
    m_insert.return_value = None
    m_update.return_value = None
    m_delete.return_value = None

    ui_edit_group_to_host = {
        "address": "1.1.1.1",
        "port": "161",
        "version": "3",
        "community": "",
        "secret": "my_secret",
        "walkInterval": 1800,
        "securityEngine": "1234aabbccd",
        "profiles": ["prof1", "prof2", "prof3"],
        "smartProfiles": False
    }

    m_find.side_effect = [
        [backend_existing_edit_group()],  # call from HandleNewDevice.update_inventory_record
    ]

    calls_find = [
        call({"_id": ObjectId(common_id)}),  # call from HandleNewDevice.update_inventory_record
    ]

    response = client.post(f"/inventory/update/{common_id}", json=ui_edit_group_to_host)
    m_find.assert_has_calls(calls_find)
    assert not m_update.called
    assert not m_insert.called
    assert not m_delete.called
    assert response.json == {"message": "Can't edit single host to the group or group to the single host"}

    backend_edit_host_to_group = {
        "_id": ObjectId(common_id),
        "address": "1.1.1.1",
        "port": 161,
        "version": "2",
        "community": "public",
        "secret": "",
        "walk_interval": 1800,
        "security_engine": "",
        "profiles": "prof1;prof2;prof3",
        "smart_profiles": False,
        "delete": False
    }

    ui_edit_group_to_host2 = {
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

    m_find.side_effect = [
        [backend_edit_host_to_group],  # call from HandleNewDevice.update_inventory_record
    ]

    calls_find = [
        call({"_id": ObjectId(common_id)}),  # call from HandleNewDevice.update_inventory_record
    ]

    response = client.post(f"/inventory/update/{common_id}", json=ui_edit_group_to_host2)
    m_find.assert_has_calls(calls_find)
    assert not m_update.called
    assert not m_insert.called
    assert not m_delete.called
    assert response.json == {"message": "Can't edit single host to the group or group to the single host"}

@mock.patch("pymongo.collection.Collection.update_one")
@mock.patch("pymongo.collection.Collection.find")
def test_delete_inventory_record(m_find, m_update, client):
    m_update.return_value = None
    m_find.return_value = [{
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
    }]
    response = client.post(f"/inventory/delete/{common_id}")
    assert m_update.call_args == call({"_id": ObjectId(common_id)}, {"$set": {"delete": True}})
    assert response.json == {"message": f"group_1 was deleted."}
