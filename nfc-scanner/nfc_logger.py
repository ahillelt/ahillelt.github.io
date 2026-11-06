#!/usr/bin/env python3
"""
NFC scan logger for the rf IDEAS WaveID Plus (keyboard-wedge mode).

The WaveID Plus "types" each tag ID followed by Enter, as if it were a
keyboard. This program reads those lines, stamps them with the time and
floor, and:

  * appends every scan to a local CSV file (always - this is the log of
    record and keeps working with no network), and
  * optionally sends every scan to a shared Google Sheet through a small
    Google Apps Script web app, so several scanner stations can write to
    the same sheet at the same time.

Scans that cannot reach Google right away are queued on disk and retried
in the background, including after the program is closed and reopened.

Standard library only - no pip installs required.

Usage:
    python nfc_logger.py                 # uses nfc_config.json if present
    python nfc_logger.py --csv other.csv # override the CSV file
    python nfc_logger.py --help
"""

import argparse
import csv
import json
import os
import socket
import sys
import threading
import time
import urllib.error
import urllib.request
import uuid
from collections import deque
from datetime import datetime, timezone

APP_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CONFIG = os.path.join(APP_DIR, "nfc_config.json")

CSV_HEADER = ["timestamp_local", "timestamp_utc", "floor", "tag_id", "station", "scan_id"]

QUIT_WORDS = {"q", "quit", "exit"}
FLOOR_WORDS = {"f", "floor"}

MAX_FLOOR_LEN = 10
MAX_TAG_LEN = 128
UPLOAD_BATCH = 100
HTTP_TIMEOUT = 15


# --------------------------------------------------------------------------
# Config
# --------------------------------------------------------------------------

def load_config(path):
    cfg = {
        "csv_path": "nfc_scans.csv",
        "station_name": socket.gethostname(),
        "sheets_webhook_url": "",
        "sheets_token": "",
        "debounce_seconds": 3,
    }
    if path and os.path.exists(path):
        with open(path, "r", encoding="utf-8") as fh:
            user = json.load(fh)
        cfg.update({k: v for k, v in user.items() if not k.startswith("_")})
    return cfg


def resolve_path(p):
    p = os.path.expanduser(p)
    return p if os.path.isabs(p) else os.path.join(APP_DIR, p)


# --------------------------------------------------------------------------
# CSV log (local, append-only)
# --------------------------------------------------------------------------

class CsvLog:
    def __init__(self, path):
        self.path = path
        folder = os.path.dirname(path)
        if folder:
            os.makedirs(folder, exist_ok=True)
        needs_header = not os.path.exists(path) or os.path.getsize(path) == 0
        if needs_header:
            self._write([CSV_HEADER])

    def _write(self, rows):
        # newline="" is required by the csv module; utf-8-sig would add a BOM
        # mid-file on append, so plain utf-8 is used.
        with open(self.path, "a", newline="", encoding="utf-8") as fh:
            csv.writer(fh).writerows(rows)
            fh.flush()
            os.fsync(fh.fileno())

    def append(self, row):
        self._write([row])

    def count_rows(self):
        try:
            with open(self.path, "r", newline="", encoding="utf-8") as fh:
                return max(sum(1 for _ in csv.reader(fh)) - 1, 0)
        except OSError:
            return 0


# --------------------------------------------------------------------------
# Google Sheets sync (via Apps Script web app), with an on-disk retry queue
# --------------------------------------------------------------------------

class SheetSync:
    def __init__(self, url, token, queue_path):
        self.url = url
        self.token = token
        self.queue_path = queue_path
        self.lock = threading.Lock()
        self.wake = threading.Event()
        self.stop = threading.Event()
        self.status = "starting"
        self.last_error = ""
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()

    # -- queue file (one JSON row per line) --
    def _read_queue(self):
        if not os.path.exists(self.queue_path):
            return []
        rows = []
        with open(self.queue_path, "r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if line:
                    try:
                        rows.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass  # skip a partially written line
        return rows

    def enqueue(self, row):
        with self.lock:
            with open(self.queue_path, "a", encoding="utf-8") as fh:
                fh.write(json.dumps(row) + "\n")
                fh.flush()
                os.fsync(fh.fileno())
        self.wake.set()

    def _drop_sent(self, n):
        with self.lock:
            remaining = self._read_queue()[n:]
            tmp = self.queue_path + ".tmp"
            with open(tmp, "w", encoding="utf-8") as fh:
                for r in remaining:
                    fh.write(json.dumps(r) + "\n")
                fh.flush()
                os.fsync(fh.fileno())
            os.replace(tmp, self.queue_path)

    def pending(self):
        with self.lock:
            return len(self._read_queue())

    # -- network --
    def _post(self, rows):
        body = json.dumps({"token": self.token, "rows": rows}).encode("utf-8")
        req = urllib.request.Request(
            self.url, data=body, method="POST",
            headers={"Content-Type": "application/json"},
        )
        # Apps Script answers with a 302 to googleusercontent.com; urllib
        # follows it with a GET, which is exactly what Google expects.
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
            text = resp.read().decode("utf-8", "replace")
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            raise RuntimeError("unexpected reply from Google (check the web app URL / access)")
        if not data.get("ok"):
            raise RuntimeError(data.get("error", "Google Sheet rejected the rows"))

    def _run(self):
        backoff = 2
        while not self.stop.is_set():
            with self.lock:
                batch = self._read_queue()[:UPLOAD_BATCH]
            if not batch:
                self.status = "up to date"
                self.wake.wait(30)
                self.wake.clear()
                continue
            try:
                self._post(batch)
                self._drop_sent(len(batch))
                self.status = "up to date"
                self.last_error = ""
                backoff = 2
            except (urllib.error.URLError, OSError, RuntimeError, ValueError) as exc:
                self.status = "offline - will retry"
                self.last_error = str(getattr(exc, "reason", exc))[:120]
                self.wake.wait(backoff)
                self.wake.clear()
                backoff = min(backoff * 2, 60)

    def flush(self, timeout=8):
        """Give the uploader a few seconds to empty the queue before exit."""
        deadline = time.time() + timeout
        self.wake.set()
        while time.time() < deadline and self.pending():
            time.sleep(0.3)
        self.stop.set()
        self.wake.set()
        return self.pending()


# --------------------------------------------------------------------------
# Screen
# --------------------------------------------------------------------------

def clear_screen():
    os.system("cls" if os.name == "nt" else "clear")


def draw(floor, csv_path, sync, total, recent, message):
    clear_screen()
    width = 72
    print("=" * width)
    print(f"  FLOOR:        {floor}")
    print(f"  WRITING TO:   {csv_path}")
    if sync:
        pend = sync.pending()
        line = f"  GOOGLE SHEET: {sync.status}"
        if pend:
            line += f"  ({pend} waiting to upload)"
        print(line)
        if sync.last_error:
            print(f"                last error: {sync.last_error}")
    else:
        print("  GOOGLE SHEET: off (CSV only)")
    print(f"  SCANS IN FILE: {total}")
    print("=" * width)
    print("  Scan a tag.  Type 'f' + Enter to change floor, 'q' + Enter to quit.")
    print("-" * width)
    if recent:
        print("  Recent scans (newest first):")
        for ts, fl, tag in recent:
            print(f"    {ts}   floor {fl:<5} {tag}")
    else:
        print("  No scans yet this session.")
    print("-" * width)
    if message:
        print(f"  {message}")
    print()


# --------------------------------------------------------------------------
# Prompts
# --------------------------------------------------------------------------

def ask_floor():
    clear_screen()
    while True:
        raw = input("Which floor are you scanning from? Enter the floor number: ").strip()
        if not raw:
            continue
        if len(raw) > MAX_FLOOR_LEN or not raw.replace("-", "").isalnum():
            print("  Please enter a floor number (e.g. 3, or B1 for a basement).")
            continue
        confirm = input(f"Scanning from floor {raw}. Type the floor number again to confirm: ").strip()
        if confirm.lower() == raw.lower():
            return raw
        print("  That didn't match - let's try again.\n")


# --------------------------------------------------------------------------
# Main loop
# --------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="Log WaveID Plus NFC scans to CSV / Google Sheets.")
    ap.add_argument("--config", default=DEFAULT_CONFIG, help="path to config JSON")
    ap.add_argument("--csv", help="CSV file to append to (overrides config)")
    ap.add_argument("--station", help="name of this scanner station (overrides config)")
    ap.add_argument("--no-sheets", action="store_true", help="CSV only, skip Google Sheets")
    args = ap.parse_args()

    cfg = load_config(args.config)
    if args.csv:
        cfg["csv_path"] = args.csv
    if args.station:
        cfg["station_name"] = args.station

    csv_path = resolve_path(cfg["csv_path"])
    station = str(cfg["station_name"])[:64]
    debounce = float(cfg.get("debounce_seconds") or 0)

    log = CsvLog(csv_path)

    sync = None
    url = (cfg.get("sheets_webhook_url") or "").strip()
    if url and not args.no_sheets:
        if not url.startswith("https://"):
            sys.exit("sheets_webhook_url must start with https://")
        sync = SheetSync(url, str(cfg.get("sheets_token", "")), csv_path + ".pending.jsonl")

    floor = ask_floor()
    total = log.count_rows()
    recent = deque(maxlen=10)
    last_tag, last_time = None, 0.0
    message = f"Ready. Logging floor {floor}."

    try:
        while True:
            draw(floor, csv_path, sync, total, recent, message)
            try:
                raw = input("Scan > ")
            except EOFError:
                break
            tag = raw.strip()
            if not tag:
                message = ""
                continue
            low = tag.lower()
            if low in QUIT_WORDS:
                break
            if low in FLOOR_WORDS:
                floor = ask_floor()
                message = f"Floor changed. Logging floor {floor}."
                continue
            if len(tag) > MAX_TAG_LEN or any(ord(c) < 32 for c in tag):
                message = "!! Ignored: that doesn't look like a tag ID."
                continue

            now = time.time()
            if debounce and tag == last_tag and now - last_time < debounce:
                message = f"Duplicate of the last scan within {debounce:g}s - ignored."
                continue
            last_tag, last_time = tag, now

            local = datetime.now().astimezone()
            ts_local = local.strftime("%Y-%m-%d %H:%M:%S")
            ts_utc = local.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            row = [ts_local, ts_utc, floor, tag, station, uuid.uuid4().hex]

            log.append(row)
            total += 1
            if sync:
                sync.enqueue(row)
            recent.appendleft((ts_local, floor, tag))
            message = f"OK  saved {tag}"
            # Audible confirmation on most terminals.
            sys.stdout.write("\a")
    except KeyboardInterrupt:
        pass

    print("\nClosing...")
    if sync:
        left = sync.flush()
        if left:
            print(f"{left} scan(s) not yet uploaded to Google Sheets. They are saved")
            print("and will upload automatically next time the program runs.")
    print(f"All scans are saved in {csv_path}")


if __name__ == "__main__":
    main()
