import { configRead } from '../config.js';
import { showToast } from '../ui/ytUI.js';
import { filterRows } from '../utils/homeRows.js';
import { t } from 'i18next';

let toastShown = false;

function isHomeResponse(r) {
  for (const service of r?.responseContext?.serviceTrackingParams || []) {
    for (const param of service.params || []) {
      if (param.key === 'browse_id') {
        return param.value === 'default' || param.value === 'FEwhat_to_watch';
      }
    }
  }
  // Rows loaded while scrolling carry no browse_id, so fall back to the page.
  const hash = location.hash.substring(1);
  return hash === '' || hash === '/';
}

export default function filterHomeRows(rows, r) {
  if (!configRead('enableHomeRowFilter') || !isHomeResponse(r)) return rows;

  const result = filterRows(rows);
  if (result.unreadable) {
    console.warn('Home row filter: no row titles found, leaving home untouched');
  }

  // Show once per launch which rows were kept and hidden, so renamed rows are easy to spot.
  if (configRead('showHomeRowFilterToast') && !toastShown && (result.hidden.length || result.unreadable)) {
    toastShown = true;
    const subtitle = result.unreadable
      ? t('homeRowFilter.unreadable')
      : t('homeRowFilter.summary', {
        kept: result.kept.join(', ') || '-',
        hidden: result.hidden.join(', ')
      });
    setTimeout(() => showToast(t('homeRowFilter.title'), subtitle), 4000);
  }

  return result.rows;
}
