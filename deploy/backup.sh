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

# Off-site copy to Backblaze B2 (survives losing the whole VPS), if configured in .env
B2_KEY_ID=$(grep -E '^B2_KEY_ID=' .env | cut -d= -f2- || true)
B2_APP_KEY=$(grep -E '^B2_APP_KEY=' .env | cut -d= -f2- || true)
B2_BUCKET=$(grep -E '^B2_BUCKET=' .env | cut -d= -f2- || true)
OFFSITE_RETENTION_DAYS="${OFFSITE_RETENTION_DAYS:-30}"

if [ -n "$B2_KEY_ID" ] && [ -n "$B2_APP_KEY" ] && [ -n "$B2_BUCKET" ]; then
  # rclone reads the remote definition from env vars: nothing written to disk
  export RCLONE_CONFIG_B2_TYPE=b2
  export RCLONE_CONFIG_B2_ACCOUNT="$B2_KEY_ID"
  export RCLONE_CONFIG_B2_KEY="$B2_APP_KEY"
  export RCLONE_CONFIG_B2_HARD_DELETE=true

  rclone copy "$BACKUP_DIR" "b2:$B2_BUCKET/auberge" --include 'db-*.dump' --include 'uploads-*.tgz'
  rclone delete "b2:$B2_BUCKET/auberge" --min-age "${OFFSITE_RETENTION_DAYS}d"
  echo "$(date -Is) off-site copy ok: b2:$B2_BUCKET/auberge (${OFFSITE_RETENTION_DAYS}-day retention)"
else
  echo "$(date -Is) off-site copy skipped: B2_KEY_ID / B2_APP_KEY / B2_BUCKET not set in deploy/.env"
fi
