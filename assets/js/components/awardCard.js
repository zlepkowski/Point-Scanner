import { airportByIata } from '../data/airports.js';
import { airlineName } from '../data/airlines.js';
import { programById } from '../data/programs.js';
import { esc } from '../util/dom.js';
import { buildHash } from '../util/router.js';
import { CABIN_LABEL, fmtDate, fmtDuration, fmtNumber, fmtStops, fmtUsd, plural } from '../util/format.js';
import { programTag, scoreBadge } from './badges.js';
import { routeArrow } from './icons.js';

const city = (iata) => airportByIata.get(iata)?.city ?? iata;

// heading: 'route' shows FROM → TO; 'destination' leads with the destination
// city (Explore, where the origin is already fixed).
export function awardCardHtml(a, { heading = 'route', note = '' } = {}) {
  const program = programById.get(a.programId);
  const title =
    heading === 'destination'
      ? `<h3 class="text-base font-semibold text-ink-900">${esc(city(a.to))} <span class="font-mono text-sm font-medium text-ink-500">${esc(a.to)}</span></h3>`
      : `<h3 class="flex items-center gap-1.5 font-mono text-lg font-semibold tracking-tight text-ink-900">${esc(a.from)} ${routeArrow(16)} ${esc(a.to)}</h3>
         <p class="text-sm text-ink-600">${esc(city(a.from))} to ${esc(city(a.to))}</p>`;
  const meta = [fmtStops(a.stops), a.durationHours ? fmtDuration(a.durationHours) : null, plural(a.seats, 'seat')].filter(Boolean).join(' · ');

  return `
    <article class="card flex h-full flex-col gap-3 p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">${title}</div>
        ${scoreBadge(a.score, a.sweet)}
      </div>
      <div>
        <p class="flex flex-wrap items-baseline gap-x-2">
          <span class="text-2xl font-semibold tabular text-ink-900">${fmtNumber(a.miles)}</span>
          <span class="text-sm text-ink-600">${esc(program?.currency ?? 'miles')}</span>
        </p>
        <p class="text-sm text-ink-600">+ ${fmtUsd(a.taxesUsd)} taxes &amp; fees · ${esc(CABIN_LABEL[a.cabin])}</p>
      </div>
      <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt class="text-ink-500">Date</dt><dd class="text-ink-800">${fmtDate(a.date)}${a.departTime ? ` · ${esc(a.departTime)}` : ''}</dd>
        <dt class="text-ink-500">Flight</dt><dd class="text-ink-800">${esc(airlineName(a.airline))} ${esc(a.flightNo)}</dd>
        <dt class="text-ink-500">Book via</dt><dd class="text-ink-800">${programTag(a.programId)}</dd>
      </dl>
      <p class="text-xs text-ink-500">${esc(meta)}${note ? ` · ${esc(note)}` : ''}</p>
      <div class="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t border-ink-100 pt-3 text-sm">
        <a class="link link-target" href="${buildHash('/calendar', { from: a.from, to: a.to, cabin: a.cabin })}">Calendar</a>
        <a class="link link-target" href="${buildHash('/search', { from: a.from, to: a.to, cabins: a.cabin })}">All dates</a>
      </div>
    </article>`;
}

export function cardGridHtml(cards) {
  return `<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">${cards.join('')}</div>`;
}

export function skeletonCards(n = 3) {
  return cardGridHtml(Array.from({ length: n }, () => '<div class="shimmer h-56"></div>'));
}
