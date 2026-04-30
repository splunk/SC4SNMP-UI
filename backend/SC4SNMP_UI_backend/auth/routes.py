from flask import Blueprint, jsonify, request, make_response

from SC4SNMP_UI_backend.auth.utils import (
    verify_login,
    create_token,
    make_cookie_kwargs,
    login_required,
    log_auth_event,
    COOKIE_NAME,
    AUTH_ENABLED,
    JWT_EXPIRY_HOURS,
)
from SC4SNMP_UI_backend import limiter

auth_blueprint = Blueprint("auth_blueprint", __name__, url_prefix="/auth")


@auth_blueprint.after_request
def add_cache_control(response):
    response.headers["Cache-Control"] = "no-store"
    return response


@auth_blueprint.route("/login", methods=["POST"])
@limiter.limit("5/minute")
def login():
    if not AUTH_ENABLED:
        return jsonify({"message": "Authentication is disabled"}), 404

    data = request.get_json(silent=True) or {}
    username = data.get("username", "")
    password = data.get("password", "")

    if verify_login(username, password):
        token = create_token(username)
        resp = make_response(jsonify({"username": username}))
        resp.set_cookie(**make_cookie_kwargs(token, max_age=JWT_EXPIRY_HOURS * 3600))
        log_auth_event("auth.login.success", username=username)
        return resp

    log_auth_event("auth.login.failure", username=username)
    return jsonify({"message": "Invalid username or password"}), 401


@auth_blueprint.route("/logout", methods=["POST"])
def logout():
    resp = make_response(jsonify({"message": "Logged out"}))
    resp.delete_cookie(COOKIE_NAME, path="/")
    log_auth_event("auth.logout")
    return resp


@auth_blueprint.route("/status", methods=["GET"])
@login_required
def status():
    from flask import g

    return jsonify({"username": g.current_user})
