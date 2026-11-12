#!/usr/bin/env node
// Collects award availability from program websites into an awards.json the
// site can load (see README → Use your own data).
//
//   node collector/run.js --dry-run            show the request plan only
//   node collector/run.js --out awards.json    run every enabled adapter
//   node collector/run.js --adapters aa        run only the named adapters
//
// One program blocking us, or its robots.txt disallowing a path, stops that
// adapter for the run; the others carry on. The output always lists every
// adapter's outcome under `sources` so partial runs are visible.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ADAPTERS } from './adapters/index.js';
import { CONFIG } from './config.js';
import { BlockedError, DisallowedError, createClient } from './lib/http.js';
import { normalizeAwards } from '../assets/js/data/validate.js';
import { addDays, todayIso } from '../assets/js/util/date.js';

export function plan({ adapters, routes, daysAhead, dateStep, today }) {
  const dates = [];
  for (let d = 0; d < daysAhead; d += dateStep) dates.push(addDays(today, d));
  return adapters.flatMap((adapter) =>
    routes.flatMap((route) => dates.map((date) => ({ adapter, query: { from: route.from, to: route.to, date } }))),
  );
}

export async function collect({ adapters, routes, daysAhead, dateStep, today, client, maxErrorsPerAdapter = 5, log = () => {} }) {
  const collected = [];
  const sources = [];
  for (const adapter of adapters) {
    const report = { adapter: adapter.id, programId: adapter.programId, searches: 0, awards: 0, errors: 0, status: 'ok', detail: null };
    for (const { query } of plan({ adapters: [adapter], routes, daysAhead, dateStep, today })) {
      report.searches++;
      try {
        const found = await adapter.search(query, client);
        collected.push(...found);
        report.awards += found.length;
      } catch (err) {
        report.detail = err.message;
        if (err instanceof BlockedError || err instanceof DisallowedError) {
          report.status = err instanceof BlockedError ? 'blocked' : 'disallowed';
          break;
        }
        report.errors++;
        if (report.errors >= maxErrorsPerAdapter) {
          report.status = 'failing';
          break;
        }
      }
    }
    log(`${adapter.id}: ${report.status}, ${report.awards} awards from ${report.searches} searches${report.detail ? ` (${report.detail})` : ''}`);
    sources.push(report);
  }
  const { awards, warnings } = normalizeAwards(collected, { today });
  return { generatedAt: new Date().toISOString(), sources, warnings, awards };
}

function parseArgs(argv) {
  const args = { out: 'awards.json', dryRun: false, adapters: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dry-run') args.dryRun = true;
    else if (argv[i] === '--out') args.out = argv[++i];
    else if (argv[i] === '--adapters') args.adapters = argv[++i].split(',');
    else throw new Error(`unknown argument ${argv[i]}`);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const adapters = args.adapters ? ADAPTERS.filter((a) => args.adapters.includes(a.id)) : ADAPTERS;
  const today = todayIso();
  const steps = plan({ adapters, routes: CONFIG.routes, daysAhead: CONFIG.daysAhead, dateStep: CONFIG.dateStep, today });

  if (!adapters.length) {
    console.log('No adapters enabled yet. See docs/LIVE_DATA.md.');
    return;
  }
  const minutes = Math.ceil((steps.length * CONFIG.minDelayMs) / 60000);
  console.log(`${steps.length} searches across ${adapters.length} adapter(s); at least ~${minutes} min at ${CONFIG.minDelayMs} ms per host.`);
  if (args.dryRun) return;

  const client = createClient({ userAgent: CONFIG.userAgent, minDelayMs: CONFIG.minDelayMs, timeoutMs: CONFIG.timeoutMs });
  const result = await collect({ ...CONFIG, adapters, today, client, log: console.log });
  writeFileSync(args.out, JSON.stringify(result));
  console.log(`wrote ${args.out}: ${result.awards.length} awards`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
}
