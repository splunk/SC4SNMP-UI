"""
Per-section change tracking and per-job-type state, kept in the single document of config_collection:

{
    "revisions":         {"inventory": 3, "discovery": 1},   # +1 on every edit of the section
    "applied_revisions": {"inventory": 3, "discovery": 0},   # revision that was saved to values.yaml and
                                                              # handed over to a created kubernetes Job
    "jobs": {
        "inventory": {"previous_job_start_time": datetime|None, "currently_scheduled": bool,
                      "task_id": str|None, "pending_revision": int},
        "discovery": {...}
    }
}

A section is dirty while its revision is greater than its applied revision. "inventory" covers Profiles, Groups and
Inventory (all of them are applied by the inventory Job), "discovery" covers the Discovery entries.
"""
from SC4SNMP_UI_backend import mongo_client

JOB_TYPES = ("inventory", "discovery")

mongo_config = mongo_client.sc4snmp.config_collection


def _check_type(job_type):
    if job_type not in JOB_TYPES:
        raise ValueError(f"unknown job type {job_type}, expected one of {JOB_TYPES}")


def _default_job_state():
    return {"previous_job_start_time": None, "currently_scheduled": False, "task_id": None, "pending_revision": 0}


def ensure_config_record(collection=None):
    """
    Creates the config record when it doesn't exist and migrates the flat (pre per-type) fields. Existing
    scheduling state is kept, so that it survives backend restarts; stale state is handled by ScheduleHandler.
    """
    collection = mongo_config if collection is None else collection
    record = collection.find_one({}) or {}
    updates = {}
    jobs = record.get("jobs") or {}
    for job_type in JOB_TYPES:
        state = _default_job_state()
        if job_type == "inventory":
            # migrate flat fields written by previous versions
            for key in ("previous_job_start_time", "currently_scheduled", "task_id"):
                if key in record:
                    state[key] = record[key]
        for key, value in state.items():
            if key not in (jobs.get(job_type) or {}):
                updates[f"jobs.{job_type}.{key}"] = value
        for field in ("revisions", "applied_revisions"):
            if job_type not in (record.get(field) or {}):
                # a fresh record is dirty, so that the first Apply writes the sections
                updates[f"{field}.{job_type}"] = 1 if field == "revisions" else 0
    if updates:
        collection.update_one({}, {"$set": updates}, upsert=True)


def mark_section_dirty(section):
    """Registers an edit of the section (increments its revision)."""
    _check_type(section)
    mongo_config.update_one({}, {"$inc": {f"revisions.{section}": 1}}, upsert=True)


def get_revisions():
    """:return: {section: (revision, applied_revision)}"""
    record = mongo_config.find_one({}) or {}
    revisions = record.get("revisions") or {}
    applied = record.get("applied_revisions") or {}
    return {section: (int(revisions.get(section, 1)), int(applied.get(section, 0))) for section in JOB_TYPES}


def dirty_sections():
    return [section for section, (revision, applied) in get_revisions().items() if revision > applied]


def mark_applied(section, revision, collection=None):
    """Records that the section was saved at the given revision and a Job was created for it."""
    _check_type(section)
    collection = mongo_config if collection is None else collection
    collection.update_one({}, {"$max": {f"applied_revisions.{section}": int(revision)}}, upsert=True)


def get_job_state(job_type, collection=None):
    _check_type(job_type)
    collection = mongo_config if collection is None else collection
    record = collection.find_one({}) or {}
    state = _default_job_state()
    state.update((record.get("jobs") or {}).get(job_type) or {})
    return state


def set_job_state(job_type, collection=None, **fields):
    _check_type(job_type)
    collection = mongo_config if collection is None else collection
    collection.update_one({}, {"$set": {f"jobs.{job_type}.{key}": value for key, value in fields.items()}},
                          upsert=True)
