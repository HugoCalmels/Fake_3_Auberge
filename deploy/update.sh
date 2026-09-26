#!/usr/bin/env bash
# Deploy the latest code from GitHub: pull, rebuild the API, restart.
# Migrations run automatically when the API container starts.
# Usage (on the server): bash /opt/auberge/deploy/update.sh
set -euo pipefail
cd "$(dirname "$0")"

git -C .. pull --ff-only
docker compose -f docker-compose.prod.yml up -d --build
docker image prune -f > /dev/null

docker compose -f docker-compose.prod.yml ps --format '{{.Service}}: {{.Status}}'
