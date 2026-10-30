// Topic pages in the YouTube TV sidebar (Music, Gaming, News, ...) are FEtopics_*.
// Plain FEtopics is Home, so it is never treated as a topic.
export function isTopicBrowseId(browseId) {
  return typeof browseId === 'string' && browseId.indexOf('FEtopics_') === 0;
}

// The sidebar's Shorts entry has no browse id; it opens the Shorts player directly.
export function isShortsEntry(navigationEndpoint) {
  return !!navigationEndpoint?.reelWatchEndpoint;
}
