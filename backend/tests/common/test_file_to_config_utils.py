import os
from unittest import TestCase

import ruamel.yaml
import yaml as pyyaml

from SC4SNMP_UI_backend.common.file_to_config_utils import (
    groups_yaml_to_documents,
    profiles_yaml_to_documents,
    inventory_csv_to_documents,
)
from SC4SNMP_UI_backend.apply_changes.config_to_yaml_utils import (
    GroupsToYamlDictConversion,
    ProfilesToYamlDictConversion,
    InventoryToYamlDictConversion,
)

REFERENCE_FILES_DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                          "../yamls_for_tests/reference_files")

# Same fixtures as tests/ui_handling/post_endpoints/test_post_apply_changes.py, without
# "_id" since the inverse conversions never produce one - Mongo assigns it on insert.
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
    {
        "single_metric": {
            "frequency": 60,
            "varBinds": [['IF-MIB', 'ifMtu', '1']]
        }
    },
    {
        "small_walk": {
            "condition": {
                "type": "walk"
            },
            "varBinds": [['IP-MIB'], ['IF-MIB']]
        }
    },
    {
        "gt_profile": {
            "frequency": 10,
            "conditions": [
                {"field": "IF-MIB.ifIndex", "operation": "gt", "value": 1}
            ],
            "varBinds": [['IF-MIB', 'ifOutDiscards']]
        }
    },
    {
        "lt_profile": {
            "frequency": 10,
            "conditions": [
                {"field": "IF-MIB.ifIndex", "operation": "lt", "value": 2}
            ],
            "varBinds": [['IF-MIB', 'ifOutDiscards']]
        }
    },
    {
        "in_profile": {
            "frequency": 10,
            "conditions": [
                {"field": "IF-MIB.ifDescr", "operation": "in", "value": ["eth0", "test value"]}
            ],
            "varBinds": [['IF-MIB', 'ifOutDiscards']]
        }
    },
    {
        "multiple_conditions": {
            "frequency": 10,
            "conditions": [
                {"field": "IF-MIB.ifIndex", "operation": "gt", "value": 1},
                {"field": "IF-MIB.ifDescr", "operation": "in", "value": ["eth0", "test value"]}
            ],
            "varBinds": [['IF-MIB', 'ifOutDiscards'], ['IF-MIB', 'ifOutErrors'], ['IF-MIB', 'ifOutOctets']]
        }
    }
]

inventory_collection_no_id = [
    {
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


class TestFileToConfigUtils(TestCase):

    @classmethod
    def setUpClass(cls):
        cls.maxDiff = None

    def test_groups_yaml_to_documents(self):
        with open(os.path.join(REFERENCE_FILES_DIRECTORY, "scheduler_groups.yaml"), "r") as file:
            groups_dict = pyyaml.safe_load(file)
        documents = groups_yaml_to_documents(groups_dict)
        self.assertEqual(documents, groups_collection_no_id)

    def test_profiles_yaml_to_documents(self):
        with open(os.path.join(REFERENCE_FILES_DIRECTORY, "scheduler_profiles.yaml"), "r") as file:
            profiles_dict = pyyaml.safe_load(file)
        documents = profiles_yaml_to_documents(profiles_dict)
        self.assertEqual(documents, profiles_collection_no_id)

    def test_inventory_csv_to_documents(self):
        with open(os.path.join(REFERENCE_FILES_DIRECTORY, "poller_inventory.yaml"), "r") as file:
            inventory_dict = pyyaml.safe_load(file)
        documents = inventory_csv_to_documents(inventory_dict["inventory"])
        self.assertEqual(documents, inventory_collection_no_id)

    def test_inventory_csv_to_documents_skips_commented_and_blank_rows(self):
        csv_string = (
            "address,port,version,community,secret,security_engine,walk_interval,profiles,smart_profiles,delete\n"
            "1.1.1.1,161,2c,public,,,1800,small_walk,t,f\n"
            "#commented_out,161,2c,public,,,1800,small_walk,t,f\n"
        )
        documents = inventory_csv_to_documents(csv_string)
        self.assertEqual(len(documents), 1)
        self.assertEqual(documents[0]["address"], "1.1.1.1")

    def test_inventory_csv_to_documents_empty_string(self):
        self.assertEqual(inventory_csv_to_documents(""), [])
        self.assertEqual(inventory_csv_to_documents(None), [])

    def test_groups_yaml_to_documents_empty(self):
        self.assertEqual(groups_yaml_to_documents({}), [])
        self.assertEqual(groups_yaml_to_documents(None), [])

    def test_profiles_yaml_to_documents_empty(self):
        self.assertEqual(profiles_yaml_to_documents({}), [])
        self.assertEqual(profiles_yaml_to_documents(None), [])

    def test_round_trip_groups(self):
        """
        Forward-convert the groups_collection fixture with the existing Mongo->YAML
        conversion, dump it exactly as SaveConfigToFileHandler/GroupsTempHandling do,
        then read it back with the new inverse conversion and assert the original
        documents are recovered. Proves forward and inverse are true inverses and
        would catch any ruamel scalar-string/CommentedMap leakage into Mongo.
        """
        yaml_dict = GroupsToYamlDictConversion().convert([dict(d) for d in groups_collection_no_id])
        yaml = ruamel.yaml.YAML()
        import io
        buffer = io.StringIO()
        yaml.dump(yaml_dict, buffer)
        buffer.seek(0)
        round_tripped = pyyaml.safe_load(buffer)
        self.assertEqual(groups_yaml_to_documents(round_tripped), groups_collection_no_id)

    def test_round_trip_profiles(self):
        yaml_dict = ProfilesToYamlDictConversion().convert([dict(d) for d in profiles_collection_no_id])
        yaml = ruamel.yaml.YAML()
        import io
        buffer = io.StringIO()
        yaml.dump(yaml_dict, buffer)
        buffer.seek(0)
        round_tripped = pyyaml.safe_load(buffer)
        self.assertEqual(profiles_yaml_to_documents(round_tripped), profiles_collection_no_id)

    def test_round_trip_inventory(self):
        yaml_dict = InventoryToYamlDictConversion().convert([dict(d) for d in inventory_collection_no_id])
        yaml = ruamel.yaml.YAML()
        import io
        buffer = io.StringIO()
        yaml.dump(yaml_dict, buffer)
        buffer.seek(0)
        round_tripped = pyyaml.safe_load(buffer)
        self.assertEqual(inventory_csv_to_documents(round_tripped["inventory"]), inventory_collection_no_id)
