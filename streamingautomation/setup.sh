#!/usr/bin/env bash
# One-time setup script for bose-autoplay on Ubuntu Server.
# Run as root: sudo bash setup.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_NAME="bose-autoplay"

echo "==> Installing system dependencies..."
apt-get update -q
apt-get install -y \
    pulseaudio \
    pulseaudio-module-bluetooth \
    mpv \
    python3-dbus \
    python3-gi \
    python3-gi-cairo \
    gir1.2-glib-2.0

echo "==> Enabling PulseAudio system-wide service..."
# On a headless server PulseAudio runs as a system service, not per-user
systemctl --global disable pulseaudio.service pulseaudio.socket 2>/dev/null || true

cat > /etc/systemd/system/pulseaudio.service << 'EOF'
[Unit]
Description=PulseAudio sound server (system mode)
After=bluetooth.service
Wants=bluetooth.service

[Service]
Type=notify
ExecStart=/usr/bin/pulseaudio --system --disallow-exit --disallow-module-loading=false --log-target=journal
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Allow PulseAudio system instance to use bluetooth
usermod -aG bluetooth pulse 2>/dev/null || true

# Load bluetooth module in PulseAudio system config if not already there
PA_CONF="/etc/pulse/system.pa"
if ! grep -q "module-bluetooth-policy" "$PA_CONF"; then
    echo "load-module module-bluetooth-policy" >> "$PA_CONF"
fi
if ! grep -q "module-bluetooth-discover" "$PA_CONF"; then
    echo "load-module module-bluetooth-discover" >> "$PA_CONF"
fi

systemctl daemon-reload
systemctl enable pulseaudio.service
systemctl restart pulseaudio.service
echo "==> PulseAudio running in system mode."

echo ""
echo "==> Installing bose-autoplay systemd service..."
cp "$SCRIPT_DIR/bose-autoplay.service" /etc/systemd/system/

# Patch the service file to point at this exact script location
sed -i "s|/opt/streamingautomation|$SCRIPT_DIR|g" \
    /etc/systemd/system/bose-autoplay.service

systemctl daemon-reload
systemctl enable "$SERVICE_NAME.service"

echo ""
echo "=========================================================="
echo " Setup complete!  One manual step remains:"
echo ""
echo " 1. Find your Bose MAC address:"
echo "      bluetoothctl"
echo "      > power on"
echo "      > scan on"
echo "      (power on your Bose, wait for it to appear)"
echo "      > scan off"
echo "      > exit"
echo ""
echo " 2. Edit config.env and set BOSE_MAC_ADDRESS"
echo "      nano $SCRIPT_DIR/config.env"
echo ""
echo " 3. Pair and trust the Bose (one time only):"
echo "      bluetoothctl"
echo "      > pair XX:XX:XX:XX:XX:XX"
echo "      > trust XX:XX:XX:XX:XX:XX"
echo "      > connect XX:XX:XX:XX:XX:XX"
echo "      > exit"
echo ""
echo " 4. Start the service:"
echo "      sudo systemctl start bose-autoplay"
echo "      sudo journalctl -u bose-autoplay -f"
echo "=========================================================="
