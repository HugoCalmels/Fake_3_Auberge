#!/usr/bin/env bash
# Restore a database dump (and optionally the uploaded images) made by backup.sh.
# DESTRUCTIVE: replaces the current production data. Asks for confirmation.
#
# Usage (on the server):
#   bash /opt/auberge/deploy/restore.sh /var/backups/auberge/db-YYYYMMDD-HHMM.dump [uploads-YYYYMMDD-HHMM.tgz]
#   bash /opt/auberge/deploy/restore.sh --check db-YYYYMMDD-HHMM.dump   # test the dump in a scratch DB, prod untouched
set -euo pipefail
cd "$(dirname "$0")"

COMPOSE="docker compose -f docker-compose.prod.yml"

if [ "${1:-}" = "--check" ]; then
  DUMP="${2:?dump file required}"
  $COMPOSE exec -T db dropdb -U auberge --if-exists restore_check
  $COMPOSE exec -T db createdb -U auberge restore_check
  $COMPOSE exec -T db pg_restore -U auberge -d restore_check --no-owner < "$DUMP"
  echo "Dump OK. Row counts in the restored copy:"
  $COMPOSE exec -T db psql -U auberge -d restore_check -tAc \
    "select 'bookings: ' || count(*) from \"Booking\" union all select 'rooms: ' || count(*) from \"Room\" union all select 'invoices: ' || count(*) from \"Invoice\""
  $COMPOSE exec -T db dropdb -U auberge restore_check
  exit 0
fi

DUMP="${1:?usage: restore.sh <db-dump> [uploads-tgz]}"
UPLOADS="${2:-}"

read -r -p "This REPLACES the production database with $DUMP. Type 'restore' to continue: " answer
[ "$answer" = "restore" ] || { echo "Aborted."; exit 1; }

# Safety net: snapshot the current state before overwriting it
bash ./backup.sh

$COMPOSE stop api
$COMPOSE exec -T db pg_restore -U auberge -d auberge --clean --if-exists --no-owner < "$DUMP"

if [ -n "$UPLOADS" ]; then
  $COMPOSE run --rm -T --no-deps --entrypoint sh api -c 'tar xzf - -C /app/public/rooms' < "$UPLOADS"
fi

$COMPOSE start api
echo "Restore done."
