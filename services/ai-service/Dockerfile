FROM python:3.12-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Build context is the repo root (Mind-Bridge/).
# Install shared library so mindbridge_common is importable.
COPY shared/mindbridge-common /shared/mindbridge-common
RUN pip install --no-cache-dir /shared/mindbridge-common

# Install service dependencies
COPY services/ai-service/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Copy source — overridden by volume mount in docker-compose for dev.
COPY services/ai-service/ .

EXPOSE 8006

# Production default: Gunicorn HTTP server (Phase 4 when HTTP endpoints are added).
# Phase 1: this container is overridden in docker-compose to run subscribe_events or celery worker.
CMD ["gunicorn", "core.wsgi:application", \
     "--bind", "0.0.0.0:8006", \
     "--workers", "2", \
     "--worker-class", "gthread", \
     "--threads", "4", \
     "--max-requests", "500", \
     "--max-requests-jitter", "50", \
     "--timeout", "120", \
     "--access-logfile", "-"]
