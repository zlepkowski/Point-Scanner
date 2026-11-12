# Pointscanner — handoff

Context for the next contributor (human or agent). The README covers usage;
this covers how it works, why it is the way it is, and what's left.

## Status

A complete static single-page app, rebuilt from the original prototype's
spec and extended. The award inventory is **synthetic** (deterministic
generator). Real data plugs in through one documented JSON shape; see
README → *Use your own data*.

Constraints that shaped everything:

- No backend, no account, no tracking. Static files only.
- Must work when `index.html` is double-clicked (`file://`), so the ES module
  source is bundled into a classic script by `build.mjs`.
- No `npm install` to edit or run. Node is only needed to rebuild and test.

## Architecture

```
main.js ── loadAwards() ──► data/store.js  (array + indexes byFrom/byRoute/byProgram,
   │                         derived cpm/score/sweet per award)
   └─ Router (hash) ──► pages/*.render(root, { query, router }) → cleanup()
```

- **Pages** render HTML strings into `#main` and bind delegated listeners;
  they return a cleanup function. State lives in the URL hash. Pages call
  `router.replaceQuery()` for in-page changes, which updates the hash without
  re-rendering or adding a history entry (`location.replace`).
- **Data** is synchronous after boot: `main.js` awaits `loadAwards()` once,
  then every view reads the in-memory store. `onDataChange` re-renders the
  current page when data is swapped (About → load file).
- **Colours** are CSS variables in `assets/css/styles.css`; Tailwind's config in
  `index.html` only references them. Dark mode swaps variable values under
  `[data-theme="dark"]`. The inline head script and `util/theme.js` always
  resolve "system" to `light`/`dark`, so there's a single dark definition.
  Use `ink-*` (neutrals), `brand-*`, `accent-*` (sweet spots), `good-*`/`bad-*`
  (alert deltas). Avoid `bg-white`/`text-black`; they don't flip.
- **Bundler** (`build.mjs`): rewrites named/namespace imports and `export`
  declarations into a lazy `__require` registry inside one IIFE. Rejects
  default exports, re-exports, dynamic import and cycles on purpose.

## Data model

```ts
type Award = {
  id: number; from: string; to: string;          // IATA
  distanceKm: number; durationHours: number | null;
  date: string;                                  // YYYY-MM-DD
  departTime: string | null;                     // HH:MM local, optional
  cabin: 'economy' | 'premium' | 'business' | 'first';
  miles: number; taxesUsd: number;
  airline: string; flightNo: string;
  programId: string;                             // key in data/programs.js
  stops: number; seats: number;
  // derived at load (not input): cpm, score, sweet
};
```

`departTime` was added to the original shape so connections can check
layovers; records without it fall back to same/next-day matching.

## Key algorithms

**Generator** (`data/awards.js`). Routes: all airport pairs 200–12,000 km
where either end is a focus hub or both share a region (~2,400). Carriers:
any airline with a hub at either end (nonstop), plus up to 2–3 connecting
carriers via a hub within a detour limit. For each route × date over 60 days:

- *Base layer* seeded by `route|date`: 3 slots, each present with probability
  `0.45 × routeWeight × bucketAvailability` (lower in peak periods). Carrier,
  partner program (own program ×3), cabin by distance bucket (first only on
  carriers that sell it), price from `BASE_MILES[bucket][cabin] × program
  multiplier × day-of-week × peak × jitter` (dynamic programs swing wider;
  12% of fixed-chart awards are "anytime" at ×1.6), taxes from distance, UK
  APD on LHR long-haul departures and carrier surcharges (except programs
  that don't pass them on).
- *Churn layer* seeded by `route|date|today`: drops ~5%, adds a little,
  plus close-in business releases within 14 days. About 81–85% of a date's
  awards survive from one day to the next, which is what makes saved-route
  alerts meaningful with synthetic data.

Result: ~65k awards, ~250 ms to generate in a browser.

**Deal score** (`util/cpm.js`): see README. Tuned so ~5% of awards are sweet
spots (score ≥ 1.8) and >60% of those are business/first. Carrier premium
multipliers for standout premium products; short-haul intra-region business
counts at 70%. Tests pin the share.

**Connections** (`data/connections.js`): for each first leg from the origin
in an allowed program and date, find a second leg to the destination in the
**same program**, same or next day, 60 min – 20 h layover (time-zone aware via
airport UTC offsets), total distance ≤ 1.3× direct. Only for date+program
pairs with no direct award in the requested cabins. The longer leg must be
in a requested cabin; a different-cabin shorter leg is flagged "mixed" with
the share of distance in the headline cabin. Miles are the sum of two awards.

**Calendar** (`pages/calendar.js`): cheapest award per day; shade is linear
from the cheapest day to the 85th-percentile day (outliers clamp to the
lightest) across 8 steps of a sequential blue ramp. The ramp flips in dark
mode so the cheapest day is always the most salient. Every shade passes WCAG
AA for its label colour.

**Alerts** (`data/alerts.js`): a saved route stores a snapshot
`{date: {programId: cheapestMiles}}`. On each visit the current snapshot is
diffed: opened dates, closed dates, per-program price drops, new overall low,
and dates newly at or under an optional target. "Mark as seen" re-snapshots.

**Wallet** (`data/wallet.js`): per balance, awards with `miles ≤ balance`
(optionally from an origin/cabins), ranked by score; "stretch" awards within
15% above the balance.

## Testing

`npm test` runs `node:test` suites over the generator (determinism, shape,
route/partner/cabin rules, day-to-day stability), deal score, filters and
URL round-trips, connections, alerts, wallet, validation and loading, the
heatmap scale, and the bundle (fresh + valid classic script). CI runs them
on Node 20 and 22 and fails if `dist/` is stale.

UI behaviour was verified in Chromium with Playwright (search, sort,
pagination, filters without history spam, save → alert → mark seen, calendar
tooltip + arrow keys, theme persistence, JSON hook over http and from the
About page, mobile menu) and axe-core reports no violations on any page in
either theme. Those scripts aren't in the repo (they need Playwright, which
would break the no-install rule).

## Known caveats

1. Synthetic data. Partner lists are simplified; program names and colours
   are for identification only.
2. Tailwind Play CDN: brief unstyled flash on first load and a dependency on
   the CDN. `styles.css` covers base colours and primitives so the page
   degrades to readable without it.
3. Bundle is ~180 KB unminified; generation takes ~250 ms on a laptop. Fine
   for now; minification or a precomputed dataset would help on low-end phones.
4. Hash routing only.
5. Connections price as two separate awards; real programs often price a
   through-itinerary differently (usually cheaper).
6. Time zones are fixed standard-time offsets (no DST).

## Next steps (by impact)

1. Real data source (keep the Award shape; `normalizeAwards` already validates).
2. Bank transferable currencies in Wallet (Amex MR, Chase UR, …) with
   transfer ratios, clearly dated since partners change.
3. Precompute/serialize the synthetic set, or move generation to a Web Worker,
   to cut startup time on slow devices.
4. Round-trip search (outbound + return pairs).
5. i18n: formatters already use `Intl`; UI copy needs extraction.
