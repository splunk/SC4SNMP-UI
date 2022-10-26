from flask import Flask
from pymongo import MongoClient
import os
import logging

try:
    from dotenv import load_dotenv

    load_dotenv()
except:
    pass

MONGO_URI = os.getenv("MONGO_URI")
mongo_client = MongoClient(MONGO_URI)


def create_app():
    app = Flask(__name__)

    from SC4SNMP_UI_backend.ui_handling.routes import ui
    app.register_blueprint(ui)
    gunicorn_logger = logging.getLogger('gunicorn.error')
    app.logger.handlers = gunicorn_logger.handlers
    app.logger.setLevel(gunicorn_logger.level)

    return app
