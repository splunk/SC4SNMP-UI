import importlib
import time

from tests.auth.conftest import TEST_USERNAME, TEST_PASSWORD


def test_verify_login_correct_credentials():
    import SC4SNMP_UI_backend.auth.utils as utils_mod
    importlib.reload(utils_mod)
    assert utils_mod.verify_login(TEST_USERNAME, TEST_PASSWORD) is True


def test_verify_login_wrong_password():
    import SC4SNMP_UI_backend.auth.utils as utils_mod
    importlib.reload(utils_mod)
    assert utils_mod.verify_login(TEST_USERNAME, "wrongpass") is False


def test_verify_login_wrong_username():
    import SC4SNMP_UI_backend.auth.utils as utils_mod
    importlib.reload(utils_mod)
    assert utils_mod.verify_login("wronguser", TEST_PASSWORD) is False


def test_verify_login_timing_similarity():
    """Both wrong-username and wrong-password paths should take similar time."""
    import SC4SNMP_UI_backend.auth.utils as utils_mod
    importlib.reload(utils_mod)

    iterations = 3
    wrong_user_times = []
    wrong_pass_times = []

    for _ in range(iterations):
        start = time.perf_counter()
        utils_mod.verify_login("nonexistent_user", "somepassword")
        wrong_user_times.append(time.perf_counter() - start)

        start = time.perf_counter()
        utils_mod.verify_login(TEST_USERNAME, "wrongpassword")
        wrong_pass_times.append(time.perf_counter() - start)

    avg_wrong_user = sum(wrong_user_times) / len(wrong_user_times)
    avg_wrong_pass = sum(wrong_pass_times) / len(wrong_pass_times)

    ratio = max(avg_wrong_user, avg_wrong_pass) / max(min(avg_wrong_user, avg_wrong_pass), 0.0001)
    assert ratio < 5.0, f"Timing difference too large: {avg_wrong_user:.4f}s vs {avg_wrong_pass:.4f}s"


def test_create_and_decode_token():
    import SC4SNMP_UI_backend.auth.utils as utils_mod
    importlib.reload(utils_mod)

    token = utils_mod.create_token(TEST_USERNAME)
    assert isinstance(token, str)

    import jwt
    payload = jwt.decode(token, utils_mod.JWT_SECRET, algorithms=["HS256"])
    assert payload["sub"] == TEST_USERNAME
    assert "exp" in payload
    assert "iat" in payload
    assert "idle_exp" in payload


def test_token_has_correct_expiry():
    import SC4SNMP_UI_backend.auth.utils as utils_mod
    importlib.reload(utils_mod)

    before = time.time()
    token = utils_mod.create_token(TEST_USERNAME)
    after = time.time()

    import jwt
    payload = jwt.decode(token, utils_mod.JWT_SECRET, algorithms=["HS256"])

    expected_exp = utils_mod.JWT_EXPIRY_HOURS * 3600
    assert payload["exp"] - payload["iat"] == expected_exp

    expected_idle = utils_mod.IDLE_TIMEOUT_MINUTES * 60
    assert abs((payload["idle_exp"] - payload["iat"]) - expected_idle) < 2


def test_refresh_token_keeps_exp():
    import SC4SNMP_UI_backend.auth.utils as utils_mod
    importlib.reload(utils_mod)

    token = utils_mod.create_token(TEST_USERNAME)
    import jwt
    original_payload = jwt.decode(token, utils_mod.JWT_SECRET, algorithms=["HS256"])

    time.sleep(0.1)
    new_token = utils_mod.refresh_token_payload(original_payload)
    new_payload = jwt.decode(new_token, utils_mod.JWT_SECRET, algorithms=["HS256"])

    assert new_payload["exp"] == original_payload["exp"]
    assert new_payload["sub"] == original_payload["sub"]
    assert new_payload["idle_exp"] >= original_payload["idle_exp"]
