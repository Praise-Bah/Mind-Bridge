#!/usr/bin/env bash
# Creates the staging secrets in the mindbridge-staging namespace WITHOUT
# committing any plaintext to git. Run this once (and again when values change)
# before deploying the staging overlay.
#
# Required environment variables (export them or source an untracked env file):
#   POSTGRES_USER, POSTGRES_PASSWORD
#   AUTH_SECRET_KEY, INTERNAL_SERVICE_TOKEN
#   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
#   SENDGRID_API_KEY, OPENROUTER_API_KEY, YOUTUBE_API_KEY
#   GHCR_USER, GHCR_TOKEN            (GitHub username + PAT with read:packages)
#   GHCR_EMAIL                       (any email for the docker registry entry)
#
# Usage:
#   export $(grep -v '^#' staging-secrets.env | xargs)   # optional untracked file
#   ./create-secrets.sh

set -euo pipefail

NS=mindbridge-staging

: "${POSTGRES_USER:?set POSTGRES_USER}"
: "${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}"
: "${AUTH_SECRET_KEY:?set AUTH_SECRET_KEY}"
: "${INTERNAL_SERVICE_TOKEN:?set INTERNAL_SERVICE_TOKEN}"
: "${GOOGLE_CLIENT_ID:?set GOOGLE_CLIENT_ID}"
: "${GOOGLE_CLIENT_SECRET:?set GOOGLE_CLIENT_SECRET}"
: "${SENDGRID_API_KEY:?set SENDGRID_API_KEY}"
: "${OPENROUTER_API_KEY:?set OPENROUTER_API_KEY}"
: "${YOUTUBE_API_KEY:?set YOUTUBE_API_KEY}"
: "${GHCR_USER:?set GHCR_USER}"
: "${GHCR_TOKEN:?set GHCR_TOKEN}"
: "${GHCR_EMAIL:?set GHCR_EMAIL}"

kubectl create namespace "$NS" --dry-run=client -o yaml | kubectl apply -f -

# App secrets (SECRET_KEY maps to the app's Django secret key).
kubectl -n "$NS" create secret generic app-secrets \
  --from-literal=SECRET_KEY="$AUTH_SECRET_KEY" \
  --from-literal=INTERNAL_SERVICE_TOKEN="$INTERNAL_SERVICE_TOKEN" \
  --from-literal=GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
  --from-literal=GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET" \
  --from-literal=SENDGRID_API_KEY="$SENDGRID_API_KEY" \
  --from-literal=OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
  --from-literal=YOUTUBE_API_KEY="$YOUTUBE_API_KEY" \
  --dry-run=client -o yaml | kubectl apply -f -

# Postgres credentials consumed by the staging patches.
kubectl -n "$NS" create secret generic postgres-secrets \
  --from-literal=POSTGRES_USER="$POSTGRES_USER" \
  --from-literal=POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  --dry-run=client -o yaml | kubectl apply -f -

# GHCR image pull secret referenced by the deployments (ghcr-pull-secret).
kubectl -n "$NS" create secret docker-registry ghcr-pull-secret \
  --docker-server=ghcr.io \
  --docker-username="$GHCR_USER" \
  --docker-password="$GHCR_TOKEN" \
  --docker-email="$GHCR_EMAIL" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Secrets created/updated in namespace $NS."
