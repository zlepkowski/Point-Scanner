import { awardsForProgram } from '../data/store.js';
import { ALLIANCES, PROGRAMS, milesValuationCents } from '../data/programs.js';
import { airlineName } from '../data/airlines.js';
import { esc, mount, on } from '../util/dom.js';
import { buildHash } from '../util/router.js';
import { CABINS, CABIN_SHORT, fmtNumber, fmtScore } from '../util/format.js';

function median(values) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export function programStats(awards) {
  const routes = new Set();
  const destinations = new Set();
  const milesByCabin = Object.fromEntries(CABINS.map((c) => [c, []]));
  let sweet = 0;
  let best = null;
  for (const a of awards) {
    routes.add(a.from + a.to);
    destinations.add(a.to);
    milesByCabin[a.cabin].push(a.miles);
    if (a.sweet) sweet++;
    if (!best || a.score > best.score) best = a;
  }
  return {
    count: awards.length,
    routes: routes.size,
    destinations: destinations.size,
    sweet,
    best,
    medianByCabin: Object.fromEntries(CABINS.map((c) => [c, median(milesByCabin[c])])),
  };
}

function cardHtml(p, s) {
  return `
    <li class="card flex flex-col overflow-hidden" data-alliance="${esc(p.alliance)}">
      <div class="h-1.5" style="background:${esc(p.color)}" aria-hidden="true"></div>
      <div class="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h2 class="text-lg font-semibold text-ink-900">${esc(p.name)}</h2>
          <p class="text-sm text-ink-600">${esc(airlineName(p.airline))} · ${esc(p.alliance === 'None' ? 'Unaligned' : p.alliance)}</p>
          <p class="text-xs text-ink-500">Currency: ${esc(p.currency)} · baseline ${milesValuationCents[p.id].toFixed(1)}¢ each</p>
        </div>
        <dl class="grid grid-cols-3 gap-2 text-center">
          <div class="rounded-lg bg-ink-50 py-2"><dd class="font-semibold tabular text-ink-900">${fmtNumber(s.count)}</dd><dt class="text-xs text-ink-500">awards</dt></div>
          <div class="rounded-lg bg-ink-50 py-2"><dd class="font-semibold tabular text-ink-900">${fmtNumber(s.destinations)}</dd><dt class="text-xs text-ink-500">destinations</dt></div>
          <div class="rounded-lg bg-ink-50 py-2"><dd class="font-semibold tabular text-ink-900">${fmtNumber(s.sweet)}</dd><dt class="text-xs text-ink-500">sweet spots</dt></div>
        </dl>
        <div>
          <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-500">Median price</p>
          <dl class="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm">
            ${CABINS.map(
              (c) => `<dt class="text-ink-600">${CABIN_SHORT[c]}</dt><dd class="text-right tabular text-ink-900">${s.medianByCabin[c] ? fmtNumber(s.medianByCabin[c]) : '—'}</dd>`,
            ).join('')}
          </dl>
        </div>
        ${
          s.best
            ? `<p class="text-sm text-ink-700"><span class="text-ink-500">Best deal:</span> <span class="font-mono">${esc(s.best.from)}–${esc(s.best.to)}</span>
                ${esc(CABIN_SHORT[s.best.cabin])} for ${fmtNumber(s.best.miles)} (${fmtScore(s.best.score)})</p>`
            : ''
        }
        <p class="text-xs text-ink-500">Partners (simplified): ${p.partners.length} airlines</p>
        <div class="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t border-ink-100 pt-3 text-sm">
          <a class="link" href="${buildHash('/search', { programs: p.id, sort: 'score' })}">Search awards</a>
          <a class="link" href="${buildHash('/wallet', { b: `${p.id}:100000` })}">What can 100k book?</a>
        </div>
      </div>
    </li>`;
}

export function render(root, { query, router }) {
  let alliance = ALLIANCES.includes(query.alliance) ? query.alliance : 'all';
  const stats = new Map(PROGRAMS.map((p) => [p.id, programStats(awardsForProgram(p.id))]));

  mount(
    root,
    `
    <div class="mb-6">
      <h1 tabindex="-1" class="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Loyalty programs</h1>
      <p class="mt-1 max-w-2xl text-ink-600">The ${PROGRAMS.length} programs Pointscanner scans, with what's bookable in each right now. The baseline is the
        value per point a deal score of 1.0× represents.</p>
    </div>
    <div role="group" aria-label="Filter by alliance" class="mb-5 flex flex-wrap gap-2">
      ${['all', ...ALLIANCES]
        .map(
          (a) => `<button type="button" class="chip" data-alliance-filter="${esc(a)}" aria-pressed="${a === alliance}">${
            a === 'all' ? 'All' : a === 'None' ? 'Unaligned' : esc(a)
          }</button>`,
        )
        .join('')}
    </div>
    <ul id="program-grid" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      ${PROGRAMS.map((p) => cardHtml(p, stats.get(p.id))).join('')}
    </ul>`,
  );

  function applyFilter() {
    for (const card of root.querySelectorAll('[data-alliance]')) {
      card.classList.toggle('hidden', alliance !== 'all' && card.dataset.alliance !== alliance);
    }
    for (const chip of root.querySelectorAll('[data-alliance-filter]')) {
      chip.setAttribute('aria-pressed', String(chip.dataset.allianceFilter === alliance));
    }
  }
  applyFilter();

  return on(root, 'click', '[data-alliance-filter]', (e, chip) => {
    alliance = chip.dataset.allianceFilter;
    router.replaceQuery({ alliance: alliance === 'all' ? null : alliance });
    applyFilter();
  });
}
