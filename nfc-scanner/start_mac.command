#!/bin/bash
# Double-click in Finder to start the NFC scan logger on macOS.
cd "$(dirname "$0")" && exec python3 nfc_logger.py "$@"
