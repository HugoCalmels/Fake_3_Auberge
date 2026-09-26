#!/usr/bin/env bash
# Back up the database and the uploaded room images to /var/backups/auberge.
# Runs nightly via /etc/cron.d/auberge-backup (installed by setup.sh).
# Keeps BACKUP_RETENTION_DAYS days (default 14).
# Usage (on the server): bash /opt/auberge/deploy/backup.sh
set -euo pipefail
cd "$(dirname "$0")"

BACKUP_DIR=/var/backups/auberge
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
STAMP=$(date +%Y%m%d-%H%M)
COMPOSE="docker compose -f docker-compose.prod.yml"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

# Write to .tmp first so a failed run never leaves a truncated file that looks valid
$COMPOSE exec -T db pg_dump -U auberge -d auberge -Fc > "$BACKUP_DIR/db-$STAMP.dump.tmp"
mv "$BACKUP_DIR/db-$STAMP.dump.tmp" "$BACKUP_DIR/db-$STAMP.dump"

$COMPOSE exec -T api tar czf - -C /app/public/rooms . > "$BACKUP_DIR/uploads-$STAMP.tgz.tmp"
mv "$BACKUP_DIR/uploads-$STAMP.tgz.tmp" "$BACKUP_DIR/uploads-$STAMP.tgz"

find "$BACKUP_DIR" -type f \( -name 'db-*.dump' -o -name 'uploads-*.tgz' \) -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -type f -name '*.tmp' -delete

echo "$(date -Is) backup ok: db-$STAMP.dump ($(du -h "$BACKUP_DIR/db-$STAMP.dump" | cut -f1)), uploads-$STAMP.tgz ($(du -h "$BACKUP_DIR/uploads-$STAMP.tgz" | cut -f1))"
