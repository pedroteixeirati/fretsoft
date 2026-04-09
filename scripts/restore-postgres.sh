#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: $0 /path/to/backup.dump [DATABASE_URL]"
  exit 1
fi

BACKUP_FILE="$1"
TARGET_DATABASE_URL="${2:-${DATABASE_URL:-}}"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "backup file not found: $BACKUP_FILE"
  exit 1
fi

if [[ -z "$TARGET_DATABASE_URL" ]]; then
  echo "DATABASE_URL is required as the second argument or environment variable"
  exit 1
fi

pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --dbname="$TARGET_DATABASE_URL" \
  "$BACKUP_FILE"
