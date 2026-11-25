from unittest import mock
from unittest.mock import call, Mock
from bson import ObjectId
from copy import copy
import ruamel
import datetime
import os
from kubernetes.client import ApiException
from SC4SNMP_UI_backend.apply_changes.handling_chain import TMP_FILE_PREFIX
import pytest
from types import SimpleNamespace
from SC4SNMP_UI_backend.apply_changes.apply_changes import SingletonMeta

VALUES_TEST_DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                             "../../yamls_for_tests/values_test")
REFERENCE_FILES_DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                         "../../yamls_for_tests/reference_files")

def return_generated_and_reference_files():
    reference_files_names = ["poller_inventory.yaml", "scheduler_profiles.yaml", "scheduler_groups.yaml"]
    reference_files = []
    generated_files = []
    yaml = ruamel.yaml.YAML()

    for file_name in reference_files_names:
        # add temporary files
        reference_file_path = os.path.join(REFERENCE_FILES_DIRECTORY, file_name)
        with open(reference_file_path, "r") as file:
            data = yaml.load(file)
        reference_files.append(copy(data))

        generated_file_path = os.path.join(VALUES_TEST_DIRECTORY, f"{TMP_FILE_PREFIX}{file_name}")
        with open(generated_file_path, "r") as file:
            data = yaml.load(file)
        generated_files.append(copy(data))

    # add values files
    edited_values_path = os.path.join(VALUES_TEST_DIRECTORY, "values.yaml")
    original_values_path = os.path.join(REFERENCE_FILES_DIRECTORY, "values.yaml")
    with open(original_values_path, "r") as file:
        data = yaml.load(file)
    reference_files.append(copy(data))
    with open(edited_values_path, "r") as file:
        data = yaml.load(file)
    generated_files.append(copy(data))
    return reference_files, generated_files

def delete_generated_files():
    reference_files_names = ["poller_inventory.yaml", "scheduler_profiles.yaml", "scheduler_groups.yaml"]
    for file_name in reference_files_names:
        generated_file_path = os.path.join(VALUES_TEST_DIRECTORY, f"{TMP_FILE_PREFIX}{file_name}")
        if os.path.exists(generated_file_path):
            os.remove(generated_file_path)

def reset_generated_values():
    edited_values_path = os.path.join(VALUES_TEST_DIRECTORY, "values.yaml")
    original_values_path = os.path.join(VALUES_TEST_DIRECTORY, "values-before-edit.yaml")
    yaml = ruamel.yaml.YAML()
    with open(original_values_path, "r") as file:
        original_data = yaml.load(file)
    with open(edited_values_path, "w") as file:
        yaml.dump(original_data, file)


@pytest.fixture(autouse=True)
def reset_singleton():
    yield  # The code after yield is executed after the test
    SingletonMeta._instances = {}


common_id = "635916b2c8cb7a15f28af40a"

groups_collection = [
    {
        "_id": ObjectId(common_id),
        "group1": [
            {"address": "52.14.243.157", "port": 1163},
            {"address": "20.14.10.0", "port": 161},
        ],
    },
    {
        "_id": ObjectId(common_id),
        "group2": [
            {"address": "0.10.20.30"},
            {"address": "52.14.243.157", "port": 1165, "version": "3", "secret": "mysecret", "security_engine": "aabbccdd1234"},
        ]
    }
]

profiles_collection = [
    {
        "_id": ObjectId(common_id),
        "single_metric":{
            "frequency": 60,
            "varBinds":[['IF-MIB', 'ifMtu', '1']]
        }
    },
    {
        "_id": ObjectId(common_id),
        "small_walk":{
            "condition":{
                "type": "walk"
            },
            "varBinds":[['IP-MIB'],['IF-MIB']]
        }
    },
    {
        "_id": ObjectId(common_id),
        "gt_profile":{
            "frequency": 10,
            "conditions":[
                {"field": "IF-MIB.ifIndex", "operation": "gt", "value": 1}
            ],
            "varBinds":[['IF-MIB', 'ifOutDiscards']]
        }
    },
    {
        "_id": ObjectId(common_id),
        "lt_profile":{
            "frequency": 10,
            "conditions":[
                {"field": "IF-MIB.ifIndex", "operation": "lt", "value": 2}
            ],
            "varBinds":[['IF-MIB', 'ifOutDiscards']]
        }
    },
    {
        "_id": ObjectId(common_id),
        "in_profile":{
            "frequency": 10,
            "conditions":[
                {"field": "IF-MIB.ifDescr", "operation": "in", "value": ["eth0", "test value"]}
            ],
            "varBinds":[['IF-MIB', 'ifOutDiscards']]
        }
    },
    {
        "_id": ObjectId(common_id),
        "multiple_conditions":{
            "frequency": 10,
            "conditions":[
                {"field": "IF-MIB.ifIndex", "operation": "gt", "value": 1},
                {"field": "IF-MIB.ifDescr", "operation": "in", "value": ["eth0", "test value"]}
            ],
            "varBinds":[['IF-MIB', 'ifOutDiscards'],['IF-MIB', 'ifOutErrors'],['IF-MIB', 'ifOutOctets']]
        }
    }
]

inventory_collection = [
    {
        "_id": ObjectId(common_id),
        "address": "1.1.1.1",
        "port": 161,
        "version": "2c",
        "community": "public",
        "secret": "",
        "security_engine": "",
        "walk_interval": 1800,
        "profiles": "small_walk;in_profile",
        "smart_profiles": True,
        "delete": False
    },
    {
        "_id": ObjectId(common_id),
        "address": "group1",
        "port": 1161,
        "version": "2c",
        "community": "public",
        "secret": "",
        "security_engine": "",
        "walk_interval": 1800,
        "profiles": "single_metric;multiple_conditions",
        "smart_profiles": False,
        "delete": False
    }
]

discovery_collection = [
    {
        "_id": ObjectId(common_id),
        "name": "office-lan",
        "network_address": "10.0.0.0/24",
        "version": "2c",
        "port": 161,
        "community": "public",
        "secret": "",
        "security_engine": "",
        "frequency": 86400,
        "delete_already_discovered": False,
        "device_rules": [
            {"name": "routers", "patterns": "*Cisco IOS*", "group": "routers"},
            {"name": "linux", "patterns": "*Linux*", "group": "linux-hosts"},
        ],
    }
]

COLLECTION_DOCUMENTS = {
    "groups_ui": groups_collection,
    "profiles_ui": profiles_collection,
    "inventory_ui": inventory_collection,
    "discovery_ui": discovery_collection,
}


def find_documents(self, *args, **kwargs):
    return COLLECTION_DOCUMENTS.get(self.name, [])


def make_job_state(**fields):
    state = {"previous_job_start_time": None, "currently_scheduled": False, "task_id": None, "pending_revision": 0}
    state.update(fields)
    return state


values_patches = [
    mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.VALUES_DIRECTORY", VALUES_TEST_DIRECTORY),
    mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.TMP_DIR", VALUES_TEST_DIRECTORY),
    mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.VALUES_FILE", "values.yaml"),
    mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.KEEP_TEMP_FILES", "true"),
]


@pytest.fixture(autouse=True)
def values_files():
    """Redirects saving of values.yaml and section files to the test directory and cleans it up afterwards."""
    for patcher in values_patches:
        patcher.start()
    yield
    for patcher in values_patches:
        patcher.stop()
    delete_generated_files()
    delete_generated_discovery_file()
    reset_generated_values()


def delete_generated_discovery_file():
    path = os.path.join(VALUES_TEST_DIRECTORY, f"{TMP_FILE_PREFIX}discovery_autodiscovery.yaml")
    if os.path.exists(path):
        os.remove(path)


@pytest.fixture()
def jobs():
    """Mocks of the kubernetes job creation and the celery task, shared by the tests."""
    with mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.create_job") as m_create_job, \
            mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.get_job_config",
                       return_value=("job", "batch")) as m_get_job_config, \
            mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.run_job") as m_run_job, \
            mock.patch("pymongo.collection.Collection.find", autospec=True, side_effect=find_documents):
        yield SimpleNamespace(create_job=m_create_job, get_job_config=m_get_job_config, run_job=m_run_job)


def test_apply_changes_inventory_only_no_job_in_namespace(jobs, job_state, client):
    jobs.create_job.return_value = None

    response = client.post("/apply-changes")

    assert response.status_code == 200
    assert response.json == {"message": "Inventory: configuration will be updated in approximately 1 seconds."}
    jobs.get_job_config.assert_called_once_with("inventory")
    jobs.create_job.assert_called_once_with("batch", "job", "sc4snmp")
    assert not jobs.run_job.apply_async.called
    job_state.mark_applied.assert_called_once_with("inventory", 2, mock.ANY)
    # the pending revision is stored first, a created job clears the scheduling state
    job_state.set_job_state.assert_any_call("inventory", mock.ANY, pending_revision=2)
    job_state.set_job_state.assert_any_call("inventory", mock.ANY, previous_job_start_time=mock.ANY,
                                            currently_scheduled=False, task_id=None)
    reference_files, generated_files = return_generated_and_reference_files()
    for ref_f, gen_f in zip(reference_files, generated_files):
        assert ref_f == gen_f


def test_apply_changes_first_call_job_present_in_namespace(jobs, job_state, client):
    jobs.create_job.side_effect = ApiException()
    apply_async_result = Mock()
    apply_async_result.id = "id_val"
    jobs.run_job.apply_async.return_value = apply_async_result

    response = client.post("/apply-changes")

    assert response.json == {"message": "Inventory: configuration will be updated in approximately 300 seconds."}
    jobs.run_job.apply_async.assert_called_once_with(args=["inventory"], countdown=300, queue="apply_changes")
    job_state.set_job_state.assert_any_call("inventory", mock.ANY, currently_scheduled=True, task_id="id_val")
    assert not job_state.mark_applied.called


def test_apply_changes_job_currently_scheduled_job_present_in_namespace(jobs, job_state, client):
    now = datetime.datetime(2020, 7, 10, 10, 30, 0, 0)
    job_state.get_job_state.return_value = make_job_state(
        previous_job_start_time=datetime.datetime(2020, 7, 10, 10, 27, 10, 0), currently_scheduled=True,
        task_id="test_id")
    jobs.create_job.side_effect = ApiException()
    inspect_mock = Mock()
    inspect_mock.scheduled.return_value = {"worker1": [{"request": {"id": "test_id"}}]}
    fake_celery = Mock(control=Mock(inspect=Mock(return_value=inspect_mock)))

    with mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.datetime") as m_datetime, \
            mock.patch.dict(client.application.extensions, {"celery": fake_celery}):
        m_datetime.datetime.utcnow.return_value = now
        response = client.post("/apply-changes")

    assert response.json == {"message": "Inventory: configuration will be updated in approximately 130 seconds."}
    assert not jobs.run_job.apply_async.called


def test_apply_changes_stale_currently_scheduled_is_reset_and_rescheduled(jobs, job_state, client):
    """
    currently_scheduled can get stuck True in mongo if Redis (the Celery broker) was reset independently of this
    backend process. The recorded task_id is then unknown to every worker, so ScheduleHandler must reset the stuck
    flag and schedule a fresh job instead of leaving apply-changes permanently blocked.
    """
    now = datetime.datetime(2020, 7, 10, 10, 30, 0, 0)
    job_state.get_job_state.return_value = make_job_state(
        previous_job_start_time=datetime.datetime(2020, 7, 10, 10, 27, 10, 0), currently_scheduled=True,
        task_id="stale_task_id")
    jobs.create_job.side_effect = ApiException()
    apply_async_result = Mock()
    apply_async_result.id = "new_task_id"
    jobs.run_job.apply_async.return_value = apply_async_result
    inspect_mock = Mock()
    inspect_mock.scheduled.return_value = {}
    fake_celery = Mock(control=Mock(inspect=Mock(return_value=inspect_mock)))

    with mock.patch("SC4SNMP_UI_backend.apply_changes.handling_chain.datetime") as m_datetime, \
            mock.patch.dict(client.application.extensions, {"celery": fake_celery}):
        m_datetime.datetime.utcnow.return_value = now
        response = client.post("/apply-changes")

    job_state.set_job_state.assert_any_call("inventory", mock.ANY, currently_scheduled=False, task_id=None)
    job_state.set_job_state.assert_any_call("inventory", mock.ANY, currently_scheduled=True, task_id="new_task_id")
    jobs.run_job.apply_async.assert_called_once_with(args=["inventory"], countdown=130, queue="apply_changes")
    assert response.json == {"message": "Inventory: configuration will be updated in approximately 130 seconds."}


def test_apply_changes_runs_only_the_dirty_job(jobs, job_state, client):
    job_state.dirty_sections.return_value = ["discovery"]
    job_state.job_available.side_effect = lambda job_type: True
    job_state.get_revisions.return_value = {"inventory": (3, 3), "discovery": (5, 4)}
    jobs.create_job.return_value = None

    response = client.post("/apply-changes")

    assert response.json == {"message": "Discovery: configuration will be updated in approximately 1 seconds."}
    jobs.get_job_config.assert_called_once_with("discovery")
    job_state.mark_applied.assert_called_once_with("discovery", 5, mock.ANY)


@pytest.mark.parametrize(("section", "expected_files"), [
    ("discovery", {"discovery_autodiscovery.yaml"}),
    ("inventory", {"scheduler_groups.yaml", "scheduler_profiles.yaml", "poller_inventory.yaml"}),
])
def test_scoped_apply_saves_and_runs_only_the_requested_section(
        section, expected_files, jobs, job_state, client):
    job_state.dirty_sections.return_value = ["inventory", "discovery"]
    job_state.job_available.side_effect = lambda job_type: True
    job_state.discovery_seeded.return_value = True
    job_state.get_revisions.return_value = {"inventory": (3, 2), "discovery": (5, 4)}

    response = client.post("/apply-changes", query_string={"section": section})

    assert response.status_code == 200
    jobs.get_job_config.assert_called_once_with(section)
    revision = {"inventory": 3, "discovery": 5}[section]
    job_state.mark_applied.assert_called_once_with(section, revision, mock.ANY)
    assert response.json["message"].startswith(f"{section.capitalize()}:")
    generated_files = {
        filename.removeprefix(TMP_FILE_PREFIX)
        for filename in os.listdir(VALUES_TEST_DIRECTORY)
        if filename.startswith(TMP_FILE_PREFIX)
    }
    assert generated_files == expected_files


def test_scoped_apply_can_retry_when_only_the_other_section_is_dirty(jobs, job_state, client):
    job_state.dirty_sections.return_value = ["inventory"]
    job_state.job_available.side_effect = lambda job_type: True

    response = client.post("/apply-changes?section=discovery")

    assert response.status_code == 200
    jobs.get_job_config.assert_called_once_with("discovery")


def test_scoped_discovery_apply_with_no_manifest_does_not_run_inventory(jobs, job_state, client):
    response = client.post("/apply-changes?section=discovery")

    assert response.status_code == 200
    assert response.json["message"].startswith("Discovery: skipped")
    jobs.get_job_config.assert_not_called()


def test_invalid_apply_section_is_rejected(jobs, client):
    response = client.post("/apply-changes?section=unknown")

    assert response.status_code == 400
    jobs.get_job_config.assert_not_called()


def test_apply_changes_runs_both_jobs_independently(jobs, job_state, client):
    job_state.dirty_sections.return_value = ["inventory", "discovery"]
    job_state.job_available.side_effect = lambda job_type: True
    # the inventory job of the previous apply is still present, the discovery job can be created
    jobs.create_job.side_effect = [ApiException(), None]
    apply_async_result = Mock()
    apply_async_result.id = "id_val"
    jobs.run_job.apply_async.return_value = apply_async_result

    response = client.post("/apply-changes")

    assert [c.args[0] for c in jobs.get_job_config.call_args_list] == ["inventory", "discovery"]
    jobs.run_job.apply_async.assert_called_once_with(args=["inventory"], countdown=300, queue="apply_changes")
    job_state.mark_applied.assert_called_once_with("discovery", 1, mock.ANY)
    assert response.json == {"message": "Inventory: configuration will be updated in approximately 300 seconds. "
                                        "Discovery: configuration will be updated in approximately 1 seconds."}


def test_apply_changes_without_changes_reruns_all_available_jobs(jobs, job_state, client):
    job_state.dirty_sections.return_value = []
    job_state.job_available.side_effect = lambda job_type: True
    jobs.create_job.return_value = None

    response = client.post("/apply-changes")

    assert [c.args[0] for c in jobs.get_job_config.call_args_list] == ["inventory", "discovery"]
    assert "Inventory:" in response.json["message"] and "Discovery:" in response.json["message"]


def test_apply_changes_without_changes_skips_disabled_discovery_silently(jobs, job_state, client):
    job_state.dirty_sections.return_value = []
    jobs.create_job.return_value = None

    response = client.post("/apply-changes")

    jobs.get_job_config.assert_called_once_with("inventory")
    assert response.json == {"message": "Inventory: configuration will be updated in approximately 1 seconds."}


def test_apply_changes_reports_dirty_discovery_when_disabled(jobs, job_state, client):
    job_state.dirty_sections.return_value = ["discovery"]
    jobs.create_job.return_value = None

    response = client.post("/apply-changes")

    # nothing but the unavailable job is dirty, so the available jobs are rerun and discovery is reported
    jobs.get_job_config.assert_called_once_with("inventory")
    assert "Discovery: skipped" in response.json["message"]


def test_apply_changes_saves_discovery_section_as_mapping(jobs, job_state, client):
    job_state.job_available.side_effect = lambda job_type: True
    job_state.discovery_seeded.return_value = True
    jobs.create_job.return_value = None

    client.post("/apply-changes")

    yaml = ruamel.yaml.YAML()
    with open(os.path.join(VALUES_TEST_DIRECTORY, "values.yaml")) as file:
        values = yaml.load(file)
    autodiscovery = values["discovery"]["autodiscovery"]
    # values.schema.json declares autodiscovery as an object, a literal string would fail the helm upgrade
    assert not isinstance(autodiscovery, str)
    assert autodiscovery["office-lan"]["network_address"] == "10.0.0.0/24"
    assert [rule["name"] for rule in autodiscovery["office-lan"]["device_rules"]] == ["routers", "linux"]
    assert "_id" not in autodiscovery["office-lan"] and "name" not in autodiscovery["office-lan"]


def test_apply_changes_does_not_write_discovery_before_it_was_seeded(jobs, job_state, client):
    job_state.job_available.side_effect = lambda job_type: True
    job_state.discovery_seeded.return_value = False
    jobs.create_job.return_value = None

    client.post("/apply-changes")

    yaml = ruamel.yaml.YAML()
    with open(os.path.join(VALUES_TEST_DIRECTORY, "values.yaml")) as file:
        values = yaml.load(file)
    assert "discovery" not in values


def test_apply_changes_accepts_post_without_body(jobs, job_state, client):
    jobs.create_job.return_value = None

    response = client.post("/apply-changes", data="", content_type=None)

    assert response.status_code == 200


def test_apply_changes_returns_message_when_discovery_job_is_not_configured(jobs, job_state, client):
    from SC4SNMP_UI_backend.apply_changes.tasks import JobNotConfiguredException
    job_state.dirty_sections.return_value = ["inventory", "discovery"]
    job_state.job_available.side_effect = lambda job_type: True
    jobs.get_job_config.side_effect = JobNotConfiguredException("discovery")

    response = client.post("/apply-changes")

    assert response.status_code == 400
    assert response.json == {"message": "Kubernetes job configuration for discovery is not available."}

