#!/bin/bash
set -e

# Source Redis URL construction
. /app/construct-connection-strings.sh

set -o errexit
set -o nounset

# Bind dual-stack ([::] also accepts IPv4) when the pod has IPv6; plain IPv4 otherwise,
# because binding [::] fails when IPv6 is disabled.
if grep -q . /proc/net/if_inet6 2>/dev/null; then
    BIND_ADDRESS="[::]:5000"
else
    BIND_ADDRESS="0.0.0.0:5000"
fi

# Start Gunicorn
exec gunicorn -b "$BIND_ADDRESS" app:flask_app --log-level INFO