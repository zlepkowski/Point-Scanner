import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyFilters, filtersFromQuery, filtersToQuery, activeFilterCount } from '../assets/js/components/filters.js';
import { sortAwards, nextSort } from '../assets/js/components/awardTable.js';
import { CABINS } from '../assets/js/util/format.js';
import { awards } from './helpers.js';

const list = awards([
  { from: 'JFK', to: 'LHR', date: '2026-12-01', cabin: 'business', miles: 60000, taxesUsd: 90, seats: 2, programId: 'aeroplan' },
  { from: 'JFK', to: 'LHR', date: '2026-12-05', cabin: 'economy', miles: 30000, taxesUsd: 400, seats: 6, programId: 'virgin', airline: 'VS' },
  { from: 'JFK', to: 'CDG', date: '2026-12-10', cabin: 'first', miles: 120000, taxesUsd: 700, seats: 1, programId: 'flyingblue', airline: 'AF', stops: 1, distanceKm: 5830 },
  { from: 'EWR', to: 'LHR', date: '2026-12-03', cabin: 'business', miles: 30000, taxesUsd: 50, seats: 1, programId: 'united', airline: 'UA', distanceKm: 5570 },
]);

const ids = (rows) => rows.map((a) => `${a.from}${a.to}${a.cabin}`);

test('defaults keep everything', () => {
  assert.equal(applyFilters(list, filtersFromQuery({})).length, list.length);
  assert.equal(activeFilterCount(filtersFromQuery({})), 0);
});

test('query round-trip', () => {
  const q = { cabins: 'business,first', programs: 'aeroplan,united', df: '2026-12-02', dt: '2026-12-31', nonstop: '1', maxMiles: '70000', maxTaxes: '500', seats: '2', sweet: '1' };
  const f = filtersFromQuery(q);
  assert.equal(activeFilterCount(f), 8);
  const back = filtersToQuery(f);
  assert.deepEqual(filtersFromQuery(Object.fromEntries(Object.entries(back).filter(([, v]) => v != null && v !== false).map(([k, v]) => [k, v === true ? '1' : String(v)]))), f);
});

test('garbage in the URL falls back to defaults', () => {
  const f = filtersFromQuery({ cabins: 'lounge', programs: 'nope', df: '12/01/2026', seats: '-3', maxMiles: 'lots' });
  assert.deepEqual(f.cabins, CABINS);
  assert.equal(f.programs, null);
  assert.equal(f.dateFrom, null);
  assert.equal(f.minSeats, 1);
  assert.equal(f.maxMiles, null);
});

test('an explicit empty program selection survives the URL', () => {
  const f = filtersFromQuery({ programs: 'none' });
  assert.deepEqual(f.programs, []);
  assert.equal(filtersToQuery(f).programs, 'none');
  assert.equal(applyFilters(list, f).length, 0);
});

test('each filter narrows as expected', () => {
  const base = filtersFromQuery({});
  assert.deepEqual(ids(applyFilters(list, { ...base, cabins: ['business'] })), ['JFKLHRbusiness', 'EWRLHRbusiness']);
  assert.deepEqual(ids(applyFilters(list, { ...base, programs: ['virgin'] })), ['JFKLHReconomy']);
  assert.deepEqual(ids(applyFilters(list, { ...base, dateFrom: '2026-12-04', dateTo: '2026-12-06' })), ['JFKLHReconomy']);
  assert.equal(applyFilters(list, { ...base, nonstop: true }).length, 3);
  assert.equal(applyFilters(list, { ...base, maxMiles: 30000 }).length, 2);
  assert.equal(applyFilters(list, { ...base, maxTaxes: 100 }).length, 2);
  assert.equal(applyFilters(list, { ...base, minSeats: 2 }).length, 2);
  assert.deepEqual(ids(applyFilters(list, base, { from: ['JFK'], to: ['LHR'] })), ['JFKLHRbusiness', 'JFKLHReconomy']);
  assert.ok(applyFilters(list, { ...base, sweetOnly: true }).every((a) => a.sweet));
});

test('sorting is stable and toggles direction', () => {
  assert.deepEqual(sortAwards(list, 'miles', 'asc').map((a) => a.miles), [30000, 30000, 60000, 120000]);
  assert.deepEqual(sortAwards(list, 'miles', 'desc').map((a) => a.miles), [120000, 60000, 30000, 30000]);
  assert.deepEqual(nextSort('miles', 'asc', 'miles'), { sort: 'miles', dir: 'desc' });
  assert.deepEqual(nextSort('miles', 'asc', 'score'), { sort: 'score', dir: 'desc' });
});
