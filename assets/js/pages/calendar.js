import { awardsOnRoute, getWindow } from '../data/store.js';
import { airportLabel, resolveLocation } from '../data/airports.js';
import { WINDOW_DAYS } from '../data/awards.js';
import { PROGRAMS, programById, programName } from '../data/programs.js';
import { airlineName } from '../data/airlines.js';
import { addSaved, findSaved } from '../data/alerts.js';
import { airportInputHtml } from '../components/airportSelect.js';
import { awardTableHtml, nextSort, sortAwards } from '../components/awardTable.js';
import { bindChips, cabinChipsHtml } from '../components/cabinChips.js';
import { announce, esc, mount, on } from '../util/dom.js';
import { buildHash } from '../util/router.js';
import { addDays, dateRange, dayOfWeek } from '../util/date.js';
import {
  CABINS, CABIN_LABEL, CABIN_SHORT, fmtDate, fmtDateLong, fmtMilesShort, fmtMonth, fmtNumber, fmtScore, fmtUsd, plural,
} from '../util/format.js';

export const HEAT_LEVELS = 8;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const HEAT_CAP_PERCENTILE = 0.85;

// Cheapest award per date plus a 0..7 shade, where 0 is the cheapest day in
// the window. The scale is linear from the cheapest day to the 85th-percentile
// day (anything pricier is the lightest shade) so one "anytime" award at
// triple the price can't wash every other day into the same colour.
// Ties on miles go to the lower cash co-pay.
export function heatmapDays(awards, dates) {
  const byDate = new Map();
  for (const a of awards) {
    const day = byDate.get(a.date) ?? byDate.set(a.date, { all: [] }).get(a.date);
    day.all.push(a);
    if (!day.best || a.miles < day.best.miles || (a.miles === day.best.miles && a.taxesUsd < day.best.taxesUsd)) day.best = a;
  }
  const values = dates.map((d) => byDate.get(d)?.best.miles).filter((m) => m != null).sort((a, b) => a - b);
  const min = values[0];
  const cap = values[Math.floor((values.length - 1) * HEAT_CAP_PERCENTILE)];
  return dates.map((date) => {
    const day = byDate.get(date);
    if (!day) return { date, best: null, all: [], level: null };
    const t = cap === min ? 0 : Math.min(1, (day.best.miles - min) / (cap - min));
    const level = Math.round(t * (HEAT_LEVELS - 1));
    return { date, best: day.best, all: day.all, level, sweet: day.all.some((a) => a.sweet) };
  });
}

function monthsCovered(dates) {
  const months = [];
  for (const d of dates) {
    const key = d.slice(0, 7);
    if (months[months.length - 1] !== key) months.push(key);
  }
  return months;
}

function cellLabel(day) {
  const a = day.best;
  const program = programById.get(a.programId);
  const parts = [
    fmtDateLong(day.date),
    `cheapest ${fmtNumber(a.miles)} ${program?.currency ?? 'miles'} plus ${fmtUsd(a.taxesUsd)}`,
    `${programName(a.programId)}, ${airlineName(a.airline)} ${a.flightNo}`,
  ];
  if (day.sweet) parts.push('includes a sweet spot');
  if (day.all.length > 1) parts.push(`${day.all.length} options`);
  return parts.join(', ');
}

function monthHtml(month, daysByDate) {
  const first = `${month}-01`;
  const lead = (dayOfWeek(first) + 6) % 7;
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push('<div class="heat-out" aria-hidden="true"></div>');
  for (let d = first; d.startsWith(month); d = addDays(d, 1)) {
    const dayNum = Number(d.slice(8));
    const day = daysByDate.get(d);
    if (!day) {
      cells.push('<div class="heat-out" aria-hidden="true"></div>');
    } else if (!day.best) {
      cells.push(`<div class="heat-empty" data-empty-date="${d}" aria-label="${esc(fmtDate(d))}: no award space" role="img"><span>${dayNum}</span><span aria-hidden="true">—</span></div>`);
    } else {
      cells.push(`
        <button type="button" class="heat-cell heat-${day.level} ${day.sweet ? 'is-sweet' : ''}" data-date="${d}" aria-pressed="false"
          aria-label="${esc(cellLabel(day))}">
          <span>${dayNum}</span><span class="heat-miles">${fmtMilesShort(day.best.miles)}</span>
        </button>`);
    }
  }
  return `
    <section aria-label="${esc(fmtMonth(first))}">
      <h3 class="mb-2 text-sm font-semibold text-ink-800">${esc(fmtMonth(first))}</h3>
      <div class="heat-grid mb-1 text-center text-[11px] font-medium text-ink-500" aria-hidden="true">${WEEKDAYS.map((w) => `<span>${w}</span>`).join('')}</div>
      <div class="heat-grid">${cells.join('')}</div>
    </section>`;
}

function legendHtml(allPrograms) {
  return `
    <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-600">
      <div class="flex items-center gap-2">
        <span>Fewer miles</span>
        <span class="flex gap-0.5" aria-hidden="true">${Array.from({ length: HEAT_LEVELS }, (_, i) => `<span class="heat-${i} inline-block h-3 w-5 rounded-sm"></span>`).join('')}</span>
        <span>More miles</span>
      </div>
      <span class="flex items-center gap-1.5"><span class="heat-empty inline-block !h-3 !min-h-0 w-5 !rounded-sm !p-0" aria-hidden="true"></span> No space</span>
      <span class="flex items-center gap-1.5"><span class="inline-block h-3 w-5 rounded-sm ring-2 ring-accent-500" aria-hidden="true"></span> Has a sweet spot</span>
    </div>
    ${
      allPrograms
        ? '<p class="mt-2 text-xs text-ink-500">Shading compares the cheapest award across all programs. Points from different programs aren’t worth the same, so pick a program for a like-for-like view.</p>'
        : ''
    }`;
}

function tooltipHtml(day) {
  const a = day.best;
  const program = programById.get(a.programId);
  return `
    <p class="font-semibold">${esc(fmtDateLong(day.date))}</p>
    <p class="mt-1"><span class="text-base font-semibold tabular">${fmtNumber(a.miles)}</span> ${esc(program?.currency ?? 'miles')} + ${fmtUsd(a.taxesUsd)}</p>
    <p>${esc(airlineName(a.airline))} ${esc(a.flightNo)}${a.departTime ? ` · dep ${esc(a.departTime)}` : ''}</p>
    <p>Book via ${esc(program?.name ?? a.programId)} · ${plural(a.seats, 'seat')}</p>
    <p>Value ${fmtScore(a.score)}${a.sweet ? ' · ★ sweet spot' : ''}</p>
    ${day.all.length > 1 ? `<p class="mt-1 opacity-75">+${day.all.length - 1} more option${day.all.length === 2 ? '' : 's'} this day</p>` : ''}`;
}

export function render(root, { query, router }) {
  const win = getWindow();
  const state = {
    from: resolveLocation(query.from)?.[0] ?? 'JFK',
    to: resolveLocation(query.to)?.[0] ?? 'LHR',
    cabin: CABINS.includes(query.cabin) ? query.cabin : 'business',
    program: programById.has(query.program) ? query.program : '',
    selected: null,
    detailSort: 'miles',
    detailDir: 'asc',
  };

  mount(
    root,
    `
    <div class="mb-6">
      <h1 tabindex="-1" class="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Award calendar</h1>
      <p class="mt-1 text-ink-600">The cheapest award each day for the next ${WINDOW_DAYS} days on one route.</p>
    </div>
    <form id="cal-form" class="card grid gap-4 p-4 lg:grid-cols-[1fr_auto_1fr_auto_minmax(0,14rem)] lg:items-end" aria-label="Calendar options">
      ${airportInputHtml({ id: 'cal-from', name: 'from', label: 'From', value: state.from })}
      <button type="button" class="btn btn-ghost btn-sm -my-1 justify-self-end lg:my-0 lg:mb-1 lg:justify-self-auto" data-swap aria-label="Swap origin and destination">⇄</button>
      ${airportInputHtml({ id: 'cal-to', name: 'to', label: 'To', value: state.to })}
      <div>
        <span class="field-label">Cabin</span>
        ${cabinChipsHtml({ group: 'cabin', selected: [state.cabin], multi: false })}
      </div>
      <div>
        <label class="field-label" for="cal-program">Program</label>
        <select id="cal-program" name="program" class="input">
          <option value="">All programs</option>
          ${PROGRAMS.map((p) => `<option value="${p.id}" ${p.id === state.program ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
        </select>
      </div>
      <button type="submit" class="sr-only">Update calendar</button>
    </form>
    <div id="cal-body" class="mt-6"></div>
    <div id="heat-tip" class="heat-tooltip" role="tooltip" hidden></div>`,
  );

  const form = root.querySelector('#cal-form');
  const body = root.querySelector('#cal-body');
  const tip = root.querySelector('#heat-tip');
  let days = [];

  function routeAwards() {
    return awardsOnRoute(state.from, state.to).filter((a) => a.cabin === state.cabin && (!state.program || a.programId === state.program));
  }

  function renderDetail() {
    const detail = body.querySelector('#day-detail');
    if (!detail) return;
    const day = days.find((d) => d.date === state.selected);
    if (!day?.best) {
      detail.innerHTML = '<p class="text-sm text-ink-600">Select a day to see every award available on it.</p>';
      return;
    }
    detail.innerHTML = `
      <h2 class="mb-3 text-lg font-semibold text-ink-900">${esc(fmtDateLong(day.date))} <span class="text-sm font-normal text-ink-500">${plural(day.all.length, 'option')}</span></h2>
      ${awardTableHtml(sortAwards(day.all, state.detailSort, state.detailDir), {
        sort: state.detailSort,
        dir: state.detailDir,
        showRoute: false,
        caption: `Awards on ${fmtDateLong(day.date)}`,
      })}`;
  }

  function renderBody() {
    const dates = dateRange(win.start, WINDOW_DAYS);
    const list = routeAwards();
    days = heatmapDays(list, dates);
    const withSpace = days.filter((d) => d.best);
    const daysByDate = new Map(days.map((d) => [d.date, d]));
    if (!withSpace.some((d) => d.date === state.selected)) {
      state.selected = withSpace.reduce((best, d) => (!best || d.best.miles < best.best.miles ? d : best), null)?.date ?? null;
    }
    const cheapest = withSpace.reduce((best, d) => (!best || d.best.miles < best.best.miles ? d : best), null);
    const sweetDays = withSpace.filter((d) => d.sweet).length;
    const savedQuery = { from: state.from, to: state.to, cabin: state.cabin, programId: state.program || null };
    const saved = findSaved(savedQuery);

    body.innerHTML = `
      <div class="card p-4 sm:p-6">
        <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-ink-900">${esc(airportLabel(state.from))} → ${esc(airportLabel(state.to))}</h2>
            <p class="text-sm text-ink-600">${esc(CABIN_LABEL[state.cabin])} · ${state.program ? esc(programName(state.program)) : 'All programs'} ·
              ${withSpace.length} of ${WINDOW_DAYS} days with space${cheapest ? ` · cheapest ${fmtNumber(cheapest.best.miles)} on ${esc(fmtDate(cheapest.date))}` : ''}${sweetDays ? ` · ${plural(sweetDays, 'sweet-spot day')}` : ''}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <a class="btn btn-sm" href="${buildHash('/search', { from: state.from, to: state.to, cabins: state.cabin, programs: state.program || null, sort: 'date' })}">List view</a>
            ${
              saved
                ? '<a class="btn btn-sm" href="#/saved"><span aria-hidden="true">★</span> Saved, view alerts</a>'
                : `<button type="button" class="btn btn-sm" data-save-route><span aria-hidden="true">☆</span> Save route</button>`
            }
          </div>
        </div>
        ${
          withSpace.length
            ? `${legendHtml(!state.program)}
               <div class="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-3" id="heatmap">${monthsCovered(dates).map((m) => monthHtml(m, daysByDate)).join('')}</div>`
            : `<div class="py-10 text-center"><p class="font-semibold text-ink-900">No ${esc(CABIN_SHORT[state.cabin].toLowerCase())} award space on this route in the next ${WINDOW_DAYS} days.</p>
               <p class="mt-1 text-sm text-ink-600">Try another cabin, all programs, or <a class="link" href="${buildHash('/search', { from: state.from, to: state.to })}">search with connections</a>.</p></div>`
        }
      </div>
      <div id="day-detail" class="mt-6"></div>`;
    syncSelected();
    renderDetail();
  }

  function syncSelected() {
    for (const cell of body.querySelectorAll('[data-date]')) {
      cell.setAttribute('aria-pressed', String(cell.dataset.date === state.selected));
    }
  }

  function showTip(cell) {
    const day = days.find((d) => d.date === cell.dataset.date);
    if (!day?.best) return;
    tip.innerHTML = tooltipHtml(day);
    tip.hidden = false;
    const r = cell.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const left = Math.min(Math.max(8, r.left + r.width / 2 - t.width / 2), window.innerWidth - t.width - 8);
    const above = r.top - t.height - 8;
    tip.style.left = `${left}px`;
    tip.style.top = `${above > 8 ? above : r.bottom + 8}px`;
  }
  const hideTip = () => {
    tip.hidden = true;
  };

  function update() {
    router.replaceQuery({ from: state.from, to: state.to, cabin: state.cabin, program: state.program || null });
    renderBody();
  }

  function readRoute() {
    const from = resolveLocation(form.elements.from.value)?.[0];
    const to = resolveLocation(form.elements.to.value)?.[0];
    if (from) state.from = from;
    if (to) state.to = to;
    form.elements.from.value = state.from;
    form.elements.to.value = state.to;
  }

  renderBody();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    readRoute();
    update();
  });
  for (const name of ['from', 'to']) {
    form.elements[name].addEventListener('change', () => {
      readRoute();
      update();
    });
  }
  form.elements.program.addEventListener('change', () => {
    state.program = form.elements.program.value;
    update();
  });
  form.querySelector('[data-swap]').addEventListener('click', () => {
    [state.from, state.to] = [state.to, state.from];
    form.elements.from.value = state.from;
    form.elements.to.value = state.to;
    update();
  });

  const moveFocus = (cell, key) => {
    const cells = [...body.querySelectorAll('[data-date]')];
    const i = cells.indexOf(cell);
    if (key === 'ArrowRight') return cells[i + 1];
    if (key === 'ArrowLeft') return cells[i - 1];
    const step = key === 'ArrowDown' ? 7 : -7;
    for (let d = addDays(cell.dataset.date, step), n = 0; n < 9; d = addDays(d, step), n++) {
      const target = cells.find((c) => c.dataset.date === d);
      if (target) return target;
    }
    return null;
  };

  const offs = [
    bindChips(form, (group, values) => {
      state.cabin = values[0];
      update();
    }),
    on(body, 'click', '[data-date]', (e, cell) => {
      state.selected = cell.dataset.date;
      syncSelected();
      renderDetail();
      announce(`Showing awards for ${fmtDateLong(state.selected)}`);
    }),
    on(body, 'pointerover', '[data-date]', (e, cell) => showTip(cell)),
    on(body, 'pointerout', '[data-date]', hideTip),
    on(body, 'focusin', '[data-date]', (e, cell) => showTip(cell)),
    on(body, 'focusout', '[data-date]', hideTip),
    on(body, 'keydown', '[data-date]', (e, cell) => {
      if (e.key === 'Escape') return hideTip();
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      const target = moveFocus(cell, e.key);
      if (target) {
        e.preventDefault();
        target.focus();
      }
    }),
    on(body, 'click', '#day-detail [data-sort]', (e, btn) => {
      const next = nextSort(state.detailSort, state.detailDir, btn.dataset.sort);
      state.detailSort = next.sort;
      state.detailDir = next.dir;
      renderDetail();
      body.querySelector(`#day-detail [data-sort="${btn.dataset.sort}"]`)?.focus();
    }),
    on(body, 'click', '[data-save-route]', () => {
      addSaved({ from: state.from, to: state.to, cabin: state.cabin, programId: state.program || null }, awardsOnRoute(state.from, state.to));
      renderBody();
      document.dispatchEvent(new CustomEvent('pointscanner:saved-changed'));
      announce(`Saved ${state.from} to ${state.to}.`);
    }),
  ];
  window.addEventListener('scroll', hideTip, { passive: true });
  return () => {
    offs.forEach((off) => off());
    window.removeEventListener('scroll', hideTip);
  };
}
