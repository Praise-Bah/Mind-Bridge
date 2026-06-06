# Databases

Each service gets its own PostgreSQL StatefulSet following the pattern in `postgres-auth-statefulset.yaml`.

Create one StatefulSet + headless Service per service using the same pattern, substituting:
- `postgres-auth` → `postgres-chat`, `postgres-community`, etc.
- `auth_db` → `chat_db`, `community_db`, etc.
- `AUTH_DATABASE_URL` → `CHAT_DATABASE_URL`, etc.
- `postgres-auth-storage` → `postgres-chat-storage`, etc.
