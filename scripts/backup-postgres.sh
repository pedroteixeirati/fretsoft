#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/fretsoft}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"
BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOCK_FILE="${LOCK_FILE:-/tmp/fretsoft-postgres-backup.lock}"

mkdir -p "$BACKUP_DIR"

exec 9>"$LOCK_FILE"
flock -n 9 || {
  echo "backup already running"
  exit 1
}

DB_EXPORTS="$(
  python3 - "$ENV_FILE" <<'PY'
from pathlib import Path
import sys

env_path = Path(sys.argv[1])
if not env_path.exists():
    raise SystemExit(f"env file not found: {env_path}")

for raw_line in env_path.read_text().splitlines():
    line = raw_line.strip()
    if not line or line.startswith('#') or '=' not in line:
        continue
    key, value = line.split('=', 1)
    if key != 'DATABASE_URL':
        continue
    value = value.strip().strip('"').strip("'")
    scheme, rest = value.split("://", 1)
    creds_host, database = rest.rsplit("/", 1)
    creds, host_port = creds_host.rsplit("@", 1)
    username, password = creds.split(":", 1)
    if ":" in host_port:
        host, port = host_port.rsplit(":", 1)
    else:
        host, port = host_port, "5432"

    print(f"DB_USERNAME={username}")
    print(f"DB_PASSWORD={password}")
    print(f"DB_HOST={host}")
    print(f"DB_PORT={port}")
    print(f"DB_NAME={database}")
    raise SystemExit(0)

raise SystemExit("DATABASE_URL not found in env file")
PY
)"

eval "$DB_EXPORTS"

BACKUP_FILE="$BACKUP_DIR/fretsoft_postgres_${TIMESTAMP}.dump"
LATEST_LINK="$BACKUP_DIR/latest.dump"
CHECKSUM_FILE="$BACKUP_FILE.sha256"

PGPASSWORD="$DB_PASSWORD" pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USERNAME" \
  --dbname="$DB_NAME" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="$BACKUP_FILE"

sha256sum "$BACKUP_FILE" > "$CHECKSUM_FILE"
ln -sfn "$BACKUP_FILE" "$LATEST_LINK"

find "$BACKUP_DIR" -type f \( -name '*.dump' -o -name '*.sha256' \) -mtime +"$RETENTION_DAYS" -delete

echo "backup created: $BACKUP_FILE"
