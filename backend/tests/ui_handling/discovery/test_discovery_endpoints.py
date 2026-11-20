from unittest import mock
from unittest.mock import call

import pytest
from bson import ObjectId
from pymongo.errors import DuplicateKeyError

entry_id = "635916b2c8cb7a15f28af40a"

valid_payload = {
    "name": "office-lan",
    "networkAddress": "10.0.0.0/24",
    "version": "2c",
    "port": "161",
    "community": "public",
    "secret": "",
    "securityEngine": "",
    "frequency": "86400",
    "deleteAlreadyDiscovered": False,
    "deviceRules": [
        {"name": "routers", "patterns": "*Cisco IOS*", "group": "routers"},
        {"name": "linux", "patterns": "*Linux*", "group": "linux-hosts"},
    ],
}

stored_document = {
    "_id": ObjectId(entry_id),
    "name": "office-lan",
    "network_address": "10.0.0.0/24",
    "version": "2c",
    "port": 161,
    "community": "public",
    "secret": "",
    "security_engine": "",
    "frequency": 86400,
    "delete_already_discovered": False,
    "device_rules": valid_payload["deviceRules"],
}


@pytest.fixture()
def collections():
    """Mocks the collection methods used by the discovery routes."""
    with mock.patch("pymongo.collection.Collection.find", autospec=True, return_value=[]) as find, \
            mock.patch("pymongo.collection.Collection.find_one", autospec=True, return_value=None) as find_one, \
            mock.patch("pymongo.collection.Collection.insert_one", autospec=True) as insert_one, \
            mock.patch("pymongo.collection.Collection.update_one", autospec=True) as update_one, \
            mock.patch("pymongo.collection.Collection.delete_one", autospec=True) as delete_one, \
            mock.patch("pymongo.collection.Collection.create_index", autospec=True) as create_index, \
            mock.patch("pymongo.collection.Collection.count_documents", autospec=True, return_value=0) as count:
        yield mock.Mock(find=find, find_one=find_one, insert_one=insert_one, update_one=update_one,
                        delete_one=delete_one, create_index=create_index, count_documents=count)


def test_get_count(client, collections):
    collections.count_documents.return_value = 3
    assert client.get("/discovery/count").json == 3


def test_get_list_converts_documents_to_ui_format(client, collections):
    cursor = mock.MagicMock()
    cursor.sort.return_value.skip.return_value.limit.return_value = [stored_document]
    collections.find.return_value = cursor

    response = client.get("/discovery/1/10")

    assert response.json == [{
        "_id": entry_id, "name": "office-lan", "networkAddress": "10.0.0.0/24", "version": "2c", "port": "161",
        "community": "public", "secret": "", "securityEngine": "", "frequency": "86400",
        "deleteAlreadyDiscovered": False, "deviceRules": valid_payload["deviceRules"],
    }]
    cursor.sort.return_value.skip.assert_called_once_with(0)


def test_add_entry_success_marks_discovery_dirty(client, collections, mark_dirty):
    response = client.post("/discovery/add", json=valid_payload)

    assert response.status_code == 200
    assert response.json == "success" or "do not currently exist" in response.json["message"]
    inserted = collections.insert_one.call_args.args[1]
    assert inserted["name"] == "office-lan"
    assert inserted["port"] == 161 and inserted["frequency"] == 86400
    # rule order is preserved
    assert [rule["name"] for rule in inserted["device_rules"]] == ["routers", "linux"]
    mark_dirty.assert_called_once_with("discovery")
    collections.create_index.assert_called_once()


def test_add_entry_warns_about_missing_groups_but_saves(client, collections):
    response = client.post("/discovery/add", json=valid_payload)

    assert response.status_code == 200
    assert "linux-hosts" in response.json["message"] and "routers" in response.json["message"]
    assert collections.insert_one.called


def test_add_entry_no_warning_when_groups_exist(client, collections):
    collections.find.return_value = [{"_id": ObjectId(entry_id), "routers": [], "linux-hosts": []}]

    response = client.post("/discovery/add", json=valid_payload)

    assert response.json == "success"


@pytest.mark.parametrize("changes, message", [
    ({"name": ""}, "Name is required"),
    ({"name": "1lan"}, "cannot start with a digit"),
    ({"name": "my lan"}, "cannot start with a digit or contain spaces"),
    ({"name": "my;lan"}, "cannot start with a digit or contain spaces or semicolons"),
    ({"networkAddress": "10.0.0.0"}, "valid IPv4 or IPv6 CIDR"),
    ({"networkAddress": "300.0.0.0/24"}, "valid IPv4 or IPv6 CIDR"),
    ({"version": "4"}, "SNMP version"),
    ({"port": "0"}, "between 1 and 65535"),
    ({"port": "65536"}, "between 1 and 65535"),
    ({"port": "abc"}, "must be integers"),
    ({"frequency": "21599"}, "at least 21600"),
    ({"version": "3", "secret": ""}, "secret is required"),
    ({"community": ""}, "community string is required"),
    ({"community": "bad community"}, "Community contains unsupported"),
    ({"securityEngine": "xyz"}, "10 to 64 hexadecimal"),
    ({"deviceRules": [{"name": "r", "patterns": "", "group": "g"}]}, "requires a name, pattern, and group"),
])
def test_add_entry_validation(client, collections, mark_dirty, changes, message):
    response = client.post("/discovery/add", json={**valid_payload, **changes})

    assert response.status_code == 400
    assert message in response.json["message"]
    assert not collections.insert_one.called
    assert not mark_dirty.called


def test_add_entry_rejects_duplicate_name(client, collections):
    collections.find_one.return_value = stored_document

    response = client.post("/discovery/add", json=valid_payload)

    assert response.status_code == 400
    assert "already exists" in response.json["message"]


def test_add_entry_duplicate_key_race_returns_400(client, collections, mark_dirty):
    collections.insert_one.side_effect = DuplicateKeyError("duplicate")

    response = client.post("/discovery/add", json=valid_payload)

    assert response.status_code == 400
    assert "already exists" in response.json["message"]
    assert not mark_dirty.called


def test_update_entry_success(client, collections, mark_dirty):
    collections.find_one.side_effect = [None, stored_document]  # duplicate check, existing entry

    response = client.post(f"/discovery/update/{entry_id}", json={**valid_payload, "port": "1161"})

    assert response.status_code == 200
    update_call = collections.update_one.call_args
    assert update_call.args[1] == {"_id": ObjectId(entry_id)}
    assert update_call.args[2]["$set"]["port"] == 1161
    mark_dirty.assert_called_once_with("discovery")


def test_update_entry_cannot_rename(client, collections):
    collections.find_one.side_effect = [None, {**stored_document, "name": "other-name"}]

    response = client.post(f"/discovery/update/{entry_id}", json=valid_payload)

    assert response.status_code == 400
    assert "cannot be changed" in response.json["message"]
    assert not collections.update_one.called


def test_update_entry_not_found(client, collections):
    collections.find_one.side_effect = [None, None]

    response = client.post(f"/discovery/update/{entry_id}", json=valid_payload)

    assert response.status_code == 404


def test_update_with_invalid_id_returns_404(client, collections):
    response = client.post("/discovery/update/not-an-object-id", json=valid_payload)

    assert response.status_code == 404


def test_delete_entry(client, collections, mark_dirty):
    collections.delete_one.return_value.deleted_count = 1

    response = client.post(f"/discovery/delete/{entry_id}")

    assert response.status_code == 200
    assert collections.delete_one.call_args.args[1] == {"_id": ObjectId(entry_id)}
    mark_dirty.assert_called_once_with("discovery")


def test_delete_entry_not_found(client, collections, mark_dirty):
    collections.delete_one.return_value.deleted_count = 0

    response = client.post(f"/discovery/delete/{entry_id}")

    assert response.status_code == 404
    assert not mark_dirty.called


def test_delete_with_invalid_id_returns_404(client, collections):
    assert client.post("/discovery/delete/xyz").status_code == 404


def test_group_names_endpoint(client, collections):
    collections.find.return_value = [
        {"_id": ObjectId(entry_id), "routers": [{"address": "1.1.1.1"}]},
        {"_id": ObjectId(entry_id), "linux-hosts": []},
        {"_id": ObjectId(entry_id), "routers": []},
    ]

    assert client.get("/groups/names").json == ["linux-hosts", "routers"]


@pytest.mark.parametrize("available", [True, False])
def test_discovery_status_reflects_job_availability(client, available):
    with mock.patch("SC4SNMP_UI_backend.discovery.routes.job_available", return_value=available) as m_available:
        response = client.get("/discovery/status")

    assert response.json == {"enabled": available}
    m_available.assert_called_once_with("discovery")
