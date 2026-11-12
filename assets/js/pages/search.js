import { awardsFrom, awardsOnRoute, getAwards, getIndexes, getWindow } from '../data/store.js';
import { resolveLocation, airportLabel } from '../data/airports.js';
import { findConnections } from '../data/connections.js';
import { addSaved, findSaved } from '../data/alerts.js';
import { airportInputHtml } from '../components/airportSelect.js';
import { awardTableHtml, nextSort, sortAwards, SORTS } from '../components/awardTable.js';
import { bindChips } from '../components/cabinChips.js';
import { connectionItemHtml } from '../components/connectionList.js';
import {
  DEFAULT_FILTERS,
  activeFilterCount,
  applyFilters,
  bindProgramShortcuts,
  filtersFromQuery,
  filtersPanelHtml,
  filtersToQuery,
  matchesFilters,
  readFiltersForm,
} from '../components/filters.js';
import { pageCountFor, pagerHtml } from '../components/pager.js';
import { announce, debounce, esc, mount, on } from '../util/dom.js';
import { buildHash } from '../util/router.js';
import { CABINS, CABIN_SHORT, fmtNumber, plural } from '../util/format.js';
import { programName } from '../data/programs.js';
import { icon, routeArrow } from '../components/icons.js';

export const PAGE_SIZE = 50;
const CONNECTION_STEP = 10;
const MAX_CONNECTION_ENDPOINTS = 3;

function stateFromQuery(q) {
  const sort = SORTS[q.sort] ? q.sort : 'score';
  return {
    from: q.from ?? '',
    to: q.to ?? '',
    filters: filtersFromQuery(q),
    sort,
    dir: q.dir === 'asc' || q.dir === 'desc' ? q.dir : SORTS[sort].defaultDir,
    page: Math.max(1, parseInt(q.page, 10) || 1),
  };
}

function stateToQuery(s) {
  return {
    from: s.from.trim(),
    to: s.to.trim(),
    ...filtersToQuery(s.filters),
    sort: s.sort !== 'score' ? s.sort : null,
    dir: s.dir !== SORTS[s.sort].defaultDir ? s.dir : null,
    page: s.page > 1 ? s.page : null,
  };
}

function candidates(from) {
  if (!from) return getAwards();
  return from.flatMap((iata) => awardsFrom(iata));
}

function describe(list) {
  if (!list) return 'Anywhere';
  if (list.length === 1) return airportLabel(list[0]);
  return list.length <= 4 ? list.join(', ') : `${list.length} airports`;
}

function saveTarget(state, from, to) {
  if (!from || !to || from.length !== 1 || to.length !== 1) return null;
  const { cabins, programs } = state.filters;
  return {
    from: from[0],
    to: to[0],
    cabin: cabins.length === 1 ? cabins[0] : 'any',
    programId: programs && programs.length === 1 ? programs[0] : null,
  };
}

export function render(root, { query, router }) {
  const state = stateFromQuery(query);
  let connectionLimit = CONNECTION_STEP;
  let justSaved = false;
  const win = getWindow();

  mount(
    root,
    `
    <div class="mb-6">
      <h1 tabindex="-1" class="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Search award space</h1>
      <p class="mt-1 text-ink-600">Airports, cities or whole regions. Separate several with commas.</p>
    </div>
    <form id="route-form" class="card grid gap-3 p-4 md:grid-cols-[1fr_auto_1fr_auto] md:items-end" role="search" aria-label="Route">
      ${airportInputHtml({ id: 'from', name: 'from', label: 'From', value: state.from, placeholder: 'Anywhere' })}
      <button type="button" class="btn btn-ghost btn-sm -my-1 justify-self-end md:my-0 md:mb-1 md:justify-self-auto" data-swap aria-label="Swap origin and destination">${icon('swap', { size: 18 })}</button>
      ${airportInputHtml({ id: 'to', name: 'to', label: 'To', value: state.to, placeholder: 'Anywhere' })}
      <button class="btn btn-primary" type="submit">Search</button>
    </form>
    <div class="mt-6 grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside aria-label="Filters">
        <details id="filter-details" class="card p-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto" open>
          <summary class="cursor-pointer font-semibold text-ink-900">Filters <span data-filter-count class="badge badge-brand ml-1 hidden"></span></summary>
          <div id="filter-panel" class="mt-4"></div>
        </details>
      </aside>
      <section class="min-w-0" aria-labelledby="results-heading">
        <div id="results"></div>
        <div id="connections" class="mt-10"></div>
      </section>
    </div>`,
  );

  const details = root.querySelector('#filter-details');
  if (window.matchMedia && !window.matchMedia('(min-width: 1024px)').matches) details.open = false;
  const panel = root.querySelector('#filter-panel');
  const resultsEl = root.querySelector('#results');
  const connectionsEl = root.querySelector('#connections');
  const routeForm = root.querySelector('#route-form');

  function renderFilterPanel() {
    panel.innerHTML = filtersPanelHtml(state.filters, { window: win });
    const form = panel.querySelector('#filters');
    bindProgramShortcuts(form, onFiltersChanged);
    updateFilterCount();
  }

  function updateFilterCount() {
    const n = activeFilterCount(state.filters);
    const badge = root.querySelector('[data-filter-count]');
    badge.textContent = n ? `${n} active` : '';
    badge.classList.toggle('hidden', !n);
  }

  function renderResults() {
    const from = resolveLocation(state.from);
    const to = resolveLocation(state.to);
    const problems = [];
    if (state.from.trim() && !from) problems.push(`Couldn't match "${state.from}" to an airport, city or region.`);
    if (state.to.trim() && !to) problems.push(`Couldn't match "${state.to}" to an airport, city or region.`);

    const pool = candidates(from);
    const rows = sortAwards(applyFilters(pool, state.filters, { from, to }), state.sort, state.dir);
    const routeHasSpace = !to || pool.some((a) => to.includes(a.to));
    const pages = pageCountFor(rows.length, PAGE_SIZE);
    state.page = Math.min(state.page, pages);
    const pageRows = rows.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);
    const sweetCount = rows.reduce((n, a) => n + (a.sweet ? 1 : 0), 0);
    const cabins = state.filters.cabins.length === CABINS.length ? 'All cabins' : state.filters.cabins.map((c) => CABIN_SHORT[c]).join(', ');

    const target = saveTarget(state, from, to);
    const saved = target ? findSaved(target) : null;
    const routeActions = target
      ? `<div class="flex flex-wrap gap-2">
          <a class="btn btn-sm" href="${buildHash('/calendar', { from: target.from, to: target.to, cabin: target.cabin === 'any' ? 'business' : target.cabin, program: target.programId })}">Calendar view</a>
          ${
            saved
              ? `<a class="btn btn-sm ${justSaved ? 'pulse-once' : ''}" href="#/saved">${icon('star', { filled: true, className: 'text-brand-600' })}Saved, view alerts</a>`
              : `<button type="button" class="btn btn-sm" data-save-route>${icon('star')}Save route${target.cabin !== 'any' ? ` (${esc(CABIN_SHORT[target.cabin])})` : ''}</button>`
          }
        </div>`
      : '';

    resultsEl.innerHTML = `
      ${problems.map((p) => `<p class="mb-3 rounded-lg bg-bad-100 px-3 py-2 text-sm text-bad-800" role="alert">${esc(p)}</p>`).join('')}
      <div class="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="results-heading" class="text-lg font-semibold text-ink-900">${plural(rows.length, 'award')}</h2>
          <p class="text-sm text-ink-600">${esc(describe(from))} ${routeArrow(12)} ${esc(describe(to))} · ${esc(cabins)}${
            state.filters.programs ? ` · ${state.filters.programs.length === 1 ? esc(programName(state.filters.programs[0])) : `${state.filters.programs.length} programs`}` : ''
          } · ${plural(sweetCount, 'sweet spot')}</p>
        </div>
        ${routeActions}
      </div>
      ${
        rows.length
          ? awardTableHtml(pageRows, { sort: state.sort, dir: state.dir, caption: `Awards from ${describe(from)} to ${describe(to)}` }) +
            pagerHtml({ page: state.page, total: rows.length, pageSize: PAGE_SIZE })
          : routeHasSpace
            ? `<div class="card p-8 text-center">
                <p class="font-semibold text-ink-900">No awards match these filters.</p>
                <p class="mt-1 text-sm text-ink-600">Try widening the dates, adding cabins or programs, or turning off “Sweet spots only”.</p>
                <button type="button" class="btn mt-4" data-reset-filters>Reset filters</button>
              </div>`
            : `<div class="card p-8 text-center">
                <p class="font-semibold text-ink-900">No direct award space on this route.</p>
                <p class="mt-1 text-sm text-ink-600">Nothing nonstop or same-ticket in the current data. Any connecting options are listed below.</p>
              </div>`
      }`;

    renderConnections(from, to, rows.length);
    return rows.length;
  }

  function renderConnections(from, to, directCount) {
    const eligible =
      from && to && from.length <= MAX_CONNECTION_ENDPOINTS && to.length <= MAX_CONNECTION_ENDPOINTS && !state.filters.nonstop;
    if (!eligible) {
      connectionsEl.innerHTML = '';
      return;
    }
    const f = state.filters;
    const cabinSet = new Set(f.cabins);
    const programSet = f.programs ? new Set(f.programs) : null;
    let itins = [];
    for (const o of from) {
      for (const d of to) {
        if (o === d) continue;
        itins.push(
          ...findConnections(getIndexes(), { from: o, to: d, cabins: f.cabins, programIds: f.programs, dateFrom: f.dateFrom, dateTo: f.dateTo }),
        );
      }
    }
    itins = itins
      .filter((it) => matchesFilters(it, f, cabinSet, programSet))
      .sort((a, b) => a.miles - b.miles || a.date.localeCompare(b.date) || b.score - a.score);

    if (!itins.length) {
      connectionsEl.innerHTML = directCount
        ? ''
        : '<p class="text-sm text-ink-600">No connecting itineraries found either.</p>';
      return;
    }
    const shown = itins.slice(0, connectionLimit);
    connectionsEl.innerHTML = `
      <div class="mb-3">
        <h2 class="text-lg font-semibold text-ink-900">Connecting itineraries <span class="badge ml-1 tabular">${fmtNumber(itins.length)}</span></h2>
        <p class="max-w-3xl text-sm text-ink-600">
          For dates and programs with no direct award in your cabins: two awards in the same program, stitched at a
          connection point. Prices are the sum of both awards; booking them as one ticket may price differently. Legs in a
          different cabin are flagged rather than averaged.
        </p>
      </div>
      <ul class="space-y-3">${shown.map(connectionItemHtml).join('')}</ul>
      ${
        itins.length > shown.length
          ? `<button type="button" class="btn mt-4" data-more-connections>Show ${Math.min(CONNECTION_STEP, itins.length - shown.length)} more</button>`
          : ''
      }`;
  }

  function update({ announceCount = true } = {}) {
    router.replaceQuery(stateToQuery(state));
    const count = renderResults();
    if (announceCount) announce(`${plural(count, 'award')} found`);
  }

  function onFiltersChanged() {
    const form = panel.querySelector('#filters');
    state.filters = readFiltersForm(form);
    state.page = 1;
    connectionLimit = CONNECTION_STEP;
    updateFilterCount();
    update();
  }
  const onFiltersChangedSoon = debounce(onFiltersChanged, 200);

  function resetFilters() {
    state.filters = { ...DEFAULT_FILTERS, cabins: [...CABINS] };
    state.page = 1;
    renderFilterPanel();
    update();
  }

  renderFilterPanel();
  renderResults();

  routeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    state.from = routeForm.elements.from.value;
    state.to = routeForm.elements.to.value;
    state.page = 1;
    connectionLimit = CONNECTION_STEP;
    update();
  });
  routeForm.querySelector('[data-swap]').addEventListener('click', () => {
    const { from, to } = routeForm.elements;
    [from.value, to.value] = [to.value, from.value];
    routeForm.requestSubmit();
  });

  const offs = [
    on(panel, 'input', 'input[data-amount]', onFiltersChangedSoon),
    on(panel, 'change', 'input, select', (e, el) => {
      if (!el.hasAttribute('data-amount')) onFiltersChanged();
    }),
    bindChips(panel, onFiltersChanged),
    on(root, 'click', '[data-reset-filters]', resetFilters),
    on(resultsEl, 'click', '[data-sort]', (e, btn) => {
      Object.assign(state, nextSort(state.sort, state.dir, btn.dataset.sort), { page: 1 });
      update({ announceCount: false });
      resultsEl.querySelector(`[data-sort="${btn.dataset.sort}"]`)?.focus();
      announce(`Sorted by ${SORTS[state.sort].label}, ${state.dir === 'asc' ? 'ascending' : 'descending'}`);
    }),
    on(resultsEl, 'click', '[data-page]', (e, btn) => {
      state.page = Number(btn.dataset.page);
      update({ announceCount: false });
      resultsEl.querySelector('#results-heading')?.scrollIntoView({ block: 'start' });
      announce(`Page ${state.page}`);
    }),
    on(resultsEl, 'click', '[data-save-route]', () => {
      const target = saveTarget(state, resolveLocation(state.from), resolveLocation(state.to));
      if (!target) return;
      addSaved(target, awardsOnRoute(target.from, target.to));
      justSaved = true;
      renderResults();
      justSaved = false;
      resultsEl.querySelector('a[href="#/saved"]')?.focus();
      document.dispatchEvent(new CustomEvent('pointscanner:saved-changed'));
      announce(`Saved ${target.from} to ${target.to}. You'll see changes on the Saved page.`);
    }),
    on(connectionsEl, 'click', '[data-more-connections]', () => {
      connectionLimit += CONNECTION_STEP;
      renderConnections(resolveLocation(state.from), resolveLocation(state.to), 1);
    }),
  ];

  return () => offs.forEach((off) => off());
}
