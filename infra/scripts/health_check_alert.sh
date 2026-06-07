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

  status_code="$(docker exec "$container" \
    curl -s -o /dev/null -w '%{http_code}' "http://localhost:${port}/api/v1/health/" \
    2>/dev/null || echo "000")"

  current="down"
  [ "$status_code" = "200" ] && current="up"

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
