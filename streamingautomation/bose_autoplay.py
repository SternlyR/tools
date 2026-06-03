#!/usr/bin/env python3
"""
Bose Soundlink auto-stream daemon.

Watches BlueZ via D-Bus for the configured Bose device connecting or
disconnecting.  On connect it starts mpv streaming the configured URL
through the Bose PulseAudio sink.  On disconnect it stops mpv.
"""

import os
import re
import subprocess
import time
import logging
import signal
import sys
from pathlib import Path

import dbus
import dbus.mainloop.glib
from gi.repository import GLib

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

CONFIG_FILE = Path(__file__).parent / "config.env"


def load_config():
    cfg = {}
    with open(CONFIG_FILE) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, val = line.partition("=")
                cfg[key.strip()] = val.strip()
    return cfg


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("bose-autoplay")

# ---------------------------------------------------------------------------
# Audio helpers
# ---------------------------------------------------------------------------

_player_proc = None


def find_bose_sink(mac: str, timeout: int = 10) -> str | None:
    """Wait up to *timeout* seconds for the PulseAudio sink for *mac* to appear."""
    # PulseAudio names the sink using the MAC with underscores
    mac_under = mac.replace(":", "_")
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            out = subprocess.check_output(
                ["pactl", "list", "sinks", "short"], text=True
            )
            for line in out.splitlines():
                if mac_under in line:
                    return line.split()[1]  # sink name is second field
        except subprocess.CalledProcessError:
            pass
        time.sleep(1)
    return None


def start_stream(stream_url: str, sink_name: str | None, connect_delay: int):
    global _player_proc
    if _player_proc and _player_proc.poll() is None:
        log.info("Stream already running, skipping start.")
        return

    log.info("Waiting %ds for audio sink to initialize...", connect_delay)
    time.sleep(connect_delay)

    cmd = [
        "mpv",
        "--no-video",
        "--audio-display=no",
        "--idle=no",
        "--really-quiet",
    ]

    if sink_name and sink_name != "auto":
        cmd += [f"--audio-device=pulse/{sink_name}"]
    elif sink_name == "auto":
        # Let PulseAudio route to the default sink (which should be the Bose
        # now that it's connected and set as default by pulseaudio-module-bluetooth)
        pass

    cmd.append(stream_url)

    log.info("Starting stream: %s", " ".join(cmd))
    _player_proc = subprocess.Popen(cmd)


def stop_stream():
    global _player_proc
    if _player_proc and _player_proc.poll() is None:
        log.info("Stopping stream (pid %d).", _player_proc.pid)
        _player_proc.terminate()
        try:
            _player_proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            _player_proc.kill()
    _player_proc = None


# ---------------------------------------------------------------------------
# BlueZ D-Bus watcher
# ---------------------------------------------------------------------------

BLUEZ_SERVICE = "org.bluez"
DBUS_PROPS_IFACE = "org.freedesktop.DBus.Properties"
BLUEZ_DEVICE_IFACE = "org.bluez.Device1"


def normalize_mac(mac: str) -> str:
    return mac.upper().strip()


def make_device_path(adapter: str, mac: str) -> str:
    mac_under = mac.replace(":", "_")
    return f"/org/bluez/{adapter}/dev_{mac_under}"


class BoseWatcher:
    def __init__(self, cfg: dict):
        self.mac = normalize_mac(cfg["BOSE_MAC_ADDRESS"])
        self.stream_url = cfg["STREAM_URL"]
        self.audio_sink_cfg = cfg.get("AUDIO_SINK", "auto")
        self.connect_delay = int(cfg.get("CONNECT_DELAY", 3))

        dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)
        self.bus = dbus.SystemBus()
        self.loop = GLib.MainLoop()

    def run(self):
        log.info("Watching for Bose %s ...", self.mac)

        # Subscribe to PropertiesChanged on all BlueZ objects
        self.bus.add_signal_receiver(
            self._on_properties_changed,
            dbus_interface=DBUS_PROPS_IFACE,
            signal_name="PropertiesChanged",
            path_keyword="path",
        )

        # Also check if the device is already connected at startup
        self._check_initial_state()

        try:
            self.loop.run()
        except KeyboardInterrupt:
            pass
        finally:
            stop_stream()

    def _check_initial_state(self):
        try:
            obj_manager = dbus.Interface(
                self.bus.get_object(BLUEZ_SERVICE, "/"),
                "org.freedesktop.DBus.ObjectManager",
            )
            objects = obj_manager.GetManagedObjects()
            for path, interfaces in objects.items():
                if BLUEZ_DEVICE_IFACE in interfaces:
                    props = interfaces[BLUEZ_DEVICE_IFACE]
                    addr = str(props.get("Address", "")).upper()
                    if addr == self.mac and props.get("Connected"):
                        log.info("Bose already connected at startup.")
                        self._on_connected()
        except Exception as exc:
            log.warning("Could not check initial BT state: %s", exc)

    def _on_properties_changed(self, interface, changed, invalidated, path):
        if interface != BLUEZ_DEVICE_IFACE:
            return

        mac_under = self.mac.replace(":", "_")
        if mac_under not in str(path):
            return

        if "Connected" in changed:
            connected = bool(changed["Connected"])
            log.info("Bose %s: Connected=%s", self.mac, connected)
            if connected:
                self._on_connected()
            else:
                self._on_disconnected()

    def _on_connected(self):
        sink = None
        if self.audio_sink_cfg != "auto":
            sink = self.audio_sink_cfg
        else:
            sink = find_bose_sink(self.mac)
            if sink:
                log.info("Found PulseAudio sink: %s", sink)
            else:
                log.warning("Could not find Bose sink; using PulseAudio default.")
                sink = "auto"
        start_stream(self.stream_url, sink, self.connect_delay)

    def _on_disconnected(self):
        log.info("Bose disconnected — stopping stream.")
        stop_stream()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    cfg = load_config()

    if cfg.get("BOSE_MAC_ADDRESS", "XX:XX:XX:XX:XX:XX").startswith("XX"):
        log.error(
            "BOSE_MAC_ADDRESS not set in config.env. "
            "Run: bluetoothctl scan on  to find it."
        )
        sys.exit(1)

    def _sigterm(signum, frame):
        stop_stream()
        sys.exit(0)

    signal.signal(signal.SIGTERM, _sigterm)

    watcher = BoseWatcher(cfg)
    watcher.run()


if __name__ == "__main__":
    main()
