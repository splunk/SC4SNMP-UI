#!/bin/bash
set -e

# Source Redis URL construction
. /app/construct-redis-url.sh

set -o errexit
set -o nounset

# Start Gunicorn
exec gunicorn -b :5000 app:flask_app --log-level INFO