// Decides which rows of the YouTube TV home screen to keep.
// Rows are matched by title (case-insensitive, partial match), with Czech
// fallbacks in case YouTube switches to the TV's language.
export const HOME_ROWS_TO_KEEP = [
  'continue watching',
  'subscription',
  'new from',
  'watch later',
  'consumer electronics',
  'pokračovat ve sledování',
  'odběr',
  'přehrát později',
  'spotřební elektronik'
];

// YouTube TV reports its home page as FEtopics (the FEtopics_* ids are the topic tabs).
const HOME_BROWSE_IDS = ['FEtopics', 'default', 'FEwhat_to_watch'];

function trackingParam(r, key) {
  for (const service of r?.responseContext?.serviceTrackingParams || []) {
    for (const param of service.params || []) {
      if (param.key === key) return param.value;
    }
  }
  return null;
}

// A signed-out home has no personal rows at all, only a search bar and a sign-in nudge.
export function isSignedOut(r) {
  return trackingParam(r, 'logged_in') === '0';
}

export function isHomeResponse(r, locationHash) {
  const browseId = trackingParam(r, 'browse_id');
  if (browseId !== null) return HOME_BROWSE_IDS.indexOf(browseId) !== -1;
  // Rows loaded while scrolling carry no browse_id, so fall back to the page.
  const hash = (locationHash || '').substring(1);
  const hashBrowseId = hash.split('c=')[1]?.split('&')[0];
  return hash === '' || hash === '/' || HOME_BROWSE_IDS.indexOf(hashBrowseId) !== -1;
}

function textOf(text) {
  if (!text) return '';
  if (typeof text === 'string') return text;
  if (text.simpleText) return text.simpleText;
  if (text.runs) return text.runs.map((run) => run.text || '').join('');
  if (text.content) return text.content;
  return '';
}

// Keys holding a row's videos; their titles are video names, not the row's name.
const VIDEO_KEYS = ['items', 'contents'];

// Fallback for header layouts not listed in rowTitle: the first title/headline
// found outside the row's videos, which is the row's own header.
function findHeaderText(node, depth) {
  if (!node || typeof node !== 'object' || depth > 8) return '';
  for (const key of ['title', 'headline']) {
    const text = textOf(node[key]);
    if (text) return text;
  }
  for (const key of Object.keys(node)) {
    if (VIDEO_KEYS.indexOf(key) !== -1) continue;
    const text = findHeaderText(node[key], depth + 1);
    if (text) return text;
  }
  return '';
}

// Lists a row's values outside its videos as path=value lines, shown on screen
// when row names can't be read so the filter can be taught the new layout.
export function describeRow(row, maxLines = 14) {
  const lines = [];
  function walk(node, path, depth) {
    if (!node || typeof node !== 'object' || depth > 10) return;
    for (const key of Object.keys(node)) {
      if (lines.length >= maxLines) return;
      if (VIDEO_KEYS.indexOf(key) !== -1 || /trackingParams$/i.test(key)) continue;
      const value = node[key];
      const childPath = path ? `${path}.${key}` : key;
      if (value !== null && typeof value === 'object') {
        walk(value, childPath, depth + 1);
      } else {
        lines.push(`${childPath}=${String(value).slice(0, 48)}`);
      }
    }
  }
  walk(row, '', 0);
  return lines;
}

export function rowTitle(row) {
  const shelf = row?.shelfRenderer;
  if (!shelf) return '';
  return textOf(shelf.headerRenderer?.shelfHeaderRenderer?.title) ||
    textOf(shelf.shelfHeaderRenderer?.title) ||
    textOf(shelf.title) ||
    findHeaderText(shelf, 0);
}

export function isWantedRow(title, keep = HOME_ROWS_TO_KEEP) {
  const lower = title.toLowerCase();
  return keep.some((word) => lower.indexOf(word) !== -1);
}

// Non-shelf entries are left alone. If no shelf has a readable title, YouTube
// probably changed its format, so nothing is hidden rather than blanking home;
// `types` then lists what the rows were, to show on screen for fixing the filter.
export function filterRows(rows, keep = HOME_ROWS_TO_KEEP) {
  const kept = [];
  const hidden = [];
  const shelves = rows.filter((row) => row.shelfRenderer);
  if (!shelves.some((row) => rowTitle(row))) {
    const types = rows.map((row) => Object.keys(row)[0] || '?');
    return { rows, kept, hidden, types, unreadable: rows.length > 0 };
  }

  const result = rows.filter((row) => {
    if (!row.shelfRenderer) return true;
    const title = rowTitle(row);
    if (title && isWantedRow(title, keep)) {
      kept.push(title);
      return true;
    }
    hidden.push(title || '?');
    return false;
  });

  return { rows: result, kept, hidden, types: [], unreadable: false };
}
