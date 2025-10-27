from flask import Flask
from pymongo import MongoClient
import os
import logging
from celery import Celery
from celery import Task
from dotenv import load_dotenv

load_dotenv()

__version__ = "1.1.1-beta.3"

MONGO_URI = os.getenv("MONGO_URI")
mongo_client = MongoClient(MONGO_URI)

VALUES_DIRECTORY = os.getenv("VALUES_DIRECTORY", "")
KEEP_TEMP_FILES = os.getenv("KEEP_TEMP_FILES", "false")

REDIS_HOST = os.getenv("REDIS_HOST", "snmp-redis")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")
REDIS_DB = os.getenv("REDIS_DB", "1")
CELERY_DB = os.getenv("CELERY_DB", "0")

if REDIS_PASSWORD:
    redis_base = f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}"
else:
    redis_base = f"redis://{REDIS_HOST}:{REDIS_PORT}"

# fallback
REDBEAT_URL = os.getenv("REDIS_URL", f"{redis_base}/{REDIS_DB}")
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", f"{redis_base}/{CELERY_DB}")


class NoValuesDirectoryException(Exception):
    pass

def create_app():
    if len(VALUES_DIRECTORY) == 0:
        raise NoValuesDirectoryException

    app = Flask(__name__)

    app.config.from_mapping(
        CELERY=dict(
            task_default_queue="apply_changes",
            broker_url=CELERY_BROKER_URL,
            beat_scheduler="redbeat.RedBeatScheduler",
            redbeat_redis_url = REDBEAT_URL,
            broker_transport_options={
                "priority_steps": list(range(10)),
                "sep": ":",
                "queue_order_strategy": "priority",
            },
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
