from SC4SNMP_UI_backend.common.conversions import InventoryConversion, ProfileConversion, get_group_name_from_backend, \
    camel_case2snake_case, snake_case2camel_case

# TODO: When someone updates devices in group then update inventory collection
class InventoryProcessing:
    def __init__(self, conversion: InventoryConversion, mongo_client):
        self._inventory_ui = []
        self._groups_backend = {}  # _groups_backend stores all fields except port,
        # that were overwritten by group device config.

        self._groups_ui = {}  # _groups_ui stores field values that will be
        # shown in the inventory ui for each group

        self._conversion = conversion
        self._mongo_client = mongo_client
        self._db = mongo_client.sc4snmp

        self._device_in_group_fields_ui = {
            'port': None,
            'version': None,
            'community': None,
            'secret': None,
            'security_engine': None
        }

        self._common_fields_ui = {
            'address': None,
            'walk_interval': None,
            'profiles': None,
            'smart_profiles': None
        }

    def read_from_backend(self):
        self._load_groups_from_mongo()

        inventory_backend = list(self._db.inventory.find())
        self._inventory_ui = []
        for record in inventory_backend:
            self._process_inventory_line(record)
        for group_in_record in self._groups_ui.values():
            converted = self._conversion.backend2ui(group_in_record)
            self._inventory_ui.append(converted)
        return self._inventory_ui

    def create_record(self, record: dict):
        # TODO: If the same record alredy exists in mongo, return an error.
        # Always add mandatory profiles. Base profiles if smartProfiles = true
        profiles = self._db.profiles.find()
        profile_conversion = ProfileConversion()
        for prof in list(profiles):
            converted = profile_conversion.backend2ui(prof)
            if converted['conditions']['condition'] == 'mandatory' or \
                    (record['smartProfiles'] and converted['conditions']['condition'] == 'mandatory'):
                record['profiles'].append(converted['profileName'])

        address = record['address']
        if address[0].isdigit():
            converted = self._conversion.ui2backend(record, delete=False, group=None)
            self._db.inventory.insert_one(converted)
        else:
            self._load_groups_from_mongo()
            if address not in self._groups_backend.keys():
                # TODO: display error if user wants to add nonexistent group
                return None
            else:
                all_records = []
                for addres_port, field in self._groups_backend[address].items():
                    ip_address = addres_port.split(":")[0]
                    port = addres_port.split(":")[1]
                    port = int(port) if len(port) > 0 else record['port']
                    community = field['community'] if 'community' in field.keys() else record['community']
                    secret = field['secret'] if 'secret' in field.keys() else record['secret']
                    version = field['version'] if 'version' in field.keys() else record['version']
                    security_engine = field['security_engine'] if 'security_engine' in field.keys() else record['securityEngine']

                    inventory_data = {
                        'address': ip_address,
                        'port': port,
                        'version': version,
                        'community': community,
                        'secret': secret,
                        'security_engine': security_engine,
                        'walk_interval': record['walkInterval'],
                        'profiles': record['profiles'],
                        'smart_profiles': record['smartProfiles'],
                        'group': address,
                        'delete': False
                    }
                    all_records.append(inventory_data)
                with self._mongo_client.start_session() as session:
                    with session.start_transaction():
                        self._db.inventory.insert_many(all_records)

    def delete_record(self, address, port):
        if address[0].isdigit():
            self._db.inventory.delete_one({'address': address, 'port': int(port)})
        else:
            with self._mongo_client.start_session() as session:
                with session.start_transaction():
                    self._db.inventory.delete_many({'group': address})

    """def update_record(self, address, port, new_record):
        if address[0].isdigit():
            converted = self._conversion.ui2backend(new_record, delete=False, group=None)
            new_values = {"$set": converted}
            self._db.inventory.update_one({"address": address, "port": int(port)}, new_values)
        else:
            group_name = address
            self._load_groups_from_mongo()
            inventory_backend = list(self._db.inventory.find({'group': address}))
            for record in inventory_backend:
                for field in self._device_in_group_fields_ui.keys():
                    if field in self._groups_backend[group_name][]"""

    def _load_groups_from_mongo(self):
        self._groups_backend = {}
        groups_query = list(self._db.groups.find({}))
        for group_from_query in groups_query:
            gr_name = get_group_name_from_backend(group_from_query)

            # self.groups_backend stores all fields, that were overwritten by group device config
            self._groups_backend[gr_name] = {}
            for device in group_from_query[gr_name]:
                port = device['port'] if 'port' in device.keys() else ""
                new_device = {
                    f"{device['address']}:{port}": {key: value for key, value in device.items() if key != 'address'}
                }
                self._groups_backend[gr_name].update(new_device)

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

        if group_name not in self._groups_ui.keys():
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
            self._groups_ui[group_name] = inventory_data
        else:
            string_to_var_map = {
                'port': port,
                'community': community,
                'secret': secret,
                'version': version,
                'security_engine': security_engine
            }
            for field, value in string_to_var_map.items():
                if value is not False:
                    self._groups_ui[group_name][field] = value
