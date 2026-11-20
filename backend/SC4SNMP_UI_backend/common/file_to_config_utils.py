import csv
import io


TRUTHY_VALUES = {"t", "true", "y", "yes", "1"}


def str_to_bool(value) -> bool:
    """
    Mirrors the truthiness convention used across the codebase for the
    section-file/values.yaml CSV fields ("t"/"true"/"y"/"yes"/"1" are truthy,
    everything else - including "f"/"false"/"" - is falsy).
    """
    return str(value).strip().lower() in TRUTHY_VALUES


def groups_yaml_to_documents(groups_dict: dict) -> list:
    """
    Inverse of GroupsToYamlDictConversion.convert. Converts a parsed
    scheduler.groups section (a dict of {group_name: [hosts...]}, as written
    directly to sc4snmp_ui_scheduler_groups.yaml) into the groups_ui Mongo
    document shape - one document per group, {group_name: [hosts...]}.
    Mongo assigns "_id" on insert, so it's intentionally omitted here.
    """
    if not groups_dict:
        return []
    return [{group_name: hosts} for group_name, hosts in groups_dict.items()]


def profiles_yaml_to_documents(profiles_dict: dict) -> list:
    """
    Inverse of ProfilesToYamlDictConversion.convert. Converts a parsed
    scheduler.profiles section (a dict of {profile_name: {...}}, as written
    directly to sc4snmp_ui_scheduler_profiles.yaml) into the profiles_ui
    Mongo document shape - one document per profile, {profile_name: {...}}.
    """
    if not profiles_dict:
        return []
    return [{profile_name: profile_body} for profile_name, profile_body in profiles_dict.items()]


def inventory_csv_to_documents(csv_string: str) -> list:
    """
    Inverse of InventoryToYamlDictConversion.convert. Parses the
    poller.inventory literal-block CSV (header: address,port,version,
    community,secret,security_engine,walk_interval,profiles,smart_profiles,
    max_oid_to_process,delete) into the inventory_ui Mongo document shape -
    one dict per row, matching InventoryConversion.ui2backend's output fields.

    max_oid_to_process is optional - a missing column (older section files)
    or a blank cell both mean "unset" (None), so the connector falls back to
    its global default rather than raising on int("").

    Rows whose address is blank or starts with "#" are skipped, mirroring
    the connector's own convention of allowing commented-out inventory rows.
    """
    if not csv_string or not csv_string.strip():
        return []

    reader = csv.DictReader(io.StringIO(csv_string))
    documents = []
    for row in reader:
        address = (row.get("address") or "").strip()
        if not address or address.startswith("#"):
            continue
        max_oid_raw = (row.get("max_oid_to_process") or "").strip()
        documents.append({
            "address": address,
            "port": int(row["port"]),
            "version": row["version"],
            "community": row["community"],
            "secret": row["secret"],
            "security_engine": row["security_engine"],
            "walk_interval": int(row["walk_interval"]),
            "profiles": row["profiles"],
            "smart_profiles": str_to_bool(row["smart_profiles"]),
            "max_oid_to_process": int(max_oid_raw) if max_oid_raw else None,
            "delete": str_to_bool(row["delete"]),
        })
    return documents


def _normalize_device_rules(rules):
    if not isinstance(rules, list):
        return None
    normalized = [
        {"name": str(rule.get("name") or ""), "patterns": str(rule.get("patterns") or ""),
         "group": str(rule.get("group") or "")}
        for rule in rules if isinstance(rule, dict)
    ]
    return normalized or None


def discovery_yaml_to_documents(discovery_dict: dict) -> list:
    """Convert a discovery.autodiscovery mapping to flat discovery_ui documents."""
    if not discovery_dict or not isinstance(discovery_dict, dict):
        return []
    documents = []
    for name, entry in discovery_dict.items():
        if not isinstance(entry, dict):
            continue
        documents.append({
            "name": str(name),
            "network_address": str(entry.get("network_address") or ""),
            "version": str(entry.get("version") or "2c"),
            "port": int(entry.get("port") or 161),
            "community": entry.get("community") or "",
            "secret": entry.get("secret") or "",
            "security_engine": entry.get("security_engine") or "",
            "frequency": int(entry.get("frequency") or 86400),
            "delete_already_discovered": str_to_bool(entry.get("delete_already_discovered", False)),
            "device_rules": _normalize_device_rules(entry.get("device_rules")),
        })
    return documents
