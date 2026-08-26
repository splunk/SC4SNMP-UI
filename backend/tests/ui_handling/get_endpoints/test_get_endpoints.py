from unittest import mock
from bson import ObjectId

@mock.patch("pymongo.collection.Collection.find")
def test_get_profile_names(m_client, client):
    m_client.return_value = [{
            "_id": ObjectId("635916b2c8cb7a15f28af40a"),
            "profile_1": {
                "frequency": 10,
                "varBinds": [["IF-MIB", "ifInDiscards", 1], ["IF-MIB"], ["IF-MIB", "ifOutErrors"]]
            }
        },
        {
            "_id": ObjectId("635916b2c8cb7a15f28af40a"),
            "profile_3": {
                "frequency": 30,
                "condition": {"type": "field",
                              "field": "SNMPv2-MIB.sysObjectID",
                              "patterns": ["^MIKROTIK", "^MIKROTIK2"]},
                "varBinds": [["IF-MIB", "ifInDiscards", 1], ["IF-MIB"], ["IF-MIB", "ifOutErrors"]]
            }
        }
    ]
    response = client.get('/profiles/names')
    assert response.json == ["profile_1", "profile_3"]


@mock.patch("pymongo.collection.Collection.find")
def test_get_all_profiles_list(m_client, client):
    common_id = "635916b2c8cb7a15f28af40a"
    m_client.return_value = [{
        "_id": common_id,
        "profile_1": {
            "frequency": 10,
            "varBinds": [["IF-MIB", "ifInDiscards", 1], ["IF-MIB"], ["IF-MIB", "ifOutErrors"]]
        }
    },
        {
            "_id": common_id,
            "profile_2": {
                "frequency": 30,
                "condition": {"type": "field",
                              "field": "SNMPv2-MIB.sysObjectID",
                              "patterns": ["^MIKROTIK", "^MIKROTIK2"]},
                "varBinds": [["IF-MIB", "ifInDiscards", 1], ["IF-MIB"], ["IF-MIB", "ifOutErrors"]]
            }
        }
    ]

    ui_prof_1 = {
        "_id": common_id,
        "profileName": "profile_1",
        "frequency": 10,
        "conditions": {
            "condition": "standard",
            "conditions": [],
            "field": "",
            "patterns": []
        },
        "varBinds": [{"component": "IF-MIB", "object": "ifInDiscards", "index": "1"},
                     {"component": "IF-MIB", "object": "", "index": ""},
                     {"component": "IF-MIB", "object": "ifOutErrors", "index": ""}],
        'profileInInventory': True,
    }

    ui_prof_2 = {
        "_id": common_id,
        "profileName": "profile_2",
        "frequency": 30,
        "conditions": {
            "condition": "smart",
            "conditions": [],
            "field": "SNMPv2-MIB.sysObjectID",
            "patterns": [{"pattern": "^MIKROTIK"}, {"pattern": "^MIKROTIK2"}]
        },
        "varBinds": [{"component": "IF-MIB", "object": "ifInDiscards", "index": "1"},
                     {"component": "IF-MIB", "object": "", "index": ""},
                     {"component": "IF-MIB", "object": "ifOutErrors", "index": ""}],
        'profileInInventory': True,
    }

    response = client.get('/profiles')

    assert response.json == [ui_prof_1, ui_prof_2]


@mock.patch("pymongo.collection.Collection.find")
def test_get_groups_list(m_client, client):
    common_id = "635916b2c8cb7a15f28af40a"

    page_groups = [
        {
            "_id": common_id,
            "group_1": [
                {"address": "1.2.3.4"}
            ]
        },
        {
            "_id": common_id,
            "group_2": [
                {"address": "1.2.3.4"}
            ]
        }
    ]

    # mongo_groups.find() is chained with .sort().skip().limit(), so its mocked return
    # value needs that chain pre-wired; the batched inventory "$in" lookup that follows
    # is a plain, un-chained find() call and is the second side effect.
    groups_cursor = mock.MagicMock()
    groups_cursor.sort.return_value.skip.return_value.limit.return_value = page_groups
    m_client.side_effect = [groups_cursor, [{"address": "group_2"}]]

    expected_groups = [
        {
            "_id": common_id,
            "groupName": "group_1",
            "groupInInventory": False
        },
        {
            "_id": common_id,
            "groupName": "group_2",
            "groupInInventory": True
        }
    ]

    response = client.get('/groups/1/50')

    assert response.json == expected_groups
    # Exactly one groups query and one *batched* inventory query, regardless of how many
    # groups are on the page - this is the fix for the 1+N query pattern.
    assert m_client.call_count == 2
    inventory_call = m_client.call_args_list[1]
    assert inventory_call.args == ({"address": {"$in": ["group_1", "group_2"]}, "delete": False}, {"address": 1, "_id": 0})


@mock.patch("pymongo.collection.Collection.count_documents")
def test_get_groups_count(m_client, client):
    m_client.return_value = 42
    response = client.get('/groups/count')
    assert response.json == 42


@mock.patch("pymongo.collection.Collection.find")
def test_get_devices_count_for_group(m_client, client):
    common_id = "635916b2c8cb7a15f28af40a"
    m_client.return_value = [
        {
            "_id": common_id,
            "group_1": [
                {"address": "1.2.3.4"},
                {"address": "1.2.3.4", "port": 1161},
                {"address": "11.0.78.114", "port": 161, "version": "2c", "community": "public"},
                {"address": "11.0.78.114", "port": 161, "version": "3", "secret": "my_secret",
                 "security_engine": "1234aabbccd"}
            ]
        }
    ]

    response = client.get(f'/group/{common_id}/devices/count')

    assert response.json == 4


@mock.patch("pymongo.collection.Collection.find")
def test_get_devices_of_group(m_client, client):
    common_id = "635916b2c8cb7a15f28af40a"
    m_client.return_value = [
        {
            "_id": common_id,
            "group_1": [
                {"address": "1.2.3.4"},
                {"address": "1.2.3.4", "port": 1161},
                {"address": "11.0.78.114", "port": 161, "version": "2c", "community": "public"},
                {"address": "11.0.78.114", "port": 161, "version": "3", "secret": "my_secret",
                 "security_engine": "1234aabbccd"},
                {"address": "0.0.0.0"},
                {"address": "1.1.1.1"},
                {"address": "2.2.2.2"},
                {"address": "3.3.3.3"}
            ]
        }
    ]

    first_result = [
        {
            "_id": f"{common_id}-0",
            "address": "1.2.3.4",
            "port": "",
            "version": "",
            "community": "",
            "secret": "",
            "securityEngine": "",
            "groupId": str(common_id)
        },
        {
            "_id": f"{common_id}-1",
            "address": "1.2.3.4",
            "port": "1161",
            "version": "",
            "community": "",
            "secret": "",
            "securityEngine": "",
            "groupId": str(common_id)
        },
        {
            "_id": f"{common_id}-2",
            "address": "11.0.78.114",
            "port": "161",
            "version": "2c",
            "community": "public",
            "secret": "",
            "securityEngine": "",
            "groupId": str(common_id)
        }
    ]

    second_result = [
        {
            "_id": f"{common_id}-3",
            "address": "11.0.78.114",
            "port": "161",
            "version": "3",
            "community": "",
            "secret": "my_secret",
            "securityEngine": "1234aabbccd",
            "groupId": str(common_id)
        },
        {
            "_id": f"{common_id}-4",
            "address": "0.0.0.0",
            "port": "",
            "version": "",
            "community": "",
            "secret": "",
            "securityEngine": "",
            "groupId": str(common_id)
        },
        {
            "_id": f"{common_id}-5",
            "address": "1.1.1.1",
            "port": "",
            "version": "",
            "community": "",
            "secret": "",
            "securityEngine": "",
            "groupId": str(common_id)
        },
    ]

    third_result = [
        {
            "_id": f"{common_id}-6",
            "address": "2.2.2.2",
            "port": "",
            "version": "",
            "community": "",
            "secret": "",
            "securityEngine": "",
            "groupId": str(common_id)
        },
        {
            "_id": f"{common_id}-7",
            "address": "3.3.3.3",
            "port": "",
            "version": "",
            "community": "",
            "secret": "",
            "securityEngine": "",
            "groupId": str(common_id)
        }
    ]

    response = client.get(f'/group/{common_id}/devices/1/3')
    assert response.json == first_result

    response = client.get(f'/group/{common_id}/devices/2/3')
    assert response.json == second_result

    response = client.get(f'/group/{common_id}/devices/3/3')
    assert response.json == third_result


@mock.patch("SC4SNMP_UI_backend.common.inventory_utils.mongo_groups")
@mock.patch("pymongo.cursor.Cursor.limit")
def test_get_inventory_list(m_cursor, m_groups, client):
    common_id = "635916b2c8cb7a15f28af40a"

    m_cursor.side_effect = [
        [
            {
                "_id": common_id,
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
            },
            {
                "_id": common_id,
                "address": "group_1",
                "port": 1161,
                "version": "2c",
                "community": "public",
                "secret": "",
                "walk_interval": 1900,
                "security_engine": "",
                "profiles": "prof3",
                "smart_profiles": True,
                "delete": False
            }
        ],
        [
            {
                "_id": common_id,
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
        ]
    ]

    # get_inventory_types_bulk runs one groups_ui "$or" query per page instead of one
    # get_inventory_type call per row - mock that query's result per page.
    m_groups.find.side_effect = [
        [{"_id": common_id, "group_1": [{"address": "1.2.3.4"}]}],
        [{"_id": common_id, "group_2": [{"address": "1.2.3.4"}]}],
    ]

    first_result = [
        {
            "_id": common_id,
            "inventoryType": "Host",
            "address": "11.0.78.114",
            "port": "161",
            "version": "3",
            "community": "",
            "secret": "my_secret",
            "walkInterval": 1800,
            "securityEngine": "1234aabbccd",
            "profiles": ["prof1", "prof2", "prof3"],
            "smartProfiles": False,
            "maxOidToProcess": ""
        },
        {
            "_id": common_id,
            "inventoryType": "Group",
            "address": "group_1",
            "port": "1161",
            "version": "2c",
            "community": "public",
            "secret": "",
            "walkInterval": 1900,
            "securityEngine": "",
            "profiles": ["prof3"],
            "smartProfiles": True,
            "maxOidToProcess": ""
        }
    ]

    second_result = [
        {
            "_id": common_id,
            "inventoryType": "Group",
            "address": "group_2",
            "port": "161",
            "version": "3",
            "community": "",
            "secret": "my_secret",
            "walkInterval": 1800,
            "securityEngine": "1234aabbccd",
            "profiles": ["prof1", "prof2", "prof3"],
            "smartProfiles": False,
            "maxOidToProcess": ""
        },
    ]

    response = client.get('/inventory/1/2')
    assert response.json == first_result
    # One groups_ui query for the whole 2-row page, not one per row.
    assert m_groups.find.call_count == 1

    response = client.get('/inventory/2/2')
    assert response.json == second_result
    assert m_groups.find.call_count == 2


@mock.patch("pymongo.collection.Collection.count_documents")
def test_get_inventory_count(m_client, client):
    pass
    m_client.return_value = 3
    response = client.get('/inventory/count')
    assert response.json == 3
