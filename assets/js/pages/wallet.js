import { awardsForProgram } from '../data/store.js';
import { PROGRAMS, programById } from '../data/programs.js';
import { airportLabel, resolveLocation } from '../data/airports.js';
import { formatBalances, loadWallet, parseBalances, saveWallet, walletMatches, STRETCH_RATIO } from '../data/wallet.js';
import { airportInputHtml } from '../components/airportSelect.js';
import { awardCardHtml, cardGridHtml } from '../components/awardCard.js';
import { awardTableHtml, sortAwards } from '../components/awardTable.js';
import { bindChips, cabinChipsHtml } from '../components/cabinChips.js';
import { programSwatch } from '../components/badges.js';
import { icon } from '../components/icons.js';
import { parseAmount } from '../util/number.js';
import { announce, debounce, esc, mount, on } from '../util/dom.js';
import { buildHash } from '../util/router.js';
import { CABINS, CABIN_SHORT, fmtNumber, plural } from '../util/format.js';

const EXAMPLE = [
  { programId: 'aeroplan', amount: 90000 },
  { programId: 'virgin', amount: 60000 },
];

function balanceRowHtml(b, i) {
  return `
    <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,9rem)_auto] items-end gap-2" data-balance-row>
      <div>
        <label class="field-label ${i ? 'sr-only' : ''}" for="bal-prog-${i}">Program</label>
        <select id="bal-prog-${i}" name="programId" class="input">
          ${PROGRAMS.map((p) => `<option value="${p.id}" ${p.id === b.programId ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="field-label ${i ? 'sr-only' : ''}" for="bal-amt-${i}">Balance</label>
        <input id="bal-amt-${i}" name="amount" type="text" inputmode="numeric" autocomplete="off" class="input tabular" value="${b.amount || ''}" placeholder="e.g. 75k" />
      </div>
      <button type="button" class="btn btn-ghost" data-remove-balance="${i}" aria-label="Remove ${esc(programById.get(b.programId)?.name ?? 'program')} balance">${icon('x')}</button>
    </div>`;
}

export function render(root, { query, router }) {
  const fromUrl = parseBalances(query.b);
  const state = {
    balances: fromUrl.length ? fromUrl : loadWallet(),
    from: query.from ?? '',
    cabins: (query.cabins ?? '').split(',').filter((c) => CABINS.includes(c)),
  };
  if (!state.cabins.length) state.cabins = [...CABINS];
  if (!state.balances.length) state.balances = [{ programId: 'aeroplan', amount: 0 }];

  mount(
    root,
    `
    <div class="mb-6">
      <h1 tabindex="-1" class="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">What can my points book?</h1>
      <p class="mt-1 max-w-2xl text-ink-600">Enter your balances and Pointscanner lists every award you can book outright, ranked by value,
        plus near misses within ${Math.round((STRETCH_RATIO - 1) * 100)}% of your balance.</p>
    </div>
    <div class="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <form id="wallet-form" class="card h-fit space-y-4 p-4 lg:sticky lg:top-20" aria-label="Your balances">
        <div id="balance-rows" class="space-y-2"></div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn btn-sm" data-add-balance>+ Add program</button>
          <button type="button" class="btn btn-sm btn-ghost" data-example>Try an example</button>
        </div>
        ${airportInputHtml({ id: 'wallet-from', name: 'from', label: 'Flying from (optional)', value: state.from, placeholder: 'Anywhere' })}
        <div>
          <span class="field-label">Cabins</span>
          ${cabinChipsHtml({ group: 'cabins', selected: state.cabins })}
        </div>
        <p class="text-xs text-ink-500">Balances are kept in this browser only and are never sent anywhere.</p>
      </form>
      <div id="wallet-results" class="min-w-0"></div>
    </div>`,
  );

  const form = root.querySelector('#wallet-form');
  const rowsEl = root.querySelector('#balance-rows');
  const results = root.querySelector('#wallet-results');

  function renderRows() {
    rowsEl.innerHTML = state.balances.map(balanceRowHtml).join('');
  }

  function readRows() {
    state.balances = [...rowsEl.querySelectorAll('[data-balance-row]')].map((row) => ({
      programId: row.querySelector('[name="programId"]').value,
      amount: parseAmount(row.querySelector('[name="amount"]').value) ?? 0,
    }));
  }

  function renderResults() {
    const active = state.balances.filter((b) => b.amount > 0);
    if (!active.length) {
      results.innerHTML = `<div class="card p-8 text-center">
        <p class="font-semibold text-ink-900">Add a balance to see what it can book.</p>
        <p class="mt-1 text-sm text-ink-600">For example, 90,000 Aeroplan points from New York in business.</p>
        <button type="button" class="btn btn-primary mt-4" data-example>Try an example</button></div>`;
      return;
    }
    const from = resolveLocation(state.from);
    const { programs, overall } = walletMatches(awardsForProgram, active, {
      from,
      cabins: state.cabins.length === CABINS.length ? null : state.cabins,
    });
    const total = programs.reduce((n, p) => n + p.affordableCount, 0);
    const where = from ? ` from ${from.length === 1 ? airportLabel(from[0]) : `${from.length} airports`}` : '';

    results.innerHTML = `
      <h2 class="text-lg font-semibold text-ink-900">${plural(total, 'bookable award')}${esc(where)}</h2>
      <p class="mb-4 text-sm text-ink-600">Across ${plural(active.length, 'program')}. Ranked by deal score.</p>
      ${overall.length ? cardGridHtml(overall.slice(0, 6).map((a) => awardCardHtml(a))) : ''}
      <div class="mt-10 space-y-10">
        ${programs.map((p) => programSectionHtml(p, state)).join('')}
      </div>`;
  }

  function persist() {
    const active = state.balances.filter((b) => b.amount > 0);
    saveWallet(active);
    router.replaceQuery({
      b: formatBalances(active),
      from: state.from.trim(),
      cabins: state.cabins.length === CABINS.length ? null : state.cabins.join(','),
    });
  }

  function update() {
    persist();
    renderResults();
  }
  const updateSoon = debounce(() => {
    readRows();
    update();
    announce('Results updated');
  }, 300);

  function loadExample() {
    state.balances = EXAMPLE.map((b) => ({ ...b }));
    state.from = state.from || 'New York';
    form.elements.from.value = state.from;
    renderRows();
    update();
  }

  renderRows();
  renderResults();

  const offs = [
    on(rowsEl, 'input', 'input', updateSoon),
    on(rowsEl, 'change', 'select', () => {
      readRows();
      update();
    }),
    on(form, 'click', '[data-add-balance]', () => {
      readRows();
      const used = new Set(state.balances.map((b) => b.programId));
      const next = PROGRAMS.find((p) => !used.has(p.id)) ?? PROGRAMS[0];
      state.balances.push({ programId: next.id, amount: 0 });
      renderRows();
      rowsEl.querySelector(`#bal-amt-${state.balances.length - 1}`)?.focus();
    }),
    on(form, 'click', '[data-remove-balance]', (e, btn) => {
      readRows();
      state.balances.splice(Number(btn.dataset.removeBalance), 1);
      if (!state.balances.length) state.balances.push({ programId: 'aeroplan', amount: 0 });
      renderRows();
      update();
      form.querySelector('[data-add-balance]').focus();
    }),
    on(root, 'click', '[data-example]', loadExample),
    bindChips(form, (group, values) => {
      state.cabins = values;
      update();
    }),
  ];
  form.elements.from.addEventListener('change', () => {
    state.from = form.elements.from.value;
    update();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.from = form.elements.from.value;
    readRows();
    update();
  });
  return () => offs.forEach((off) => off());
}

function programSectionHtml(p, state) {
  const program = programById.get(p.programId);
  const best = Object.entries(p.bestByCabin)
    .sort((a, b) => CABINS.indexOf(b[0]) - CABINS.indexOf(a[0]))
    .map(([cabin, a]) => `<li><span class="text-ink-500">${esc(CABIN_SHORT[cabin])}:</span> <span class="font-mono">${esc(a.from)}–${esc(a.to)}</span> for ${fmtNumber(a.miles)}</li>`)
    .join('');
  return `
    <section aria-labelledby="w-${p.programId}">
      <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="w-${p.programId}" class="flex items-center gap-2 text-lg font-semibold text-ink-900">${programSwatch(p.programId)} ${esc(program.name)}
          <span class="text-sm font-normal text-ink-500">${fmtNumber(p.amount)} ${esc(program.currency)}</span></h3>
        <a class="link link-target text-sm" href="${buildHash('/search', {
          programs: p.programId,
          from: state.from.trim(),
          cabins: state.cabins.length === CABINS.length ? null : state.cabins.join(','),
          maxMiles: p.amount,
          sort: 'score',
        })}">Open in Search ${icon('arrowRight', { size: 14 })}</a>
      </div>
      <p class="mb-3 text-sm text-ink-600">${plural(p.affordableCount, 'award')} to ${plural(p.destinationCount, 'destination')} within your balance.</p>
      ${best ? `<ul class="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">${best}</ul>` : ''}
      ${p.affordable.length ? awardTableHtml(sortAwards(p.affordable.slice(0, 10), 'score', 'desc'), { caption: `Best ${program.name} redemptions within your balance` }) : ''}
      ${
        p.stretch.length
          ? `<div class="mt-4">
              <h4 class="mb-2 text-sm font-semibold text-ink-800">Just out of reach (${fmtNumber(p.stretchCount)})</h4>
              <ul class="grid gap-2 text-sm sm:grid-cols-2">
                ${p.stretch
                  .map(
                    (a) => `<li class="rounded-lg bg-ink-100 px-3 py-2"><span class="font-mono font-semibold">${esc(a.from)}–${esc(a.to)}</span>
                      ${esc(CABIN_SHORT[a.cabin])} · ${fmtNumber(a.miles)} <span class="text-ink-500">(${fmtNumber(a.miles - p.amount)} short)</span></li>`,
                  )
                  .join('')}
              </ul>
            </div>`
          : ''
      }
    </section>`;
}
