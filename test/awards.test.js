import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_ROUTE_KM, MIN_ROUTE_KM, WINDOW_DAYS, buildRoutes, generateAwards } from '../assets/js/data/awards.js';
import { airportByIata } from '../assets/js/data/airports.js';
import { airlineByIata } from '../assets/js/data/airlines.js';
import { programById } from '../assets/js/data/programs.js';
import { normalizeAwards } from '../assets/js/data/validate.js';
import { addDays } from '../assets/js/util/date.js';

const TODAY = '2026-11-12';
const awards = generateAwards({ today: TODAY });

test('generator is deterministic for a given day', () => {
  const again = generateAwards({ today: TODAY });
  assert.equal(again.length, awards.length);
  assert.deepEqual(again.slice(0, 500), awards.slice(0, 500));
  assert.deepEqual(again.at(-1), awards.at(-1));
});

test('inventory size stays in the intended range', () => {
  assert.ok(awards.length > 45000 && awards.length < 100000, `got ${awards.length}`);
});

test('every award has the documented shape', () => {
  const { awards: valid, warnings } = normalizeAwards(awards, { today: TODAY });
  assert.equal(valid.length, awards.length, warnings.join('\n'));
});

test('awards respect route, partner and cabin rules', () => {
  const end = addDays(TODAY, WINDOW_DAYS - 1);
  for (const a of awards) {
    assert.ok(a.distanceKm >= MIN_ROUTE_KM && a.distanceKm <= MAX_ROUTE_KM, `${a.from}-${a.to} ${a.distanceKm}`);
    assert.ok(a.date >= TODAY && a.date <= end, a.date);
    assert.ok(programById.get(a.programId).partners.includes(a.airline), `${a.programId} can't book ${a.airline}`);
    const carrier = airlineByIata.get(a.airline);
    if (a.cabin === 'first') assert.ok(carrier.first, `${a.airline} has no first class`);
    const servesEndpoint = carrier.hubs.includes(a.from) || carrier.hubs.includes(a.to);
    assert.equal(a.stops === 0, servesEndpoint, `${a.flightNo} ${a.from}-${a.to} stops=${a.stops}`);
    const from = airportByIata.get(a.from);
    const to = airportByIata.get(a.to);
    assert.ok(from.focus || to.focus || from.region === to.region, `${a.from}-${a.to} breaks the route rule`);
  }
});

test('same-metro hops are excluded', () => {
  const keys = new Set(buildRoutes().map((r) => r.key));
  assert.ok(!keys.has('JFK-EWR'));
  assert.ok(!keys.has('HND-NRT'));
  assert.ok(keys.has('JFK-LHR'));
});

test('a given flight on a given date mostly survives to the next day (stable base + light churn)', () => {
  const tomorrow = generateAwards({ today: addDays(TODAY, 1) });
  const date = addDays(TODAY, 10);
  const key = (a) => `${a.from}|${a.to}|${a.flightNo}|${a.cabin}|${a.programId}`;
  const before = new Set(awards.filter((a) => a.date === date).map(key));
  const after = new Set(tomorrow.filter((a) => a.date === date).map(key));
  const kept = [...before].filter((k) => after.has(k)).length;
  const share = kept / before.size;
  assert.ok(share > 0.75 && share < 1, `kept ${(share * 100).toFixed(1)}%`);
});

test('prices on a shared date are identical across days for surviving awards', () => {
  const tomorrow = generateAwards({ today: addDays(TODAY, 1) });
  const date = addDays(TODAY, 20);
  const index = new Map(tomorrow.filter((a) => a.date === date).map((a) => [`${a.from}${a.to}${a.flightNo}${a.cabin}${a.programId}`, a]));
  let compared = 0;
  for (const a of awards.filter((x) => x.date === date)) {
    const b = index.get(`${a.from}${a.to}${a.flightNo}${a.cabin}${a.programId}`);
    if (!b || b.miles !== a.miles) continue;
    compared++;
    assert.equal(b.taxesUsd, a.taxesUsd);
  }
  assert.ok(compared > 100);
});

test('UK departure tax makes LHR long-haul departures pricier than arrivals', () => {
  const avg = (list) => list.reduce((s, a) => s + a.taxesUsd, 0) / list.length;
  const out = awards.filter((a) => a.from === 'LHR' && a.to === 'JFK' && a.programId === 'united');
  const back = awards.filter((a) => a.from === 'JFK' && a.to === 'LHR' && a.programId === 'united');
  if (out.length && back.length) assert.ok(avg(out) > avg(back) + 50);
});
