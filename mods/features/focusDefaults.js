import { configRead, configWrite } from '../config.js';

// TizenTube saves every setting it has read, so a changed default never reaches a
// TV that already ran it. Apply YouTube Focus's own defaults once instead; the
// user can still change them in settings afterwards.
if (!configRead('focusDefaultsApplied')) {
  configWrite('enableShorts', false);
  configWrite('focusDefaultsApplied', true);
}
