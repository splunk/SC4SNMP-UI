from unittest import mock

import pytest
from kubernetes.client import ApiException

from SC4SNMP_UI_backend.apply_changes import tasks

JOB_YAML = "apiVersion: batch/v1\nkind: Job\nmetadata:\n  name: j\n"


def test_discovery_job_is_unavailable_when_manifest_is_missing(tmp_path, monkeypatch):
    monkeypatch.setattr(tasks, "DISCOVERY_JOB_CONFIG_PATH", str(tmp_path / "missing.yaml"))

    assert tasks.job_available("discovery") is False
    assert tasks.job_available("inventory") is True
    with pytest.raises(tasks.JobNotConfiguredException):
        tasks.get_job_config("discovery")


def test_each_job_type_reads_its_own_manifest(tmp_path, monkeypatch):
    inventory_path = tmp_path / "job_config.yaml"
    discovery_path = tmp_path / "discovery_job_config.yaml"
    inventory_path.write_text(JOB_YAML)
    discovery_path.write_text(JOB_YAML)
    monkeypatch.setattr(tasks, "JOB_CONFIG_PATH", str(inventory_path))
    monkeypatch.setattr(tasks, "DISCOVERY_JOB_CONFIG_PATH", str(discovery_path))
    opened = []
    real_open = open

    def tracking_open(path, *args, **kwargs):
        opened.append(str(path))
        return real_open(path, *args, **kwargs)

    with mock.patch("builtins.open", tracking_open), mock.patch.object(tasks.config, "load_incluster_config"), \
            mock.patch.object(tasks.client, "BatchV1Api"), \
            mock.patch.object(tasks, "create_job_object", side_effect=lambda cfg: cfg):
        tasks.get_job_config("inventory")
        tasks.get_job_config("discovery")

    assert opened == [str(inventory_path), str(discovery_path)]


@pytest.fixture()
def run_job_env(monkeypatch):
    monkeypatch.setattr(tasks, "JOB_CREATION_RETRIES", 2)
    connection = mock.MagicMock()
    connection.__enter__.return_value = connection
    with mock.patch.object(tasks, "get_job_config", return_value=("job", "batch")), \
            mock.patch.object(tasks, "MongoClient", return_value=connection), \
            mock.patch.object(tasks, "get_job_state", return_value={"pending_revision": 7}), \
            mock.patch.object(tasks, "set_job_state") as set_state, \
            mock.patch.object(tasks, "mark_applied") as mark_applied, \
            mock.patch.object(tasks, "create_job") as create_job, \
            mock.patch.object(tasks.time, "sleep"):
        yield mock.Mock(create_job=create_job, set_state=set_state, mark_applied=mark_applied)


def test_run_job_marks_pending_revision_as_applied(run_job_env):
    tasks.run_job("discovery")

    run_job_env.create_job.assert_called_once_with("batch", "job", tasks.JOB_NAMESPACE)
    run_job_env.mark_applied.assert_called_once_with("discovery", 7, mock.ANY)
    assert run_job_env.set_state.call_args.kwargs["currently_scheduled"] is False


def test_run_job_gives_up_without_marking_applied(run_job_env):
    run_job_env.create_job.side_effect = ApiException()

    tasks.run_job("inventory")

    assert run_job_env.create_job.call_count == 2
    assert not run_job_env.mark_applied.called
    # the section stays dirty and the scheduling state is released, so that Apply can be repeated
    run_job_env.set_state.assert_called_with("inventory", mock.ANY, currently_scheduled=False, task_id=None)
