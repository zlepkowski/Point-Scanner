import { ALLIANCES, PROGRAMS, programById } from '../data/programs.js';
import { CABINS } from '../util/format.js';
import { isIsoDate } from '../util/date.js';
import { esc } from '../util/dom.js';
import { programSwatch } from './badges.js';
import { icon } from './icons.js';
import { parseAmount } from '../util/number.js';
import { cabinChipsHtml, readChips } from './cabinChips.js';

export const DEFAULT_FILTERS = Object.freeze({
  cabins: CABINS,
  programs: null,
  dateFrom: null,
  dateTo: null,
  nonstop: false,
  maxMiles: null,
  maxTaxes: null,
  minSeats: 1,
  sweetOnly: false,
});

const splitList = (s) => (s ? String(s).split(',').map((x) => x.trim()).filter(Boolean) : []);
const positive = parseAmount;

export function filtersFromQuery(q = {}) {
  const cabins = splitList(q.cabins).filter((c) => CABINS.includes(c));
  const programs = splitList(q.programs).filter((p) => programById.has(p));
  return {
    cabins: cabins.length ? cabins : [...CABINS],
    programs: q.programs === 'none' ? [] : programs.length && programs.length < PROGRAMS.length ? programs : null,
    dateFrom: isIsoDate(q.df) ? q.df : null,
    dateTo: isIsoDate(q.dt) ? q.dt : null,
    nonstop: q.nonstop === '1',
    maxMiles: positive(q.maxMiles),
    maxTaxes: positive(q.maxTaxes),
    minSeats: Math.min(9, Math.max(1, Math.floor(positive(q.seats) ?? 1))),
    sweetOnly: q.sweet === '1',
  };
}

export function filtersToQuery(f) {
  return {
    cabins: f.cabins.length === CABINS.length ? null : f.cabins.join(','),
    programs: f.programs ? f.programs.join(',') || 'none' : null,
    df: f.dateFrom,
    dt: f.dateTo,
    nonstop: f.nonstop,
    maxMiles: f.maxMiles,
    maxTaxes: f.maxTaxes,
    seats: f.minSeats > 1 ? f.minSeats : null,
    sweet: f.sweetOnly,
  };
}

export function activeFilterCount(f) {
  let n = 0;
  if (f.cabins.length !== CABINS.length) n++;
  if (f.programs) n++;
  if (f.dateFrom || f.dateTo) n++;
  if (f.nonstop) n++;
  if (f.maxMiles) n++;
  if (f.maxTaxes) n++;
  if (f.minSeats > 1) n++;
  if (f.sweetOnly) n++;
  return n;
}

// Works for single awards and stitched itineraries alike (both expose
// cabin, programId, date, miles, taxesUsd, seats, sweet and stops/kind).
export function matchesFilters(a, f, cabinSet = new Set(f.cabins), programSet = f.programs ? new Set(f.programs) : null) {
  if (!cabinSet.has(a.cabin)) return false;
  if (programSet && !programSet.has(a.programId)) return false;
  if (f.dateFrom && a.date < f.dateFrom) return false;
  if (f.dateTo && a.date > f.dateTo) return false;
  if (f.nonstop && (a.kind === 'connection' || a.stops > 0)) return false;
  if (f.maxMiles && a.miles > f.maxMiles) return false;
  if (f.maxTaxes && a.taxesUsd > f.maxTaxes) return false;
  if (a.seats < f.minSeats) return false;
  if (f.sweetOnly && !a.sweet) return false;
  return true;
}

export function applyFilters(awards, f, { from = null, to = null } = {}) {
  const fromSet = from ? new Set(from) : null;
  const toSet = to ? new Set(to) : null;
  const cabinSet = new Set(f.cabins);
  const programSet = f.programs ? new Set(f.programs) : null;
  return awards.filter(
    (a) => (!fromSet || fromSet.has(a.from)) && (!toSet || toSet.has(a.to)) && matchesFilters(a, f, cabinSet, programSet),
  );
}

function programGroupHtml(alliance, f) {
  const programs = PROGRAMS.filter((p) => p.alliance === alliance);
  const label = alliance === 'None' ? 'Unaligned' : alliance;
  const gid = `prog-${alliance.replace(/\W+/g, '').toLowerCase()}`;
  return `
    <fieldset class="mb-3" aria-labelledby="${gid}">
      <div class="mb-1 flex items-center justify-between">
        <legend id="${gid}" class="text-xs font-semibold uppercase tracking-wide text-ink-500">${esc(label)}</legend>
        <span class="flex gap-1 text-xs">
          <button type="button" class="link link-target px-1" data-programs-all="${esc(alliance)}" aria-label="Select all ${esc(label)} programs">All</button>
          <button type="button" class="link link-target px-1" data-programs-none="${esc(alliance)}" aria-label="Clear ${esc(label)} programs">None</button>
        </span>
      </div>
      ${programs
        .map(
          (p) => `
        <label class="flex min-h-[28px] items-center gap-2 text-sm text-ink-800">
          <input type="checkbox" class="checkbox" name="program" value="${p.id}" ${!f.programs || f.programs.includes(p.id) ? 'checked' : ''} />
          ${programSwatch(p.id)} <span class="truncate">${esc(p.name)}</span>
        </label>`,
        )
        .join('')}
    </fieldset>`;
}

export function filtersPanelHtml(f, { window }) {
  return `
    <form id="filters" class="space-y-5" novalidate>
      <div>
        <span class="field-label" id="cabin-label">Cabin</span>
        ${cabinChipsHtml({ group: 'cabins', selected: f.cabins, label: 'Cabin' })}
      </div>

      <fieldset>
        <legend class="field-label">Travel dates</legend>
        <div class="grid grid-cols-2 gap-2">
          <label class="text-xs text-ink-600">From
            <input type="date" name="dateFrom" class="input mt-1" value="${esc(f.dateFrom ?? '')}" min="${window.start}" max="${window.end}" />
          </label>
          <label class="text-xs text-ink-600">To
            <input type="date" name="dateTo" class="input mt-1" value="${esc(f.dateTo ?? '')}" min="${window.start}" max="${window.end}" />
          </label>
        </div>
      </fieldset>

      <fieldset class="space-y-2">
        <legend class="field-label">Price &amp; seats</legend>
        <label class="block text-xs text-ink-600">Max miles / points
          <input type="text" inputmode="numeric" autocomplete="off" data-amount name="maxMiles" class="input mt-1 tabular" placeholder="Any, e.g. 80k" value="${f.maxMiles ?? ''}" />
        </label>
        <label class="block text-xs text-ink-600">Max taxes &amp; fees (USD)
          <input type="text" inputmode="numeric" autocomplete="off" data-amount name="maxTaxes" class="input mt-1 tabular" placeholder="Any, e.g. 200" value="${f.maxTaxes ?? ''}" />
        </label>
        <label class="block text-xs text-ink-600">Seats needed
          <select name="minSeats" class="input mt-1">
            ${[1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}" ${f.minSeats === n ? 'selected' : ''}>${n}${n === 1 ? '' : '+'}</option>`).join('')}
          </select>
        </label>
      </fieldset>

      <div class="space-y-2">
        <label class="flex items-center gap-2 text-sm text-ink-800">
          <input type="checkbox" class="checkbox" name="nonstop" ${f.nonstop ? 'checked' : ''} /> Nonstop only
        </label>
        <label class="flex items-center gap-2 text-sm text-ink-800">
          <input type="checkbox" class="checkbox" name="sweetOnly" ${f.sweetOnly ? 'checked' : ''} />
          <span>Sweet spots only <span class="badge badge-sweet ml-1" aria-hidden="true">${icon('star', { size: 12, filled: true })}</span></span>
        </label>
      </div>

      <details ${f.programs ? 'open' : ''}>
        <summary class="cursor-pointer py-1 text-[13px] font-semibold text-ink-700">Programs
          <span class="font-normal text-ink-600">(${f.programs ? `${f.programs.length} of ${PROGRAMS.length}` : `all ${PROGRAMS.length}`})</span></summary>
        <div class="mt-2">${ALLIANCES.map((a) => programGroupHtml(a, f)).join('')}</div>
      </details>

      <button type="button" class="btn w-full" data-reset-filters>Reset filters</button>
    </form>`;
}

export function readFiltersForm(form) {
  const fd = new FormData(form);
  const checked = fd.getAll('program');
  const cabins = readChips(form, 'cabins');
  return {
    cabins: cabins.length ? cabins : [...CABINS],
    programs: checked.length === PROGRAMS.length ? null : checked,
    dateFrom: isIsoDate(fd.get('dateFrom')) ? fd.get('dateFrom') : null,
    dateTo: isIsoDate(fd.get('dateTo')) ? fd.get('dateTo') : null,
    nonstop: fd.get('nonstop') === 'on',
    maxMiles: positive(fd.get('maxMiles')),
    maxTaxes: positive(fd.get('maxTaxes')),
    minSeats: Number(fd.get('minSeats')) || 1,
    sweetOnly: fd.get('sweetOnly') === 'on',
  };
}

export function bindProgramShortcuts(form, onChange) {
  form.addEventListener('click', (event) => {
    const all = event.target.closest('[data-programs-all]');
    const none = event.target.closest('[data-programs-none]');
    if (!all && !none) return;
    const alliance = (all ?? none).dataset[all ? 'programsAll' : 'programsNone'];
    for (const p of PROGRAMS.filter((x) => x.alliance === alliance)) {
      const box = form.querySelector(`input[name="program"][value="${p.id}"]`);
      if (box) box.checked = Boolean(all);
    }
    onChange();
  });
}
