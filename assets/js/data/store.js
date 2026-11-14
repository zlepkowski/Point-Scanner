import { generateAwards, WINDOW_DAYS } from './awards.js';
import { normalizeAwards, readProvenance } from './validate.js';
import { centsPerMile, dealScore, isSweetSpot } from '../util/cpm.js';
import { todayIso, addDays } from '../util/date.js';

const EMPTY = Object.freeze([]);

export function routeKey(from, to) {
  return `${from}-${to}`;
}

// Derived fields are computed once at load so every view sorts and filters on
// the same numbers. They are not part of the input contract.
export function enrich(awards) {
  for (const a of awards) {
    a.cpm = centsPerMile(a);
    a.score = dealScore(a);
    a.sweet = isSweetSpot(a.score);
  }
  return awards;
}

function push(map, key, value) {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

export function buildIndexes(awards) {
  const byFrom = new Map();
  const byRoute = new Map();
  const byProgram = new Map();
  for (const a of awards) {
    push(byFrom, a.from, a);
    push(byRoute, routeKey(a.from, a.to), a);
    push(byProgram, a.programId, a);
  }
  return { byFrom, byRoute, byProgram };
}

const state = {
  awards: EMPTY,
  indexes: buildIndexes(EMPTY),
  source: null,
  today: todayIso(),
  window: { start: todayIso(), end: addDays(todayIso(), WINDOW_DAYS - 1) },
};
const listeners = new Set();

export function setAwards(awards, source, today = state.today) {
  state.today = today;
  state.awards = enrich(awards);
  state.indexes = buildIndexes(state.awards);
  let end = addDays(today, WINDOW_DAYS - 1);
  for (const a of state.awards) if (a.date > end) end = a.date;
  state.window = { start: today, end };
  state.source = { warnings: [], ...source, count: state.awards.length };
  for (const fn of listeners) fn(state);
}

export async function loadAwards({ url, globalData, today = todayIso(), fetchImpl = globalThis.fetch } = {}) {
  const warnings = [];

  if (globalData != null) {
    const result = normalizeAwards(globalData, { today });
    warnings.push(...result.warnings);
    if (result.awards.length) {
      return setAwards(result.awards, { kind: 'json', label: 'Embedded award data', warnings, ...readProvenance(globalData) }, today);
    }
    warnings.push('Embedded award data had no usable records; using synthetic data instead.');
  }

  if (url) {
    try {
      const res = await fetchImpl(url, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const result = normalizeAwards(json, { today });
      warnings.push(...result.warnings);
      if (result.awards.length) {
        return setAwards(result.awards, { kind: 'json', label: url, warnings, ...readProvenance(json) }, today);
      }
      warnings.push(`${url} had no usable records; using synthetic data instead.`);
    } catch (err) {
      warnings.push(`Could not load ${url} (${err.message}); using synthetic data instead.`);
    }
  }

  setAwards(generateAwards({ today }), { kind: 'synthetic', label: 'Synthetic sample data', warnings }, today);
}

export function loadAwardsFromJson(json, label) {
  const result = normalizeAwards(json, { today: state.today });
  if (!result.awards.length) return { ok: false, warnings: result.warnings };
  setAwards(result.awards, { kind: 'json', label, warnings: result.warnings, ...readProvenance(json) });
  return { ok: true, warnings: result.warnings };
}

export function resetToSynthetic() {
  setAwards(generateAwards({ today: state.today }), { kind: 'synthetic', label: 'Synthetic sample data' });
}

export const getAwards = () => state.awards;
export const getIndexes = () => state.indexes;
export const getSource = () => state.source;
export const getToday = () => state.today;
export const getWindow = () => state.window;

export function awardsFrom(iata) {
  return state.indexes.byFrom.get(iata) ?? EMPTY;
}

export function awardsOnRoute(from, to) {
  return state.indexes.byRoute.get(routeKey(from, to)) ?? EMPTY;
}

export function awardsForProgram(programId) {
  return state.indexes.byProgram.get(programId) ?? EMPTY;
}

export function onDataChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
