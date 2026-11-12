import { airportByIata } from '../data/airports.js';
import { airlineName } from '../data/airlines.js';
import { programById } from '../data/programs.js';
import { esc } from '../util/dom.js';
import { CABIN_LABEL, fmtDate, fmtDuration, fmtNumber, fmtUsd } from '../util/format.js';
import { cabinBadge, mixedCabinBadge, programTag, scoreBadge } from './badges.js';

const city = (iata) => airportByIata.get(iata)?.city ?? iata;

function legHtml(leg, n) {
  return `
    <li class="rounded-lg bg-ink-50 px-3 py-2">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="font-mono font-semibold text-ink-900">${esc(leg.from)}–${esc(leg.to)}</span>
        <span class="text-xs text-ink-500">Leg ${n}</span>
      </div>
      <div class="text-ink-700">${esc(CABIN_LABEL[leg.cabin])} · ${esc(airlineName(leg.airline))} <span class="font-mono text-xs">${esc(leg.flightNo)}</span></div>
      <div class="text-xs text-ink-500 tabular">${fmtDate(leg.date)}${leg.departTime ? ` · dep ${esc(leg.departTime)}` : ''} · ${fmtNumber(leg.miles)} + ${fmtUsd(leg.taxesUsd)}</div>
    </li>`;
}

export function connectionItemHtml(it) {
  const program = programById.get(it.programId);
  const layover =
    it.layoverMinutes != null
      ? `${fmtDuration(it.layoverMinutes / 60)} layover in ${esc(city(it.via))}`
      : `Connect in ${esc(city(it.via))} (times unknown)`;
  return `
    <li class="card p-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="font-mono text-base font-semibold text-ink-900">
            ${esc(it.from)} <span aria-hidden="true" class="text-ink-400">→</span>
            <span class="rounded bg-brand-100 px-1 text-brand-800">${esc(it.via)}</span>
            <span aria-hidden="true" class="text-ink-400">→</span> ${esc(it.to)}
            <span class="sr-only">, connecting in ${esc(city(it.via))}</span>
          </p>
          <p class="text-sm text-ink-600">${fmtDate(it.date)} · ${layover}${it.durationHours ? ` · ${fmtDuration(it.durationHours)} total` : ''}</p>
        </div>
        <div class="text-right">
          <p class="text-xl font-semibold tabular text-ink-900">${fmtNumber(it.miles)}</p>
          <p class="text-xs text-ink-600">${esc(program?.currency ?? 'miles')} + ${fmtUsd(it.taxesUsd)}</p>
        </div>
      </div>
      <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
        ${programTag(it.programId)} ${cabinBadge(it.cabin)} ${mixedCabinBadge(it)} ${scoreBadge(it.score, it.sweet)}
        <span class="text-xs text-ink-500">${it.seats} seat${it.seats === 1 ? '' : 's'}</span>
      </div>
      <ol class="mt-3 grid gap-2 text-sm sm:grid-cols-2">${it.legs.map((l, i) => legHtml(l, i + 1)).join('')}</ol>
    </li>`;
}
