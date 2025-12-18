import sys
import time

from flask import Flask
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import os
import logging
from celery import Celery
from celery import Task
from dotenv import load_dotenv

load_dotenv()

__version__ = "1.1.2-beta.2"

MONGO_URI = os.getenv("MONGO_URI")


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

wait_for_mongodb_replicaset(logging.getLogger(), MONGO_URI)
mongo_client = MongoClient(MONGO_URI)

VALUES_DIRECTORY = os.getenv("VALUES_DIRECTORY", "")
KEEP_TEMP_FILES = os.getenv("KEEP_TEMP_FILES", "false")

REDBEAT_URL = os.getenv("REDIS_URL", "redis://snmp-redis-headless:6379")
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "sentinel://snmp-redis-sentinel:26379")
REDIS_SENTINEL_SERVICE = os.getenv("REDIS_SENTINEL_SERVICE", "snmp-redis-sentinel")
REDIS_MODE = os.getenv("REDIS_MODE", "standalone")


class NoValuesDirectoryException(Exception):
    pass

def create_app():
    if len(VALUES_DIRECTORY) == 0:
        raise NoValuesDirectoryException

    app = Flask(__name__)

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
    from SC4SNMP_UI_backend.profiles.routes import profiles_blueprint
    from SC4SNMP_UI_backend.groups.routes import groups_blueprint
    from SC4SNMP_UI_backend.inventory.routes import inventory_blueprint
    from SC4SNMP_UI_backend.apply_changes.routes import apply_changes_blueprint
    app.register_blueprint(profiles_blueprint)
    app.register_blueprint(groups_blueprint)
    app.register_blueprint(inventory_blueprint)
    app.register_blueprint(apply_changes_blueprint)
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
