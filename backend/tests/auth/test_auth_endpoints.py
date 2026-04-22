import time
from unittest import mock

from tests.auth.conftest import TEST_USERNAME, TEST_PASSWORD


def test_login_success(client):
    response = client.post(
        "/auth/login",
        json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
    )
    assert response.status_code == 200
    assert response.json["username"] == TEST_USERNAME
    assert client.get_cookie("id") is not None


def test_login_wrong_password(client):
    response = client.post(
        "/auth/login",
        json={"username": TEST_USERNAME, "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json["message"] == "Invalid username or password"


def test_login_wrong_username(client):
    response = client.post(
        "/auth/login",
        json={"username": "nonexistent", "password": TEST_PASSWORD},
    )
    assert response.status_code == 401
    assert response.json["message"] == "Invalid username or password"


def test_login_empty_body(client):
    response = client.post("/auth/login", json={})
    assert response.status_code == 401


def test_logout(client):
    client.post(
        "/auth/login",
        json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
    )
    response = client.post("/auth/logout")
    assert response.status_code == 200
    assert response.json["message"] == "Logged out"


def test_status_authenticated(client):
    client.post(
        "/auth/login",
        json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
    )
    response = client.get("/auth/status")
    assert response.status_code == 200
    assert response.json["username"] == TEST_USERNAME


def test_status_unauthenticated(client):
    response = client.get("/auth/status")
    assert response.status_code == 401


def test_cache_control_on_auth_responses(client):
    response = client.post(
        "/auth/login",
        json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
    )
    assert response.headers.get("Cache-Control") == "no-store"

    response = client.get("/auth/status")
    assert response.headers.get("Cache-Control") == "no-store"

    response = client.post("/auth/logout")
    assert response.headers.get("Cache-Control") == "no-store"


def test_protected_route_returns_401_without_cookie(client):
    with mock.patch("pymongo.collection.Collection.count_documents", return_value=5):
        response = client.get("/profiles/count")
    assert response.status_code == 401


def test_protected_route_accessible_with_cookie(client):
    client.post(
        "/auth/login",
        json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
    )
    with mock.patch("pymongo.collection.Collection.count_documents", return_value=5):
        response = client.get("/profiles/count")
    assert response.status_code == 200


def test_csrf_header_required_on_post(client):
    client.post(
        "/auth/login",
        json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
    )
    with mock.patch("pymongo.collection.Collection.find", return_value=[]):
        response = client.post(
            "/profiles/add",
            json={"profileName": "test"},
        )
    assert response.status_code == 403
    assert response.json["message"] == "Missing required header"


def test_csrf_header_allows_post(client):
    client.post(
        "/auth/login",
        json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
    )
    with mock.patch("pymongo.collection.Collection.find", return_value=[]):
        with mock.patch("pymongo.collection.Collection.insert_one"):
            response = client.post(
                "/profiles/add",
                json={
                    "profileName": "test",
                    "frequency": 10,
                    "conditions": {
                        "condition": "standard",
                        "field": "",
                        "patterns": None,
                    },
                    "varBinds": [],
                },
                headers={"X-Requested-With": "XMLHttpRequest"},
            )
    assert response.status_code == 200


def test_idle_timeout_rejection(client):
    client.post(
        "/auth/login",
        json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
    )

    with mock.patch("SC4SNMP_UI_backend.auth.utils.time") as mock_time:
        mock_time.time.return_value = time.time() + 3600
        with mock.patch("pymongo.collection.Collection.count_documents", return_value=5):
            response = client.get("/profiles/count")
    assert response.status_code == 401
    assert "inactivity" in response.json["message"]


def test_expired_token_rejection(client):
    import SC4SNMP_UI_backend.auth.utils as utils_mod
    original_hours = utils_mod.JWT_EXPIRY_HOURS
    original_minutes = utils_mod.IDLE_TIMEOUT_MINUTES

    utils_mod.JWT_EXPIRY_HOURS = 0
    utils_mod.IDLE_TIMEOUT_MINUTES = 0
    try:
        client.post(
            "/auth/login",
            json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
        )
        time.sleep(1)
        with mock.patch("pymongo.collection.Collection.count_documents", return_value=5):
            response = client.get("/profiles/count")
        assert response.status_code == 401
    finally:
        utils_mod.JWT_EXPIRY_HOURS = original_hours
        utils_mod.IDLE_TIMEOUT_MINUTES = original_minutes
