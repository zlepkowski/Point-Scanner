import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findConnections, MIN_CONNECT_MINUTES } from '../assets/js/data/connections.js';
import { buildIndexes } from '../assets/js/data/store.js';
import { awards } from './helpers.js';

// FRA is UTC+1, JFK UTC-5. A 17:30 JFK departure of 7.6h lands 07:06 FRA local.
const leg1 = { from: 'JFK', to: 'FRA', distanceKm: 6200, durationHours: 7.6, date: '2026-12-01', departTime: '17:30', cabin: 'business', miles: 60000, taxesUsd: 50, airline: 'LH', flightNo: 'LH401', programId: 'aeroplan' };
const leg2 = { from: 'FRA', to: 'SIN', distanceKm: 10260, durationHours: 12.4, date: '2026-12-02', departTime: '10:00', cabin: 'business', miles: 70000, taxesUsd: 60, airline: 'LH', flightNo: 'LH778', programId: 'aeroplan' };
const query = { from: 'JFK', to: 'SIN', cabins: ['business'] };

test('stitches two same-program legs with a valid layover', () => {
  const [it, ...rest] = findConnections(buildIndexes(awards([leg1, leg2])), query);
  assert.equal(rest.length, 0);
  assert.equal(it.via, 'FRA');
  assert.equal(it.miles, 130000);
  assert.equal(it.taxesUsd, 110);
  assert.equal(it.mixed, false);
  assert.equal(it.layoverMinutes, 10 * 60 - (7 * 60 + 6));
  assert.equal(it.cabinShare, 1);
});

test('rejects connections shorter than the minimum layover', () => {
  const tight = { ...leg2, date: '2026-12-02', departTime: '07:30' };
  assert.ok(24 < MIN_CONNECT_MINUTES);
  assert.equal(findConnections(buildIndexes(awards([leg1, tight])), query).length, 0);
});

test('does not mix programs across legs', () => {
  assert.equal(findConnections(buildIndexes(awards([leg1, { ...leg2, programId: 'united', airline: 'UA' }])), query).length, 0);
});

test('skips dates where the same program already has a direct award', () => {
  const direct = { ...leg1, to: 'SIN', distanceKm: 15350, durationHours: 18.6, flightNo: 'SQ23', airline: 'SQ' };
  assert.equal(findConnections(buildIndexes(awards([leg1, leg2, direct])), query).length, 0);
});

test('flags a mixed-cabin itinerary instead of hiding the economy leg', () => {
  const [it] = findConnections(buildIndexes(awards([{ ...leg1, cabin: 'economy', miles: 30000 }, leg2])), query);
  assert.equal(it.mixed, true);
  assert.equal(it.cabin, 'business');
  assert.ok(Math.abs(it.cabinShare - 10260 / 16460) < 1e-9);
});

test('the longer leg must be in a requested cabin', () => {
  const list = awards([leg1, { ...leg2, cabin: 'economy' }]);
  assert.equal(findConnections(buildIndexes(list), query).length, 0);
});

test('records without times fall back to same/next-day matching', () => {
  const list = awards([{ ...leg1, departTime: null }, { ...leg2, departTime: null }]);
  const [it] = findConnections(buildIndexes(list), query);
  assert.equal(it.layoverMinutes, null);
});

test('rejects big detours', () => {
  const viaSyd = { ...leg1, to: 'SYD', distanceKm: 16000 };
  const sydSin = { ...leg2, from: 'SYD', distanceKm: 6300 };
  assert.equal(findConnections(buildIndexes(awards([viaSyd, sydSin])), query).length, 0);
});
