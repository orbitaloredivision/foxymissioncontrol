#!/bin/bash
# Wrapper for guidashboard upgrade - runs install-master.sh from GitHub (code.zip + install)
# Install with: sudo tools/setup-upgrade-wrapper.sh
# Requires: orangepi ALL=(ALL) NOPASSWD: /usr/local/bin/run-upgrade in sudoers
#
# install-master.sh handles code.zip + install-guidashboard + setup-upgrade-wrapper.

set -e
export TERM=dumb
cd /home/orangepi

REPO_RAW="${REPO_RAW:-https://raw.githubusercontent.com/orbitaloredivision/foxymissioncontrol/main}"

log_time() { echo "[$(date '+%H:%M:%S')] $1"; }

# 1. Run deploy script (code.zip, install-guidashboard - deploy does both)
log_time "Starting deploy script (code.zip + install)"
curl -fsSL "${REPO_RAW}/tools/install/install-master.sh?$(date +%s)" -o install-master.sh
chmod +x install-master.sh
sudo ./install-master.sh
log_time "Install script finished"

# install-master.sh already runs setup-upgrade-wrapper and update-nginx-upgrade-timeout (via install)

log_time "Upgrade complete"
