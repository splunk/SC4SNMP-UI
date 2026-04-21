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
    import importlib
    import SC4SNMP_UI_backend.auth.utils as utils_mod
    importlib.reload(utils_mod)

    from unittest import mock
    with mock.patch("SC4SNMP_UI_backend.wait_for_mongodb_replicaset"):
        with mock.patch("pymongo.MongoClient"):
            import SC4SNMP_UI_backend
            importlib.reload(SC4SNMP_UI_backend)
            app = SC4SNMP_UI_backend.create_app()
            app.config.update({"TESTING": True})
            yield app


@pytest.fixture()
def client(app):
    return app.test_client()
