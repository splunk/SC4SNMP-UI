from bson import ObjectId

from SC4SNMP_UI_backend.apply_changes.config_to_yaml_utils import DiscoveryToYamlDictConversion, DiscoveryTempHandling
from SC4SNMP_UI_backend.common.backend_ui_conversions import DiscoveryConversion
from SC4SNMP_UI_backend.common.file_to_config_utils import discovery_yaml_to_documents

ui_entry = {
    "name": "office-lan",
    "networkAddress": " 10.0.0.0/24 ",
    "version": "3",
    "port": "1161",
    "community": "",
    "secret": "my-secret",
    "securityEngine": "aabbccdd1234",
    "frequency": "43200",
    "deleteAlreadyDiscovered": "true",
    "deviceRules": [
        {"name": "second", "patterns": "*b*", "group": "g2"},
        {"name": "first", "patterns": "*a*", "group": "g1"},
    ],
}

backend_entry = {
    "name": "office-lan",
    "network_address": "10.0.0.0/24",
    "version": "3",
    "port": 1161,
    "community": "",
    "secret": "my-secret",
    "security_engine": "aabbccdd1234",
    "frequency": 43200,
    "delete_already_discovered": True,
    "device_rules": ui_entry["deviceRules"],
}


def test_ui2backend():
    assert DiscoveryConversion().ui2backend(ui_entry) == backend_entry


def test_ui2backend_defaults_and_empty_rules():
    result = DiscoveryConversion().ui2backend({"name": "n", "networkAddress": "10.0.0.0/8"})
    assert result["version"] == "2c" and result["port"] == 161 and result["frequency"] == 86400
    assert result["delete_already_discovered"] is False
    assert result["device_rules"] is None


def test_backend2ui_round_trip_keeps_rule_order():
    document = {**backend_entry, "_id": ObjectId("635916b2c8cb7a15f28af40a")}
    ui = DiscoveryConversion().backend2ui(document)
    assert ui["_id"] == "635916b2c8cb7a15f28af40a"
    assert ui["port"] == "1161" and ui["frequency"] == "43200"
    assert ui["deleteAlreadyDiscovered"] is True
    assert [rule["name"] for rule in ui["deviceRules"]] == ["second", "first"]


def test_backend2ui_handles_documents_seeded_by_the_connector():
    ui = DiscoveryConversion().backend2ui({"_id": ObjectId("635916b2c8cb7a15f28af40a"), "name": "n",
                                           "network_address": "10.0.0.0/8", "port": None, "community": None})
    assert ui["community"] == "" and ui["deviceRules"] == []


def test_mongo_to_yaml_mapping_is_keyed_by_name():
    result = DiscoveryToYamlDictConversion().convert([backend_entry])
    entry = result["office-lan"]
    assert entry["network_address"] == "10.0.0.0/24"
    assert entry["version"] == "3" and entry["port"] == 1161 and entry["frequency"] == 43200
    assert entry["delete_already_discovered"] is True
    # empty community is omitted, secret and rules are kept in order
    assert "community" not in entry and entry["secret"] == "my-secret"
    assert [rule["name"] for rule in entry["device_rules"]] == ["second", "first"]


def test_temp_handling_returns_mapping_not_string(tmp_path):
    converted = DiscoveryToYamlDictConversion().convert([backend_entry])
    path = tmp_path / "discovery.yaml"

    parsed = DiscoveryTempHandling(str(path)).parse_dict_to_yaml(converted, delete_tmp=False)

    assert isinstance(parsed, dict) and not isinstance(parsed, str)
    assert path.exists()


def test_yaml_round_trip_through_section_file(tmp_path):
    import yaml
    converted = DiscoveryToYamlDictConversion().convert([backend_entry])
    path = tmp_path / "discovery.yaml"
    DiscoveryTempHandling(str(path)).parse_dict_to_yaml(converted, delete_tmp=False)

    documents = discovery_yaml_to_documents(yaml.safe_load(path.read_text()))

    assert documents == [{**backend_entry, "community": ""}]


def test_discovery_yaml_to_documents_normalises_missing_values():
    documents = discovery_yaml_to_documents({
        "minimal": {"network_address": "10.0.0.0/24", "port": None, "frequency": None, "version": None,
                    "device_rules": []},
        "skipped": "not-a-mapping",
    })
    assert documents == [{
        "name": "minimal", "network_address": "10.0.0.0/24", "version": "2c", "port": 161, "community": "",
        "secret": "", "security_engine": "", "frequency": 86400, "delete_already_discovered": False,
        "device_rules": None,
    }]


def test_discovery_yaml_to_documents_empty():
    assert discovery_yaml_to_documents(None) == []
    assert discovery_yaml_to_documents({}) == []
