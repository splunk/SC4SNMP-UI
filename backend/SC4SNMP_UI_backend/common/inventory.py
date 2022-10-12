from SC4SNMP_UI_backend.common.conversions import InventoryConversion, get_group_name_from_backend


class InventoryProcessing:
    def __init__(self, conversion: InventoryConversion, db):
        self._inventory_ui = []
        self._groups_backend = {}
        self._groups_inventory = {}
        self._conversion = conversion
        self._db = db

    def read_from_backend(self):
        groups_query = list(self._db.groups.find({}))

        for group_from_query in groups_query:
            gr_name = get_group_name_from_backend(group_from_query)

            # self.groups_backend stores all fields except port, that were overwritten by group device config
            self._groups_backend[gr_name] = {}
            for device in group_from_query[gr_name]:
                port = device['port'] if 'port' in device.keys() else ""
                new_device = {
                    f"{device['address']}:{port}": {key: value for key, value in device.items() if key != 'address' and key != 'port'}
                }
                self._groups_backend[gr_name].update(new_device)

        inventory_backend = list(self._db.inventory.find({}))
        self._inventory_ui = []
        for record in inventory_backend:
            self._process_inventory_line(record)
        for group_in_record in self._groups_inventory.values():
            converted = self._conversion.backend2ui(group_in_record)
            self._inventory_ui.append(converted)
        return self._inventory_ui

    def _process_inventory_line(self, record: dict):
        if record["group"] is None:
            converted = self._conversion.backend2ui(record)
            self._inventory_ui.append(converted)
        else:
            self._gather_group(record)

    def _gather_group(self, record: dict):
        group_name = record["group"]
        try:
            group = self._groups_backend[group_name]
        except KeyError:
            #TODO: if group was deleted from groups, delete it from inventory
            return None

        if f"{record['address']}:{record['port']}" in group:
            device_key = f"{record['address']}:{record['port']}"
            port = False
        else:
            device_key = f"{record['address']}:"
            port = record['port']

        community = record['community'] if 'community' not in group[device_key].keys() else False
        secret = record['secret'] if 'secret' not in group[device_key].keys() else False
        version = record['version'] if 'version' not in group[device_key].keys() else False
        security_engine = record['security_engine'] if 'security_engine' not in group[device_key].keys() else False

        if group_name not in self._groups_inventory.keys():
            inventory_data = {
                '_id': record["_id"],
                'address': group_name,
                'port': port if port is not False else 161,
                'version': version if version is not False else "2c",
                'community': community if community is not False else None,
                'secret': secret if secret is not False else None,
                'security_engine': security_engine if security_engine is not False else None,
                'walk_interval': record['walk_interval'],
                'profiles': record['profiles'],
                'smart_profiles': record['smart_profiles'],
                'group': record['group'],
                'delete': record['delete']
            }
            self._groups_inventory[group_name] = inventory_data
        else:
            if port is not False:
                self._groups_inventory[group_name]['port'] = port
            if community is not False:
                self._groups_inventory[group_name]['community'] = community
            if secret is not False:
                self._groups_inventory[group_name]['secret'] = secret
            if version is not False:
                self._groups_inventory[group_name]['version'] = version
            if security_engine is not False:
                self._groups_inventory[group_name]['security_engine'] = security_engine


