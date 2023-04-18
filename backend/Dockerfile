FROM python:3.9
WORKDIR /app

COPY requirements.txt app.py ./
COPY SC4SNMP_UI_backend ./SC4SNMP_UI_backend
RUN pip install -r ./requirements.txt
ENV FLASK_DEBUG production


COPY ./flask_start.sh /flask_start.sh
RUN chmod +x /flask_start.sh

COPY ./celery_start.sh /celery_start.sh
RUN chmod +x /celery_start.sh

EXPOSE 5000
CMD ["gunicorn", "-b", ":5000", "app:flask_app", "--log-level", "DEBUG"]