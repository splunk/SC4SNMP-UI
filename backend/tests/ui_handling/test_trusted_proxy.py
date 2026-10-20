import pytest
from flask_limiter.util import get_remote_address

FORWARDED = {"X-Forwarded-For": "203.0.113.7"}


def _probe_ip(app):
    @app.route("/_probe_ip")
    def probe_ip():
        return get_remote_address()

    return app.test_client().get("/_probe_ip", headers=FORWARDED, environ_base={"REMOTE_ADDR": "10.0.0.5"})


def test_forwarded_for_ignored_by_default(app):
    assert _probe_ip(app).get_data(as_text=True) == "10.0.0.5"


def test_forwarded_for_honored_with_trusted_proxy(monkeypatch):
    import SC4SNMP_UI_backend
    from unittest import mock

    monkeypatch.setenv("TRUSTED_PROXY_COUNT", "1")
    with mock.patch("SC4SNMP_UI_backend.wait_for_mongodb_replicaset"):
        app = SC4SNMP_UI_backend.create_app()
    assert _probe_ip(app).get_data(as_text=True) == "203.0.113.7"


@pytest.mark.parametrize("value", ["abc", "-1", "1.5"])
def test_invalid_trusted_proxy_count_raises(monkeypatch, value):
    import SC4SNMP_UI_backend
    from unittest import mock

    monkeypatch.setenv("TRUSTED_PROXY_COUNT", value)
    with mock.patch("SC4SNMP_UI_backend.wait_for_mongodb_replicaset"):
        with pytest.raises(ValueError, match="TRUSTED_PROXY_COUNT"):
            SC4SNMP_UI_backend.create_app()
