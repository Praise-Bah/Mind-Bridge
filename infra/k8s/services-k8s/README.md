# Kubernetes Service Manifests

`auth-service/` contains the complete pattern (deployment + service + hpa).
All other services follow the exact same structure. To add a service, copy the auth-service directory and change:

| Field | auth-service | chat-service | community-service | professionals-service | notification-service | ai-service | content-service | admin-service |
|---|---|---|---|---|---|---|---|---|
| name | auth-service | chat-service | community-service | professionals-service | notification-service | ai-service | content-service | admin-service |
| image | mindbridge/auth-service | mindbridge/chat-service | mindbridge/community-service | mindbridge/professionals-service | mindbridge/notification-service | mindbridge/ai-service | mindbridge/content-service | mindbridge/admin-service |
| containerPort | 8001 | 8002 | 8003 | 8004 | 8005 | 8006 | 8007 | 8008 |
| command | gunicorn ... | **daphne** (WebSocket) | gunicorn ... | gunicorn ... | **daphne** (WebSocket) | gunicorn ... | gunicorn ... | gunicorn ... |
| DATABASE_URL key | AUTH_DATABASE_URL | CHAT_DATABASE_URL | COMMUNITY_DATABASE_URL | PROFESSIONALS_DATABASE_URL | NOTIFICATIONS_DATABASE_URL | AI_DATABASE_URL | CONTENT_DATABASE_URL | none |
| HPA maxReplicas | 10 | 8 | 10 | 8 | 6 | 4 | 6 | none |
| CPU limit | 1000m | 500m | 1000m | 1000m | 500m | 2000m | 500m | 250m |
| Memory limit | 512Mi | 256Mi | 512Mi | 512Mi | 256Mi | 1Gi | 256Mi | 128Mi |

## Chat + Notification: Use Daphne (not Gunicorn)
```yaml
command:
  - daphne
  - -b
  - "0.0.0.0"
  - -p
  - "8002"   # or 8005 for notification
  - --proxy-headers
  - core.asgi:application
```

## AI Service: Fewer replicas, higher limits, longer timeout
```yaml
command:
  - gunicorn
  - core.wsgi:application
  - --bind=0.0.0.0:8006
  - --workers=2
  - --worker-class=gthread
  - --threads=4
  - --timeout=120
```

## Admin Service: No HPA (admin is low traffic)
Skip hpa.yaml. Set replicas: 1 in deployment.yaml.
