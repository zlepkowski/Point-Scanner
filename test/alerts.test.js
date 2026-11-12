import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  addSaved, diffSnapshots, evaluateSaved, isNoteworthy, listSaved, markSeen, removeSaved, setTarget, snapshotRoute,
} from '../assets/js/data/alerts.js';
import { awards, memoryStorage } from './helpers.js';

beforeEach(() => {
  globalThis.localStorage = memoryStorage();
});

const TODAY = '2026-12-01';

test('snapshot keeps the cheapest miles per program per date and respects cabin/program', () => {
  const list = awards([
    { date: '2026-12-02', miles: 70000 },
    { date: '2026-12-02', miles: 60000 },
    { date: '2026-12-02', miles: 50000, programId: 'united', airline: 'UA' },
    { date: '2026-12-03', miles: 30000, cabin: 'economy' },
  ]);
  assert.deepEqual(snapshotRoute(list, { cabin: 'business' }), { '2026-12-02': { aeroplan: 60000, united: 50000 } });
  assert.deepEqual(snapshotRoute(list, { cabin: 'business', programId: 'united' }), { '2026-12-02': { united: 50000 } });
  assert.equal(Object.keys(snapshotRoute(list, { cabin: 'any' })).length, 2);
});

test('diff reports opened, closed, drops, new lows and target hits', () => {
  const prev = { '2026-11-30': { aeroplan: 1 }, '2026-12-02': { aeroplan: 70000 }, '2026-12-04': { aeroplan: 80000 } };
  const curr = { '2026-12-02': { aeroplan: 55000 }, '2026-12-05': { aeroplan: 90000 } };
  const d = diffSnapshots(prev, curr, TODAY, 60000);
  assert.deepEqual(d.opened, ['2026-12-05']);
  assert.deepEqual(d.closed, ['2026-12-04']);
  assert.deepEqual(d.drops, [{ date: '2026-12-02', programId: 'aeroplan', from: 70000, to: 55000 }]);
  assert.deepEqual(d.targetHits, [{ date: '2026-12-02', miles: 55000 }]);
  assert.equal(d.prevLow, 70000, 'past dates are ignored');
  assert.equal(d.newLow, true);
  assert.ok(isNoteworthy(d));
});

test('an unchanged route is not noteworthy', () => {
  const snap = { '2026-12-02': { aeroplan: 60000 } };
  assert.equal(isNoteworthy(diffSnapshots(snap, snap, TODAY)), false);
});

test('saved routes persist, evaluate, can be marked seen and removed', () => {
  const before = awards([{ date: '2026-12-02', miles: 70000 }]);
  const entry = addSaved({ from: 'JFK', to: 'LHR', cabin: 'business' }, before);
  assert.equal(listSaved().length, 1);

  const after = awards([{ date: '2026-12-02', miles: 60000 }, { date: '2026-12-09', miles: 65000 }]);
  const [result] = evaluateSaved(() => after, TODAY);
  assert.equal(result.noteworthy, true);
  assert.deepEqual(result.diff.opened, ['2026-12-09']);

  markSeen(entry.id, after);
  assert.equal(evaluateSaved(() => after, TODAY)[0].noteworthy, false);

  setTarget(entry.id, 50000);
  assert.equal(listSaved()[0].targetMiles, 50000);

  removeSaved(entry.id);
  assert.equal(listSaved().length, 0);
});

test('a broken or missing localStorage degrades to nothing saved', () => {
  globalThis.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.deepEqual(listSaved(), []);
  assert.doesNotThrow(() => addSaved({ from: 'JFK', to: 'LHR', cabin: 'business' }, []));
  delete globalThis.localStorage;
  assert.deepEqual(listSaved(), []);
});
