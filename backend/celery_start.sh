#!/bin/bash
set -e

# Source Redis URL construction
. /app/construct-redis-url.sh

echo "Starting Gunicorn with:"
echo "  REDIS_URL=${REDIS_URL}"
echo "  CELERY_BROKER_URL=${CELERY_BROKER_URL}"

set -o errexit
set -o nounset

cd /app
celery -A app worker -Q apply_changes --loglevel INFO
