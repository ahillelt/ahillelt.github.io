# NFC Scan Logger (WaveID Plus)

Logs every NFC tag scanned on an rf IDEAS **WaveID Plus** reader with a timestamp and floor number.
Every scan goes to a local CSV file. If you set it up, each scan also goes to a shared Google Sheet that several scanner stations can write to at the same time.

- Python 3.8+, standard library only (nothing to `pip install`)
- Works on Windows, macOS and Linux

## How it works

The WaveID Plus acts as a keyboard ("keyboard wedge"). It types the tag ID and presses Enter.
The program reads each line, adds a timestamp, the floor and the station name, and then:

1. **Appends the scan to the CSV** right away. It never overwrites the file, so closing and
   reopening the program keeps adding to the same log.
2. **Sends the scan to Google Sheets** in the background, if you set that up. If the
   network is down, the scan waits in a queue file (`<csv>.pending.jsonl`) and uploads
   automatically once the network is back, even after a restart.

At startup it asks which floor you're scanning from and has you type the number again to confirm.
The top of the screen always shows the floor, the CSV file it's writing to, the Google Sheet
status and the number of scans in the file.

| Column | Example |
|---|---|
| timestamp_local | `2026-11-06 14:03:22` |
| timestamp_utc | `2026-11-06T19:03:22Z` |
| floor | `3` |
| tag_id | `04A1B2C3D4` |
| station | `Lobby-Scanner-1` |
| scan_id | unique ID per scan (prevents duplicate rows in the sheet if an upload is retried) |

## Running it

```bash
python nfc_logger.py
```

On Windows you can double-click `nfc_logger.py`, or run `py nfc_logger.py`.

- **Keep the program window focused** (clicked on) while scanning. The reader types into whichever window is active.
- Type `f` and press Enter to change floor. Type `q` and press Enter to quit (Ctrl+C also works).
- Scanning the same tag twice within `debounce_seconds` (default 3) is ignored as an accidental double read. Set it to `0` to turn this off.

Options: `--csv PATH`, `--station NAME`, `--no-sheets`, `--config PATH`.

## Configuration

Copy `nfc_config.example.json` to `nfc_config.json` next to the script and edit it:

```json
{
  "csv_path": "nfc_scans.csv",
  "station_name": "Lobby-Scanner-1",
  "sheets_webhook_url": "",
  "sheets_token": "",
  "debounce_seconds": 3
}
```

Give each scanner PC its own `station_name` so you can tell in the sheet where each scan came from.
Without a config file, the program writes `nfc_scans.csv` next to the script and uses the computer name as the station.

## Google Sheets setup (for multiple scanners)

All stations send their scans to one small Google Apps Script attached to the sheet.
It locks the sheet while writing, so scans that arrive at the same time never overwrite each other.
You don't need a Google Cloud project or service account.

1. Create a Google Sheet.
2. In the sheet, open **Extensions → Apps Script**. Delete the starter code and paste in `google_apps_script.gs`.
3. In that script, change `SHARED_TOKEN` to a long random string (for example, a password-manager generated one).
4. Click **Deploy → New deployment**, choose type **Web app**, and set
   **Execute as: Me** and **Who has access: Anyone**. Authorize it when Google asks.
5. Copy the **Web app URL** (it ends in `/exec`).
6. On every scanner PC, put that URL in `nfc_config.json` as `sheets_webhook_url`, and the same token as `sheets_token`.

The rows go into a tab named **Scans** with an extra `received_at` column.
If you change the script later, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.

**Security note:** "Anyone" means anyone who has the URL *and* the token can add rows.
They can't read the sheet. Treat the token like a password, and don't commit `nfc_config.json`.
This folder's `.gitignore` already excludes it, along with the CSV and queue files.

## Reader setup

Out of the box, the WaveID Plus outputs the tag ID followed by Enter, and that's all this program needs.
If you want a different ID format (hex or decimal, with or without leading zeros), change it with
rf IDEAS' configuration utility. The program logs whatever text the reader types.
