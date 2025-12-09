FROM python:3.9
WORKDIR /app

COPY requirements.txt app.py ./
COPY SC4SNMP_UI_backend ./SC4SNMP_UI_backend
RUN pip install -r ./requirements.txt
ENV FLASK_DEBUG production

# Copy scripts
COPY ./flask_start.sh /flask_start.sh
COPY ./celery_start.sh /celery_start.sh
COPY construct-connection-strings.sh /app/construct-connection-strings.sh

# Set permissions BEFORE USER switch
RUN chmod +x /flask_start.sh /celery_start.sh /app/construct-connection-strings.sh

# Switch to non-root
USER 10000:10000

EXPOSE 5000

# Use flask_start.sh which sources construct-connection-strings.sh
CMD ["/flask_start.sh"]