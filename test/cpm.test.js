import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CASH_FLOOR, CASH_PER_KM, SWEET_SPOT_THRESHOLD, baselineCents, centsPerMile, dealScore, estimateCashUsd, isSweetSpot,
} from '../assets/js/util/cpm.js';
import { generateAwards } from '../assets/js/data/awards.js';
import { award } from './helpers.js';

test('cents per mile follows the documented formula', () => {
  const a = award({ cabin: 'business', distanceKm: 6000, airline: 'AC', taxesUsd: 100, miles: 70000 });
  const cash = Math.max(CASH_FLOOR.business, CASH_PER_KM.business * 6000);
  assert.equal(centsPerMile(a), ((cash - 100) * 100) / 70000);
  assert.equal(dealScore(a), centsPerMile(a) / baselineCents('aeroplan'));
});

test('cash is floored per cabin and net value never drops below $40', () => {
  assert.equal(estimateCashUsd({ cabin: 'economy', distanceKm: 300, airline: 'UA' }), CASH_FLOOR.economy);
  const a = award({ cabin: 'economy', distanceKm: 300, taxesUsd: 500, miles: 10000 });
  assert.equal(centsPerMile(a), (40 * 100) / 10000);
});

test('carrier premium lifts premium cabins only', () => {
  const base = { distanceKm: 8000, from: 'SIN', to: 'LHR' };
  assert.ok(estimateCashUsd({ ...base, cabin: 'business', airline: 'SQ' }) > estimateCashUsd({ ...base, cabin: 'business', airline: 'TK' }));
  assert.equal(estimateCashUsd({ ...base, cabin: 'economy', airline: 'SQ' }), estimateCashUsd({ ...base, cabin: 'economy', airline: 'TK' }));
});

test('short-haul business within a region is discounted', () => {
  const domestic = estimateCashUsd({ cabin: 'business', distanceKm: 2500, airline: 'UA', from: 'ORD', to: 'SFO' });
  const crossRegion = estimateCashUsd({ cabin: 'business', distanceKm: 2500, airline: 'UA', from: 'IAH', to: 'BOG' });
  assert.ok(domestic < crossRegion);
});

test('threshold', () => {
  assert.ok(isSweetSpot(SWEET_SPOT_THRESHOLD));
  assert.ok(!isSweetSpot(SWEET_SPOT_THRESHOLD - 0.01));
});

test('about 5% of synthetic awards are sweet spots, mostly in premium cabins', () => {
  const list = generateAwards({ today: '2026-11-12' });
  let sweet = 0;
  let premium = 0;
  for (const a of list) {
    if (!isSweetSpot(dealScore(a))) continue;
    sweet++;
    if (a.cabin === 'business' || a.cabin === 'first') premium++;
  }
  const share = sweet / list.length;
  assert.ok(share > 0.03 && share < 0.08, `sweet share ${(share * 100).toFixed(2)}%`);
  assert.ok(premium / sweet > 0.6, `premium share of sweet spots ${(premium / sweet).toFixed(2)}`);
});
