#!/bin/bash
set -e

# Source Redis URLs
. /app/construct-redis-url.sh

# Execute whatever CMD was provided
exec "$@"