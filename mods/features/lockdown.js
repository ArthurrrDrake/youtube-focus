import { showToast } from '../ui/ytUI.js';
import resolveCommand from '../resolveCommand.js';
import { isLockdownTime, MORNING_HOUR } from '../utils/schedule.js';
import { isHomeHash } from '../utils/homeRows.js';
import { t } from 'i18next';

// Lockdown (22:00-07:00): every list is emptied and playback is refused in
// adblock.js's JSON.parse hook. There is deliberately no switch for it on the TV.
export function isLockdown() {
  return isLockdownTime(new Date());
}

export function lockdownReason() {
  return t('lockdown.subtitle', { hour: MORNING_HOUR });
}

function showLockdownToast() {
  showToast(t('lockdown.title'), lockdownReason());
}

// When lockdown starts, leave whatever is open for the (now empty) home screen.
// While it lasts, pause anything that still plays (cached pages, casts from a phone).
let wasLockdown = null;
setInterval(() => {
  const now = isLockdown();
  if (now && wasLockdown === false) {
    showLockdownToast();
    try {
      resolveCommand(isHomeHash(location.hash)
        ? { signalAction: { signal: 'SOFT_RELOAD_PAGE' } }
        : { browseEndpoint: { browseId: 'FEtopics' } });
    } catch (e) {
      console.error('Lockdown: could not reload the home screen', e);
    }
  } else if (now && wasLockdown === null) {
    setTimeout(showLockdownToast, 4000);
  }
  wasLockdown = now;

  if (!now) return;
  const videos = document.querySelectorAll('video');
  for (let i = 0; i < videos.length; i++) {
    if (!videos[i].paused) videos[i].pause();
  }
}, 2000);
