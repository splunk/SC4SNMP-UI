#!/bin/bash
set -e

# Source Redis URL construction
. /app/construct-redis-url.sh

set -o errexit
set -o nounset

cd /app
celery -A app worker -Q apply_changes --loglevel INFO
