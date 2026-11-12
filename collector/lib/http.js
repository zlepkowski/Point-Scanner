import { isAllowed, parseRobots } from './robots.js';

// Statuses that mean "this site doesn't want automated traffic from us".
// The collector stops using a host for the rest of the run instead of
// retrying, rotating identities or otherwise working around the block.
export const BLOCKING_STATUSES = new Set([401, 403, 429, 444]);

export class BlockedError extends Error {
  constructor(host, status) {
    super(`${host} refused automated access (${status})`);
    this.name = 'BlockedError';
    this.host = host;
    this.status = status;
  }
}

export class DisallowedError extends Error {
  constructor(url) {
    super(`robots.txt disallows ${url}`);
    this.name = 'DisallowedError';
    this.url = url;
  }
}

const ALLOW_ALL = [];
const DISALLOW_ALL = [{ agents: ['*'], rules: [{ allow: false, pattern: '/', regex: /^\// }] }];

// A polite HTTP client: identifies itself, checks robots.txt before every
// request, waits at least `minDelayMs` between requests to the same host, and
// treats a block as final for the run.
export function createClient({
  userAgent,
  minDelayMs = 4000,
  timeoutMs = 20000,
  fetchImpl = globalThis.fetch,
  now = () => Date.now(),
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  if (!userAgent) throw new Error('createClient needs a userAgent that identifies the collector');
  const robotsByOrigin = new Map();
  const lastRequestAt = new Map();
  const blockedHosts = new Set();

  async function throttle(host) {
    const last = lastRequestAt.get(host);
    if (last != null) {
      const wait = last + minDelayMs - now();
      if (wait > 0) await sleep(wait);
    }
    lastRequestAt.set(host, now());
  }

  // RFC 9309: a 4xx robots.txt means no restrictions; 5xx or unreachable
  // means assume everything is disallowed.
  function robotsFor(origin) {
    if (!robotsByOrigin.has(origin)) {
      robotsByOrigin.set(
        origin,
        (async () => {
          try {
            await throttle(new URL(origin).host);
            const res = await fetchImpl(`${origin}/robots.txt`, {
              headers: { 'User-Agent': userAgent },
              signal: AbortSignal.timeout(timeoutMs),
            });
            if (res.ok) return parseRobots(await res.text());
            return res.status >= 400 && res.status < 500 && !BLOCKING_STATUSES.has(res.status) ? ALLOW_ALL : DISALLOW_ALL;
          } catch {
            return DISALLOW_ALL;
          }
        })(),
      );
    }
    return robotsByOrigin.get(origin);
  }

  async function request(url, init = {}) {
    const u = new URL(url);
    if (blockedHosts.has(u.host)) throw new BlockedError(u.host, 'blocked earlier in this run');
    const groups = await robotsFor(u.origin);
    if (!isAllowed(groups, userAgent, u.pathname + u.search)) throw new DisallowedError(url);
    await throttle(u.host);
    const res = await fetchImpl(url, {
      ...init,
      headers: { 'User-Agent': userAgent, Accept: 'application/json', ...init.headers },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (BLOCKING_STATUSES.has(res.status)) {
      blockedHosts.add(u.host);
      throw new BlockedError(u.host, res.status);
    }
    return res;
  }

  async function json(url, init) {
    const res = await request(url, init);
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return res.json();
  }

  return { request, json, isBlocked: (host) => blockedHosts.has(host) };
}
