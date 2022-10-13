from SC4SNMP_UI_backend.common.conversions import InventoryConversion, ProfileConversion, get_group_name_from_backend, \
    camel_case2snake_case, snake_case2camel_case
from enum import Enum
from bson import ObjectId


class Status(Enum):
    NOT_SPECIFIED = 1


# TODO: When someone updates devices in group then update inventory collection
class InventoryProcessing:
    def __init__(self, conversion: InventoryConversion, mongo_client):
        self._conversion = conversion
        self._mongo_client = mongo_client
        self._db = mongo_client.sc4snmp

        self._records_from_group = {}

        self._device_in_group_fields_ui = {
            'port': Status.NOT_SPECIFIED,
            'version': Status.NOT_SPECIFIED,
            'community': Status.NOT_SPECIFIED,
            'secret': Status.NOT_SPECIFIED,
            'security_engine': Status.NOT_SPECIFIED
        }

        self._default_device_fields = {
            'port': 161,
            'version': '2c',
            'community': None,
            'secret': None,
            'security_engine': None
        }

        self._common_fields_ui = {
            'walk_interval': Status.NOT_SPECIFIED,
            'profiles': Status.NOT_SPECIFIED,
            'smart_profiles': Status.NOT_SPECIFIED
        }

    def read_from_backend(self):
        inventory_mongo = list(self._db.inventory.find())
        ui_index_counter = 0
        ui_inventory = []
        for record_from_mongo in inventory_mongo:
            if record_from_mongo['group'] is None:
                converted = self._conversion.backend2ui(record_from_mongo)
                ui_inventory.append(converted)
                ui_index_counter += 1
            else:
                group_name = record_from_mongo['group']
                if group_name in self._records_from_group.keys():
                    self._records_from_group[group_name]['records'].append(record_from_mongo)
                else:
                    self._records_from_group[group_name] = {
                        'index_ui_list': ui_index_counter,
                        'records': [record_from_mongo]
                    }
                    ui_index_counter += 1

        decrease_index = 0
        for group_name in self._records_from_group.keys():
            record_from_mongo = self._render_group_record_in_ui(group_name)
            if record_from_mongo is not None:
                record_from_mongo = self._conversion.backend2ui(record_from_mongo)
                index_to_insert = self._records_from_group[group_name]['index_ui_list'] - decrease_index
                ui_inventory.insert(index_to_insert, record_from_mongo)
            else:
                decrease_index += 1
        self._records_from_group = {}
        return ui_inventory

    def delete_record(self, address, port):
        if address[0].isdigit():
            self._db.inventory.delete_one({'address': address, 'port': int(port)})
        else:
            with self._mongo_client.start_session() as session:
                with session.start_transaction():
                    self._db.inventory.delete_many({'group': address})

    def create_record(self, record_from_ui: dict, edit = False):
        # TODO: If the same record alredy exists in mongo, return an error.
        # Always add mandatory profiles. Base profiles if smartProfiles = true
        default_profiles = self._get_default_profiles(record_from_ui['smartProfiles'])
        record_from_ui['profiles'] += default_profiles

        address = record_from_ui['address']
        if address[0].isdigit():
            converted = self._conversion.ui2backend(record_from_ui, delete=False, group=None)
            self._db.inventory.insert_one(converted)
        else:
            group_name = address
            group_from_mongo = list(self._db.groups.find({group_name: {"$exists": 1}}))
            if len(group_from_mongo) == 0:
                return None
            else:
                overwritten_fields = self._overwritten_fields_in_group(group_from_mongo[0][group_name])
                all_new_records_in_mongo = []
                for addres_port in overwritten_fields.keys():
                    ip_address = addres_port.split(":")[0]
                    new_record_in_mongo = {
                        'address': ip_address,
                        'group': group_name,
                        'delete': False
                    }
                    for field in self._device_in_group_fields_ui.keys():
                        if field in overwritten_fields[addres_port]:
                            data = overwritten_fields[addres_port][field]
                        else:
                            data = record_from_ui[snake_case2camel_case(field)]
                        data = data if field != 'port' else int(data)
                        new_record_in_mongo.update({field: data})

                    for field in self._common_fields_ui.keys():
                        new_record_in_mongo.update({field: record_from_ui[snake_case2camel_case(field)]})

                    all_new_records_in_mongo.append(new_record_in_mongo)

                with self._mongo_client.start_session() as session:
                    with session.start_transaction():
                        if edit:
                            self._db.inventory.delete_many({"group": group_name})
                        self._db.inventory.insert_many(all_new_records_in_mongo)

    def update_record(self, address, port, inventory_id, record_from_ui):
        print("updating",address)
        if address[0].isdigit():
            default_profiles = self._get_default_profiles(record_from_ui['smartProfiles'])
            record_from_ui['profiles'] += default_profiles
            converted = self._conversion.ui2backend(record_from_ui, delete=False, group=None)
            with self._mongo_client.start_session() as session:
                with session.start_transaction():
                    self._db.inventory.delete_one({'_id': ObjectId(inventory_id)})
                    self._db.inventory.insert_one(converted)
        else:
            self.create_record(record_from_ui, True)

    def _get_default_profiles(self, smart_profiles: bool):
        result = []
        profiles = self._db.profiles.find()
        profile_conversion = ProfileConversion()
        for prof in list(profiles):
            converted = profile_conversion.backend2ui(prof)
            if converted['conditions']['condition'] == 'mandatory' or \
                    (smart_profiles and converted['conditions']['condition'] == 'base'):
                result.append(converted['profileName'])
        return result

    def _overwritten_fields_in_group(self, group_devices_mongo):
        result = {}
        for device in group_devices_mongo:
            port = device['port'] if 'port' in device.keys() else ""
            result[f"{device['address']}:{port}"] = {key: value for key, value in device.items() if key != 'address'}
        return result

    def _render_group_record_in_ui(self, group_name):
        records_from_mongo = self._records_from_group[group_name]['records']
        group_from_mongo = list(self._db.groups.find({group_name: {"$exists": 1}}))
        if len(group_from_mongo) == 0:
            self.delete_record(group_name, "")
            return None
        else:
            group_from_mongo = group_from_mongo[0]
            overwritten_fields = self._overwritten_fields_in_group(group_from_mongo[group_name])
            counter = 0
            group_record = {
                '_id': records_from_mongo[0]["_id"],
                'address': group_name
            }

            for record in records_from_mongo:
                address = record['address']
                port = record['port']
                if f"{address}:{port}" in overwritten_fields.keys():
                    group_key = f"{address}:{port}"
                else:
                    group_key = f"{address}:"

                for field in self._device_in_group_fields_ui.keys():
                    if field not in overwritten_fields[group_key]:
                        self._device_in_group_fields_ui[field] = record[field]

                if counter == 0:
                    for field, value in self._device_in_group_fields_ui.items():
                        if value == Status.NOT_SPECIFIED:
                            data = self._default_device_fields[field]
                        else:
                            data = value
                        group_record.update({field: data})
                    for field in self._common_fields_ui.keys():
                        data = record[field]
                        group_record.update({field: data})
                else:
                    for field, value in self._device_in_group_fields_ui.items():
                        if value != Status.NOT_SPECIFIED:
                            group_record.update({field: value})

        self._reset_fields()
        return group_record

    def _reset_fields(self):
        for field in self._device_in_group_fields_ui.keys():
            self._device_in_group_fields_ui[field] = Status.NOT_SPECIFIED
        for field in self._common_fields_ui.keys():
            self._common_fields_ui[field] = Status.NOT_SPECIFIED
