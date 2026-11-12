import { CABINS, CABIN_SHORT } from '../util/format.js';
import { esc, on } from '../util/dom.js';

export function cabinChipsHtml({ group, selected, label = 'Cabin', multi = true, includeAny = false }) {
  const values = includeAny ? ['any', ...CABINS] : CABINS;
  const chips = values
    .map((c) => {
      const pressed = selected.includes(c);
      const text = c === 'any' ? 'Any cabin' : CABIN_SHORT[c];
      return `<button type="button" class="chip" data-chip-group="${group}" data-value="${c}" aria-pressed="${pressed}">${esc(text)}</button>`;
    })
    .join('');
  return `<div role="group" aria-label="${esc(label)}" class="flex flex-wrap gap-2" data-chips="${group}" data-multi="${multi}">${chips}</div>`;
}

export function readChips(root, group) {
  return [...root.querySelectorAll(`[data-chip-group="${group}"][aria-pressed="true"]`)].map((b) => b.dataset.value);
}

// Multi-select chips toggle independently but never allow an empty set;
// single-select chips behave like a radio group.
export function bindChips(root, onChange) {
  return on(root, 'click', '[data-chip-group]', (event, btn) => {
    const container = btn.closest('[data-chips]');
    const multi = container.dataset.multi === 'true';
    const chips = [...container.querySelectorAll('[data-chip-group]')];
    if (multi) {
      const pressed = btn.getAttribute('aria-pressed') === 'true';
      const others = chips.filter((c) => c !== btn && c.getAttribute('aria-pressed') === 'true');
      if (pressed && others.length === 0) return;
      btn.setAttribute('aria-pressed', String(!pressed));
    } else {
      for (const c of chips) c.setAttribute('aria-pressed', String(c === btn));
    }
    onChange(btn.dataset.chipGroup, readChips(root, btn.dataset.chipGroup));
  });
}
