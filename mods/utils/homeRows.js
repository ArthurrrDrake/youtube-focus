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

export function isHomeHash(locationHash) {
  const hash = (locationHash || '').substring(1);
  const hashBrowseId = hash.split('c=')[1]?.split('&')[0];
  return hash === '' || hash === '/' || HOME_BROWSE_IDS.indexOf(hashBrowseId) !== -1;
}

export function isHomeResponse(r, locationHash) {
  const browseId = trackingParam(r, 'browse_id');
  if (browseId !== null) return HOME_BROWSE_IDS.indexOf(browseId) !== -1;
  // Rows loaded while scrolling carry no browse_id, so fall back to the page.
  return isHomeHash(locationHash);
}

// Empties a home section list: only the search bar is kept, and the token for
// loading more rows is dropped so YouTube doesn't keep fetching rows to fill it.
export function emptyRows(sectionList) {
  sectionList.contents = sectionList.contents.filter((row) => row.searchBarRenderer);
  sectionList.continuations = [];
}

// Progress bars on a video thumbnail: old tiles use the first, lockup view models the second.
const PROGRESS_KEYS = ['thumbnailOverlayResumePlaybackRenderer', 'thumbnailOverlayProgressBarViewModel'];

function hasAnyKey(node, keys, depth) {
  if (!node || typeof node !== 'object' || depth > 12) return false;
  for (const key of Object.keys(node)) {
    if (keys.indexOf(key) !== -1) return true;
    if (hasAnyKey(node[key], keys, depth + 1)) return true;
  }
  return false;
}

// A video counts as watched as soon as its thumbnail shows a progress bar, however short.
export function isWatched(item) {
  return hasAnyKey(item, PROGRESS_KEYS, 0);
}

export function removeWatchedItems(items) {
  return items.filter((item) => !isWatched(item));
}

// Drops watched videos from every row, and rows left with no videos at all.
export function removeWatched(sectionList) {
  sectionList.contents = sectionList.contents.filter((row) => {
    const content = row.shelfRenderer?.content;
    const list = content && content[Object.keys(content)[0]];
    if (!list || !Array.isArray(list.items) || !list.items.length) return true;
    list.items = removeWatchedItems(list.items);
    return list.items.length > 0;
  });
}
