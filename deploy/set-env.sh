#!/usr/bin/env bash
# Upsert KEY=VALUE lines read from stdin into deploy/.env (surrounding quotes stripped).
# Example: grep '^STRIPE_SECRET_KEY=' Backend/.env | ssh server 'bash /opt/auberge/deploy/set-env.sh'
set -euo pipefail
cd "$(dirname "$0")"
touch .env

# Strip CRLF and any UTF-8 BOM (Windows PowerShell adds one when piping)
tr -d '\r' | sed 's/^\xEF\xBB\xBF//' | while IFS='=' read -r key value; do
  [ -z "$key" ] && continue
  value="${value%\"}"; value="${value#\"}"
  grep -v "^${key}=" .env > .env.tmp || true
  printf '%s=%s\n' "$key" "$value" >> .env.tmp
  mv .env.tmp .env
  echo "set $key"
done
chmod 600 .env
