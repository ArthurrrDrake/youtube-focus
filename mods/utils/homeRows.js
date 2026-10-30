// Night mode: between these hours (TV's local time) the home screen shows no rows.
export const NIGHT_START_HOUR = 20;
export const NIGHT_END_HOUR = 7;

export function isNightTime(date) {
  const hour = date.getHours();
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
}

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
