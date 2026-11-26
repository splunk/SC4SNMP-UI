import pytest


@pytest.fixture(autouse=True)
def _disable_auth(monkeypatch, tmp_path):
    # These tests exercise the UI handlers, not authentication. Disable auth so
    # create_app() does not require AUTH_USERNAME / AUTH_PASSWORD_HASH /
    # JWT_SECRET to be present in the environment.
    monkeypatch.setenv("AUTH_ENABLED", "false")
    monkeypatch.setenv("SECURE_COOKIES", "false")
    monkeypatch.setenv("MONGODB_MODE", "standalone")
    monkeypatch.setenv("VALUES_DIRECTORY", str(tmp_path))
    monkeypatch.setenv("MONGO_URI", "mongodb://localhost:27017/test")
    monkeypatch.setenv("REDIS_URL", "memory://")


@pytest.fixture(autouse=True)
def mark_dirty():
    """
    Routes register edits of a section with change_tracking.mark_section_dirty, which writes to the config record in
    mongo. Handler tests don't need mongo for that, so it is replaced with a mock that tests can inspect. The patch is
    active before the app fixture reloads the route modules, so they bind to the mock.
    """
    from unittest import mock
    with mock.patch("SC4SNMP_UI_backend.common.change_tracking.mark_section_dirty") as marker:
        yield marker


@pytest.fixture(autouse=True)
def job_state():
    """
    Replaces the mongo-backed revisions and per-job state used by the apply flow. By default only the inventory section
    has unapplied changes, the discovery job is not available (discovery disabled) and no job is currently scheduled.
    Tests can change the return values of the returned mocks.
    """
    from types import SimpleNamespace
    from unittest import mock
    apply_mod = "SC4SNMP_UI_backend.apply_changes.apply_changes"
    chain_mod = "SC4SNMP_UI_backend.apply_changes.handling_chain"
    patches = {
        "ensure_config_record": mock.patch(f"{apply_mod}.ensure_config_record"),
        "get_revisions": mock.patch(f"{apply_mod}.get_revisions",
                                    return_value={"inventory": (2, 1), "discovery": (1, 1)}),
        "dirty_sections": mock.patch(f"{apply_mod}.dirty_sections", return_value=["inventory"]),
        "job_available": mock.patch(f"{apply_mod}.job_available", side_effect=lambda job_type: job_type == "inventory"),
        "discovery_seeded": mock.patch(f"{apply_mod}.discovery_seeded", return_value=False),
        "get_job_state": mock.patch(f"{chain_mod}.get_job_state", return_value={
            "previous_job_start_time": None, "currently_scheduled": False, "task_id": None, "pending_revision": 0}),
        "set_job_state": mock.patch(f"{chain_mod}.set_job_state"),
        "mark_applied": mock.patch(f"{chain_mod}.mark_applied"),
    }
    started = {name: patcher.start() for name, patcher in patches.items()}
    yield SimpleNamespace(**started)
    for patcher in patches.values():
        patcher.stop()


@pytest.fixture()
def app(_disable_auth, mark_dirty):
    # The auth module-level constant AUTH_ENABLED is captured at import time.
    # The route modules apply @login_required at import time, capturing a
    # closure over auth.utils' module globals. If tests/auth/* ran first,
    # those routes are bound to AUTH_ENABLED=True. We must reload auth.utils
    # first, then reload every blueprint module so the decorators re-bind to
    # the new (AUTH_ENABLED=False) utils module.
    import importlib
    import sys

    for mod_name in (
        "SC4SNMP_UI_backend.auth.utils",
        "SC4SNMP_UI_backend.auth.routes",
        "SC4SNMP_UI_backend.profiles.routes",
        "SC4SNMP_UI_backend.groups.routes",
        "SC4SNMP_UI_backend.inventory.routes",
        "SC4SNMP_UI_backend.apply_changes.routes",
        "SC4SNMP_UI_backend.discovery.routes",
    ):
        if mod_name in sys.modules:
            importlib.reload(sys.modules[mod_name])

    from unittest import mock
    with mock.patch("SC4SNMP_UI_backend.wait_for_mongodb_replicaset"):
        # Do NOT mock pymongo.MongoClient here. Tests rely on
        # @mock.patch("pymongo.collection.Collection.find") which only works
        # when `mongo_client.sc4snmp.profiles_ui` is a real Collection
        # instance. MongoClient is lazy and does not open a connection until
        # a command runs, so constructing it against a fake URI is safe.
        import SC4SNMP_UI_backend
        importlib.reload(SC4SNMP_UI_backend)
        # Re-reload route modules after SC4SNMP_UI_backend reload so they
        # pick up the fresh mongo_client/limiter globals.
        for mod_name in (
            "SC4SNMP_UI_backend.auth.utils",
            "SC4SNMP_UI_backend.auth.routes",
            "SC4SNMP_UI_backend.profiles.routes",
            "SC4SNMP_UI_backend.groups.routes",
            "SC4SNMP_UI_backend.inventory.routes",
            "SC4SNMP_UI_backend.apply_changes.routes",
            "SC4SNMP_UI_backend.discovery.routes",
        ):
            if mod_name in sys.modules:
                importlib.reload(sys.modules[mod_name])
        app = SC4SNMP_UI_backend.create_app()
        app.config.update({"TESTING": True})

        # Flask-Limiter reads RATELIMIT_ENABLED during init_app(), which
        # runs inside create_app(). Setting the config after the fact is
        # too late, so disable the limiter directly on the instance. The
        # /auth/login route has a 5/minute rate limit with in-memory
        # storage that persists across tests, otherwise causing 429s.
        from SC4SNMP_UI_backend import limiter
        limiter.enabled = False

        yield app


@pytest.fixture()
def client(app):
    client = app.test_client()
    # The backend enforces the CSRF header (X-Requested-With) on state-changing
    # requests even when AUTH_ENABLED is false. Set it once so existing tests
    # don't need to add it to every POST/PUT/DELETE/PATCH call.
    client.environ_base["HTTP_X_REQUESTED_WITH"] = "XMLHttpRequest"
    return client


@pytest.fixture()
def runner(app):
    return app.test_cli_runner()
