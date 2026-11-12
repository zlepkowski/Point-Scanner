import { getAwards, getIndexes, getSource } from '../data/store.js';
import { PROGRAMS } from '../data/programs.js';
import { REGIONS, regionOf, resolveLocation } from '../data/airports.js';
import { awardCardHtml, cardGridHtml } from '../components/awardCard.js';
import { airportInputHtml } from '../components/airportSelect.js';
import { programSwatch } from '../components/badges.js';
import { esc, mount } from '../util/dom.js';
import { buildHash } from '../util/router.js';
import { CABINS, CABIN_LABEL, fmtNumber } from '../util/format.js';
import { SWEET_SPOT_THRESHOLD, baselineCents } from '../util/cpm.js';
import { icon, routeArrow } from '../components/icons.js';
import { airportLabel } from '../data/airports.js';
import { programById } from '../data/programs.js';
import { fmtCpm, fmtScore, fmtUsd } from '../util/format.js';

function topDistinct(list, keyFn, n) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const k = keyFn(item);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
    if (out.length === n) break;
  }
  return out;
}

const byScore = (a, b) => b.score - a.score || a.miles - b.miles;

// The clearest "fewer miles isn't always better" pair in the current data:
// same route, business class, one award cheaper in miles but worse value.
export function valueExample(awards) {
  const byRoute = new Map();
  for (const a of awards) {
    if (a.cabin !== 'business') continue;
    const key = a.from + a.to;
    (byRoute.get(key) ?? byRoute.set(key, []).get(key)).push(a);
  }
  let best = null;
  for (const list of byRoute.values()) {
    if (list.length < 2) continue;
    const top = list.reduce((x, y) => (y.score > x.score ? y : x));
    for (const a of list) {
      if (a.programId === top.programId || a.miles >= top.miles) continue;
      const gap = top.score - a.score;
      if (!best || gap > best.gap) best = { better: top, cheaper: a, gap };
    }
  }
  return best;
}

function exampleSideHtml(a, verdict) {
  const program = programById.get(a.programId);
  return `
    <div class="card p-5">
      <p class="text-sm font-semibold text-ink-700">${esc(verdict)}</p>
      <p class="mt-2 flex flex-wrap items-baseline gap-x-2"><span class="text-3xl font-semibold tabular text-ink-900">${fmtNumber(a.miles)}</span>
        <span class="text-ink-600">${esc(program.currency)} + ${fmtUsd(a.taxesUsd)}</span></p>
      <dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt class="text-ink-600">Value per point</dt><dd class="tabular text-ink-900">${fmtCpm(a.cpm)}</dd>
        <dt class="text-ink-600">${esc(program.name)} usually</dt><dd class="tabular text-ink-900">${fmtCpm(baselineCents(a.programId))}</dd>
        <dt class="text-ink-600">Deal score</dt><dd class="tabular font-semibold text-ink-900">${fmtScore(a.score)}${a.sweet ? ' · sweet spot' : ''}</dd>
      </dl>
    </div>`;
}

export function render(root, { router }) {
  const awards = getAwards();
  const source = getSource();
  const sweetSpots = awards.filter((a) => a.sweet);
  const todaysPicks = topDistinct([...sweetSpots].sort(byScore), (a) => a.from + a.to, 6);

  const premium = awards.filter((a) => a.cabin === 'business' || a.cabin === 'first').sort(byScore);
  const regionPicks = REGIONS.map((region) => ({
    region,
    picks: topDistinct(premium.filter((a) => regionOf(a.to) === region), (a) => a.from + a.to, 3),
  })).filter((r) => r.picks.length);

  const example = valueExample(awards);
  const stat = (value, label) => `
    <div class="flex flex-col-reverse">
      <dt class="text-sm text-ink-600">${label}</dt>
      <dd class="text-2xl font-semibold tabular text-ink-900">${value}</dd>
    </div>`;

  mount(
    root,
    `
    <section class="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div>
        ${source?.kind === 'synthetic' ? '<p class="mb-4"><span class="badge">Demo data</span> <span class="text-sm text-ink-600">Availability is generated, not live.</span></p>' : ''}
        <h1 tabindex="-1" class="max-w-[18ch] text-3xl font-bold tracking-tight text-ink-900 sm:text-5xl">Find the award seats worth your points.</h1>
        <p class="mt-4 max-w-xl text-lg text-ink-600">
          Pointscanner compares award seats across ${PROGRAMS.length} loyalty programs and scores each one against an estimate
          of what those points are usually worth, so 60k in one program and 90k in another can be compared fairly.
        </p>
        <p class="mt-3 text-sm text-ink-500">Free and open source. No account, no email, no tracking.</p>
      </div>
      <form id="quick-search" class="card grid gap-3 p-5 sm:grid-cols-2" aria-label="Quick search">
        ${airportInputHtml({ id: 'qs-from', name: 'from', label: 'From', placeholder: 'e.g. JFK or New York' })}
        ${airportInputHtml({ id: 'qs-to', name: 'to', label: 'To', placeholder: 'e.g. LHR or Europe' })}
        <div class="sm:col-span-2">
          <label class="field-label" for="qs-cabin">Cabin</label>
          <select id="qs-cabin" name="cabin" class="input">
            <option value="">Any cabin</option>
            ${CABINS.map((c) => `<option value="${c}" ${c === 'business' ? 'selected' : ''}>${CABIN_LABEL[c]}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary sm:col-span-2" type="submit">Search award space</button>
        <p class="text-xs text-ink-500 sm:col-span-2">Tip: leave a field blank to search everywhere, or type a region like <span class="font-mono">Asia</span>.</p>
      </form>
    </section>

    <dl class="mt-10 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-ink-200 py-5 md:grid-cols-4">
      ${stat(fmtNumber(awards.length), source?.kind === 'synthetic' ? 'sample award seats' : 'award seats loaded')}
      ${stat(fmtNumber(getIndexes().byRoute.size), 'routes')}
      ${stat(PROGRAMS.length, 'loyalty programs')}
      ${stat(fmtNumber(sweetSpots.length), 'sweet spots')}
    </dl>

    ${
      example
        ? `<section class="mt-12" aria-labelledby="value-heading">
            <h2 id="value-heading" class="text-xl font-semibold text-ink-900">Fewer miles isn't always the better deal</h2>
            <p class="mb-4 mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-ink-600">A comparison from the current data:
              ${esc(airportLabel(example.better.from))} ${routeArrow(12)} ${esc(airportLabel(example.better.to))}, business class.</p>
            <div class="grid gap-4 md:grid-cols-2">
              ${exampleSideHtml(example.cheaper, 'Fewer points')}
              ${exampleSideHtml(example.better, 'Better value')}
            </div>
            <p class="mt-3 max-w-3xl text-sm text-ink-600">The deal score divides what each point is worth on this ticket (estimated cash
              fare minus taxes, per point) by what that program's points are usually worth. <a class="link" href="#/about">How it's calculated</a>.</p>
          </section>`
        : ''
    }

    <section class="mt-12" aria-labelledby="sweet-heading">
      <div class="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="sweet-heading" class="text-xl font-semibold text-ink-900">Today's sweet spots</h2>
          <p class="text-sm text-ink-600">Awards returning at least ${SWEET_SPOT_THRESHOLD}× their program's baseline value per point.</p>
        </div>
        <a class="link link-target text-sm" href="${buildHash('/search', { sweet: true, sort: 'score' })}">See all ${fmtNumber(sweetSpots.length)} ${icon('arrowRight', { size: 14 })}</a>
      </div>
      ${todaysPicks.length ? cardGridHtml(todaysPicks.map((a) => awardCardHtml(a))) : '<p class="text-ink-600">No sweet spots in the current data.</p>'}
    </section>

    <section class="mt-12" aria-labelledby="premium-heading">
      <h2 id="premium-heading" class="text-xl font-semibold text-ink-900">Premium-cabin picks by destination</h2>
      <p class="mb-4 text-sm text-ink-600">Best-value business and first class into each region.</p>
      <div class="space-y-8">
        ${regionPicks
          .map(
            ({ region, picks }) => `
          <div>
            <div class="mb-3 flex items-baseline justify-between gap-2">
              <h3 class="font-semibold text-ink-800">${esc(region)}</h3>
              <a class="link link-target text-sm" href="${buildHash('/search', { to: region, cabins: 'business,first', sort: 'score' })}">More into ${esc(region)} ${icon('arrowRight', { size: 14 })}</a>
            </div>
            ${cardGridHtml(picks.map((a) => awardCardHtml(a)))}
          </div>`,
          )
          .join('')}
      </div>
    </section>

    <section class="mt-12" aria-labelledby="programs-heading">
      <h2 id="programs-heading" class="mb-3 text-xl font-semibold text-ink-900">Programs covered</h2>
      <ul class="flex flex-wrap gap-2">
        ${PROGRAMS.map(
          (p) => `<li><a class="chip" href="${buildHash('/search', { programs: p.id, sort: 'score' })}">${programSwatch(p.id)} ${esc(p.name)}</a></li>`,
        ).join('')}
      </ul>
    </section>`,
  );

  const form = root.querySelector('#quick-search');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const from = String(fd.get('from') || '').trim();
    const to = String(fd.get('to') || '').trim();
    router.go('/search', {
      from: resolveLocation(from) ? from : '',
      to: resolveLocation(to) ? to : '',
      cabins: fd.get('cabin') || '',
    });
  });
}
