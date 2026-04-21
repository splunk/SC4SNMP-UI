import hmac
import json
import logging
import time
from datetime import datetime, timezone
from functools import wraps

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
from flask import request, jsonify, g

import os

log = logging.getLogger("gunicorn.error")

COOKIE_NAME = "id"

AUTH_ENABLED = os.getenv("AUTH_ENABLED", "true").lower() == "true"
AUTH_USERNAME = os.getenv("AUTH_USERNAME", "")
AUTH_PASSWORD_HASH = os.getenv("AUTH_PASSWORD_HASH", "")
JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", "2"))
IDLE_TIMEOUT_MINUTES = int(os.getenv("IDLE_TIMEOUT_MINUTES", "30"))
SECURE_COOKIES = os.getenv("SECURE_COOKIES", "true").lower() == "true"

_ph = PasswordHasher()
DUMMY_HASH = _ph.hash("dummy-constant-time-padding")


def log_auth_event(event_type, **kwargs):
    entry = {
        "event": event_type,
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        "source_ip": request.remote_addr if request else None,
    }
    entry.update(kwargs)
    log.info(json.dumps(entry))


def verify_login(username, password):
    if hmac.compare_digest(username, AUTH_USERNAME):
        try:
            return _ph.verify(AUTH_PASSWORD_HASH, password)
        except (VerifyMismatchError, VerificationError, InvalidHashError):
            return False
    else:
        try:
            _ph.verify(DUMMY_HASH, password)
        except (VerifyMismatchError, VerificationError, InvalidHashError):
            pass
        return False


def create_token(username):
    now = time.time()
    payload = {
        "sub": username,
        "iat": now,
        "exp": now + JWT_EXPIRY_HOURS * 3600,
        "idle_exp": now + IDLE_TIMEOUT_MINUTES * 60,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def refresh_token_payload(payload):
    new_payload = dict(payload)
    new_payload["idle_exp"] = time.time() + IDLE_TIMEOUT_MINUTES * 60
    return jwt.encode(new_payload, JWT_SECRET, algorithm="HS256")


def make_cookie_kwargs(token, max_age=None):
    kwargs = {
        "key": COOKIE_NAME,
        "value": token,
        "httponly": True,
        "samesite": "Lax",
        "path": "/",
    }
    if max_age is not None:
        kwargs["max_age"] = max_age
    if SECURE_COOKIES:
        kwargs["secure"] = True
    return kwargs


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Always enforce CSRF-like header check on state-changing methods,
        # even when user authentication is disabled, to mitigate CSRF.
        if request.method in ("POST", "PUT", "DELETE", "PATCH"):
            if not request.headers.get("X-Requested-With"):
                return jsonify({"message": "Missing required header"}), 403

        if not AUTH_ENABLED:
            g.current_user = "anonymous"
            g.token_payload = None
            g.refresh_token = False
            return f(*args, **kwargs)

        token = request.cookies.get(COOKIE_NAME)
        if not token:
            return jsonify({"message": "Authentication required"}), 401
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            log_auth_event("auth.token.invalid")
            return jsonify({"message": "Invalid or expired token"}), 401

        idle_exp = payload.get("idle_exp", 0)
        if time.time() > idle_exp:
            log_auth_event("auth.idle.timeout", username=payload.get("sub"))
            return jsonify({"message": "Session timed out due to inactivity"}), 401

        g.current_user = payload["sub"]
        g.token_payload = payload
        g.refresh_token = True
        return f(*args, **kwargs)

    return decorated
