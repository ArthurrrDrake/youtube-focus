import { configRead } from '../config.js';
import { showToast, showModal, overlayPanelItemListRenderer, overlayMessageRenderer } from '../ui/ytUI.js';
import { filterRows, isHomeResponse, isSignedOut, describeRow } from '../utils/homeRows.js';
import { t } from 'i18next';

let toastShown = false;

export default function filterHomeRows(rows, r) {
  if (!configRead('enableHomeRowFilter') || !isHomeResponse(r, location.hash)) return rows;

  const result = filterRows(rows);
  if (result.unreadable) {
    console.warn('Home row filter: no row titles found, leaving home untouched');
  }

  // Rows exist but no names were found: show what the first rows contain instead,
  // once per launch, so the filter can be taught YouTube's new layout.
  if (result.unreadable && !isSignedOut(r) && !toastShown) {
    toastShown = true;
    const shelves = rows.filter((row) => row.shelfRenderer).slice(0, 2);
    const lines = [];
    shelves.forEach((row, i) => {
      lines.push(`--- row ${i + 1} ---`);
      describeRow(row).forEach((line) => lines.push(line));
    });
    setTimeout(() => showModal(
      { title: t('homeRowFilter.inspectorTitle'), subtitle: t('homeRowFilter.inspectorSubtitle') },
      overlayPanelItemListRenderer(lines.map((line) => overlayMessageRenderer(line))),
      'tt-home-row-inspector',
      false
    ), 5000);
    return result.rows;
  }

  // Show once per launch which rows were kept and hidden, so renamed rows are easy to spot.
  if (configRead('showHomeRowFilterToast') && !toastShown && (result.hidden.length || result.unreadable)) {
    toastShown = true;
    const subtitle = isSignedOut(r)
      ? t('homeRowFilter.signedOut')
      : result.unreadable
      ? t('homeRowFilter.unreadable', { types: result.types.join(', ') })
      : t('homeRowFilter.summary', {
        kept: result.kept.join(', ') || '-',
        hidden: result.hidden.join(', ')
      });
    setTimeout(() => showToast(t('homeRowFilter.title'), subtitle), 4000);
  }

  return result.rows;
}
