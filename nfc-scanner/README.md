# NFC Scan Logger (WaveID Plus)

Logs every NFC tag scanned on an rf IDEAS **WaveID Plus** reader with a timestamp and floor number.
Every scan goes to a local CSV file. If you set it up, each scan also goes to a shared Google Sheet that several scanner stations can write to at the same time.

- Python 3.8+, standard library only (nothing to `pip install`)
- Works on Windows, macOS and Linux

## How it works

The WaveID Plus acts as a keyboard ("keyboard wedge"). It types the tag ID and presses Enter.
The program reads each line, adds a timestamp, the floor and the station name, and then:

1. **Appends the scan to the local CSV** right away. The CSV is always created, with or without
   Google Sheets. It's never overwritten, so closing and reopening the program keeps adding to the same log.
2. **Appends the same scan to a backup CSV** in a separate folder (see [Backups](#backups)).
3. **Sends the scan to Google Sheets** in the background, if you set that up. If the
   network is down, the scan waits in a queue file (`<csv>.pending.jsonl`) and uploads
   automatically once the network is back, even after a restart.

At startup it asks which floor you're scanning from (**G, 2, 10 or 12**) and has you type it again to confirm.
Anything else is rejected, and `g` is accepted for `G`.
The top of the screen always shows the floor, the CSV file it's writing to, the backup file,
the Google Sheet status and the number of scans in the file.

| Column | Example |
|---|---|
| timestamp_local | `2026-11-06 14:03:22` |
| timestamp_utc | `2026-11-06T19:03:22Z` |
| floor | `3` |
| tag_id | `04A1B2C3D4` |
| station | `Lobby-Scanner-1` |
| scan_id | unique ID per scan (prevents duplicate rows in the sheet if an upload is retried) |

## Running it

Install Python 3 first if the computer doesn't have it (https://www.python.org/downloads/).
On Windows, tick **"Add python.exe to PATH"** in the installer.

| Computer | To start |
|---|---|
| Windows | Double-click `start_windows.bat` |
| Mac | Double-click `start_mac.command`. The first time, macOS may block it: right-click it, choose **Open**, then **Open** again. |
| Linux | Run `./start_linux.sh` in a terminal |

You can also run `python3 nfc_logger.py` (or `py nfc_logger.py` on Windows) from a terminal.

- **Keep the program window focused** (clicked on) while scanning. The reader types into whichever window is active.
- Type `f` and press Enter to change floor. Type `q` and press Enter to quit (Ctrl+C also works).
- If the same tag is scanned again on the same floor within `debounce_seconds` (default 10), the repeat is ignored. Other tags scanned in between don't reset this. Set it to `0` to log every read.

Options: `--csv PATH`, `--station NAME`, `--no-sheets`, `--config PATH`.

## Configuration

Copy `nfc_config.example.json` to `nfc_config.json` next to the script and edit it:

```json
{
  "csv_path": "nfc_scans.csv",
  "station_name": "Lobby-Scanner-1",
  "sheets_webhook_url": "",
  "sheets_token": "",
  "debounce_seconds": 10,
  "floors": ["G", "2", "10", "12"]
}
```

To add or rename floors later, edit the `floors` list.

Give each scanner PC its own `station_name` so you can tell in the sheet where each scan came from.
Without a config file, the program writes `nfc_scans.csv` next to the script and uses the computer name as the station.

## Backups

Every scan is written to two CSV files:

| File | Default location |
|---|---|
| Main log | `nfc_scans.csv` next to the program |
| Backup | `NFC_Scan_Backups/nfc_scans_backup.csv` in your home folder (`C:\Users\<you>\` on Windows, `/Users/<you>/` on Mac) |

The backup is kept outside the program folder, so deleting or replacing the program doesn't remove it.
For a copy that survives losing the computer, set `backup_path` to a USB drive or a synced cloud
folder, for example `"D:/NFC_Backup/scans.csv"` or `"~/OneDrive/NFC_Backup/scans.csv"`.

Built-in protection:

- **File locked or unavailable** (most often because the CSV is open in Excel on Windows): the scan
  still goes to the other file. The top of the screen shows a red-flag line, and the program writes the
  waiting scans as soon as the file is free. To look at the data while scanning, open a copy of the file.
- **Every startup**, the program compares the two files by `scan_id` and adds any scan that's missing
  from one to the other. If one file is deleted, it's rebuilt from the other. Nothing is ever deleted or rewritten.
- **When you quit**, it makes a last attempt to write any waiting scans. If a scan still can't be written,
  it tells you which file was affected.

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

### How often it uploads

Each scan is sent as soon as it's made, usually within a second. The **GOOGLE SHEET** line at the top
of the screen updates every second:

| Shows | Meaning |
|---|---|
| `up to date - last upload 14:03:22 (12 this session)` | Everything is in the sheet |
| `uploading 1 scan(s)...` | A scan is on its way (normal for a moment after each scan) |
| `NOT UPLOADING - 3 waiting, next try in 8s` + `reason: ...` | Google can't be reached or rejected the upload. The scans are safe in both CSVs and the queue. It retries after 2s, then 4s, 8s and so on up to every 60s. |

If it stays on **NOT UPLOADING**, the `reason` line says why:

- `bad token`: `sheets_token` doesn't match `SHARED_TOKEN` in the Apps Script.
- `unexpected reply from Google`: the web app isn't deployed with **Who has access: Anyone**, or the URL isn't
  the `/exec` URL. Paste the URL into a browser: it should show `{"ok":true,"message":"NFC scan logger endpoint is running"}`.
- `Not Found`: the URL is wrong or the deployment was deleted.
- A network error such as `Name or service not known` or `timed out`: the computer is offline.

The rows go into a tab named **Scans** with an extra `received_at` column.
If you change the script later, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.

**Security note:** "Anyone" means anyone who has the URL *and* the token can add rows.
They can't read the sheet. Treat the token like a password, and don't commit `nfc_config.json`.
This folder's `.gitignore` already excludes it, along with the CSV and queue files.

## Troubleshooting

- **Google Sheet status says "SSL certificates missing" (Mac):** open the Python folder in
  Applications and double-click **Install Certificates.command**, then restart the logger.
  Scans waiting to upload are kept and will upload then.
- **"!! … NOT yet written - file is locked":** close the CSV in Excel (or another program).
  The waiting scans are written on the next scan.
- **Nothing happens when scanning:** click on the logger window so it's the active window.
  Test the reader by scanning into a text editor: you should see the ID typed out.
- **Windows says "Python was not found":** reinstall Python and tick "Add python.exe to PATH".

## Reader setup

Out of the box, the WaveID Plus outputs the tag ID followed by Enter, and that's all this program needs.
If you want a different ID format (hex or decimal, with or without leading zeros), change it with
rf IDEAS' configuration utility. The program logs whatever text the reader types.
