import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashString, mulberry32, pickWeighted, roundToChart } from '../assets/js/util/rand.js';
import { distanceBucket, haversineKm } from '../assets/js/util/geo.js';
import { addDays, dayOfWeek, daysBetween, fmtHm, parseHm, thanksgiving } from '../assets/js/util/date.js';
import { buildHash, parseHash } from '../assets/js/util/router.js';
import { fmtMilesShort } from '../assets/js/util/format.js';
import { airportByIata, resolveLocation } from '../assets/js/data/airports.js';

test('hashString is FNV-1a', () => {
  assert.equal(hashString(''), 0x811c9dc5);
  assert.equal(hashString('a'), 0xe40c292c);
});

test('mulberry32 is deterministic and in [0, 1)', () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  for (let i = 0; i < 1000; i++) {
    const x = a();
    assert.equal(x, b());
    assert.ok(x >= 0 && x < 1);
  }
});

test('pickWeighted never picks zero-weight entries', () => {
  const rng = mulberry32(7);
  for (let i = 0; i < 500; i++) assert.notEqual(pickWeighted(rng, [['a', 1], ['b', 0], ['c', 2]]), 'b');
});

test('roundToChart produces chart-like numbers', () => {
  assert.equal(roundToChart(12340), 12500);
  assert.equal(roundToChart(61200), 60000);
  assert.equal(roundToChart(63740, true), 63700);
  assert.equal(roundToChart(10), 500);
});

test('haversineKm matches known great-circle distances', () => {
  const jfkLhr = haversineKm(airportByIata.get('JFK'), airportByIata.get('LHR'));
  assert.ok(Math.abs(jfkLhr - 5540) < 30, `JFK-LHR ${jfkLhr}`);
  const sydLax = haversineKm(airportByIata.get('SYD'), airportByIata.get('LAX'));
  assert.ok(Math.abs(sydLax - 12050) < 60, `SYD-LAX ${sydLax}`);
});

test('distanceBucket boundaries', () => {
  assert.equal(distanceBucket(1499), 'short');
  assert.equal(distanceBucket(1500), 'medium');
  assert.equal(distanceBucket(4000), 'long');
  assert.equal(distanceBucket(8000), 'ultra');
});

test('date helpers work across month and year ends', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(daysBetween('2026-11-12', '2027-01-10'), 59);
  assert.equal(dayOfWeek('2026-11-12'), 4);
  assert.equal(thanksgiving(2026), '2026-11-26');
  assert.equal(thanksgiving(2027), '2027-11-25');
  assert.equal(parseHm('07:45'), 465);
  assert.equal(parseHm('24:00'), null);
  assert.equal(fmtHm(-30), '23:30');
});

test('router hash round-trips and keeps commas readable', () => {
  const hash = buildHash('/search', { from: 'JFK', to: 'Europe', cabins: 'business,first', empty: '', off: false, on: true });
  assert.equal(hash, '#/search?from=JFK&to=Europe&cabins=business,first&on=1');
  assert.deepEqual(parseHash(hash), { path: '/search', query: { from: 'JFK', to: 'Europe', cabins: 'business,first', on: '1' } });
  assert.deepEqual(parseHash(''), { path: '/', query: {} });
  assert.deepEqual(parseHash('#/calendar/'), { path: '/calendar', query: {} });
});

test('resolveLocation understands codes, cities, regions and datalist labels', () => {
  assert.deepEqual(resolveLocation('jfk'), ['JFK']);
  assert.deepEqual(resolveLocation('Tokyo'), ['HND', 'NRT']);
  assert.deepEqual(resolveLocation('Tokyo (HND)'), ['HND']);
  assert.deepEqual(resolveLocation('ewr, jfk'), ['EWR', 'JFK']);
  assert.ok(resolveLocation('Oceania').includes('SYD'));
  assert.equal(resolveLocation(''), null);
  assert.equal(resolveLocation('not a place'), null);
});

test('fmtMilesShort', () => {
  assert.equal(fmtMilesShort(60000), '60k');
  assert.equal(fmtMilesShort(57500), '57.5k');
  assert.equal(fmtMilesShort(950), '950');
});

test('parseAmount accepts the ways people type numbers', async () => {
  const { parseAmount } = await import('../assets/js/util/number.js');
  assert.equal(parseAmount('90000'), 90000);
  assert.equal(parseAmount('90,000'), 90000);
  assert.equal(parseAmount(' 90 000 '), 90000);
  assert.equal(parseAmount('90k'), 90000);
  assert.equal(parseAmount('57.5K'), 57500);
  assert.equal(parseAmount('1.2m'), 1200000);
  assert.equal(parseAmount('$250'), 250);
  assert.equal(parseAmount('75k points'), 75000);
  assert.equal(parseAmount(''), null);
  assert.equal(parseAmount('lots'), null);
  assert.equal(parseAmount('-5'), null);
  assert.equal(parseAmount(null), null);
});
