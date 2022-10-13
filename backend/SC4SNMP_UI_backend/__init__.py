from flask import Flask
from pymongo import MongoClient
import os
try:
    from dotenv import load_dotenv

    load_dotenv()
except:
    pass

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
mongo_client = MongoClient('localhost', 27017)


def create_app():
    app = Flask(__name__)

    from SC4SNMP_UI_backend.ui_handling.routes import ui
    app.register_blueprint(ui)

    return app
