import resolveCommand from '../resolveCommand.js';
import { isLockdownTime, MORNING_HOUR } from '../utils/schedule.js';
import { showScreen, removeScreen, pauseVideos, pauseOnPlay, blockKeys } from '../utils/lockdownScreen.js';
import { t } from 'i18next';

// Lockdown (22:00-07:00): a full-screen "YouTube is off" cover hides everything,
// including pages YouTube loaded before 22:00 and keeps in memory, the remote is
// ignored and nothing plays. adblock.js also empties every newly loaded list and
// refuses playback. There is deliberately no switch for it on the TV.
export function isLockdown() {
  return isLockdownTime(new Date());
}

export function lockdownReason() {
  return t('lockdown.subtitle', { hour: MORNING_HOUR });
}

let screen = null;

function closeApp() {
  try {
    window.tizen.application.getCurrentApplication().exit();
  } catch (e) {
    // Not available here; the TV's Home button still leaves the app.
  }
}

pauseOnPlay(document, isLockdown);
blockKeys(window, () => !!screen, closeApp);

function update() {
  if (isLockdown()) {
    if (!screen && document.body) screen = showScreen(document, t('lockdown.title'), lockdownReason());
    pauseVideos(document);
    return;
  }
  if (!screen) return;
  // Morning: lift the cover and start again from a fresh home screen.
  removeScreen(screen);
  screen = null;
  try {
    resolveCommand({ browseEndpoint: { browseId: 'FEtopics' } });
  } catch (e) {
    console.error('Lockdown: could not open the home screen', e);
  }
}

update();
setInterval(update, 1000);
