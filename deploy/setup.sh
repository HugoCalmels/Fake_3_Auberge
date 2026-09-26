#!/usr/bin/env bash
# Prepare a fresh Ubuntu VPS: updates, firewall, swap, fail2ban, Docker.
# Idempotent: safe to run again on an already-configured server.
# Usage (as root): bash deploy/setup.sh
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

echo "==> System updates"
apt-get update -q
apt-get upgrade -yq
apt-get install -yq ufw fail2ban unattended-upgrades curl git ca-certificates

echo "==> Automatic security updates"
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "==> Firewall (SSH, HTTP, HTTPS only)"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> SSH: key-only login"
cat > /etc/ssh/sshd_config.d/99-hardening.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
EOF
# Recent Ubuntu socket-activates sshd (config read per connection); older ones run ssh.service
sshd -t
systemctl reload ssh 2>/dev/null || true

echo "==> fail2ban (SSH brute-force protection)"
cat > /etc/fail2ban/jail.local <<'EOF'
[sshd]
enabled = true
maxretry = 5
bantime = 1h
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban

echo "==> Swap (2G)"
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
sysctl -q vm.swappiness=10
echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf

echo "==> Docker (Ubuntu packages)"
apt-get install -yq docker.io docker-compose-v2
systemctl enable --now docker

echo "==> Nightly backups (03:00, see deploy/backup.sh)"
cat > /etc/cron.d/auberge-backup <<'EOF'
0 3 * * * root [ -f /opt/auberge/deploy/backup.sh ] && bash /opt/auberge/deploy/backup.sh >> /var/log/auberge-backup.log 2>&1
EOF
chmod 644 /etc/cron.d/auberge-backup

echo "==> Done"
docker --version
docker compose version
ufw status | head -n 8
swapon --show
