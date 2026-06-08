#!/usr/bin/env bash
# MindBridge service health-check alerting.
#
# Curls each service's internal /api/v1/health/ endpoint via `docker exec`
# (independent of Nginx — so a gateway/routing problem doesn't mask itself as
# "service down", and a down service can't prevent reporting on itself) and
# emails on STATE CHANGE only via SendGrid's HTTP API, so you get one alert
# when something goes down and one when it recovers — not a flood every run.
#
# Setup (run once, as root or a user in the `docker` group):
#   1. cp infra/scripts/health_check_alert.env.example infra/scripts/health_check_alert.env
#      and fill in SENDGRID_API_KEY, ALERT_FROM, ALERT_TO
#   2. chmod +x infra/scripts/health_check_alert.sh
#   3. Add to crontab (crontab -e):
#        */5 * * * * /opt/Mind-Bridge/infra/scripts/health_check_alert.sh >> /var/log/mindbridge-health.log 2>&1
#
# Adjust the path above to wherever the repo lives on your VPS.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/health_check_alert.env"
STATE_DIR="/var/lib/mindbridge-health"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

: "${SENDGRID_API_KEY:?Set SENDGRID_API_KEY in health_check_alert.env}"
: "${ALERT_TO:?Set ALERT_TO in health_check_alert.env}"
ALERT_FROM="${ALERT_FROM:-noreply@mindbridge.sbs}"

mkdir -p "$STATE_DIR"

declare -A SERVICE_STATUS   # populated during the per-service loop, reused by the gateway canary below

# name:container:port — keep in sync with infra/docker/docker-compose.prod.yml
SERVICES=(
  "auth-service:docker-auth-service-1:8001"
  "chat-service:docker-chat-service-1:8002"
  "community-service:docker-community-service-1:8003"
  "professionals-service:docker-professionals-service-1:8004"
  "notification-service:docker-notification-service-1:8005"
  "ai-service:docker-ai-service-1:8006"
  "content-service:docker-content-service-1:8007"
  "admin-service:docker-admin-service-1:8008"
)

send_email() {
  local subject="$1" body="$2"
  curl -s -o /dev/null -X POST https://api.sendgrid.com/v3/mail/send \
    -H "Authorization: Bearer ${SENDGRID_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$(cat <<JSON
{
  "personalizations": [{"to": [{"email": "${ALERT_TO}"}]}],
  "from": {"email": "${ALERT_FROM}"},
  "subject": "${subject}",
  "content": [{"type": "text/plain", "value": "${body}"}]
}
JSON
)"
}

now() { date -u +'%Y-%m-%d %H:%M:%S UTC'; }

for entry in "${SERVICES[@]}"; do
  IFS=':' read -r name container port <<< "$entry"
  state_file="${STATE_DIR}/${name}.state"
  prev="up"
  [ -f "$state_file" ] && prev="$(cat "$state_file")"

  # The slim Django images don't include curl/wget — but they always have
  # python (it's the runtime), so use urllib instead of relying on a tool
  # that may not be installed in the container.
  status_code="$(docker exec "$container" python -c "
import urllib.request, urllib.error
try:
    with urllib.request.urlopen('http://localhost:${port}/api/v1/health/', timeout=5) as r:
        print(r.status)
except urllib.error.HTTPError as e:
    # Surface the real HTTP status (e.g. 400 from an ALLOWED_HOSTS mismatch,
    # 503 from a degraded health check) instead of masking it as 'unreachable'.
    print(e.code)
except Exception:
    print('000')
" 2>/dev/null || echo "000")"
  status_code="$(echo "$status_code" | tr -d '[:space:]')"

  current="down"
  [ "$status_code" = "200" ] && current="up"
  SERVICE_STATUS["$name"]="$current"

  if [ "$current" != "$prev" ]; then
    if [ "$current" = "down" ]; then
      send_email "MindBridge ALERT: ${name} is DOWN" \
        "${name} health check returned HTTP ${status_code} at $(now).

Check logs with:
  cd /opt/Mind-Bridge/infra/docker
  docker compose -f docker-compose.prod.yml logs --tail=200 ${name}

Restart with:
  docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --force-recreate ${name}"
    else
      send_email "MindBridge: ${name} recovered" \
        "${name} health check is back to HTTP 200 at $(now)."
    fi
    echo "$current" > "$state_file"
  fi
done

# ── Nginx gateway canary: detect + self-heal stale-upstream-IP 502s ──────
# The per-service checks above intentionally bypass Nginx (see header comment).
# But Docker assigns recreated containers new internal IPs, and Nginx caches
# the old ones until reloaded — producing the OPPOSITE signature: backend
# reports healthy directly, yet public traffic through Nginx gets 502s. Only
# probe Nginx when the backend itself is confirmed healthy — otherwise a real
# outage would look identical and trigger a pointless reload.
gw_state_file="${STATE_DIR}/nginx_gateway.state"
gw_prev="ok"
[ -f "$gw_state_file" ] && gw_prev="$(cat "$gw_state_file")"

gw_status="ok"
nginx_code="200"
if [ "${SERVICE_STATUS[auth-service]:-down}" = "up" ]; then
  nginx_code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost/health/ || echo "000")"
  if [ "$nginx_code" != "200" ]; then
    docker exec docker-nginx-1 nginx -s reload >/dev/null 2>&1 || true
    sleep 2
    nginx_code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost/health/ || echo "000")"
    if [ "$nginx_code" = "200" ]; then
      gw_status="healed"
    else
      gw_status="broken"
    fi
  fi
fi

if [ "$gw_status" != "$gw_prev" ]; then
  case "$gw_status" in
    healed)
      send_email "MindBridge: Nginx gateway self-healed" \
        "Detected the stale-upstream-IP signature at $(now): auth-service responded directly, but Nginx returned HTTP ${nginx_code} for the public /health/ path (a container was likely just recreated, leaving Nginx pointed at its old internal IP).

Ran 'docker exec docker-nginx-1 nginx -s reload' automatically — Nginx now returns HTTP 200. No action needed; this is just an FYI in case you want to know why a container restarted."
      ;;
    broken)
      send_email "MindBridge ALERT: Nginx gateway down, auto-heal failed" \
        "Detected the stale-upstream-IP signature at $(now) but 'nginx -s reload' did NOT fix it (still HTTP ${nginx_code}). This needs manual investigation.

  docker logs docker-nginx-1 --tail 50
  docker compose -f /opt/Mind-Bridge/infra/docker/docker-compose.prod.yml ps"
      ;;
    ok)
      send_email "MindBridge: Nginx gateway recovered" \
        "Nginx gateway is responding normally again as of $(now)."
      ;;
  esac
  echo "$gw_status" > "$gw_state_file"
fi
