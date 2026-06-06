FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY services/admin-service/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY services/admin-service/ .

EXPOSE 8008

CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8008", \
     "--workers", "2", "--timeout", "30"]
