import { airportByIata } from '../data/airports.js';
import { airlineName } from '../data/airlines.js';
import { programName } from '../data/programs.js';
import { esc } from '../util/dom.js';
import { buildHash } from '../util/router.js';
import { CABIN_RANK, fmtDate, fmtDuration, fmtNumber, fmtStops, fmtUsd } from '../util/format.js';
import { cabinBadge, programTag, scoreBadge } from './badges.js';

export const SORTS = {
  date: { label: 'Date', get: (a) => a.date + (a.departTime ?? ''), defaultDir: 'asc' },
  route: { label: 'Route', get: (a) => a.from + a.to, defaultDir: 'asc' },
  cabin: { label: 'Cabin', get: (a) => CABIN_RANK[a.cabin], defaultDir: 'desc' },
  program: { label: 'Program', get: (a) => programName(a.programId), defaultDir: 'asc' },
  miles: { label: 'Miles', get: (a) => a.miles, defaultDir: 'asc' },
  taxes: { label: 'Taxes', get: (a) => a.taxesUsd, defaultDir: 'asc' },
  seats: { label: 'Seats', get: (a) => a.seats, defaultDir: 'desc' },
  score: { label: 'Value', get: (a) => a.score, defaultDir: 'desc' },
};

export function sortAwards(list, key = 'score', dir = SORTS[key]?.defaultDir ?? 'asc') {
  const spec = SORTS[key] ?? SORTS.score;
  const sign = dir === 'desc' ? -1 : 1;
  return [...list].sort((x, y) => {
    const a = spec.get(x);
    const b = spec.get(y);
    if (a < b) return -sign;
    if (a > b) return sign;
    return x.miles - y.miles || x.date.localeCompare(y.date) || x.id - y.id;
  });
}

function th(key, sort, dir, extraClass = '') {
  const spec = SORTS[key];
  const active = sort === key;
  const ariaSort = active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none';
  const arrow = active ? (dir === 'asc' ? '↑' : '↓') : '';
  return `<th scope="col" class="${extraClass}" aria-sort="${ariaSort}">
    <button type="button" class="sort-btn" data-sort="${key}">${spec.label}<span aria-hidden="true" class="w-3 text-brand-700">${arrow}</span></button>
  </th>`;
}

const city = (iata) => airportByIata.get(iata)?.city ?? iata;

export function awardTableHtml(rows, { sort = 'score', dir = 'desc', caption = 'Award availability', showRoute = true } = {}) {
  const body = rows
    .map(
      (a) => `
      <tr>
        <td class="whitespace-nowrap">
          <div class="font-medium text-ink-900">${fmtDate(a.date)}</div>
          ${a.departTime ? `<div class="text-xs text-ink-500 tabular">dep ${esc(a.departTime)}</div>` : ''}
        </td>
        ${
          showRoute
            ? `<td class="whitespace-nowrap">
                <div class="font-mono font-semibold text-ink-900">${esc(a.from)}–${esc(a.to)}</div>
                <div class="text-xs text-ink-500">${esc(city(a.from))} – ${esc(city(a.to))}</div>
              </td>`
            : ''
        }
        <td>${cabinBadge(a.cabin)}</td>
        <td class="text-ink-800">${programTag(a.programId)}</td>
        <td class="num font-semibold text-ink-900">${fmtNumber(a.miles)}</td>
        <td class="num text-ink-700">${fmtUsd(a.taxesUsd)}</td>
        <td class="min-w-[11rem]">
          <div class="text-ink-800">${esc(airlineName(a.airline))} <span class="font-mono text-xs text-ink-500">${esc(a.flightNo)}</span></div>
          <div class="text-xs text-ink-500">${fmtStops(a.stops)}${a.durationHours ? ` · ${fmtDuration(a.durationHours)}` : ''}</div>
        </td>
        <td class="num text-ink-700">${a.seats}</td>
        <td>${scoreBadge(a.score, a.sweet)}</td>
        <td class="whitespace-nowrap text-right">
          <a class="link text-sm" href="${buildHash('/calendar', { from: a.from, to: a.to, cabin: a.cabin })}"
            aria-label="Calendar for ${esc(a.from)} to ${esc(a.to)}, ${esc(a.cabin)}">Calendar</a>
        </td>
      </tr>`,
    )
    .join('');

  return `
    <div class="card relative overflow-x-auto">
      <table class="data-table">
        <caption class="sr-only">${esc(caption)}. Column headers with buttons can be sorted.</caption>
        <thead>
          <tr>
            ${th('date', sort, dir)}
            ${showRoute ? th('route', sort, dir) : ''}
            ${th('cabin', sort, dir)}
            ${th('program', sort, dir)}
            ${th('miles', sort, dir, 'num')}
            ${th('taxes', sort, dir, 'num')}
            <th scope="col">Flight</th>
            ${th('seats', sort, dir, 'num')}
            ${th('score', sort, dir)}
            <th scope="col"><span class="sr-only">Links</span></th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>`;
}

export function nextSort(currentKey, currentDir, clickedKey) {
  if (currentKey === clickedKey) return { sort: clickedKey, dir: currentDir === 'asc' ? 'desc' : 'asc' };
  return { sort: clickedKey, dir: SORTS[clickedKey]?.defaultDir ?? 'asc' };
}
