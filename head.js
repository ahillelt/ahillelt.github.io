// ============================================================================
// head.js - loaded synchronously in <head>, before any content renders.
// Holds everything that must exist early: clickjacking defense, shared
// security/CSV utilities, and the saved layout preference.
// All scripts are external files so the CSP can omit 'unsafe-inline'.
// ============================================================================

// ============================================================================
// SECURITY: Clickjacking defense. GitHub Pages cannot send X-Frame-Options or a
// CSP frame-ancestors header, and browsers ignore both when set via <meta>.
// Refuse to render when framed by another origin.
// ============================================================================
(function() {
  if (window.top === window.self) return;
  let sameOrigin = false;
  try { sameOrigin = window.top.location.origin === window.location.origin; } catch (e) { /* cross-origin */ }
  if (!sameOrigin) {
    document.documentElement.style.display = 'none';
    try { window.top.location = window.location.href; } catch (e) { /* sandboxed frame */ }
  }
})();

// ============================================================================
// PERFORMANCE: Async font loading. The stylesheet starts as media="print" so it
// doesn't block rendering; switch it on once loaded (replaces an inline onload=,
// which the CSP would block).
// ============================================================================
(function() {
  const fontCss = document.getElementById('font-css');
  if (!fontCss) return;
  const enable = () => { fontCss.media = 'all'; };
  if (fontCss.sheet) enable();
  else fontCss.addEventListener('load', enable);
})();

// ============================================================================
// SECURITY: HTML escaping and URL/HTML sanitization (prevent XSS).
// Defined once here; never redeclare them in another script, since a later
// function declaration silently replaces the global one.
// ============================================================================

// Escapes quotes too, so output is safe in both element content and quoted attributes
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Returns a URL safe to interpolate into a quoted HTML attribute.
// Allowlist: http(s), mailto, tel, and relative/fragment URLs only.
function sanitizeUrl(url) {
  if (!url) return '#';
  // Strip whitespace/control chars browsers ignore inside schemes (e.g. "java\tscript:")
  const trimmed = String(url).trim().replace(/[\u0000-\u001F\u007F]/g, '');
  const scheme = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (scheme && !/^(https?|mailto|tel)$/i.test(scheme[1])) return '#';
  return escapeHtml(trimmed);
}

// For CSV fields that intentionally contain light formatting.
// Escapes everything, then re-enables only attribute-less <strong>, <em>, <b>, <i>, <br>.
function sanitizeHtml(html) {
  return escapeHtml(html).replace(/&lt;(\/?)(strong|em|b|i|br)\s*\/?&gt;/gi, '<$1$2>');
}

// ============================================================================
// CSV PARSING: one RFC 4180-style parser shared by every loader.
// Handles quoted fields, embedded commas, "" escapes, newlines inside quotes,
// CRLF line endings and a UTF-8 BOM. Cell values are whitespace-trimmed and
// blank lines are skipped.
// ============================================================================
function parseCSVRows(text) {
  const src = String(text).replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const char = src[i];
    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows
    .map(r => r.map(value => value.trim()))
    .filter(r => r.some(value => value !== ''));
}

// Header row + data rows -> array of objects keyed by header name
function parseCSVObjects(text) {
  const [headers = [], ...rows] = parseCSVRows(text);
  return rows.map(r => {
    const obj = {};
    headers.forEach((header, idx) => { obj[header] = r[idx] || ''; });
    return obj;
  });
}

// "key,value" files -> { key: value }
function parseCSVKeyValues(text) {
  const data = {};
  parseCSVRows(text).slice(1).forEach(r => {
    if (r[0]) data[r[0]] = r[1] || '';
  });
  return data;
}

async function fetchCSV(file) {
  const response = await fetch(file, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${file}`);
  return response.text();
}

// ============================================================================
// Shared layout-preference utilities (used by content.js and script.js)
// ============================================================================
window.__portfolioUtils = {
  sectionMap: {
    '#about': 'about',
    '#press': 'press',
    '#teaching': 'teaching',
    '#labs': 'labs',
    '#research': 'research',
    '#industry': 'industry',
    '#credentials': 'credentials',
    '#contact': 'contact'
  },
  getCookie: function(name) {
    const value = document.cookie.split('; ').find(row => row.startsWith(name + '='));
    return value ? decodeURIComponent(value.split('=')[1]) : null;
  },
  setCookie: function(name, value, days = 365) {
    const MS_PER_DAY = 864e5; // 86400000 milliseconds in a day
    const expires = new Date(Date.now() + days * MS_PER_DAY).toUTCString();
    // SECURITY: Add Secure flag for HTTPS, SameSite=Strict to prevent CSRF
    const isSecure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict${isSecure}`;
  }
};

// Load saved layout as early as possible so content.js can reorder before paint
(function() {
  const getCookie = window.__portfolioUtils.getCookie;

  // localStorage throws (SecurityError) when site data is blocked
  let savedOrder = null;
  try { savedOrder = localStorage.getItem('navOrder'); } catch (e) { /* storage blocked */ }
  if (!savedOrder) {
    savedOrder = getCookie('navOrder');
  }

  if (savedOrder) {
    try {
      window.__initialNavOrder = JSON.parse(savedOrder);
    } catch (e) {
      console.error('Failed to parse saved nav order:', e);
    }
  }
})();
