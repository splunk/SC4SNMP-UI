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

    return ''.join(result)


def get_group_or_profile_name_from_backend(document: dict):
    group_or_profile_name = None
    for key in document.keys():
        if key != "_id":
            group_or_profile_name = key
    return group_or_profile_name


class Conversion:

    @abstractmethod
    def backend2ui(self, document: dict, **kwargs):
        pass

    @abstractmethod
    def ui2backend(self, document: dict, **kwargs):
        pass


def string_value_to_numeric(value: str):
    try:
        if value.isnumeric():
            return int(value)
        elif value.replace(".", "").isnumeric():
            return float(value)
        else:
            return value
    except ValueError:
        return value


class ProfileConversion(Conversion):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__backend2ui_conditional_operations = {
            "lt": "less than",
            "gt": "greater than",
            "equals": "equals",
            "in": "in"
        }
        self.__ui2backend_conditional_operations = {}
        for key, value in self.__backend2ui_conditional_operations.items():
            self.__ui2backend_conditional_operations[value] = key

        self.__backend2ui_profile_types = {
            "field": "smart",
            "base": "base",
            "walk": "walk"
        }
        self.__ui2backend_profile_types = {}
        for key, value in self.__backend2ui_profile_types.items():
            self.__ui2backend_profile_types[value] = key

    def backend2ui(self, document: dict, **kwargs):
        profile_name = get_group_or_profile_name_from_backend(document)
        if "profile_in_inventory" not in kwargs.keys():
            raise ValueError("No profile_in_inventory provided")
        elif profile_name is None:
            raise ValueError("No profile name detected")
        else:
            profile_in_inventory = kwargs["profile_in_inventory"]
            backend_var_binds = document[profile_name]["varBinds"]
            var_binds = []
            for vb in backend_var_binds:
                new_vb = {
                    "component": vb[0],
                    "object": vb[1] if len(vb) >= 2 else "",
                    "index": '.'.join(map(str, vb[2:])) if len(vb) >= 3 else "",
                }
                var_binds.append(new_vb)

            if "condition" in document[profile_name]:
                backend_condition = document[profile_name]["condition"]
                condition_type = self.__backend2ui_profile_types[backend_condition["type"]]
                field = backend_condition["field"] if backend_condition["type"] == "field" else ""
                patterns = [{"pattern": p} for p in backend_condition["patterns"]] \
                    if backend_condition["type"] == "field" else []
                conditions = {
                    "condition": condition_type,
                    "field": field,
                    "patterns": patterns,
                    "conditions": []
                }
            elif "conditions" in document[profile_name]:
                conditional = []
                for back_condition in document[profile_name]["conditions"]:
                    field = back_condition["field"]
                    operation = self.__backend2ui_conditional_operations[back_condition["operation"]]
                    value = []
                    if operation == "in":
                        for v in back_condition["value"]:
                            value.append(str(v))
                    else:
                        value.append(str(back_condition["value"]))
                    conditional.append(
                        {"field": field, "operation": operation, "value": value}
                    )
                conditions = {
                    "condition": "conditional",
                    "field": "",
                    "patterns": [],
                    "conditions": conditional
                }
            else:
                conditions = {
                    "condition": "standard",
                    "field": "",
                    "patterns": [],
                    "conditions": []
                }
            result = {
                "_id": str(document["_id"]),
                "profileName": profile_name,
                "frequency": document[profile_name].get("frequency", 1),
                "conditions": conditions,
                "varBinds": var_binds,
                "profileInInventory": profile_in_inventory
            }
            return result

    def ui2backend(self, document: dict, **kwargs):
        conditions = None
        condition = None
        if document['conditions']['condition'] == "smart":
            condition = {
                'type': 'field',
                'field': document['conditions']['field'],
                'patterns': [el['pattern'] for el in document['conditions']['patterns']]
            }
        elif document['conditions']['condition'] == "conditional":
            conditions = []
            for ui_condition in document['conditions']['conditions']:
                field = ui_condition["field"]
                operation = self.__ui2backend_conditional_operations[ui_condition["operation"]]
                if operation == "in":
                    value = []
                    for v in ui_condition["value"]:
                        value.append(string_value_to_numeric(v))
                else:
                    value = string_value_to_numeric(ui_condition["value"][0])
                conditions.append(
                    {"field": field, "operation": operation, "value": value}
                )
        elif document['conditions']['condition'] != "standard":
            condition = {
                'type': document['conditions']['condition']
            }
        var_binds = []
        for var_b in document['varBinds']:
            single_var_bind = [var_b['component']]
            if len(var_b['object']) > 0:
                single_var_bind.append(var_b['object'])
                if len(var_b['index']) > 0:
                    single_var_bind += var_b['index'].split(".")
            var_binds.append(single_var_bind)

        item = {
            document['profileName']: {
                'varBinds': var_binds
            }
        }
        if document['conditions']['condition'] != "walk":
            item[document['profileName']].update({'frequency': int(document['frequency'])})
        if condition is not None:
            item[document['profileName']].update({'condition': condition})
        if conditions is not None:
            item[document['profileName']].update({'conditions': conditions})
        return item


class GroupConversion(Conversion):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def backend2ui(self, document: dict, **kwargs):
        if "group_in_inventory" in kwargs.keys():
            group_name = get_group_or_profile_name_from_backend(document)
            result = {
                "_id": str(document["_id"]),
                "groupName": group_name,
                "groupInInventory": kwargs["group_in_inventory"]
            }
            return result
        else:
            raise ValueError("No group_in_inventory provided")

    def ui2backend(self, document: dict, **kwargs):
        result = {
            document["groupName"]: []
        }
        return result


class GroupDeviceConversion(Conversion):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.optional_fields = ["port", "version", "community", "secret", "security_engine"]

    def backend2ui(self, document: dict, **kwargs):
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

    def ui2backend(self, document: dict, **kwargs):
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

    def ui2backend(self, document: dict, **kwargs):
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

    def backend2ui(self, document: dict, **kwargs):
        if "inventory_type" not in kwargs.keys():
            raise ValueError("No inventory_type provided")
        profiles_mongo = document['profiles']
        if len(profiles_mongo) > 0:
            profiles = profiles_mongo.split(";")
        else:
            profiles = []
        result = {
            '_id': str(document["_id"]),
            'inventoryType': kwargs['inventory_type'],
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