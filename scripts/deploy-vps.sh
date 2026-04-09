#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/fretsoft}"
BRANCH="${BRANCH:-main}"
API_PROCESS_NAME="${API_PROCESS_NAME:-fretsoft-api}"

cd "$APP_DIR"

git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

npm ci
npm run build

pm2 startOrReload ecosystem.config.cjs --only "$API_PROCESS_NAME" --update-env

pm2 save
