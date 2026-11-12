import { awardsOnRoute, getToday } from '../data/store.js';
import { airportLabel } from '../data/airports.js';
import { programName } from '../data/programs.js';
import { evaluateSaved, markSeen, removeSaved, setTarget } from '../data/alerts.js';
import { announce, esc, mount, on } from '../util/dom.js';
import { buildHash } from '../util/router.js';
import { CABIN_LABEL, fmtDate, fmtNumber, plural } from '../util/format.js';

const MAX_LISTED = 8;

function dateList(dates) {
  const shown = dates.slice(0, MAX_LISTED).map(fmtDate).join(', ');
  return dates.length > MAX_LISTED ? `${shown} +${dates.length - MAX_LISTED} more` : shown;
}

function relative(iso) {
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.round(mins / 60);
  if (hours < 36) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function entryHtml({ saved, current, diff, noteworthy }) {
  const cabinLabel = saved.cabin === 'any' ? 'Any cabin' : CABIN_LABEL[saved.cabin];
  const datesWithSpace = Object.keys(current).filter((d) => d >= getToday()).length;
  const chips = [];
  if (diff.opened.length) chips.push(`<span class="badge badge-good">${plural(diff.opened.length, 'new date')}</span>`);
  if (diff.drops.length) chips.push(`<span class="badge badge-good">${plural(diff.drops.length, 'price drop')}</span>`);
  if (diff.newLow) chips.push(`<span class="badge badge-sweet">New low ${fmtNumber(diff.currLow)}</span>`);
  if (diff.targetHits.length) chips.push(`<span class="badge badge-sweet">${plural(diff.targetHits.length, 'date')} under target</span>`);
  if (diff.closed.length) chips.push(`<span class="badge badge-bad">${plural(diff.closed.length, 'date')} gone</span>`);
  if (!chips.length) chips.push('<span class="badge">No changes</span>');

  const details = [];
  if (diff.opened.length) details.push(`<li><span class="font-semibold text-good-800">Opened:</span> ${esc(dateList(diff.opened))}</li>`);
  if (diff.drops.length) {
    details.push(
      `<li><span class="font-semibold text-good-800">Cheaper:</span> ${diff.drops
        .slice(0, MAX_LISTED)
        .map((d) => `${esc(fmtDate(d.date))} ${esc(programName(d.programId))} ${fmtNumber(d.from)} → <strong>${fmtNumber(d.to)}</strong>`)
        .join('; ')}${diff.drops.length > MAX_LISTED ? ` +${diff.drops.length - MAX_LISTED} more` : ''}</li>`,
    );
  }
  if (diff.targetHits.length) {
    details.push(
      `<li><span class="font-semibold text-accent-800">At or under ${fmtNumber(saved.targetMiles)}:</span> ${diff.targetHits
        .slice(0, MAX_LISTED)
        .map((h) => `${esc(fmtDate(h.date))} (${fmtNumber(h.miles)})`)
        .join(', ')}</li>`,
    );
  }
  if (diff.closed.length) details.push(`<li><span class="font-semibold text-bad-800">No longer available:</span> ${esc(dateList(diff.closed))}</li>`);

  const cabinParam = saved.cabin === 'any' ? null : saved.cabin;
  return `
    <li class="card p-4 sm:p-5 ${noteworthy ? 'ring-2 ring-accent-400' : ''}" data-saved-id="${esc(saved.id)}">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="font-mono text-lg font-semibold text-ink-900">${esc(saved.from)} → ${esc(saved.to)}</h2>
          <p class="text-sm text-ink-600">${esc(airportLabel(saved.from))} to ${esc(airportLabel(saved.to))} · ${esc(cabinLabel)} · ${
            saved.programId ? esc(programName(saved.programId)) : 'All programs'
          }</p>
          <p class="mt-1 text-xs text-ink-500">Last seen ${esc(relative(saved.seenAt))} · ${plural(datesWithSpace, 'date')} with space now${
            diff.currLow != null ? ` · lowest ${fmtNumber(diff.currLow)}` : ''
          }</p>
        </div>
        <div class="flex flex-wrap gap-1.5">${chips.join('')}</div>
      </div>
      ${details.length ? `<ul class="mt-3 space-y-1 text-sm text-ink-700">${details.join('')}</ul>` : ''}
      <div class="mt-4 flex flex-wrap items-end gap-2 border-t border-ink-100 pt-4">
        <label class="text-xs text-ink-600">Alert me at or under
          <input type="number" class="input mt-1 w-36 tabular" min="0" step="5000" data-target value="${saved.targetMiles ?? ''}" placeholder="Any price" />
        </label>
        <a class="btn btn-sm" href="${buildHash('/calendar', { from: saved.from, to: saved.to, cabin: cabinParam ?? 'business', program: saved.programId })}">Calendar</a>
        <a class="btn btn-sm" href="${buildHash('/search', { from: saved.from, to: saved.to, cabins: cabinParam, programs: saved.programId, sort: 'date' })}">Search</a>
        ${noteworthy ? '<button type="button" class="btn btn-sm btn-primary" data-mark-seen>Mark as seen</button>' : ''}
        <button type="button" class="btn btn-sm btn-ghost ml-auto" data-remove aria-label="Stop watching ${esc(saved.from)} to ${esc(saved.to)}">Remove</button>
      </div>
    </li>`;
}

export function render(root) {
  function draw() {
    const entries = evaluateSaved(awardsOnRoute, getToday()).sort((a, b) => Number(b.noteworthy) - Number(a.noteworthy));
    const changed = entries.filter((e) => e.noteworthy).length;
    mount(
      root,
      `
      <div class="mb-6">
        <h1 tabindex="-1" class="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Saved routes</h1>
        <p class="mt-1 max-w-2xl text-ink-600">Each time you open Pointscanner it compares saved routes with the last time you looked and flags
          new dates, price drops and anything under your target. Everything is stored in this browser; there is no server and nothing to sign up for.</p>
      </div>
      ${
        entries.length
          ? `<p class="mb-4 text-sm text-ink-600">${plural(entries.length, 'route')} saved · ${plural(changed, 'route')} with updates.</p>
             <ul class="space-y-4">${entries.map(entryHtml).join('')}</ul>`
          : `<div class="card p-8 text-center">
              <p class="font-semibold text-ink-900">No saved routes yet.</p>
              <p class="mt-1 text-sm text-ink-600">Search a route or open its calendar and choose <strong>Save route</strong>.</p>
              <a class="btn btn-primary mt-4" href="${buildHash('/calendar', { from: 'JFK', to: 'LHR', cabin: 'business' })}">Try JFK → LHR in business</a>
            </div>`
      }`,
    );
  }

  draw();
  const changed = () => document.dispatchEvent(new CustomEvent('pointscanner:saved-changed'));
  const idOf = (el) => el.closest('[data-saved-id]').dataset.savedId;
  const offs = [
    on(root, 'click', '[data-mark-seen]', (e, btn) => {
      const id = idOf(btn);
      const [from, to] = id.split('|');
      markSeen(id, awardsOnRoute(from, to));
      draw();
      changed();
      announce('Marked as seen');
    }),
    on(root, 'click', '[data-remove]', (e, btn) => {
      removeSaved(idOf(btn));
      draw();
      changed();
      announce('Route removed');
      root.querySelector('h1')?.focus();
    }),
    on(root, 'change', '[data-target]', (e, input) => {
      setTarget(idOf(input), Math.round(Number(input.value)) || null);
      draw();
      changed();
      announce('Target updated');
    }),
  ];
  return () => offs.forEach((off) => off());
}
