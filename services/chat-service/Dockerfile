FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Build context is the repo root (Mind-Bridge/).
COPY shared/mindbridge-common /shared/mindbridge-common
RUN pip install --no-cache-dir /shared/mindbridge-common

COPY services/chat-service/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Source — overridden by volume mount in docker-compose for dev.
COPY services/chat-service/ .

EXPOSE 8002

# Daphne for HTTP + WebSocket (chat requires WebSocket support)
CMD ["daphne", "-b", "0.0.0.0", "-p", "8002", "--proxy-headers", "core.asgi:application"]
