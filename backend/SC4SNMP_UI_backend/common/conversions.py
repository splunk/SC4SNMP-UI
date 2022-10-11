from abc import abstractmethod

class Conversion:

    @abstractmethod
    def _ui2backend_map(self, document: dict):
        pass

    @abstractmethod
    def _backend2ui_map(self, document: dict):
        pass

    def backend2ui(self, document: dict):
        return self._backend2ui_map(document)

    def ui2backend(self, document: dict):
        return self._ui2backend_map(document)


class ProfileConversion(Conversion):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def _backend2ui_map(self, profile: dict):
        profile_name = None
        for key in profile.keys():
            if key != "_id":
                profile_name = key
        if profile_name is None:
            raise ValueError("No profile name detected")
        else:
            backend_var_binds = profile[profile_name]["varBinds"]
            var_binds = []
            for vb in backend_var_binds:
                new_vb = {
                    "family": vb[0],
                    "category": vb[1] if len(vb) >= 2 else "",
                    "index": str(vb[2]) if len(vb) == 3 else "",
                }
                var_binds.append(new_vb)

            if "condition" in profile[profile_name]:
                backend_condition = profile[profile_name]["condition"]
                condition_type = backend_condition["type"]
                field = backend_condition["field"] if condition_type == "field" else ""
                patterns = [{"pattern": p} for p in backend_condition["patterns"]] if condition_type == "field" else None
                conditions = {
                    "condition": condition_type,
                    "field": field,
                    "patterns": patterns
                }
            else:
                conditions = {
                    "condition": "None",
                    "field": "",
                    "patterns": None
                }
            converted = {
                "_id": profile["_id"],
                "profileName": profile_name,
                "frequency": profile[profile_name]["frequency"],
                "conditions": conditions,
                "varBinds": var_binds
            }
            return converted

    def _ui2backend_map(self, profile: dict):
        if profile['conditions']['condition'] == "field":
            conditions = {
                'type': 'field',
                'field': profile['conditions']['field'],
                'patterns': [el['pattern'] for el in profile['conditions']['patterns']]
            }
        elif profile['conditions']['condition'] == "None":
            conditions = None
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

        if conditions is None:
            item = {
                profile['profileName']: {
                    'frequency': int(profile['frequency']),
                    'varBinds': var_binds
                }
            }
        else:
            item = {
                profile['profileName']: {
                    'frequency': int(profile['frequency']),
                    'condition': conditions,
                    'varBinds': var_binds
                }
            }
        return item


class InventoryConversion(Conversion):
    def __init__(self, mongo):
        super().__init__(mongo, "inventory")


if __name__ == '__main__':
    from SC4SNMP_UI_backend import mongo_client
    prof_converter = ProfileConversion(mongo_client)
    prof_converter.ui2backend()
