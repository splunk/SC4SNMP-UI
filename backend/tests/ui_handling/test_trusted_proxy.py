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


def test_forwarded_proto_is_not_trusted(monkeypatch):
    import SC4SNMP_UI_backend
    from unittest import mock
    from flask import request

    monkeypatch.setenv("TRUSTED_PROXY_COUNT", "1")
    with mock.patch("SC4SNMP_UI_backend.wait_for_mongodb_replicaset"):
        app = SC4SNMP_UI_backend.create_app()

    @app.route("/_probe_scheme")
    def probe_scheme():
        return request.scheme

    response = app.test_client().get(
        "/_probe_scheme", headers={"X-Forwarded-For": "203.0.113.7", "X-Forwarded-Proto": "abc"}
    )
    assert response.get_data(as_text=True) == "http"


def _app_with(monkeypatch, count="1", cidrs=None):
    import SC4SNMP_UI_backend
    from unittest import mock

    monkeypatch.setenv("TRUSTED_PROXY_COUNT", count)
    if cidrs is not None:
        monkeypatch.setenv("TRUSTED_PROXY_CIDRS", cidrs)
    with mock.patch("SC4SNMP_UI_backend.wait_for_mongodb_replicaset"):
        return SC4SNMP_UI_backend.create_app()


def _ip_seen(app, peer, header="203.0.113.7"):
    if "probe_peer" not in app.view_functions:
        app.add_url_rule("/_probe_peer", "probe_peer", lambda: get_remote_address())

    return app.test_client().get(
        "/_probe_peer", headers={"X-Forwarded-For": header}, environ_base={"REMOTE_ADDR": peer}
    ).get_data(as_text=True)


def test_header_trusted_only_from_listed_peer(monkeypatch):
    app = _app_with(monkeypatch, cidrs="10.1.5.0/24")
    assert _ip_seen(app, "10.1.5.9") == "203.0.113.7"      # frontend nginx: header honoured
    assert _ip_seen(app, "10.1.9.9") == "10.1.9.9"          # any other pod: real address, header ignored


def test_ipv4_mapped_peer_is_matched(monkeypatch):
    app = _app_with(monkeypatch, cidrs="10.1.5.0/24")
    assert _ip_seen(app, "::ffff:10.1.5.9") == "203.0.113.7"
    assert _ip_seen(app, "::ffff:10.1.9.9") == "::ffff:10.1.9.9"


def test_multiple_cidrs_and_single_addresses(monkeypatch):
    app = _app_with(monkeypatch, cidrs="10.1.5.0/24, 192.168.1.4, fd00::/8")
    assert _ip_seen(app, "192.168.1.4") == "203.0.113.7"
    assert _ip_seen(app, "fd00::10") == "203.0.113.7"
    assert _ip_seen(app, "192.168.1.5") == "192.168.1.5"


def test_cidrs_ignored_when_count_is_zero(monkeypatch):
    app = _app_with(monkeypatch, count="0", cidrs="10.1.5.0/24")
    assert _ip_seen(app, "10.1.5.9") == "10.1.5.9"


@pytest.mark.parametrize("value", ["not-an-ip", "10.0.0.0/99", "10.0.0.1;x"])
def test_invalid_cidrs_raise(monkeypatch, value):
    with pytest.raises(ValueError, match="TRUSTED_PROXY_CIDRS"):
        _app_with(monkeypatch, cidrs=value)


def test_spoofed_header_from_unlisted_peer_cannot_rotate_rate_limit(monkeypatch):
    app = _app_with(monkeypatch, cidrs="10.1.5.0/24")
    seen = {_ip_seen(app, "10.1.9.9", header=f"198.51.100.{i}") for i in range(5)}
    assert seen == {"10.1.9.9"}
