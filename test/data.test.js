import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAwards } from '../assets/js/data/validate.js';
import { getAwards, getSource, getWindow, loadAwards } from '../assets/js/data/store.js';
import { formatBalances, parseBalances, walletMatches } from '../assets/js/data/wallet.js';
import { heatmapDays, HEAT_LEVELS } from '../assets/js/pages/calendar.js';
import { bestPerDestination } from '../assets/js/pages/explore.js';
import { programStats } from '../assets/js/pages/programs.js';
import { dateRange } from '../assets/js/util/date.js';
import { award, awards } from './helpers.js';

const TODAY = '2026-11-12';

test('normalizeAwards accepts both shapes, drops bad and stale records with reasons', () => {
  const good = award({ date: '2026-12-01' });
  const result = normalizeAwards({ awards: [good, { ...good, cabin: 'lounge' }, { ...good, programId: 'nope' }, { ...good, date: '2026-01-01' }] }, { today: TODAY });
  assert.equal(result.awards.length, 1);
  assert.ok(result.warnings.some((w) => w.includes('Dropped 2')));
  assert.ok(result.warnings.some((w) => w.includes('cabin must be')));
  assert.ok(result.warnings.some((w) => w.includes('Skipped 1')));
  assert.equal(normalizeAwards([good], { today: TODAY }).awards.length, 1);
  assert.equal(normalizeAwards('nope').awards.length, 0);
});

test('normalizeAwards fills optional fields', () => {
  const { awards: [a] } = normalizeAwards([{ ...award({ date: '2026-12-01' }), departTime: undefined, stops: undefined, seats: undefined, durationHours: undefined }]);
  assert.equal(a.departTime, null);
  assert.equal(a.stops, 0);
  assert.equal(a.seats, 1);
  assert.equal(a.durationHours, null);
});

test('loadAwards prefers embedded data, then the URL, then synthetic', async () => {
  await loadAwards({ globalData: [award({ date: '2026-12-01' })], today: TODAY });
  assert.equal(getSource().kind, 'json');
  assert.equal(getAwards().length, 1);
  assert.ok(Number.isFinite(getAwards()[0].score), 'awards are enriched');

  const fetchImpl = async () => ({ ok: true, json: async () => ({ awards: [award({ date: '2026-12-02' }), award({ date: '2026-12-03' })] }) });
  await loadAwards({ url: 'awards.json', fetchImpl, today: TODAY });
  assert.equal(getSource().label, 'awards.json');
  assert.equal(getAwards().length, 2);

  const failing = async () => ({ ok: false, status: 404 });
  await loadAwards({ url: 'awards.json', fetchImpl: failing, today: TODAY });
  assert.equal(getSource().kind, 'synthetic');
  assert.ok(getSource().warnings[0].includes('HTTP 404'));
  assert.equal(getWindow().start, TODAY);
});

test('wallet finds affordable awards, near misses, and respects origin and cabin', () => {
  const list = awards([
    { miles: 60000, cabin: 'business' },
    { miles: 95000, cabin: 'business', to: 'CDG' },
    { miles: 30000, cabin: 'economy', from: 'BOS' },
    { miles: 50000, cabin: 'business', programId: 'united', airline: 'UA' },
  ]);
  const byProgram = (id) => list.filter((a) => a.programId === id);
  const { programs, overall } = walletMatches(byProgram, [{ programId: 'aeroplan', amount: 85000 }]);
  assert.equal(programs[0].affordableCount, 2);
  assert.equal(programs[0].stretchCount, 1);
  assert.equal(overall.length, 2);
  const fromJfk = walletMatches(byProgram, [{ programId: 'aeroplan', amount: 85000 }], { from: ['JFK'], cabins: ['business'] });
  assert.equal(fromJfk.programs[0].affordableCount, 1);
});

test('wallet balances round-trip through the URL format', () => {
  const b = [{ programId: 'aeroplan', amount: 90000 }, { programId: 'virgin', amount: 60000 }];
  assert.deepEqual(parseBalances(formatBalances(b)), b);
  assert.deepEqual(parseBalances('nope:5,aeroplan:-1,united:abc'), []);
});

test('heatmap shades cheapest day darkest and caps outliers', () => {
  const dates = dateRange('2026-12-01', 7);
  const list = awards([
    { date: '2026-12-01', miles: 60000 },
    { date: '2026-12-01', miles: 55000 },
    { date: '2026-12-02', miles: 70000 },
    { date: '2026-12-03', miles: 80000 },
    { date: '2026-12-04', miles: 400000 },
  ]);
  const days = heatmapDays(list, dates);
  assert.equal(days[0].best.miles, 55000);
  assert.equal(days[0].level, 0);
  assert.equal(days[3].level, HEAT_LEVELS - 1);
  assert.ok(days[1].level > 0 && days[1].level < days[2].level, 'the outlier does not flatten the rest');
  assert.equal(days[5].best, null);
});

test('explore picks one award per destination', () => {
  const list = awards([
    { to: 'LHR', miles: 70000 },
    { to: 'LHR', miles: 60000, date: '2026-12-02' },
    { to: 'CDG', miles: 65000 },
    { to: 'CDG', miles: 50000, cabin: 'economy' },
  ]);
  const rows = bestPerDestination(list, 'business', 'miles');
  assert.equal(rows.length, 2);
  assert.equal(rows.find((r) => r.award.to === 'LHR').award.miles, 60000);
  assert.equal(rows.find((r) => r.award.to === 'LHR').dateCount, 2);
});

test('program stats summarise counts and medians', () => {
  const s = programStats(awards([{ miles: 60000 }, { miles: 80000 }, { miles: 70000, to: 'CDG' }]));
  assert.equal(s.count, 3);
  assert.equal(s.destinations, 2);
  assert.equal(s.medianByCabin.business, 70000);
  assert.equal(s.medianByCabin.first, null);
});

test('home value example contrasts a cheaper-in-miles award with a better-value one', async () => {
  const { valueExample } = await import('../assets/js/pages/home.js');
  const list = awards([
    { programId: 'virgin', airline: 'DL', miles: 50000, taxesUsd: 600 },
    { programId: 'aeroplan', miles: 70000, taxesUsd: 50 },
    { programId: 'aeroplan', miles: 90000, taxesUsd: 50, to: 'CDG' },
  ]);
  const ex = valueExample(list);
  assert.equal(ex.cheaper.programId, 'virgin');
  assert.equal(ex.better.programId, 'aeroplan');
  assert.ok(ex.better.score > ex.cheaper.score && ex.cheaper.miles < ex.better.miles);
  assert.equal(valueExample(awards([{ miles: 60000 }])), null);
});
