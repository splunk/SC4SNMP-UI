from SC4SNMP_UI_backend import create_app

flask_app = create_app()
celery_app = flask_app.extensions["celery"]

if __name__ == '__main__':
    flask_app.run()
