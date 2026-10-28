import { configRead } from '../config.js';
import { showToast } from '../ui/ytUI.js';
import { filterRows, isHomeResponse } from '../utils/homeRows.js';
import { t } from 'i18next';

let toastShown = false;

export default function filterHomeRows(rows, r) {
  if (!configRead('enableHomeRowFilter') || !isHomeResponse(r, location.hash)) return rows;

  const result = filterRows(rows);
  if (result.unreadable) {
    console.warn('Home row filter: no row titles found, leaving home untouched');
  }

  // Show once per launch which rows were kept and hidden, so renamed rows are easy to spot.
  if (configRead('showHomeRowFilterToast') && !toastShown && (result.hidden.length || result.unreadable)) {
    toastShown = true;
    const subtitle = result.unreadable
      ? t('homeRowFilter.unreadable', { types: result.types.join(', ') })
      : t('homeRowFilter.summary', {
        kept: result.kept.join(', ') || '-',
        hidden: result.hidden.join(', ')
      });
    setTimeout(() => showToast(t('homeRowFilter.title'), subtitle), 4000);
  }

  return result.rows;
}
