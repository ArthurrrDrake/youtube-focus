// Recognises Shorts in YouTube TV responses and removes them wherever they appear.

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

function shelfItemCount(el) {
  const content = el?.shelfRenderer?.content;
  const list = content && content[Object.keys(content)[0]];
  return Array.isArray(list?.items) ? list.items.length : -1;
}

// Filters every array under node; rows whose videos were all Shorts are dropped too.
// Returns true if anything was removed.
function removeFrom(node, depth) {
  if (!node || typeof node !== 'object' || depth > 40) return false;
  let removed = false;
  for (const key of Object.keys(node)) {
    const value = node[key];
    if (Array.isArray(value)) {
      const kept = value.filter((el) => !isShortsItem(el) && !isShortsShelf(el));
      if (kept.length !== value.length) removed = true;
      node[key] = kept.filter((el) => {
        const before = shelfItemCount(el);
        if (!removeFrom(el, depth + 1)) return true;
        removed = true;
        return !(before > 0 && shelfItemCount(el) === 0);
      });
    } else if (value && typeof value === 'object') {
      if (removeFrom(value, depth + 1)) removed = true;
    }
  }
  return removed;
}

// Only the parts of a response that hold pages and lists are searched, so large
// player responses are not walked on every JSON.parse.
export function removeShorts(r) {
  if (!r || typeof r !== 'object') return false;
  let removed = false;
  for (const key of ['contents', 'continuationContents', 'onResponseReceivedActions']) {
    if (removeFrom(r[key], 0)) removed = true;
  }
  return removed;
}
