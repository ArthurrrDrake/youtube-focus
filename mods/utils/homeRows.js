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

function textOf(text) {
  if (!text) return '';
  if (typeof text === 'string') return text;
  if (text.simpleText) return text.simpleText;
  if (text.runs) return text.runs.map((run) => run.text || '').join('');
  if (text.content) return text.content;
  return '';
}

export function rowTitle(row) {
  const shelf = row?.shelfRenderer;
  if (!shelf) return '';
  return textOf(shelf.headerRenderer?.shelfHeaderRenderer?.title) ||
    textOf(shelf.shelfHeaderRenderer?.title) ||
    textOf(shelf.title);
}

export function isWantedRow(title, keep = HOME_ROWS_TO_KEEP) {
  const lower = title.toLowerCase();
  return keep.some((word) => lower.indexOf(word) !== -1);
}

// Non-shelf entries are left alone. If no shelf has a readable title, YouTube
// probably changed its format, so nothing is hidden rather than blanking home.
export function filterRows(rows, keep = HOME_ROWS_TO_KEEP) {
  const kept = [];
  const hidden = [];
  const shelves = rows.filter((row) => row.shelfRenderer);
  if (!shelves.some((row) => rowTitle(row))) {
    return { rows, kept, hidden, unreadable: shelves.length > 0 };
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

  return { rows: result, kept, hidden, unreadable: false };
}
