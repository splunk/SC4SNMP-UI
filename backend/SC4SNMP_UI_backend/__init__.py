from flask import Flask
from pymongo import MongoClient
import os
import logging

try:
    from dotenv import load_dotenv

    load_dotenv()
except:
    pass

__version__ = "0.0.1"

MONGO_URI = os.getenv("MONGO_URI")
mongo_client = MongoClient(MONGO_URI)


def create_app():
    app = Flask(__name__)

    from SC4SNMP_UI_backend.profiles.routes import profiles_blueprint
    from SC4SNMP_UI_backend.groups.routes import groups_blueprint
    from SC4SNMP_UI_backend.inventory.routes import inventory_blueprint
    app.register_blueprint(profiles_blueprint)
    app.register_blueprint(groups_blueprint)
    app.register_blueprint(inventory_blueprint)
    gunicorn_logger = logging.getLogger('gunicorn.error')
    app.logger.handlers = gunicorn_logger.handlers
    app.logger.setLevel(gunicorn_logger.level)

    return app
