from flask import Flask
from pymongo import MongoClient
import os
import logging
from celery import Celery
from celery import Task
from dotenv import load_dotenv

load_dotenv()

__version__ = "1.0.3-beta.1"

MONGO_URI = os.getenv("MONGO_URI")
mongo_client = MongoClient(MONGO_URI)
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "amqp://guest:guest@localhost:5672//")
REDIS_URL = os.getenv("REDIS_URL")
VALUES_DIRECTORY = os.getenv("VALUES_DIRECTORY", "")
KEEP_TEMP_FILES = os.getenv("KEEP_TEMP_FILES", "false")

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
            redbeat_redis_url = REDIS_URL,
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
