from flask import Blueprint, jsonify, current_app
from SC4SNMP_UI_backend import mongo_client
from SC4SNMP_UI_backend.auth.utils import login_required
from SC4SNMP_UI_backend.apply_changes.apply_changes import ApplyChanges
from SC4SNMP_UI_backend.apply_changes import handling_chain
from SC4SNMP_UI_backend.apply_changes.handling_chain import (
    EmptyValuesFileException,
    YamlParserException,
    mongo_groups,
    mongo_inventory,
    mongo_profiles,
)
from SC4SNMP_UI_backend.common.file_to_config_utils import (
    groups_yaml_to_documents,
    profiles_yaml_to_documents,
    inventory_csv_to_documents,
)
import os
import traceback
import yaml

apply_changes_blueprint = Blueprint('common_blueprint', __name__)
JOB_CREATION_RETRIES = int(os.getenv("JOB_CREATION_RETRIES", 10))

# Maps a section name to its key in values.yaml, used to derive the section
# file name the same way SaveConfigToFileHandler does (TMP_FILE_PREFIX +
# key.replace(".", "_") + ".yaml").
SECTION_FILE_KEYS = {
    "groups": "scheduler.groups",
    "profiles": "scheduler.profiles",
    "inventory": "poller.inventory",
}


def _section_file_path(section_key):
    file_name = handling_chain.TMP_FILE_PREFIX + SECTION_FILE_KEYS[section_key].replace(".", "_") + ".yaml"
    return os.path.join(handling_chain.VALUES_DIRECTORY, file_name)


def _load_yaml_section(section_key):
    """
    Reads and parses a section file with plain PyYAML (not ruamel), since the
    result is inserted straight into Mongo and must not carry ruamel's
    CommentedMap/scalar-string wrappers. Returns None if the file isn't
    present, so the caller can skip restoring that section.
    """
    file_path = _section_file_path(section_key)
    if not os.path.exists(file_path):
        return None
    with open(file_path, "r") as file:
        return yaml.safe_load(file)


def _reconcile_inventory(inventory_documents, session=None):
    """
    Orphan-safe replace of inventory_ui: hosts/groups no longer present in the
    restored section file are marked delete=True (mirroring the soft-delete
    inventory/routes.py itself performs) so the connector loader tears down
    their RedBeat walk schedules on the next Apply Changes, rather than the
    rows just vanishing from Mongo with their schedules left orphaned in
    Redis. Rows still present in the file are upserted by {address, port},
    clearing any prior delete=True on rows that reappear.
    """
    parsed_keys = {(doc["address"], doc["port"]) for doc in inventory_documents}
    existing_records = list(mongo_inventory.find({"delete": False}, session=session))
    for record in existing_records:
        if (record["address"], record["port"]) not in parsed_keys:
            mongo_inventory.update_one(
                {"_id": record["_id"]}, {"$set": {"delete": True}}, session=session
            )

    for doc in inventory_documents:
        mongo_inventory.update_one(
            {"address": doc["address"], "port": doc["port"]},
            {"$set": doc},
            upsert=True,
            session=session,
        )


def _restore_documents(session, groups_yaml, profiles_yaml, inventory_yaml):
    """
    Performs all Mongo writes for a restore under the given session so they
    can be wrapped in a single transaction by the caller (load_config) -
    mirrors the transactional pattern already used by
    groups/routes.py::delete_group_and_devices.
    """
    if groups_yaml is not None:
        group_documents = groups_yaml_to_documents(groups_yaml)
        mongo_groups.delete_many({}, session=session)
        if group_documents:
            mongo_groups.insert_many(group_documents, session=session)

    if profiles_yaml is not None:
        profile_documents = profiles_yaml_to_documents(profiles_yaml)
        mongo_profiles.delete_many({}, session=session)
        if profile_documents:
            mongo_profiles.insert_many(profile_documents, session=session)

    if inventory_yaml is not None:
        inventory_csv = (inventory_yaml or {}).get("inventory", "")
        inventory_documents = inventory_csv_to_documents(inventory_csv)
        _reconcile_inventory(inventory_documents, session=session)


@apply_changes_blueprint.route("/apply-changes", methods=['POST'])
@login_required
def apply_changes():
    changes = ApplyChanges()
    job_delay, currently_scheduled = changes.apply_changes()
    if job_delay <= 1 and currently_scheduled:
        message = "There might be previous kubernetes job still present in the namespace. Configuration update will be " \
                  f"retried {JOB_CREATION_RETRIES} times. If your configuration won't be updated in a few minutes, make sure that " \
                  f"snmp-splunk-connect-for-snmp-inventory job isn't present in your kubernetes deployment namespace and " \
                  f"click 'Apply changes' button once again."
    else:
        message = f"Configuration will be updated in approximately {job_delay} seconds."
    result = jsonify({"message": message})
    return result, 200


@apply_changes_blueprint.route("/load-config", methods=['POST'])
@login_required
def load_config():
    """
    Restores profiles, groups, and inventory from the on-disk section files
    (sc4snmp_ui_scheduler_groups.yaml / sc4snmp_ui_scheduler_profiles.yaml /
    sc4snmp_ui_poller_inventory.yaml) into their *_ui Mongo collections, then
    triggers the same Apply Changes flow as /apply-changes so the connector's
    inventory Job picks the restored configuration up (both UI visibility and
    polling). This is the only inverse (file -> Mongo) path in the backend;
    everywhere else Mongo is the sole source of truth.
    """
    groups_yaml = _load_yaml_section("groups")
    profiles_yaml = _load_yaml_section("profiles")
    inventory_yaml = _load_yaml_section("inventory")

    if groups_yaml is None and profiles_yaml is None and inventory_yaml is None:
        result = jsonify({"message": "No section files found in the values directory to restore from."})
        return result, 400

    with mongo_client.start_session() as session:
        with session.start_transaction():
            _restore_documents(session, groups_yaml, profiles_yaml, inventory_yaml)

    changes = ApplyChanges()
    job_delay, currently_scheduled = changes.apply_changes()
    if job_delay <= 1 and currently_scheduled:
        message = "Configuration was restored from section files. There might be previous kubernetes job still " \
                  "present in the namespace. Configuration update will be " \
                  f"retried {JOB_CREATION_RETRIES} times. If your configuration won't be updated in a few minutes, make sure that " \
                  f"snmp-splunk-connect-for-snmp-inventory job isn't present in your kubernetes deployment namespace and " \
                  f"click 'Apply changes' button once again."
    else:
        message = f"Configuration was restored from section files. It will be updated in approximately {job_delay} seconds."
    result = jsonify({"message": message})
    return result, 200


@apply_changes_blueprint.errorhandler(Exception)
def handle_exception(e):
    current_app.logger.error(traceback.format_exc())
    if isinstance(e, (EmptyValuesFileException, YamlParserException)):
        result = jsonify({"message": e.message})
        return result, 400

    result = jsonify({"message": "Undentified error. Check logs."})
    return result, 400