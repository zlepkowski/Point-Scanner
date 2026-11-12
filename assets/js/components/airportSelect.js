import { AIRPORTS, REGIONS } from '../data/airports.js';
import { esc } from '../util/dom.js';

export const DATALIST_ID = 'airport-options';

export function ensureAirportDatalist() {
  if (document.getElementById(DATALIST_ID)) return;
  const list = document.createElement('datalist');
  list.id = DATALIST_ID;
  list.innerHTML =
    AIRPORTS.map((a) => `<option value="${a.iata}" label="${esc(`${a.city} · ${a.name}`)}"></option>`).join('') +
    REGIONS.map((r) => `<option value="${esc(r)}" label="All airports in region"></option>`).join('');
  document.body.appendChild(list);
}

export function airportInputHtml({ id, name, label, value = '', placeholder = 'City, IATA code or region', hint = '' }) {
  const hintId = hint ? `${id}-hint` : '';
  return `
    <div>
      <label class="field-label" for="${id}">${esc(label)}</label>
      <input id="${id}" name="${name}" class="input" list="${DATALIST_ID}"
        value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off" spellcheck="false"
        ${hintId ? `aria-describedby="${hintId}"` : ''} />
      ${hint ? `<p id="${hintId}" class="mt-1 text-xs text-ink-500">${esc(hint)}</p>` : ''}
    </div>`;
}
