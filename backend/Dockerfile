FROM python:3.12-slim
WORKDIR /app

COPY --chown=10000:10000 requirements.txt app.py ./
COPY --chown=10000:10000 SC4SNMP_UI_backend ./SC4SNMP_UI_backend
RUN pip install --no-cache-dir -r ./requirements.txt
ENV FLASK_DEBUG=production

# Copy scripts (executable, owned by non-root user)
COPY --chown=10000:10000 ./flask_start.sh /flask_start.sh
COPY --chown=10000:10000 ./celery_start.sh /celery_start.sh
COPY --chown=10000:10000 construct-connection-strings.sh /app/construct-connection-strings.sh

# Set executable bit BEFORE USER switch
RUN chmod 0755 /flask_start.sh /celery_start.sh /app/construct-connection-strings.sh

# Switch to non-root
USER 10000:10000

EXPOSE 5000

# Use flask_start.sh which sources construct-connection-strings.sh
CMD ["/flask_start.sh"]