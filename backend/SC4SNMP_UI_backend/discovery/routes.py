import ipaddress
import re

from bson import ObjectId
from bson.errors import InvalidId
from pymongo.errors import DuplicateKeyError
from flask import Blueprint, jsonify, request

from SC4SNMP_UI_backend import mongo_client
from SC4SNMP_UI_backend.auth.utils import login_required
from SC4SNMP_UI_backend.common.backend_ui_conversions import DiscoveryConversion
from SC4SNMP_UI_backend.common.change_tracking import mark_section_dirty
from SC4SNMP_UI_backend.apply_changes.tasks import job_available

discovery_blueprint = Blueprint("discovery_blueprint", __name__)
mongo_discovery = mongo_client.sc4snmp.discovery_ui
mongo_groups = mongo_client.sc4snmp.groups_ui
mongo_config = mongo_client.sc4snmp.config_collection
discovery_conversion = DiscoveryConversion()


_index_ready = False


def _mark_discovery_dirty():
    mark_section_dirty("discovery")


def _ensure_unique_name_index():
    """Names are part of the redis schedule name, so they must be unique even under concurrent requests."""
    global _index_ready
    if not _index_ready:
        mongo_discovery.create_index("name", unique=True)
        _index_ready = True


def _object_id(value):
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return None


def _validate_entry(payload, updating=False):
    name = str(payload.get("name", "")).strip()
    if not name or name[0].isdigit() or re.search(r"[;\s]", name):
        return "Name is required and cannot start with a digit or contain spaces or semicolons."
    network_address = str(payload.get("networkAddress", "")).strip()
    try:
        if "/" not in network_address:
            raise ValueError("prefix length is required")
        ipaddress.ip_network(network_address, strict=False)
    except ValueError:
        return "Network address must be a valid IPv4 or IPv6 CIDR."
    if payload.get("version", "2c") not in ("1", "2c", "3"):
        return "SNMP version must be 1, 2c, or 3."
    try:
        port = int(payload.get("port", 161))
        frequency = int(payload.get("frequency", 86400))
    except (TypeError, ValueError):
        return "Port and frequency must be integers."
    if not 1 <= port <= 65535:
        return "Port must be between 1 and 65535."
    if frequency < 21600:
        return "Frequency must be at least 21600 seconds."
    if payload.get("version") == "3" and not str(payload.get("secret", "")).strip():
        return "A secret is required for SNMP version 3."
    if payload.get("version", "2c") in ("1", "2c") and not str(payload.get("community", "")).strip():
        return "A community string is required for SNMP version 1 and 2c."
    if payload.get("community") and not re.fullmatch(r"[.a-zA-Z0-9_-]+", str(payload["community"])):
        return "Community contains unsupported characters."
    if payload.get("secret") and not re.fullmatch(r"[.a-zA-Z0-9_-]+", str(payload["secret"])):
        return "Secret contains unsupported characters."
    security_engine = str(payload.get("securityEngine", ""))
    if security_engine and not re.fullmatch(r"(?:[A-F0-9]{10,64}|[a-f0-9]{10,64})", security_engine):
        return "Security engine must be 10 to 64 hexadecimal characters."
    rules = payload.get("deviceRules") or []
    if not isinstance(rules, list):
        return "Device rules must be a list."
    if any(not isinstance(rule, dict) or not all(str(rule.get(field, "")).strip() for field in ("name", "patterns", "group")) for rule in rules):
        return "Each device rule requires a name, pattern, and group."
    duplicate_query = {"name": name}
    if updating:
        duplicate_query["_id"] = {"$ne": updating}
    if mongo_discovery.find_one(duplicate_query):
        return f"Discovery entry '{name}' already exists."
    return None


def _missing_rule_groups(payload):
    known = set()
    for group in mongo_groups.find({}, {"_id": 0}):
        known.update(key for key in group if key != "_id")
    return sorted({rule.get("group", "").strip() for rule in (payload.get("deviceRules") or [])
                   if rule.get("group", "").strip() not in known})


@discovery_blueprint.route("/discovery/count")
@login_required
def get_discovery_count():
    return jsonify(mongo_discovery.count_documents({}))


@discovery_blueprint.route("/discovery/<page_num>/<per_page>")
@login_required
def get_discovery_list(page_num, per_page):
    page_num, per_page = int(page_num), int(per_page)
    rows = mongo_discovery.find().sort("_id", 1).skip((page_num - 1) * per_page).limit(per_page)
    return jsonify([discovery_conversion.backend2ui(row) for row in rows])


@discovery_blueprint.route("/discovery/add", methods=["POST"])
@login_required
def add_discovery_entry():
    payload = request.json or {}
    error = _validate_entry(payload)
    if error:
        return jsonify({"message": error}), 400
    _ensure_unique_name_index()
    try:
        mongo_discovery.insert_one(discovery_conversion.ui2backend(payload))
    except DuplicateKeyError:
        return jsonify({"message": f"Discovery entry '{str(payload.get('name', '')).strip()}' already exists."}), 400
    _mark_discovery_dirty()
    missing = _missing_rule_groups(payload)
    if missing:
        return jsonify({"message": f"Entry saved. These rule groups do not currently exist: {', '.join(missing)}."})
    return jsonify("success")


@discovery_blueprint.route("/discovery/update/<entry_id>", methods=["POST"])
@login_required
def update_discovery_entry(entry_id):
    payload = request.json or {}
    object_id = _object_id(entry_id)
    if object_id is None:
        return jsonify({"message": "Discovery entry was not found."}), 404
    error = _validate_entry(payload, updating=object_id)
    if error:
        return jsonify({"message": error}), 400
    existing = mongo_discovery.find_one({"_id": object_id})
    if not existing:
        return jsonify({"message": "Discovery entry was not found."}), 404
    if str(payload.get("name", "")).strip() != existing["name"]:
        return jsonify({"message": "Discovery entry names cannot be changed after creation."}), 400
    result = mongo_discovery.update_one(
        {"_id": object_id}, {"$set": discovery_conversion.ui2backend(payload)}
    )
    if result.matched_count == 0:
        return jsonify({"message": "Discovery entry was not found."}), 404
    _mark_discovery_dirty()
    missing = _missing_rule_groups(payload)
    if missing:
        return jsonify({"message": f"Entry saved. These rule groups do not currently exist: {', '.join(missing)}."})
    return jsonify("success")


@discovery_blueprint.route("/discovery/delete/<entry_id>", methods=["POST"])
@login_required
def delete_discovery_entry(entry_id):
    object_id = _object_id(entry_id)
    if object_id is None:
        return jsonify({"message": "Discovery entry was not found."}), 404
    result = mongo_discovery.delete_one({"_id": object_id})
    if result.deleted_count == 0:
        return jsonify({"message": "Discovery entry was not found."}), 404
    _mark_discovery_dirty()
    return jsonify({"message": "Discovery entry was deleted."})


@discovery_blueprint.route("/discovery/status")
@login_required
def get_discovery_status():
    """Discovery job manifest is rendered by the helm chart only when discovery.enabled is true."""
    return jsonify({"enabled": job_available("discovery")})
