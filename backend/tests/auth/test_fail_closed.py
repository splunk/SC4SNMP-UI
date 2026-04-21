import importlib
import pytest
from unittest import mock


def test_fail_closed_missing_username(monkeypatch, tmp_path):
    monkeypatch.setenv("AUTH_ENABLED", "true")
    monkeypatch.delenv("AUTH_USERNAME", raising=False)
    monkeypatch.setenv("AUTH_PASSWORD_HASH", "somehash")
    monkeypatch.setenv("JWT_SECRET", "somesecret")
    monkeypatch.setenv("VALUES_DIRECTORY", str(tmp_path))
    monkeypatch.setenv("MONGO_URI", "mongodb://localhost:27017/test")
    monkeypatch.setenv("MONGODB_MODE", "standalone")

    with mock.patch("SC4SNMP_UI_backend.wait_for_mongodb_replicaset"):
        with mock.patch("pymongo.MongoClient"):
            import SC4SNMP_UI_backend
            importlib.reload(SC4SNMP_UI_backend)
            with pytest.raises(SC4SNMP_UI_backend.AuthNotConfiguredException):
                SC4SNMP_UI_backend.create_app()


def test_fail_closed_missing_jwt_secret(monkeypatch, tmp_path):
    monkeypatch.setenv("AUTH_ENABLED", "true")
    monkeypatch.setenv("AUTH_USERNAME", "admin")
    monkeypatch.setenv("AUTH_PASSWORD_HASH", "somehash")
    monkeypatch.delenv("JWT_SECRET", raising=False)
    monkeypatch.setenv("VALUES_DIRECTORY", str(tmp_path))
    monkeypatch.setenv("MONGO_URI", "mongodb://localhost:27017/test")
    monkeypatch.setenv("MONGODB_MODE", "standalone")

    with mock.patch("SC4SNMP_UI_backend.wait_for_mongodb_replicaset"):
        with mock.patch("pymongo.MongoClient"):
            import SC4SNMP_UI_backend
            importlib.reload(SC4SNMP_UI_backend)
            with pytest.raises(SC4SNMP_UI_backend.AuthNotConfiguredException):
                SC4SNMP_UI_backend.create_app()


def test_auth_disabled_allows_startup(monkeypatch, tmp_path):
    monkeypatch.setenv("AUTH_ENABLED", "false")
    monkeypatch.delenv("AUTH_USERNAME", raising=False)
    monkeypatch.delenv("AUTH_PASSWORD_HASH", raising=False)
    monkeypatch.delenv("JWT_SECRET", raising=False)
    monkeypatch.setenv("VALUES_DIRECTORY", str(tmp_path))
    monkeypatch.setenv("MONGO_URI", "mongodb://localhost:27017/test")
    monkeypatch.setenv("MONGODB_MODE", "standalone")

    with mock.patch("SC4SNMP_UI_backend.wait_for_mongodb_replicaset"):
        with mock.patch("pymongo.MongoClient"):
            import SC4SNMP_UI_backend
            importlib.reload(SC4SNMP_UI_backend)
            app = SC4SNMP_UI_backend.create_app()
            assert app is not None
