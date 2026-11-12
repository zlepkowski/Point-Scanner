import { awardsFrom } from '../data/store.js';
import { REGIONS, airportLabel, regionOf, resolveLocation } from '../data/airports.js';
import { airportInputHtml } from '../components/airportSelect.js';
import { awardCardHtml, cardGridHtml } from '../components/awardCard.js';
import { bindChips, cabinChipsHtml } from '../components/cabinChips.js';
import { announce, esc, mount } from '../util/dom.js';
import { icon } from '../components/icons.js';
import { buildHash } from '../util/router.js';
import { CABINS, CABIN_LABEL, plural } from '../util/format.js';

const PER_REGION = 9;
const DEFAULT_ORIGIN = 'JFK';

// Cheapest (or best-value) award to each destination, plus how many dates
// have space, so a destination with one lucky date doesn't look like a lane.
export function bestPerDestination(awards, cabin, sort) {
  const best = new Map();
  const dates = new Map();
  for (const a of awards) {
    if (a.cabin !== cabin) continue;
    (dates.get(a.to) ?? dates.set(a.to, new Set()).get(a.to)).add(a.date);
    const prev = best.get(a.to);
    const better =
      !prev ||
      (sort === 'score'
        ? a.score > prev.score || (a.score === prev.score && a.miles < prev.miles)
        : a.miles < prev.miles || (a.miles === prev.miles && a.score > prev.score));
    if (better) best.set(a.to, a);
  }
  return [...best.values()].map((award) => ({ award, dateCount: dates.get(award.to).size }));
}

export function render(root, { query, router }) {
  const state = {
    from: query.from || DEFAULT_ORIGIN,
    cabin: CABINS.includes(query.cabin) ? query.cabin : 'business',
    sort: query.sort === 'score' ? 'score' : 'miles',
  };

  mount(
    root,
    `
    <div class="mb-6">
      <h1 tabindex="-1" class="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Explore from your home airport</h1>
      <p class="mt-1 text-ink-600">The best award to every destination reachable from where you are, grouped by region.</p>
    </div>
    <form id="explore-form" class="card grid gap-4 p-4 md:grid-cols-[minmax(0,16rem)_1fr_auto] md:items-end" aria-label="Explore options">
      ${airportInputHtml({ id: 'explore-from', name: 'from', label: 'From', value: state.from, placeholder: 'e.g. JFK' })}
      <div>
        <span class="field-label">Cabin</span>
        ${cabinChipsHtml({ group: 'cabin', selected: [state.cabin], multi: false })}
      </div>
      <div>
        <label class="field-label" for="explore-sort">Show</label>
        <select id="explore-sort" name="sort" class="input">
          <option value="miles" ${state.sort === 'miles' ? 'selected' : ''}>Fewest miles</option>
          <option value="score" ${state.sort === 'score' ? 'selected' : ''}>Best value</option>
        </select>
      </div>
    </form>
    <div id="explore-results" class="mt-8"></div>`,
  );

  const results = root.querySelector('#explore-results');
  const form = root.querySelector('#explore-form');

  function renderResults() {
    const origins = resolveLocation(state.from);
    if (!origins) {
      results.innerHTML = `<p class="rounded-lg bg-bad-100 px-3 py-2 text-sm text-bad-800" role="alert">Enter an origin airport, city or region.</p>`;
      return 0;
    }
    const awards = origins.flatMap((o) => awardsFrom(o));
    const rows = bestPerDestination(awards, state.cabin, state.sort);
    const cmp = state.sort === 'score' ? (a, b) => b.award.score - a.award.score : (a, b) => a.award.miles - b.award.miles;
    const groups = REGIONS.map((region) => ({ region, rows: rows.filter((r) => regionOf(r.award.to) === region).sort(cmp) }))
      .filter((g) => g.rows.length);

    const originLabel = origins.length === 1 ? airportLabel(origins[0]) : `${origins.length} airports`;
    results.innerHTML = groups.length
      ? `<p class="mb-6 text-sm text-ink-600" aria-live="polite">${plural(rows.length, 'destination')} from ${esc(originLabel)} in ${esc(CABIN_LABEL[state.cabin])}.</p>
        <div class="space-y-10">
        ${groups
          .map(
            (g) => `
          <section aria-labelledby="region-${g.region.replace(/\W+/g, '')}">
            <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="region-${g.region.replace(/\W+/g, '')}" class="text-lg font-semibold text-ink-900">${esc(g.region)}
                <span class="ml-1 text-sm font-normal text-ink-500">${plural(g.rows.length, 'destination')}</span></h2>
              ${
                g.rows.length > PER_REGION
                  ? `<a class="link link-target text-sm" href="${buildHash('/search', { from: state.from, to: g.region, cabins: state.cabin, sort: state.sort === 'score' ? null : 'miles' })}">View all ${g.rows.length} in Search ${icon('arrowRight', { size: 14 })}</a>`
                  : ''
              }
            </div>
            ${cardGridHtml(
              g.rows
                .slice(0, PER_REGION)
                .map((r) => awardCardHtml(r.award, { heading: 'destination', note: `${plural(r.dateCount, 'date')} with space` })),
            )}
          </section>`,
          )
          .join('')}
        </div>`
      : `<div class="card p-8 text-center"><p class="font-semibold text-ink-900">No ${esc(CABIN_LABEL[state.cabin].toLowerCase())} awards from ${esc(originLabel)}.</p>
          <p class="mt-1 text-sm text-ink-600">Try another cabin or a bigger hub nearby.</p></div>`;
    return rows.length;
  }

  function update() {
    router.replaceQuery({ from: state.from, cabin: state.cabin, sort: state.sort === 'score' ? 'score' : null });
    const n = renderResults();
    announce(`${plural(n, 'destination')} found`);
  }

  renderResults();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.from = form.elements.from.value.trim();
    update();
  });
  form.elements.from.addEventListener('change', () => {
    state.from = form.elements.from.value.trim();
    update();
  });
  form.elements.sort.addEventListener('change', () => {
    state.sort = form.elements.sort.value;
    update();
  });
  const offs = [
    bindChips(form, (group, values) => {
      state.cabin = values[0];
      update();
    }),
  ];
  return () => offs.forEach((off) => off());
}
