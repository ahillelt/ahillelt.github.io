/**
 * Google Apps Script web app that receives scans from nfc_logger.py and
 * appends them to this spreadsheet. Safe for many scanner stations at once:
 * a script lock serialises writes, and each scan's scan_id is remembered so
 * a retried upload never creates a duplicate row.
 *
 * Setup (once):
 *   1. Open the Google Sheet > Extensions > Apps Script.
 *   2. Paste this file in, replacing everything.
 *   3. Change SHARED_TOKEN below to a long random string, and put the same
 *      string in nfc_config.json as "sheets_token" on every scanner PC.
 *   4. Deploy > New deployment > type "Web app".
 *        Execute as:    Me
 *        Who has access: Anyone
 *      Copy the Web app URL into nfc_config.json as "sheets_webhook_url".
 *   (After editing this script later, use Deploy > Manage deployments >
 *    Edit > Version: New version, so the URL stays the same.)
 */

const SHARED_TOKEN = 'CHANGE-ME-to-a-long-random-string';
const SHEET_NAME = 'Scans';
const HEADER = ['timestamp_local', 'timestamp_utc', 'floor', 'tag_id', 'station', 'scan_id', 'received_at'];

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: 'bad JSON' });
  }
  if (!body || body.token !== SHARED_TOKEN) {
    return reply({ ok: false, error: 'bad token' });
  }
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (rows.length === 0 || rows.length > 500) {
    return reply({ ok: false, error: 'expected 1-500 rows' });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getSheet();
    const cache = CacheService.getScriptCache();
    const received = new Date();
    const out = [];
    rows.forEach(function (r) {
      if (!Array.isArray(r) || r.length < 6) return;
      const scanId = String(r[5]).slice(0, 64);
      if (cache.get('scan_' + scanId)) return; // already written on an earlier try
      // Prefix with ' so Sheets keeps tag IDs as text (no lost leading zeros
      // or scientific notation) and nothing is treated as a formula.
      out.push(r.slice(0, 6).map(function (v) { return "'" + String(v).slice(0, 200); })
        .concat([received]));
      cache.put('scan_' + scanId, '1', 21600); // 6 hours
    });
    if (out.length) {
      sheet.getRange(sheet.getLastRow() + 1, 1, out.length, HEADER.length).setValues(out);
    }
    return reply({ ok: true, written: out.length });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return reply({ ok: true, message: 'NFC scan logger endpoint is running' });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
