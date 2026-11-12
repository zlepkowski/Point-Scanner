import { programById } from '../data/programs.js';
import { CABIN_SHORT, fmtScore } from '../util/format.js';
import { esc } from '../util/dom.js';
import { icon } from './icons.js';

export function programSwatch(programId) {
  const color = programById.get(programId)?.color ?? '#94a3b8';
  return `<span class="swatch" style="background:${esc(color)}" aria-hidden="true"></span>`;
}

export function programTag(programId) {
  const p = programById.get(programId);
  return `<span class="inline-flex items-center gap-1.5 whitespace-nowrap">${programSwatch(programId)}<span>${esc(p?.name ?? programId)}</span></span>`;
}

export function cabinBadge(cabin) {
  const strong = cabin === 'business' || cabin === 'first';
  return `<span class="badge ${strong ? 'badge-brand' : ''}">${esc(CABIN_SHORT[cabin] ?? cabin)}</span>`;
}

// Score is always paired with text ("Sweet spot") so the accent colour never
// carries meaning on its own.
export function scoreBadge(score, sweet) {
  const title = `Deal score ${score.toFixed(2)}× the program's baseline value per point`;
  return sweet
    ? `<span class="badge badge-sweet" title="${esc(title)}">${icon('star', { size: 12, filled: true })} ${fmtScore(score)}<span class="sr-only"> deal score, sweet spot</span></span>`
    : `<span class="badge tabular" title="${esc(title)}">${fmtScore(score)}<span class="sr-only"> deal score</span></span>`;
}

export function mixedCabinBadge(itin) {
  if (!itin.mixed) return '';
  const pct = Math.round(itin.cabinShare * 100);
  return `<span class="badge badge-bad" title="One leg is in a different cabin">Mixed cabin · ${pct}% in ${esc(CABIN_SHORT[itin.cabin])}</span>`;
}
