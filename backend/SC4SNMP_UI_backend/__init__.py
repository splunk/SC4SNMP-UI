import re
import sys
import time

from flask import Flask, g
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import os
import logging
from celery import Celery
from celery import Task
from dotenv import load_dotenv

load_dotenv()

__version__ = "1.2.0-beta.2"

MONGO_URI = os.getenv("MONGO_URI")
log = logging.getLogger('gunicorn.error')
log.setLevel(logging.INFO)

def wait_for_mongodb_replicaset(logger, mongo_uri, max_retries=120, retry_interval=5):
    """
    Wait for MongoDB to be ready before starting the application.
    For replica sets, waits for PRIMARY to be elected.
    """
    mongo_mode = os.getenv("MONGODB_MODE", "standalone").lower()
    if mongo_mode == "standalone":
        logger.info("MongoDB is in standalone mode, skipping ReplicaSet wait")
        return

    if not mongo_uri:
        logger.warning("MONGO_URI not set, exiting application")
        sys.exit(1)

    logger.info(f"Waiting for MongoDB ReplicaSet to be ready and elect the primary...")

    for attempt in range(1, max_retries + 1):
        if attempt != 1:
            time.sleep(retry_interval)
        try:
            # Try to connect
            client = MongoClient(
                mongo_uri, serverSelectionTimeoutMS=5000, connectTimeoutMS=5000
            )

            # Execute a simple operation to verify PRIMARY exists
            client.admin.command("ping")

            # For replica sets, verify PRIMARY exists
            if "replicaSet=" in mongo_uri:
                if client.primary is None:
                    continue
                logger.info(f"PRIMARY found: {client.primary}")

            client.close()
            logger.info("MongoDB is ready")
            return

        except (ServerSelectionTimeoutError, ConnectionFailure, Exception) as e:
            if attempt >= max_retries:
                logger.info(f"MongoDB not ready after {max_retries * retry_interval}s")
                logger.info(f"   Error: {e}")
                sys.exit(1)

        logger.info(f"  Still waiting... ({attempt}/{max_retries})")

wait_for_mongodb_replicaset(log, MONGO_URI)
mongo_client = MongoClient(MONGO_URI)

VALUES_DIRECTORY = os.getenv("VALUES_DIRECTORY", "")
KEEP_TEMP_FILES = os.getenv("KEEP_TEMP_FILES", "false")

REDBEAT_URL = os.getenv("REDIS_URL", "redis://snmp-redis-headless:6379")
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "sentinel://snmp-redis-sentinel:26379")
REDIS_SENTINEL_SERVICE = os.getenv("REDIS_SENTINEL_SERVICE", "snmp-redis-sentinel")
REDIS_MODE = os.getenv("REDIS_MODE", "standalone")


class NoValuesDirectoryException(Exception):
    pass


class AuthNotConfiguredException(Exception):
    pass


limiter = Limiter(key_func=get_remote_address, default_limits=[])


def create_app():
    if len(VALUES_DIRECTORY) == 0:
        raise NoValuesDirectoryException

    app = Flask(__name__)

    auth_enabled = os.getenv("AUTH_ENABLED", "true").lower() == "true"
    if auth_enabled:
        missing = []
        for var in ("AUTH_USERNAME", "AUTH_PASSWORD_HASH", "JWT_SECRET"):
            if not os.getenv(var):
                missing.append(var)
        if missing:
            raise AuthNotConfiguredException(
                f"AUTH_ENABLED=true but {', '.join(missing)} not set. "
                "Set these env vars or set AUTH_ENABLED=false to disable authentication."
            )
    else:
        log.warning(
            "SECURITY: AUTH_ENABLED=false. All endpoints are accessible without authentication. "
            "Do NOT use this configuration in production or on any network-exposed deployment. "
            "Restrict access via ClusterIP/NetworkPolicy and use only for local development."
        )

    allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "").strip()
    if allowed_origins_env == "*":
        # Reflect any origin. Intended for local development only.
        log.warning(
            "SECURITY: ALLOWED_ORIGINS=* reflects any browser Origin. "
            "Do NOT use in production; set an explicit allow-list."
        )
        cors_origins = [re.compile(r".*")]
    elif allowed_origins_env:
        cors_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
    elif not auth_enabled:
        # When auth is disabled (dev mode), reflect any origin so the UI works
        # out of the box on NodePort setups. Security warning already logged above.
        cors_origins = [re.compile(r".*")]
    else:
        cors_origins = ["http://localhost:8080"]

    CORS(app, origins=cors_origins, supports_credentials=True)

    limiter.init_app(app)
    limiter.storage_uri = REDBEAT_URL

    if REDIS_MODE == "replication":
        broker_transport_options = {
            "priority_steps": list(range(10)),
            "sep": ":",
            "queue_order_strategy": "priority",
            "service_name": "mymaster",
            "master_name": "mymaster",
            "socket_timeout": 5,
            "retry_policy": {
                "max_retries": 100,
                "interval_start": 0,
                "interval_step": 2,
                "interval_max": 5,
            },
            "db": 1,
            "sentinels": [(REDIS_SENTINEL_SERVICE, 26379)],
            "password": os.getenv("REDIS_PASSWORD", None),
        }
    else:
        broker_transport_options = {
            "priority_steps": list(range(10)),
            "sep": ":",
            "queue_order_strategy": "priority"
        }

    app.config.from_mapping(
        CELERY=dict(
            task_default_queue="apply_changes",
            broker_url=CELERY_BROKER_URL,
            beat_scheduler="redbeat.RedBeatScheduler",
            redbeat_redis_url = REDBEAT_URL,
            broker_transport_options=broker_transport_options,
            task_ignore_result=True,
            redbeat_lock_key=None,
        ),
    )
    celery_init_app(app)

    from SC4SNMP_UI_backend.auth.routes import auth_blueprint
    from SC4SNMP_UI_backend.profiles.routes import profiles_blueprint
    from SC4SNMP_UI_backend.groups.routes import groups_blueprint
    from SC4SNMP_UI_backend.inventory.routes import inventory_blueprint
    from SC4SNMP_UI_backend.apply_changes.routes import apply_changes_blueprint
    app.register_blueprint(auth_blueprint)
    app.register_blueprint(profiles_blueprint)
    app.register_blueprint(groups_blueprint)
    app.register_blueprint(inventory_blueprint)
    app.register_blueprint(apply_changes_blueprint)

    from SC4SNMP_UI_backend.auth.utils import (
        AUTH_ENABLED as _auth_on,
        refresh_token_payload,
        make_cookie_kwargs,
        COOKIE_NAME,
        JWT_EXPIRY_HOURS as _jwt_hours,
    )

    @app.after_request
    def refresh_idle_token(response):
        if not _auth_on:
            return response
        try:
            should_refresh = g.get("refresh_token", False)
            payload = g.get("token_payload")
        except RuntimeError:
            return response
        if should_refresh and payload:
            new_token = refresh_token_payload(payload)
            response.set_cookie(**make_cookie_kwargs(new_token, max_age=_jwt_hours * 3600))
        return response

    gunicorn_logger = logging.getLogger('gunicorn.error')
    app.logger.handlers = gunicorn_logger.handlers
    app.logger.setLevel(gunicorn_logger.level)

    return app

def celery_init_app(app: Flask) -> Celery:
    class FlaskTask(Task):
        def __call__(self, *args: object, **kwargs: object) -> object:
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app = Celery(app.name, task_cls=FlaskTask)
    celery_app.config_from_object(app.config["CELERY"])
    celery_app.set_default()
    app.extensions["celery"] = celery_app
    return celery_app
