#!/usr/bin/env bash
# Create deploy/.env from .env.example with freshly generated secrets.
# Never overwrites an existing, non-empty .env. Third-party keys (Stripe, Brevo) stay to fill in.
set -euo pipefail
cd "$(dirname "$0")"

if [ -s .env ]; then
  echo ".env already exists, leaving it untouched"
else
  sed -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -hex 24)|" \
      -e "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 48)|" \
      -e "s|^SEED_ADMIN_PASSWORD=.*|SEED_ADMIN_PASSWORD=$(openssl rand -hex 12)|" \
      .env.example > .env
  chmod 600 .env
  echo ".env created"
fi

echo "Still empty:"
grep -E '^[A-Z_]+=$' .env || echo "(none)"
