from abc import abstractmethod


def camel_case2snake_case(txt):
    return ''.join(['_' + i.lower() if i.isupper()
                    else i for i in txt]).lstrip('_')


def snake_case2camel_case(txt):
    result = []
    to_upper = False
    for i in range(len(txt)):
        if txt[i] != "_":
            result.append(txt[i].upper()) if to_upper else result.append(txt[i])
            to_upper = False
        elif txt[i] == "_" and i < len(txt) - 1:
            to_upper = True
            continue

    return ''.join(result)


def get_group_name_from_backend(document: dict):
    group_name = None
    for key in document.keys():
        if key != "_id":
            group_name = key
    return group_name


class Conversion:
    @abstractmethod
    def _ui2backend_map(self, document: dict, **kwargs):
        pass

    @abstractmethod
    def _backend2ui_map(self, document: dict, **kwargs):
        pass

    def backend2ui(self, document: dict, **kwargs):
        return self._backend2ui_map(document, **kwargs)

    def ui2backend(self, document: dict, **kwargs):
        return self._ui2backend_map(document, **kwargs)


class ProfileConversion(Conversion):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def _backend2ui_map(self, document: dict, **kwargs):
        profile_name = None
        for key in document.keys():
            if key != "_id":
                profile_name = key
        if profile_name is None:
            raise ValueError("No profile name detected")
        else:
            backend_var_binds = document[profile_name]["varBinds"]
            var_binds = []
            for vb in backend_var_binds:
                new_vb = {
                    "family": vb[0],
                    "category": vb[1] if len(vb) >= 2 else "",
                    "index": str(vb[2]) if len(vb) == 3 else "",
                }
                var_binds.append(new_vb)

            if "condition" in document[profile_name]:
                backend_condition = document[profile_name]["condition"]
                condition_type = backend_condition["type"]
                field = backend_condition["field"] if condition_type == "field" else ""
                patterns = [{"pattern": p} for p in backend_condition["patterns"]] \
                    if condition_type == "field" else None
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
            result = {
                "_id": document["_id"],
                "profileName": profile_name,
                "frequency": document[profile_name]["frequency"],
                "conditions": conditions,
                "varBinds": var_binds
            }
            return result

    def _ui2backend_map(self, document: dict, **kwargs):
        if document['conditions']['condition'] == "field":
            conditions = {
                'type': 'field',
                'field': document['conditions']['field'],
                'patterns': [el['pattern'] for el in document['conditions']['patterns']]
            }
        elif document['conditions']['condition'] == "None":
            conditions = None
        else:
            conditions = {
                'type': document['conditions']['condition']
            }
        var_binds = []
        for var_b in document['varBinds']:
            single_var_bind = [var_b['family']]
            if len(var_b['category']) > 0:
                single_var_bind.append(var_b['category'])
                if len(var_b['index']) > 0:
                    single_var_bind.append(int(var_b['index']))
            var_binds.append(single_var_bind)

        item = {
            document['profileName']: {
                'frequency': int(document['frequency']),
                'varBinds': var_binds
            }
        }
        if conditions is not None:
            item[document['profileName']].update({'conditions': conditions})
        return item


class GroupConversion(Conversion):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def _backend2ui_map(self, document: dict, **kwargs):
        group_name = get_group_name_from_backend(document)
        result = {
            "_id": document["_id"],
            "groupName": group_name
        }
        return result

    def _ui2backend_map(self, document: dict, **kwargs):
        result = {
            document["groupName"]: []
        }
        return result


class GroupDeviceConversion(Conversion):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.optional_fields = ["port", "version", "community", "secret", "security_engine"]

    def _backend2ui_map(self, document: dict, **kwargs):
        if "group_id" in kwargs.keys() and "device_id" in kwargs.keys():
            group_id = kwargs["group_id"]
            device_id = kwargs["device_id"]
            result = {
                "_id": f"{group_id}-{device_id}",
                "groupId": str(group_id),
                "address": document['address']
            }
            for backend_key in self.optional_fields:
                ui_key = snake_case2camel_case(backend_key)
                if backend_key in document.keys():
                    result.update({f'{ui_key}': str(document[backend_key])})
                else:
                    result.update({f'{ui_key}': ""})
            return result
        else:
            raise ValueError("No group_id or device_id provided")

    def _ui2backend_map(self, document: dict, **kwargs):
        result = {
            "address": document["address"]
        }
        for backend_key in self.optional_fields:
            ui_key = snake_case2camel_case(backend_key)
            if len(document[ui_key]) > 0:
                result.update({f"{backend_key}": str(document[ui_key])})
        if len(document['port']) > 0:
            result.update({"port": int(document['port'])})
        return result


class InventoryConversion(Conversion):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def _ui2backend_map(self, document: dict, **kwargs):
        if "delete" in kwargs.keys():
            profiles = ""
            for i in range(len(document['profiles'])):
                profiles += f"{document['profiles'][i]}"
                if i < len(document['profiles'])-1:
                    profiles += ";"
            result = {
                'address': document['address'],
                'port': int(document['port']),
                'version': document['version'],
                'community': document['community'],
                'secret': document['secret'],
                'security_engine': document['securityEngine'],
                'walk_interval': document['walkInterval'],
                'profiles': profiles,
                'smart_profiles': document['smartProfiles'],
                'delete': kwargs['delete']
            }
            return result
        else:
            raise ValueError("No delete provided")

    def _backend2ui_map(self, document: dict, **kwargs):
        profiles_mongo = document['profiles']
        profiles = profiles_mongo.split(";")
        result = {
            '_id': document['_id'],
            'address': document['address'],
            'port': str(document['port']),
            'version': document['version'],
            'community': document['community'],
            'secret': document['secret'],
            'securityEngine': document['security_engine'],
            'walkInterval': document['walk_interval'],
            'profiles': profiles,
            'smartProfiles': document['smart_profiles']
        }
        return result
