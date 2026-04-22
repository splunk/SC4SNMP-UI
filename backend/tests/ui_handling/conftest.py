import pytest
from SC4SNMP_UI_backend import create_app


@pytest.fixture(autouse=True)
def _disable_auth(monkeypatch):
    # These tests exercise the UI handlers, not authentication. Disable auth so
    # create_app() does not require AUTH_USERNAME / AUTH_PASSWORD_HASH /
    # JWT_SECRET to be present in the environment.
    monkeypatch.setenv("AUTH_ENABLED", "false")


@pytest.fixture()
def app(_disable_auth):
    app = create_app()
    app.config.update({
        "TESTING": True,
    })
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