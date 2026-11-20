import pytest

from SC4SNMP_UI_backend.common import change_tracking


class FakeCollection:
    """Minimal in-memory stand-in for the single-document config collection."""

    def __init__(self, record=None):
        self.record = record

    def find_one(self, *args, **kwargs):
        return self.record

    def update_one(self, query, update, upsert=False):
        if self.record is None:
            assert upsert
            self.record = {}
        for operator, fields in update.items():
            for dotted, value in fields.items():
                target = self.record
                *parents, last = dotted.split(".")
                for key in parents:
                    target = target.setdefault(key, {})
                if operator == "$set":
                    target[last] = value
                elif operator == "$inc":
                    target[last] = target.get(last, 0) + value
                elif operator == "$max":
                    target[last] = max(target.get(last, value), value)


@pytest.fixture()
def collection(monkeypatch):
    fake = FakeCollection()
    monkeypatch.setattr(change_tracking, "mongo_config", fake)
    return fake


def test_fresh_record_is_dirty_for_every_section(collection):
    change_tracking.ensure_config_record(collection)

    assert set(change_tracking.dirty_sections()) == {"inventory", "discovery"}
    assert change_tracking.get_job_state("inventory")["currently_scheduled"] is False


def test_ensure_config_record_migrates_flat_fields_and_keeps_state(collection):
    collection.record = {"previous_job_start_time": "t", "currently_scheduled": True, "task_id": "abc"}

    change_tracking.ensure_config_record(collection)

    state = change_tracking.get_job_state("inventory")
    assert state["task_id"] == "abc" and state["currently_scheduled"] is True
    assert change_tracking.get_job_state("discovery")["task_id"] is None


def test_ensure_config_record_does_not_reset_existing_revisions(collection):
    change_tracking.ensure_config_record(collection)
    change_tracking.mark_applied("inventory", 1)
    change_tracking.mark_section_dirty("inventory")

    change_tracking.ensure_config_record(collection)

    assert change_tracking.get_revisions()["inventory"] == (2, 1)


def test_edit_makes_only_its_section_dirty(collection):
    change_tracking.ensure_config_record(collection)
    change_tracking.mark_applied("inventory", 1)
    change_tracking.mark_applied("discovery", 1)
    assert change_tracking.dirty_sections() == []

    change_tracking.mark_section_dirty("discovery")

    assert change_tracking.dirty_sections() == ["discovery"]


def test_edit_during_apply_keeps_section_dirty(collection):
    """The revision captured before saving is recorded as applied, so a later edit is not lost."""
    change_tracking.ensure_config_record(collection)
    captured_revision = change_tracking.get_revisions()["inventory"][0]
    change_tracking.mark_section_dirty("inventory")  # edit after values.yaml was saved
    change_tracking.mark_applied("inventory", captured_revision)

    assert "inventory" in change_tracking.dirty_sections()


def test_applied_revision_never_decreases(collection):
    change_tracking.ensure_config_record(collection)
    change_tracking.mark_applied("inventory", 5)
    change_tracking.mark_applied("inventory", 3)

    assert collection.record["applied_revisions"]["inventory"] == 5


def test_job_state_is_tracked_per_type(collection):
    change_tracking.ensure_config_record(collection)

    change_tracking.set_job_state("discovery", currently_scheduled=True, task_id="d1")

    assert change_tracking.get_job_state("discovery")["task_id"] == "d1"
    assert change_tracking.get_job_state("inventory")["task_id"] is None


def test_unknown_section_is_rejected(collection):
    with pytest.raises(ValueError):
        change_tracking.mark_section_dirty("profiles")
