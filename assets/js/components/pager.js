import { fmtNumber } from '../util/format.js';
import { icon } from './icons.js';

function pageList(page, count) {
  const pages = new Set([1, count, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= count - 2) [count - 1, count - 2, count - 3].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}

export function pageCountFor(total, pageSize) {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function pagerHtml({ page, total, pageSize }) {
  const count = pageCountFor(total, pageSize);
  if (count <= 1) return '';
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);
  const btn = (p, label, { current = false, disabled = false, aria = '' } = {}) =>
    `<button type="button" class="btn btn-sm ${current ? 'btn-primary' : 'btn-ghost'} tabular" data-page="${p}"
      ${current ? 'aria-current="page"' : ''} ${disabled ? 'disabled' : ''} ${aria ? `aria-label="${aria}"` : ''}>${label}</button>`;
  const items = pageList(page, count)
    .map((p) => (p === null ? '<span class="px-1 text-ink-400" aria-hidden="true">…</span>' : btn(p, p, { current: p === page, aria: `Page ${p}` })))
    .join('');
  return `
    <nav class="flex flex-wrap items-center justify-between gap-3 pt-4" aria-label="Results pages">
      <p class="text-sm text-ink-600 tabular">Showing ${fmtNumber(first)}–${fmtNumber(last)} of ${fmtNumber(total)}</p>
      <div class="flex flex-wrap items-center gap-1">
        ${btn(page - 1, `${icon('arrowLeft')}Prev`, { disabled: page <= 1, aria: 'Previous page' })}
        ${items}
        ${btn(page + 1, `Next${icon('arrowRight')}`, { disabled: page >= count, aria: 'Next page' })}
      </div>
    </nav>`;
}
