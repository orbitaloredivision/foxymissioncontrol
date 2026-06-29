#!/usr/bin/env bash
#
# Master Orange Pi install: code.zip (Python services) + guidashboard install.
#
# Usage on device:
#   curl -fsSL "https://raw.githubusercontent.com/orbitaloredivision/foxymissioncontrol/main/tools/install/install-master.sh" -o install-master.sh
#   chmod +x install-master.sh
#   sudo ./install-master.sh
#
# First run may enable hardware and reboot; re-run the same commands after boot.

set -euo pipefail

REPO_RAW="${REPO_RAW:-https://raw.githubusercontent.com/orbitaloredivision/foxymissioncontrol/main}"
CODE_ZIP_URL="${REPO_RAW}/shared/code.zip"

WDIR='/home/orangepi/code'
TMP_FNAME='/tmp/code.zip'

SIG_FILE="/boot/update.sig"
SKIP_SIG_FILE="$WDIR/skip_update"
SERV_SIG_FILE="/etc/systemd/system/emaster.service"

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo $0"
  exit 1
fi

echo "Update starts..."

if [ -f "$TMP_FNAME" ]; then
  rm "$TMP_FNAME"
fi

echo "Downloading code.zip from repository..."
echo "  ${CODE_ZIP_URL}"
curl -fsSL "${CODE_ZIP_URL}?$(date +%s)" -o "$TMP_FNAME"
if [ ! -s "$TMP_FNAME" ]; then
  echo "ERROR: code.zip download failed or empty"
  exit 1
fi

if [ ! -d "$WDIR" ]; then
  mkdir "$WDIR"
  chown orangepi:orangepi "$WDIR"
fi

if [ ! -f "$SKIP_SIG_FILE" ]; then
    unzip -o "$TMP_FNAME" -d "$WDIR"
    cd "$WDIR"
    find . -type f \( -name "*.sh" -o -name "*.py" \) -exec sed -i 's/\r$//' {} +
    shopt -s nullglob
    chmod +x *.sh *.py 2>/dev/null || true
    shopt -u nullglob
    chown -R orangepi:orangepi "$WDIR"

    if [ ! -f "$SIG_FILE" ]; then
      echo "Enabling hardware. Please re-run this script after reboot!"
      ./enable_hw.sh
      exit 0
    fi

    if [ ! -f "$SERV_SIG_FILE" ]; then
      echo "Installing master scripts"
      ./install_wifi.sh
    else
      echo "Restarting services"
      systemctl restart emaster.service
      systemctl restart edisplay.service
      systemctl restart epass.service
      systemctl restart enet.service
    fi
else
    echo "This orangepi is not upgreadable!"
    cd "$WDIR"
fi

rm "$TMP_FNAME"

INSTALLER="/tmp/install-guidashboard.sh"
curl -fsSL "${REPO_RAW}/tools/install/install-guidashboard.sh?$(date +%s)" -o "$INSTALLER"
chmod +x "$INSTALLER"
"$INSTALLER"
code=$?
rm -f "$INSTALLER"
if [ $code -eq 0 ]; then
  cd /home/orangepi/guidashboard-repo/tools
  echo "--- setup-upgrade-wrapper.sh ---"
  ./setup-upgrade-wrapper.sh
  echo "--- update-nginx-upgrade-timeout.sh ---"
  ./update-nginx-upgrade-timeout.sh
fi

if [ "$code" -ne 0 ]; then
  echo "ERROR: install-guidashboard.sh failed (exit $code)"
  exit "$code"
fi

echo "COMPLETE!"
