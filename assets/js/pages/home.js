import { getAwards, getIndexes, getSource } from '../data/store.js';
import { PROGRAMS } from '../data/programs.js';
import { REGIONS, regionOf, resolveLocation } from '../data/airports.js';
import { awardCardHtml, cardGridHtml } from '../components/awardCard.js';
import { airportInputHtml } from '../components/airportSelect.js';
import { programSwatch } from '../components/badges.js';
import { esc, mount } from '../util/dom.js';
import { buildHash } from '../util/router.js';
import { CABINS, CABIN_LABEL, fmtNumber } from '../util/format.js';
import { SWEET_SPOT_THRESHOLD } from '../util/cpm.js';

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

  const stat = (value, label) => `
    <div class="card px-4 py-3">
      <dd class="text-2xl font-semibold tabular text-ink-900">${value}</dd>
      <dt class="text-sm text-ink-600">${label}</dt>
    </div>`;

  mount(
    root,
    `
    <section class="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div>
        ${source?.kind === 'synthetic' ? '<p class="mb-4"><span class="badge badge-sweet">Demo data</span> <span class="text-sm text-ink-600">Availability is generated, not live.</span></p>' : ''}
        <h1 tabindex="-1" class="text-3xl font-bold tracking-tight text-ink-900 sm:text-5xl">Find the award seats worth your points.</h1>
        <p class="mt-4 max-w-xl text-lg text-ink-600">
          Pointscanner scans award space across ${PROGRAMS.length} loyalty programs and scores every seat against what
          those points are normally worth, so 60k in one program and 90k in another are finally comparable.
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

    <dl class="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
      ${stat(fmtNumber(awards.length), 'award seats scanned')}
      ${stat(fmtNumber(getIndexes().byRoute.size), 'routes')}
      ${stat(PROGRAMS.length, 'loyalty programs')}
      ${stat(fmtNumber(sweetSpots.length), 'sweet spots')}
    </dl>

    <section class="mt-12" aria-labelledby="sweet-heading">
      <div class="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="sweet-heading" class="text-xl font-semibold text-ink-900">Today's sweet spots</h2>
          <p class="text-sm text-ink-600">Awards returning at least ${SWEET_SPOT_THRESHOLD}× their program's baseline value per point.</p>
        </div>
        <a class="link text-sm" href="${buildHash('/search', { sweet: true, sort: 'score' })}">See all ${fmtNumber(sweetSpots.length)} →</a>
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
              <a class="link text-sm" href="${buildHash('/search', { to: region, cabins: 'business,first', sort: 'score' })}">More into ${esc(region)} →</a>
            </div>
            ${cardGridHtml(picks.map((a) => awardCardHtml(a)))}
          </div>`,
          )
          .join('')}
      </div>
    </section>

    <section class="mt-12" aria-labelledby="programs-heading">
      <h2 id="programs-heading" class="mb-3 text-xl font-semibold text-ink-900">Programs we scan</h2>
      <ul class="flex flex-wrap gap-2">
        ${PROGRAMS.map(
          (p) => `<li><a class="chip" href="${buildHash('/search', { programs: p.id, sort: 'score' })}">${programSwatch(p.id)} ${esc(p.name)}</a></li>`,
        ).join('')}
      </ul>
    </section>

    <section class="card mt-12 grid gap-4 p-6 md:grid-cols-3" aria-labelledby="how-heading">
      <h2 id="how-heading" class="sr-only">How it works</h2>
      <div><p class="font-semibold text-ink-900">1 · Normalised deal score</p><p class="mt-1 text-sm text-ink-600">Every seat is priced in cents per point against an estimated cash fare, then divided by that program's baseline value. 2.0× means twice the usual value.</p></div>
      <div><p class="font-semibold text-ink-900">2 · Calendar heatmap</p><p class="mt-1 text-sm text-ink-600">See 60 days of a route at a glance and spot the cheap week in a second.</p></div>
      <div><p class="font-semibold text-ink-900">3 · Saved routes</p><p class="mt-1 text-sm text-ink-600">Save a route and Pointscanner shows what opened up or got cheaper since your last visit. Stored in your browser only.</p></div>
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
