import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAllowed, parseRobots } from '../collector/lib/robots.js';
import { BlockedError, DisallowedError, createClient } from '../collector/lib/http.js';
import { toAward } from '../collector/lib/award.js';
import { collect, plan } from '../collector/run.js';

const UA = 'PointscannerBot/0.1 (+https://example.test)';

// Excerpts of real robots.txt rules seen on program sites in November 2026.
const ALASKA = `
User-agent: *
User-agent: GPTBot
Allow: /
Disallow: /shopping/
Allow: /search/$
Disallow: /search/results?
Disallow: /search/calendar?
`;
const AIRFRANCE = `
User-agent: *
Disallow: /*/search
Disallow: /search
Disallow: /*/flight-status
Disallow: /flight-status
Allow: /*/flight-status$
Allow : /flight-status$
`;

test('robots: longest match wins, Allow wins ties, $ anchors and * wildcards work', () => {
  const alaska = parseRobots(ALASKA);
  assert.equal(isAllowed(alaska, UA, '/search/'), true);
  assert.equal(isAllowed(alaska, UA, '/search/results?O=JFK&D=LHR'), false);
  assert.equal(isAllowed(alaska, UA, '/shopping/flights'), false);
  assert.equal(isAllowed(alaska, UA, '/content/deals'), true);

  const af = parseRobots(AIRFRANCE);
  assert.equal(isAllowed(af, UA, '/en/search/offers'), false);
  assert.equal(isAllowed(af, UA, '/flight-status'), true);
  assert.equal(isAllowed(af, UA, '/flight-status/AF22'), false);
  assert.equal(isAllowed(af, UA, '/robots.txt'), true);
});

test('robots: a group naming our product token beats the * group', () => {
  const groups = parseRobots('User-agent: *\nDisallow: /\n\nUser-agent: PointscannerBot\nAllow: /api/\nDisallow: /');
  assert.equal(isAllowed(groups, UA, '/api/search'), true);
  assert.equal(isAllowed(groups, UA, '/other'), false);
  assert.equal(isAllowed(groups, 'SomeoneElse/1.0', '/api/search'), false);
});

test('robots: empty Disallow means no restriction', () => {
  assert.equal(isAllowed(parseRobots('User-agent: *\nDisallow:'), UA, '/anything'), true);
});

function fakeSite(routes) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, ua: init?.headers?.['User-Agent'] });
    const path = new URL(url).pathname;
    const handler = routes[path];
    if (!handler) return new Response('not found', { status: 404 });
    return typeof handler === 'function' ? handler() : new Response(handler.body ?? '', { status: handler.status ?? 200 });
  };
  return { fetchImpl, calls };
}

function fakeClock() {
  let t = 0;
  const waits = [];
  return { now: () => t, sleep: async (ms) => { waits.push(ms); t += ms; }, waits };
}

test('client identifies itself, honours robots.txt and spaces out requests', async () => {
  const site = fakeSite({ '/robots.txt': { body: 'User-agent: *\nDisallow: /private' }, '/api/search': { body: '{"ok":true}' } });
  const clock = fakeClock();
  const client = createClient({ userAgent: UA, minDelayMs: 4000, fetchImpl: site.fetchImpl, ...clock });

  assert.deepEqual(await client.json('https://air.test/api/search'), { ok: true });
  await client.json('https://air.test/api/search');
  await assert.rejects(client.request('https://air.test/private/x'), DisallowedError);

  assert.ok(site.calls.every((c) => c.ua === UA));
  assert.equal(site.calls.filter((c) => c.url.endsWith('/robots.txt')).length, 1, 'robots.txt is cached per origin');
  assert.ok(clock.waits.every((w) => w <= 4000) && clock.waits.length >= 2, `waits ${clock.waits}`);
});

test('client stops using a host once it blocks us', async () => {
  const site = fakeSite({ '/robots.txt': { status: 404 }, '/api/search': { status: 403 } });
  const client = createClient({ userAgent: UA, minDelayMs: 0, fetchImpl: site.fetchImpl });
  await assert.rejects(client.request('https://air.test/api/search'), BlockedError);
  const before = site.calls.length;
  await assert.rejects(client.request('https://air.test/api/search'), BlockedError);
  assert.equal(site.calls.length, before, 'no further requests after a block');
  assert.ok(client.isBlocked('air.test'));
});

test('an unreachable or erroring robots.txt counts as disallow-all', async () => {
  const site = fakeSite({ '/robots.txt': { status: 503 }, '/api/search': { body: '{}' } });
  const client = createClient({ userAgent: UA, minDelayMs: 0, fetchImpl: site.fetchImpl });
  await assert.rejects(client.request('https://air.test/api/search'), DisallowedError);
});

test('client refuses to run without an identifying user agent', () => {
  assert.throws(() => createClient({}));
});

test('toAward fills distance and duration from known airports', () => {
  const a = toAward({ from: 'JFK', to: 'LHR', date: '2026-12-01', cabin: 'business', miles: 57500, taxesUsd: 5.6, airline: 'AA', programId: 'aadvantage' });
  assert.ok(Math.abs(a.distanceKm - 5540) < 30);
  assert.ok(a.durationHours > 6);
  assert.equal(toAward({ from: 'XXX', to: 'LHR' }).distanceKm, null);
});

test('collect reports each adapter and keeps going when one is blocked', async () => {
  const good = {
    id: 'good',
    programId: 'aadvantage',
    search: async ({ from, to, date }) => [toAward({ from, to, date, cabin: 'economy', miles: 30000, taxesUsd: 5.6, airline: 'AA', programId: 'aadvantage' })],
  };
  const blocked = { id: 'walled', programId: 'united', search: async () => { throw new BlockedError('united.test', 403); } };
  const flaky = { id: 'flaky', programId: 'delta', search: async () => { throw new Error('bad json'); } };
  const routes = [{ from: 'JFK', to: 'LHR' }];
  const result = await collect({ adapters: [blocked, good, flaky], routes, daysAhead: 3, dateStep: 1, today: '2026-12-01', client: null, maxErrorsPerAdapter: 2 });

  const byId = Object.fromEntries(result.sources.map((s) => [s.adapter, s]));
  assert.equal(byId.walled.status, 'blocked');
  assert.equal(byId.walled.searches, 1, 'stops at the first block');
  assert.equal(byId.good.status, 'ok');
  assert.equal(byId.good.awards, 3);
  assert.equal(byId.flaky.status, 'failing');
  assert.equal(result.awards.length, 3);
  assert.ok(result.generatedAt);
});

test('plan covers every adapter × route × date step', () => {
  const steps = plan({ adapters: [{ id: 'a' }, { id: 'b' }], routes: [{ from: 'JFK', to: 'LHR' }, { from: 'LHR', to: 'JFK' }], daysAhead: 10, dateStep: 2, today: '2026-12-01' });
  assert.equal(steps.length, 2 * 2 * 5);
  assert.equal(steps[1].query.date, '2026-12-03');
});
