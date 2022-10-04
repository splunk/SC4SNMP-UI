from abc import abstractmethod
from collection_manager import ConnectorCollectionManager


class Conversion:
    def __init__(self, mongo, collection_name):
        self.mongo = mongo
        self.connector_manager = ConnectorCollectionManager(mongo, collection_name)

    @abstractmethod
    def ui2backend_map(self, ui_profiles, backend_profiles):
        pass

    @abstractmethod
    def backend2ui_map(self, ui_profiles, backend_profiles):
        pass

    def backend2ui(self):
        pass

    def ui2backend(self):
        ui_profiles = self.mongo.sc4snmp.profiles_ui.find({}, {"_id": 0})
        backend_profiles = self.connector_manager.return_collection()
        backend_profiles = self.ui2backend_map(ui_profiles, backend_profiles)
        self.connector_manager.update_collection(backend_profiles)


class ProfilesConversion(Conversion):
    def __init__(self, mongo):
        super().__init__(mongo, "profiles")

    def backend2ui_map(self):
        pass

    def ui2backend_map(self, ui_profiles, backend_profiles):
        for profile in ui_profiles:
            if profile['conditions']['condition'] == "field":
                conditions = {
                    'type': 'field',
                    'field': profile['conditions']['field'],
                    'patterns': [el['pattern'] for el in profile['conditions']['patterns']]
                }
            else:
                conditions = {
                    'type': profile['conditions']['condition']
                }
            var_binds = []
            for var_b in profile['varBinds']:
                single_var_bind = [var_b['family']]
                if len(var_b['category']) > 0:
                    single_var_bind.append(var_b['category'])
                    if len(var_b['index']) > 0:
                        single_var_bind.append(int(var_b['index']))
                var_binds.append(single_var_bind)

            item = {
                profile['profileName']: {
                    'frequency': int(profile['frequency']),
                    'condition': conditions,
                    'varBinds': var_binds
                }
            }
            backend_profiles.update(item)


class InventoryConversion(Conversion):
    def __init__(self, mongo):
        super().__init__(mongo, "inventory")


if __name__ == '__main__':
    from SC4SNMP_UI_backend import client
    prof_converter = ProfilesConversion(client)
    prof_converter.ui2backend()
