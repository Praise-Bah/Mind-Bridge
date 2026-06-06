FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Build context is the repo root (Mind-Bridge/).
COPY shared/mindbridge-common /shared/mindbridge-common
RUN pip install --no-cache-dir /shared/mindbridge-common

COPY services/community-service/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Source — overridden by volume mount in docker-compose for dev.
COPY services/community-service/ .

EXPOSE 8003

CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8003", \
     "--workers", "4", "--threads", "2", "--max-requests", "1000", "--timeout", "30"]
