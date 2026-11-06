#!/bin/sh
# Start the NFC scan logger on Linux.
cd "$(dirname "$0")" && exec python3 nfc_logger.py "$@"
