from unittest import TestCase
from SC4SNMP_UI_backend.common.backend_ui_conversions import ProfileConversion, GroupConversion, GroupDeviceConversion, \
    InventoryConversion
from bson import ObjectId

profile_conversion = ProfileConversion()
group_conversion = GroupConversion()
group_device_conversion = GroupDeviceConversion()
inventory_conversion = InventoryConversion()


class TestConversions(TestCase):

    @classmethod
    def setUpClass(cls):
        cls.maxDiff = None
        common_id = "635916b2c8cb7a15f28af40a"

        cls.ui_prof_1 = {
            "_id": common_id,
            "profileName": "profile_1",
            "frequency": 10,
            "conditions": {
                "condition": "standard",
                "field": "",
                "patterns": [],
                "conditions": []
            },
            "varBinds": [{"component": "IF-MIB", "object": "ifInDiscards", "index": "1.test.2"},
                         {"component": "IF-MIB", "object": "ifInDiscards", "index": "1"},
                         {"component": "IF-MIB", "object": "", "index": ""},
                         {"component": "IF-MIB", "object": "ifOutErrors", "index": ""}],
            "profileInInventory": True
        }

        cls.ui_prof_2 = {
            "_id": common_id,
            "profileName": "profile_2",
            "frequency": 20,
            "conditions": {
                "condition": "base",
                "field": "",
                "patterns": [],
                "conditions": []
            },
            "varBinds": [{"component": "IF-MIB", "object": "ifInDiscards", "index": "1"},
                         {"component": "IF-MIB", "object": "", "index": ""},
                         {"component": "IF-MIB", "object": "ifOutErrors", "index": ""}],
            "profileInInventory": False
        }

        cls.ui_prof_3 = {
            "_id": common_id,
            "profileName": "profile_3",
            "frequency": 30,
            "conditions": {
                "condition": "smart",
                "field": "SNMPv2-MIB.sysObjectID",
                "patterns": [{"pattern": "^MIKROTIK"}, {"pattern": "^MIKROTIK2"}],
                "conditions": []
            },
            "varBinds": [{"component": "IF-MIB", "object": "ifInDiscards", "index": "1"},
                         {"component": "IF-MIB", "object": "", "index": ""},
                         {"component": "IF-MIB", "object": "ifOutErrors", "index": ""}],
            "profileInInventory": True
        }

        cls.ui_prof_4 = {
            "_id": common_id,
            "profileName": "profile_4",
            "frequency": 30,
            "conditions": {
                "condition": "conditional",
                "field": "",
                "patterns": [],
                "conditions": [
                    {"field": "field: IF-MIB.ifAdminStatus", "operation": "in", "value":["0", "down"], 'negateOperation': False,},
                    {"field": "field: IF-MIB.ifOperStatus", "operation": "equals", "value": ["up"], 'negateOperation': True,},
                    {"field": "field: IF-MIB.ifIndex", "operation": "less than", "value": ["3"], 'negateOperation': False,},
                    {"field": "field: IF-MIB.ifIndex", "operation": "greater than", "value": ["5"], 'negateOperation': True,}
                ]
            },
            "varBinds": [{"component": "IF-MIB", "object": "ifInDiscards", "index": "1"},
                         {"component": "IF-MIB", "object": "", "index": ""},
                         {"component": "IF-MIB", "object": "ifOutErrors", "index": ""}],
            "profileInInventory": False
        }

        cls.backend_prof_1 = {
            "_id": ObjectId(common_id),
            "profile_1": {
                "frequency": 10,
                "varBinds": [["IF-MIB", "ifInDiscards", "1", "test", "2"],
                             ["IF-MIB", "ifInDiscards", "1"],
                             ["IF-MIB"],
                             ["IF-MIB", "ifOutErrors"]]
            }
        }

        cls.backend_prof_2 = {
            "_id": ObjectId(common_id),
            "profile_2": {
                "frequency": 20,
                "condition": {"type": "base"},
                "varBinds": [["IF-MIB", "ifInDiscards", "1"], ["IF-MIB"], ["IF-MIB", "ifOutErrors"]]
            }
        }

        cls.backend_prof_3 = {
            "_id": ObjectId(common_id),
            "profile_3": {
                "frequency": 30,
                "condition": {"type": "field",
                              "field": "SNMPv2-MIB.sysObjectID",
                              "patterns": ["^MIKROTIK", "^MIKROTIK2"]},
                "varBinds": [["IF-MIB", "ifInDiscards", "1"], ["IF-MIB"], ["IF-MIB", "ifOutErrors"]]
            }
        }

        cls.backend_prof_4 = {
            "_id": ObjectId(common_id),
            "profile_4": {
                "frequency": 30,
                "conditions": [
                    {"field": "field: IF-MIB.ifAdminStatus", "operation": "in", "value": [0, "down"]},
                    {"field": "field: IF-MIB.ifOperStatus", "operation": "equals", "value": "up", 'negate_operation': True},
                    {"field": "field: IF-MIB.ifIndex", "operation": "lt", "value": 3},
                    {"field": "field: IF-MIB.ifIndex", "operation": "gt", "value": 5, 'negate_operation': True}
                ],
                "varBinds": [["IF-MIB", "ifInDiscards", "1"], ["IF-MIB"], ["IF-MIB", "ifOutErrors"]]
            }
        }

        cls.backend_group = {
            "_id": ObjectId(common_id),
            "group_1": [
                {"address": "1.2.3.4"},
                {"address": "1.2.3.4", "port": 1161},
                {"address": "11.0.78.114", "port": 161, "version": "2c", "community": "public"},
                {"address": "11.0.78.114", "port": 161, "version": "3", "secret": "my_secret", "security_engine": "1234aabbccd"}
            ]
        }

        cls.ui_group = {
            "_id": common_id,
            "groupName": "group_1",
            "groupInInventory": False
        }

        cls.ui_group_device_1 = {
            "_id": f"{common_id}-0",
            "address": "1.2.3.4",
            "port": "",
            "version": "",
            "community": "",
            "secret": "",
            "securityEngine": "",
            "groupId": str(common_id)
        }

        cls.ui_group_device_2 = {
            "_id": f"{common_id}-1",
            "address": "1.2.3.4",
            "port": "1161",
            "version": "",
            "community": "",
            "secret": "",
            "securityEngine": "",
            "groupId": str(common_id)
        }

        cls.ui_group_device_3 = {
            "_id": f"{common_id}-2",
            "address": "11.0.78.114",
            "port": "161",
            "version": "2c",
            "community": "public",
            "secret": "",
            "securityEngine": "",
            "groupId": str(common_id)
        }

        cls.ui_group_device_4 = {
            "_id": f"{common_id}-3",
            "address": "11.0.78.114",
            "port": "161",
            "version": "3",
            "community": "",
            "secret": "my_secret",
            "securityEngine": "1234aabbccd",
            "groupId": str(common_id)
        }

        cls.backend_inventory_1 = {
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
        }

        cls.ui_inventory_1 = {
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
            "smartProfiles": False
        }

        cls.backend_inventory_2 = {
            "_id": ObjectId(common_id),
            "address": "group_1",
            "port": 1161,
            "version": "2c",
            "community": "public",
            "secret": "",
            "walk_interval": 1900,
            "security_engine": "",
            "profiles": "prof3",
            "smart_profiles": True,
            "delete": True
        }

        cls.ui_inventory_2 = {
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
            "smartProfiles": True
        }

    def test_profile_backend_to_ui(self):
        self.assertDictEqual(profile_conversion.backend2ui(self.backend_prof_1, profile_in_inventory=True), self.ui_prof_1)
        self.assertDictEqual(profile_conversion.backend2ui(self.backend_prof_2, profile_in_inventory=False), self.ui_prof_2)
        self.assertDictEqual(profile_conversion.backend2ui(self.backend_prof_3, profile_in_inventory=True), self.ui_prof_3)
        self.assertDictEqual(profile_conversion.backend2ui(self.backend_prof_4, profile_in_inventory=False), self.ui_prof_4)

    def test_profile_ui_to_backend(self):
        back_pr1 = self.backend_prof_1
        del back_pr1["_id"]

        back_pr2 = self.backend_prof_2
        del back_pr2["_id"]

        back_pr3 = self.backend_prof_3
        del back_pr3["_id"]

        back_pr4 = self.backend_prof_4
        del back_pr4["_id"]

        self.assertDictEqual(profile_conversion.ui2backend(self.ui_prof_1), back_pr1)
        self.assertDictEqual(profile_conversion.ui2backend(self.ui_prof_2), back_pr2)
        self.assertDictEqual(profile_conversion.ui2backend(self.ui_prof_3), back_pr3)
        self.assertDictEqual(profile_conversion.ui2backend(self.ui_prof_4), back_pr4)

    def test_group_backend_to_ui(self):
        self.assertDictEqual(group_conversion.backend2ui(self.backend_group, group_in_inventory=False), self.ui_group)

    def test_group_ui_to_backend(self):
        new_group_from_ui = {
            "groupName": "group_1"
        }
        expected = {
            "group_1": []
        }
        self.assertDictEqual(group_conversion.ui2backend(new_group_from_ui), expected)

    def test_group_device_backend_to_ui(self):
        device = self.backend_group["group_1"][0]
        group_id = self.backend_group["_id"]
        self.assertDictEqual(group_device_conversion.backend2ui(device, group_id=group_id, device_id=0),
                             self.ui_group_device_1)

        device = self.backend_group["group_1"][1]
        group_id = self.backend_group["_id"]
        self.assertDictEqual(group_device_conversion.backend2ui(device, group_id=group_id, device_id=1),
                             self.ui_group_device_2)

        device = self.backend_group["group_1"][2]
        group_id = self.backend_group["_id"]
        self.assertDictEqual(group_device_conversion.backend2ui(device, group_id=group_id, device_id=2),
                             self.ui_group_device_3)

        device = self.backend_group["group_1"][3]
        group_id = self.backend_group["_id"]
        self.assertDictEqual(group_device_conversion.backend2ui(device, group_id=group_id, device_id=3),
                             self.ui_group_device_4)

        self.assertRaises(ValueError, group_device_conversion.backend2ui, device, group_id=group_id)
        self.assertRaises(ValueError, group_device_conversion.backend2ui, device, device_id=3)
        self.assertRaises(ValueError, group_device_conversion.backend2ui, device)

    def test_group_device_ui_to_backend(self):
        device = self.backend_group["group_1"][0]
        self.assertDictEqual(group_device_conversion.ui2backend(self.ui_group_device_1), device)

        device = self.backend_group["group_1"][1]
        self.assertDictEqual(group_device_conversion.ui2backend(self.ui_group_device_2), device)

        device = self.backend_group["group_1"][2]
        self.assertDictEqual(group_device_conversion.ui2backend(self.ui_group_device_3), device)

        device = self.backend_group["group_1"][3]
        self.assertDictEqual(group_device_conversion.ui2backend(self.ui_group_device_4), device)

    def test_inventory_backend_to_ui(self):
        self.assertDictEqual(inventory_conversion.backend2ui(self.backend_inventory_1, inventory_type="Host"), self.ui_inventory_1)
        self.assertDictEqual(inventory_conversion.backend2ui(self.backend_inventory_2, inventory_type="Group"), self.ui_inventory_2)

    def test_inventory_ui_to_backend(self):
        back_inv = self.backend_inventory_1
        del back_inv["_id"]
        self.assertDictEqual(inventory_conversion.ui2backend(self.ui_inventory_1, delete=False), back_inv)

        back_inv = self.backend_inventory_2
        del back_inv["_id"]
        self.assertDictEqual(inventory_conversion.ui2backend(self.ui_inventory_2, delete=True), back_inv)

        self.assertRaises(ValueError, inventory_conversion.ui2backend, self.ui_inventory_1)
