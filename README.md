# Pointscanner

A free, open-source award-flight finder. Pointscanner compares award space
across 20 loyalty programs and scores every seat against what those points are
normally worth, so you can tell a genuinely good redemption from a merely
cheap one.

- **No account, no email, no tracking, no ads.** No backend at all.
- **Works from a double-click.** Download the repo, open `index.html`. No
  server, no install.
- **Editable without `npm install`.** Plain ES modules, zero dependencies.

> **The bundled award data is synthetic.** It's generated to be realistic,
> not scraped. See [Use your own data](#use-your-own-data) to plug in a real
> source. Always confirm on the program's site before transferring points.

## What's in it

| Page | What it does |
| --- | --- |
| **Home** | Quick search, today's sweet spots, best premium-cabin picks per region |
| **Search** | Airports, cities or whole regions (`JFK`, `Tokyo`, `Europe`, `JFK, EWR`). Filters for cabin, dates, price, taxes, seats, nonstop, programs and sweet spots. Sortable, paginated table. **Connecting itineraries** stitched from two awards in the same program, with mixed cabins flagged |
| **Explore** | The best award to every destination from your home airport, grouped by region |
| **Calendar** | 60-day heatmap of the cheapest award per day on a route, with hover/focus tooltips (flight, program, taxes, seats) and keyboard navigation |
| **Wallet** | "I have X points in program Y — what can I fly?" Ranked by value, with near misses |
| **Saved** | Save routes; each visit shows new dates, price drops, new lows and anything under your target. Stored in `localStorage` only |
| **Programs** | Every program with its baseline value, coverage, median prices and best current deal |
| **About** | Methodology, data format, privacy |

Every view's state lives in the URL hash, so any search can be shared as a
link. Light and dark themes follow the system or a manual toggle.

### The deal score

```
cash  = max(floor[cabin], rate[cabin] × distance_km) × carrier_premium
cpm   = max($40, cash − taxes) × 100 ÷ miles
score = cpm ÷ baseline_cpm[program]        sweet spot: score ≥ 1.8×
```

60,000 Aeroplan points and 75,000 United miles aren't comparable until you
divide by what each currency is normally worth. The score does that. It's a
coarse model, documented on the About page and pinned by tests.

## Use it

```bash
open index.html            # macOS; or just double-click it
```

## Develop

Requires Node 20+ for the build and tests only. The site itself has no
runtime dependencies and makes no third-party requests.

```bash
node build.mjs             # bundle assets/js → dist/pointscanner.js and
                           # compile Tailwind → dist/pointscanner.css
node build.mjs --watch     # rebuild on change
node build.mjs --check     # fail if either committed file is stale
npm test                   # unit tests (node:test, no packages)
python3 -m http.server 8080
```

`dist/` is committed so the double-click workflow keeps working, and CI
fails if you forget to rebuild. The CSS step runs a pinned Tailwind CLI
through `npx` (fetched on first use, nothing added to the repo); offline, the
JS still builds and the CSS step is skipped with a warning.

UI, copy and data-handling changes follow
[docs/DESIGN_GUIDELINES.md](docs/DESIGN_GUIDELINES.md); the latest audit
against it is [docs/DESIGN_AUDIT.md](docs/DESIGN_AUDIT.md).

### Layout

```
index.html                 shell: theme bootstrap, styles, bundle
build.mjs                  bundler (ES modules → one IIFE) + Tailwind compile
tailwind.config.cjs        Tailwind theme (references the CSS variables)
dist/                      committed bundle and compiled CSS
assets/css/styles.css      design tokens (colour, space, radius, motion), primitives
assets/fonts/              self-hosted Inter + JetBrains Mono (OFL)
assets/js/
  main.js                  router bootstrap, data loading
  util/                    rand, geo, date, format, cpm, dom, router, storage, theme
  data/                    airports, airlines, programs, awards (generator),
                           store (loading + indexes), validate, connections,
                           alerts (saved routes), wallet
  components/              header, awardCard, awardTable, filters, pager,
                           cabinChips, airportSelect, badges, connectionList
  pages/                   home, search, explore, calendar, wallet, saved,
                           programs, about, privacy, terms
collector/                 polite award collector (work in progress)
test/                      node:test suites
docs/HANDOFF.md            architecture and decisions, for the next contributor
```

## Use your own data

Everything reads one array of award records:

```json
{
  "from": "JFK", "to": "LHR", "date": "2026-12-03", "departTime": "18:30",
  "cabin": "business", "miles": 60000, "taxesUsd": 86.4,
  "programId": "aeroplan", "airline": "AC", "flightNo": "AC123",
  "distanceKm": 5540, "durationHours": 7.3, "stops": 0, "seats": 2
}
```

`programId` must match a key in `assets/js/data/programs.js`. Supply the array
(or `{ "awards": [...] }`) in one of three ways:

1. **Hosted:** put `awards.json` next to `index.html` and set
   `data-awards-url="awards.json"` on the bundle's `<script>` tag.
2. **From disk:** browsers block `fetch` on `file://`, so add a script before
   the bundle that sets `window.POINTSCANNER_AWARDS = [...]`.
3. **One-off:** load a file on the About page (kept in memory for that tab).

Invalid and past-dated records are skipped with a reason; if nothing usable
loads, the synthetic data is used and a warning is logged.

A first-pass collector for loyalty-program websites (`node collector/run.js`)
writes this file; it's a work in progress, see [docs/LIVE_DATA.md](docs/LIVE_DATA.md).

## Deploy

`.github/workflows/pages.yml` publishes to GitHub Pages on every push to
`main`. Enable it once under **Settings → Pages → Source: GitHub Actions**.

## Privacy

No cookies, analytics, server or third-party requests: fonts (Inter, JetBrains
Mono) are self-hosted and Tailwind is compiled into `dist/pointscanner.css`.
Saved routes, wallet balances and theme are stored in your browser under
`pointscanner:*` keys; the in-app Privacy page lists them and can export or
delete them. Legal pages are drafts pending review (see
[docs/DESIGN_AUDIT.md](docs/DESIGN_AUDIT.md)).

## License

[MIT](LICENSE)
