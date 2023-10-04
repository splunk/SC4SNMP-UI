from abc import abstractmethod
import ruamel
from ruamel.yaml.scalarstring import SingleQuotedScalarString as single_quote
from ruamel.yaml.scalarstring import DoubleQuotedScalarString as double_quote
from SC4SNMP_UI_backend.common.backend_ui_conversions import get_group_or_profile_name_from_backend
from ruamel.yaml.scalarstring import LiteralScalarString as literal_string
import os
from flask import current_app


def bool_to_str(value):
    if value:
        return "t"
    else:
        return "f"


class MongoToYamlDictConversion:
    """
    MongoToYamlDictConversion is an abstract class. Implementations of this class converts
    appropriate mongo collections to dictionaries in such a way, that configurations from those collections can be
    dumped to yaml file with appropriate formatting.
    """
    @classmethod
    def yaml_escape_list(cls, *l):
        """
        This function is used to parse an example list [yaml_escape_list(el1, el2, el3)] like this:
        - [el1, el2, el3]
        and not like this:
        - el1
        - el2
        - el3
        """
        ret = ruamel.yaml.comments.CommentedSeq(l)
        ret.fa.set_flow_style()
        return ret
    @abstractmethod
    def convert(self, documents: list) -> dict:
        pass


class ProfilesToYamlDictConversion(MongoToYamlDictConversion):
    def convert(self, documents: list) -> dict:
        """
        ProfilesToYamlDictConversion converts profiles from mongo collection to
        format that can be dumped to yaml file
        :param documents: list of profiles from mongo
        :return: dictionary that can be dumped to yaml
        """
        result = {}
        for profile in documents:
            profile_name = get_group_or_profile_name_from_backend(profile)
            prof = profile[profile_name]
            var_binds = []
            condition = None
            conditions = None
            is_walk_profile = False

            for var_bind in prof["varBinds"]:
                var_binds.append(self.yaml_escape_list(*[single_quote(vb) for vb in var_bind]))

            if "condition" in prof:
                backend_condition = prof["condition"]
                condition_type = backend_condition["type"]
                is_walk_profile = True if backend_condition["type"] == "walk" else False
                condition = {
                    "type": condition_type
                }
                if condition_type == "field":
                    condition["field"] = backend_condition["field"]
                    condition["patterns"] = [single_quote(pattern) for pattern in backend_condition["patterns"]]

            if "conditions" in prof:
                backend_conditions = prof["conditions"]
                conditions = []
                for cond in backend_conditions:
                    if cond["operation"] == "in":
                        value = [double_quote(v) if type(v) == str else v for v in cond["value"]]
                    else:
                        value = double_quote(cond["value"]) if type(cond["value"]) == str else cond["value"]
                    conditions.append({
                        "field": cond["field"],
                        "operation": double_quote(cond["operation"]),
                        "value": value
                    })

            result[profile_name] = {}
            if not is_walk_profile:
                result[profile_name]["frequency"] = prof['frequency']
            if condition is not None:
                result[profile_name]["condition"] = condition
            if conditions is not None:
                result[profile_name]["conditions"] = conditions
            result[profile_name]["varBinds"] = var_binds

        return result


class GroupsToYamlDictConversion(MongoToYamlDictConversion):
    def convert(self, documents: list) -> dict:
        """
        GroupsToYamlDictConversion converts groups from mongo collection to
        format that can be dumped to yaml file
        :param documents: list of groups from mongo
        :return: dictionary that can be dumped to yaml
        """
        result = {}
        for group in documents:
            group_name = get_group_or_profile_name_from_backend(group)
            gr = group[group_name]
            hosts = []
            for host in gr:
                host_config = host
                if "community" in host:
                    host_config["community"] = single_quote(host["community"])
                if "secret" in host:
                    host_config["secret"] = single_quote(host["secret"])
                if "version" in host:
                    host_config["version"] = single_quote(host["version"])
                hosts.append(host_config)
            result[group_name] = hosts
        return result


class InventoryToYamlDictConversion(MongoToYamlDictConversion):
    def convert(self, documents: list) -> dict:
        """
        InventoryToYamlDictConversion converts inventory from mongo collection to
        format that can be dumped to yaml file
        :param documents: inventory from mongo
        :return: dictionary that can be dumped to yaml
        """
        inventory_string = "address,port,version,community,secret,security_engine,walk_interval,profiles,smart_profiles,delete"
        for inv in documents:
            smart_profiles = bool_to_str(inv['smart_profiles'])
            inv_delete = bool_to_str(inv['delete'])
            inventory_string += f"\n{inv['address']},{inv['port']},{inv['version']},{inv['community']}," \
                                f"{inv['secret']},{inv['security_engine']},{inv['walk_interval']},{inv['profiles']}," \
                                f"{smart_profiles},{inv_delete}"
        return {
            "inventory": literal_string(inventory_string)
        }


class TempFileHandling:
    """
    After converting configurations from mongo to dictionaries ready to be dumped to yaml file, those dictionaries
    must be dumped to temporary files. This is because those configurations must be parsed before they are inserted
    to values.yaml file. TempFileHandling is an abstract class whose implementations parse dictionaries and return
    ready configuration that can be saved in values.yaml
    """
    def __init__(self, file_path: str):
        self._file_path = file_path

    def _save_temp(self, content):
        yaml = ruamel.yaml.YAML()
        with open(self._file_path, "w") as file:
            yaml.dump(content, file)

    def _delete_temp(self):
        if os.path.exists(self._file_path):
            os.remove(self._file_path)
        else:
            current_app.logger.info(f"Directory {self._file_path} doesn't exist inside a Pod. File wasn't removed.")

    @abstractmethod
    def parse_dict_to_yaml(self, document: dict, delete_tmp: bool = True):
        pass


class ProfilesTempHandling(TempFileHandling):
    def __init__(self, file_path: str):
        super().__init__(file_path)

    def parse_dict_to_yaml(self, document: dict, delete_tmp: bool = True):
        """
        :param document: dictionary with profiles configuration
        :param delete_tmp: whether to delete temporary file after parsing
        :return: parsed configuration ready to be saved to values.yaml
        """
        self._save_temp(document)
        lines = ""
        with open(self._file_path, "r") as file:
            line = file.readline()
            while line != "":
                lines += line
                line = file.readline()
        if delete_tmp:
            self._delete_temp()
        return literal_string(lines)


class InventoryTempHandling(TempFileHandling):
    def __init__(self, file_path: str):
        super().__init__(file_path)

    def parse_dict_to_yaml(self, document: dict, delete_tmp: bool = True):
        """
        :param document: dictionary with inventory configuration
        :param delete_tmp: whether to delete temporary file after parsing
        :return: parsed configuration ready to be saved to values.yaml
        """
        self._save_temp(document)
        yaml = ruamel.yaml.YAML()
        with open(self._file_path, "r") as file:
            inventory = yaml.load(file)
            result = inventory["inventory"]
        if delete_tmp:
            self._delete_temp()
        return literal_string(result)


class GroupsTempHandling(TempFileHandling):
    def __init__(self, file_path: str):
        super().__init__(file_path)

    def parse_dict_to_yaml(self, document: dict, delete_tmp: bool = True):
        """
        :param document: dictionary with groups configuration
        :param delete_tmp: whether to delete temporary file after parsing
        :return: parsed configuration ready to be saved to values.yaml
        """
        self._save_temp(document)
        lines = ""
        with open(self._file_path, "r") as file:
            line = file.readline()
            while line != "":
                lines += line
                line = file.readline()
        if delete_tmp:
            self._delete_temp()
        return literal_string(lines)
