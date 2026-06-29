#!/bin/bash
# Wrapper for guidashboard upgrade - GUI dashboard only (no code.zip / master services)
# Install with: sudo tools/setup-upgrade-wrapper.sh
# Requires: orangepi ALL=(ALL) NOPASSWD: /usr/bin/systemctl start guidashboard-upgrade in sudoers

set -e
export TERM=dumb
cd /home/orangepi

REPO_RAW="${REPO_RAW:-https://raw.githubusercontent.com/orbitaloredivision/foxymissioncontrol/main}"

log_time() { echo "[$(date '+%H:%M:%S')] $1"; }

log_time "Starting GUI dashboard install/upgrade"
INSTALLER="/tmp/install-guidashboard.sh"
curl -fsSL "${REPO_RAW}/tools/install/install-guidashboard.sh?$(date +%s)" -o "$INSTALLER"
chmod +x "$INSTALLER"
sudo "$INSTALLER"
code=$?
rm -f "$INSTALLER"
if [ $code -ne 0 ]; then
  log_time "Install failed (exit $code)"
  exit "$code"
fi

if [ -d /home/orangepi/guidashboard-repo/tools ]; then
  cd /home/orangepi/guidashboard-repo/tools
  log_time "Running setup-upgrade-wrapper.sh"
  sudo ./setup-upgrade-wrapper.sh
  log_time "Running update-nginx-upgrade-timeout.sh"
  sudo ./update-nginx-upgrade-timeout.sh
fi

log_time "Upgrade complete"
