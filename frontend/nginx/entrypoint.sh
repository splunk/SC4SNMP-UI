#!/bin/sh
set -eu

DEMO_PORT="${DEMO_PORT:-8080}"
BACKEND_URL="${BACKEND_URL:-http://ui-backend-entrypoint:5000}"
TRUSTED_PROXY_CIDRS="$(printf '%s' "${TRUSTED_PROXY_CIDRS:-}" | tr -d ' ')"

fail() {
    echo "sc4snmp-ui-frontend: $*" >&2
    exit 1
}

# Values are rendered into the nginx config, so reject anything outside a strict whitelist.
case "$DEMO_PORT" in
    ''|*[!0-9]*) fail "DEMO_PORT must be a port number, got '$DEMO_PORT'" ;;
esac
[ "$DEMO_PORT" -ge 1 ] && [ "$DEMO_PORT" -le 65535 ] || fail "DEMO_PORT out of range: $DEMO_PORT"

case "$BACKEND_URL" in
    *[!A-Za-z0-9.:/-]*) fail "BACKEND_URL contains invalid characters" ;;
esac
printf '%s\n' "$BACKEND_URL" | grep -Eq '^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?$' \
    || fail "BACKEND_URL must look like http://host[:port]"

CONF_DIR=/tmp/nginx/conf.d
mkdir -p "$CONF_DIR"
rm -f "$CONF_DIR"/*.conf

envsubst '${DEMO_PORT} ${BACKEND_URL}' \
    < /etc/nginx/sc4snmp/default.conf.template > "$CONF_DIR/default.conf"

if [ -n "$TRUSTED_PROXY_CIDRS" ]; then
    case "$TRUSTED_PROXY_CIDRS" in
        *[!0-9A-Fa-f:./,]*) fail "TRUSTED_PROXY_CIDRS contains invalid characters" ;;
    esac
    : > "$CONF_DIR/00-realip.conf"
    OLD_IFS="$IFS"
    IFS=','
    set -f
    for cidr in $TRUSTED_PROXY_CIDRS; do
        if printf '%s\n' "$cidr" | grep -Eq '^[0-9]{1,3}(\.[0-9]{1,3}){3}(/[0-9]{1,2})?$' \
            || printf '%s\n' "$cidr" | grep -Eq '^[0-9A-Fa-f:]*:[0-9A-Fa-f:]*(/[0-9]{1,3})?$'; then
            echo "set_real_ip_from $cidr;" >> "$CONF_DIR/00-realip.conf"
        else
            fail "TRUSTED_PROXY_CIDRS entry is not an IP or CIDR: '$cidr'"
        fi
    done
    set +f
    IFS="$OLD_IFS"
    {
        echo "real_ip_header X-Forwarded-For;"
        echo "real_ip_recursive on;"
    } >> "$CONF_DIR/00-realip.conf"
fi

exec nginx -g 'daemon off;'
