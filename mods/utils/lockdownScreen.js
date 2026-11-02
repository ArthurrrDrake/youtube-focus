// Full-screen "YouTube is off" cover, key blocking and pausing used during lockdown.
// No YouTube imports, so it can be tested in a plain browser page.

export function showScreen(doc, title, subtitle) {
  const screen = doc.createElement('div');
  screen.id = 'yf-lockdown-screen';
  screen.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483647;' +
    'background:#000;color:#fff;display:flex;flex-direction:column;align-items:center;' +
    'justify-content:center;text-align:center;font-family:Roboto,Arial,sans-serif;';
  const heading = doc.createElement('div');
  heading.textContent = title;
  heading.style.cssText = 'font-size:4vw;font-weight:500;margin-bottom:1.5vw;';
  const text = doc.createElement('div');
  text.textContent = subtitle;
  text.style.cssText = 'font-size:2vw;opacity:0.7;';
  screen.appendChild(heading);
  screen.appendChild(text);
  doc.body.appendChild(screen);
  return screen;
}

export function removeScreen(screen) {
  if (screen && screen.parentNode) screen.parentNode.removeChild(screen);
}

export function pauseVideos(doc) {
  const videos = doc.querySelectorAll('video');
  let paused = 0;
  for (let i = 0; i < videos.length; i++) {
    if (!videos[i].paused) {
      videos[i].pause();
      paused++;
    }
  }
  return paused;
}

// Pauses any video the moment it starts while isActive() is true.
export function pauseOnPlay(doc, isActive) {
  doc.addEventListener('play', (e) => {
    if (isActive() && e.target && typeof e.target.pause === 'function') e.target.pause();
  }, true);
}

// Swallows every remote key while isActive() is true; Back (or Escape) calls onBack.
const BACK_KEYS = [10009, 27];

export function blockKeys(win, isActive, onBack) {
  const handler = (e) => {
    if (!isActive()) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.type === 'keydown' && BACK_KEYS.indexOf(e.keyCode) !== -1) onBack();
  };
  ['keydown', 'keyup', 'keypress'].forEach((type) => win.addEventListener(type, handler, true));
}
