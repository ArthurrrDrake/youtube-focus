// Recognises unwanted videos (Shorts, short videos) in YouTube TV responses and
// removes them wherever they appear.

// Videos this long or shorter are hidden when "only long videos" is on.
export const MIN_VIDEO_MINUTES = 12;

export function isShortsItem(el) {
  if (!el || typeof el !== 'object') return false;
  if (el.shortsLockupViewModel || el.reelItemRenderer) return true;
  if (el.lockupViewModel?.contentType === 'LOCKUP_CONTENT_TYPE_SHORT') return true;
  if (el.lockupViewModel?.rendererContext?.commandContext?.onTap?.innertubeCommand?.reelWatchEndpoint) return true;
  if (el.tileRenderer?.onSelectCommand?.reelWatchEndpoint) return true;
  return el.tileRenderer?.tvhtml5ShelfRendererType === 'TVHTML5_TILE_RENDERER_TYPE_SHORTS';
}

export function isShortsShelf(el) {
  return el?.shelfRenderer?.tvhtml5ShelfRendererType === 'TVHTML5_SHELF_RENDERER_TYPE_SHORTS' ||
    !!el?.reelShelfRenderer;
}

const LENGTH = /^(\d+:)?\d{1,2}:\d{2}$/;

// The length badge on the thumbnail (e.g. "16:03" or "1:02:03").
function lengthText(node, depth) {
  if (!node || typeof node !== 'object' || depth > 12) return null;
  for (const key of Object.keys(node)) {
    const value = node[key];
    if (typeof value === 'string') {
      if (LENGTH.test(value)) return value;
    } else {
      const found = lengthText(value, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

// Length in seconds, or null when none is shown (live streams, playlists, channels).
export function videoSeconds(el) {
  const thumbnail = el?.lockupViewModel?.contentImage || el?.tileRenderer?.header;
  const text = lengthText(thumbnail, 0);
  if (!text) return null;
  return text.split(':').reduce((total, part) => total * 60 + Number(part), 0);
}

export function isTooShort(el, minMinutes = MIN_VIDEO_MINUTES) {
  const seconds = videoSeconds(el);
  return seconds !== null && seconds <= minMinutes * 60;
}

function shelfItemCount(el) {
  const content = el?.shelfRenderer?.content;
  const list = content && content[Object.keys(content)[0]];
  return Array.isArray(list?.items) ? list.items.length : -1;
}

// Filters every array under node; rows left without videos are dropped too.
// Returns true if anything was removed.
function removeFrom(node, isUnwanted, depth) {
  if (!node || typeof node !== 'object' || depth > 40) return false;
  let removed = false;
  for (const key of Object.keys(node)) {
    const value = node[key];
    if (Array.isArray(value)) {
      const kept = value.filter((el) => !isUnwanted(el));
      if (kept.length !== value.length) removed = true;
      node[key] = kept.filter((el) => {
        const before = shelfItemCount(el);
        if (!removeFrom(el, isUnwanted, depth + 1)) return true;
        removed = true;
        return !(before > 0 && shelfItemCount(el) === 0);
      });
    } else if (value && typeof value === 'object') {
      if (removeFrom(value, isUnwanted, depth + 1)) removed = true;
    }
  }
  return removed;
}

// Only the parts of a response that hold pages and lists are searched, so large
// player responses are not walked on every JSON.parse.
export function removeVideos(r, { shorts, shortVideos }) {
  if (!r || typeof r !== 'object' || (!shorts && !shortVideos)) return false;
  const isUnwanted = (el) => (shorts && (isShortsItem(el) || isShortsShelf(el))) ||
    (shortVideos && isTooShort(el));
  let removed = false;
  for (const key of ['contents', 'continuationContents', 'onResponseReceivedActions']) {
    if (removeFrom(r[key], isUnwanted, 0)) removed = true;
  }
  return removed;
}
