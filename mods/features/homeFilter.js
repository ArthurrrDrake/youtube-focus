import { configRead } from '../config.js';
import { showToast } from '../ui/ytUI.js';
import resolveCommand from '../resolveCommand.js';
import { isHomeHash, isHomeResponse, isNightTime, emptyRows, removeWatched, removeWatchedItems, NIGHT_END_HOUR } from '../utils/homeRows.js';
import { t } from 'i18next';

let toastShown = false;

function isNight() {
  return configRead('enableNightMode') && isNightTime(new Date());
}

// Home rows: emptied at night, without watched videos during the day.
export default function filterHome(sectionList, r) {
  if (!sectionList?.contents || !isHomeResponse(r, location.hash)) return;

  if (!isNight()) {
    if (configRead('hideWatchedOnHome')) removeWatched(sectionList);
    return;
  }

  emptyRows(sectionList);
  if (configRead('showNightModeToast') && !toastShown) {
    toastShown = true;
    setTimeout(() => showToast(t('nightMode.title'), t('nightMode.subtitle', { hour: NIGHT_END_HOUR })), 4000);
  }
}

// Videos loaded while scrolling along a home row.
export function filterHomeItems(items, r) {
  if (isNight() || !configRead('hideWatchedOnHome') || !isHomeResponse(r, location.hash)) return items;
  return removeWatchedItems(items);
}

// Reload the home screen when night starts or ends while it is open.
let wasNight = isNight();
setInterval(() => {
  const night = isNight();
  if (night === wasNight) return;
  wasNight = night;
  toastShown = false;
  if (isHomeHash(location.hash)) {
    resolveCommand({
      signalAction: {
        signal: 'SOFT_RELOAD_PAGE'
      }
    });
  }
}, 60000);
