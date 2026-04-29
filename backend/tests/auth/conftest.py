import os
import pytest
from argon2 import PasswordHasher


TEST_USERNAME = "testadmin"
TEST_PASSWORD = "testpassword123"
TEST_JWT_SECRET = "test-jwt-secret-for-unit-tests-only"

_ph = PasswordHasher()
TEST_PASSWORD_HASH = _ph.hash(TEST_PASSWORD)


@pytest.fixture(autouse=True)
def auth_env_vars(monkeypatch, tmp_path):
    monkeypatch.setenv("AUTH_ENABLED", "true")
    monkeypatch.setenv("AUTH_USERNAME", TEST_USERNAME)
    monkeypatch.setenv("AUTH_PASSWORD_HASH", TEST_PASSWORD_HASH)
    monkeypatch.setenv("JWT_SECRET", TEST_JWT_SECRET)
    monkeypatch.setenv("SECURE_COOKIES", "false")
    monkeypatch.setenv("VALUES_DIRECTORY", str(tmp_path))
    monkeypatch.setenv("MONGO_URI", "mongodb://localhost:27017/test")
    monkeypatch.setenv("REDIS_URL", "memory://")
    monkeypatch.setenv("MONGODB_MODE", "standalone")


@pytest.fixture()
def app(auth_env_vars):
    # Ensure auth.utils and all blueprint modules re-read AUTH_ENABLED and
    # re-decorate routes via @login_required against the freshly-reloaded
    # utils module. This matters because Python caches modules in sys.modules;
    # without reloading, @login_required closures may still point at a prior
    # test run's utils module (with stale AUTH_ENABLED).
    import importlib
    import sys

    for mod_name in (
        "SC4SNMP_UI_backend.auth.utils",
        "SC4SNMP_UI_backend.auth.routes",
        "SC4SNMP_UI_backend.profiles.routes",
        "SC4SNMP_UI_backend.groups.routes",
        "SC4SNMP_UI_backend.inventory.routes",
        "SC4SNMP_UI_backend.apply_changes.routes",
    ):
        if mod_name in sys.modules:
            importlib.reload(sys.modules[mod_name])

    from unittest import mock
    with mock.patch("SC4SNMP_UI_backend.wait_for_mongodb_replicaset"):
        # Do NOT mock pymongo.MongoClient. Tests rely on
        # @mock.patch("pymongo.collection.Collection.<method>") which only
        # works when `mongo_client.sc4snmp.*` returns a real Collection
        # instance. MongoClient is lazy so constructing against a fake URI
        # is safe.
        import SC4SNMP_UI_backend
        importlib.reload(SC4SNMP_UI_backend)
        # Re-reload route modules after package reload so they pick up the
        # fresh mongo_client/limiter globals.
        for mod_name in (
            "SC4SNMP_UI_backend.auth.utils",
            "SC4SNMP_UI_backend.auth.routes",
            "SC4SNMP_UI_backend.profiles.routes",
            "SC4SNMP_UI_backend.groups.routes",
            "SC4SNMP_UI_backend.inventory.routes",
            "SC4SNMP_UI_backend.apply_changes.routes",
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
    return app.test_client()
