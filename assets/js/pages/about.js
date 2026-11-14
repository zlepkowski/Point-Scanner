import { getSource, loadAwardsFromJson, resetToSynthetic } from '../data/store.js';
import { WINDOW_DAYS, buildRoutes } from '../data/awards.js';
import { PROGRAMS } from '../data/programs.js';
import { AIRPORTS } from '../data/airports.js';
import { CARRIER_PREMIUM, CASH_FLOOR, CASH_PER_KM, SWEET_SPOT_THRESHOLD } from '../util/cpm.js';
import { MAX_CONNECT_MINUTES, MAX_DETOUR_RATIO, MIN_CONNECT_MINUTES } from '../data/connections.js';
import { REPO_URL } from '../components/header.js';
import { announce, esc, mount } from '../util/dom.js';
import { CABINS, CABIN_SHORT, fmtDateTime, fmtNumber, plural } from '../util/format.js';
import { programName } from '../data/programs.js';

const EXAMPLE_RECORD = `{
  "from": "JFK",
  "to": "LHR",
  "date": "2026-12-03",
  "departTime": "18:30",
  "cabin": "business",
  "miles": 60000,
  "taxesUsd": 86.4,
  "programId": "aeroplan",
  "airline": "AC",
  "flightNo": "AC123",
  "distanceKm": 5540,
  "durationHours": 7.3,
  "stops": 0,
  "seats": 2
}`;

const SOURCE_LABEL = {
  ok: 'collected',
  blocked: 'blocked automated access, skipped',
  disallowed: "robots.txt doesn't allow it, skipped",
  failing: 'errors, skipped',
};

function sourceStatusHtml() {
  const s = getSource();
  if (!s) return '';
  return `
    <div class="rounded-lg bg-ink-100 p-3 text-sm">
      <p><span class="font-semibold text-ink-900">Current data:</span> ${esc(s.label)} · ${plural(s.count, 'award')}${
        s.generatedAt ? ` · collected ${esc(fmtDateTime(s.generatedAt))}` : ''
      }</p>
      ${
        s.sources?.length
          ? `<ul class="mt-2 space-y-0.5 text-ink-700">${s.sources
              .map((p) => `<li><span class="font-semibold">${esc(programName(p.programId))}:</span> ${esc(SOURCE_LABEL[p.status])}${
                p.status === 'ok' ? `, ${plural(p.awards, 'award')}` : ''
              }${p.detail && p.status !== 'ok' ? ` (${esc(p.detail)})` : ''}</li>`)
              .join('')}</ul>`
          : ''
      }
      ${s.warnings?.length ? `<ul class="mt-2 list-disc space-y-0.5 pl-5 text-ink-700">${s.warnings.map((w) => `<li>${esc(w.trim())}</li>`).join('')}</ul>` : ''}
    </div>`;
}

const section = (id, title, body) => `
  <section aria-labelledby="${id}" class="card p-5 sm:p-6">
    <h2 id="${id}" class="mb-3 text-xl font-semibold text-ink-900">${title}</h2>
    <div class="space-y-3 text-ink-700">${body}</div>
  </section>`;

export function render(root) {
  const rate = CABINS.map((c) => `<li>${CABIN_SHORT[c]}: $${CASH_PER_KM[c]}/km, minimum $${fmtNumber(CASH_FLOOR[c])}</li>`).join('');
  const premiums = Object.entries(CARRIER_PREMIUM).map(([k, v]) => `${k} ×${v}`).join(', ');

  mount(
    root,
    `
    <div class="mb-6">
      <h1 tabindex="-1" class="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">About &amp; methodology</h1>
      <p class="mt-1 max-w-2xl text-ink-600">How Pointscanner finds and scores award seats, how to use your own data, and what it does (and doesn't do) with your information.</p>
    </div>
    <div class="max-w-4xl space-y-6">
      ${section(
        'about-data',
        'Where the data comes from',
        `<p><strong>The bundled inventory is synthetic.</strong> A deterministic generator builds about ${fmtNumber(Math.round(buildRoutes().length / 100) * 100)} routes between ${AIRPORTS.length} airports,
          picks carriers by hub, programs by partnership, and prices each seat from a distance-based award chart with day-of-week, holiday and
          program-specific adjustments. It covers the next ${WINDOW_DAYS} days. The same flight on the same date looks the same every time you load
          the page; a small daily "churn" removes and adds some space, the way real inventory moves.</p>
         <p>It is realistic enough to explore the tool with, but it is not live availability. Always confirm on the program's own site before
          transferring points; transfers are usually irreversible.</p>`,
      )}
      ${section(
        'about-own-data',
        'Use your own award data',
        `<p>Pointscanner reads one array of award records. Any source that can produce this shape works:</p>
         <pre class="overflow-x-auto rounded-lg bg-ink-100 p-3 text-xs text-ink-800"><code>${esc(EXAMPLE_RECORD)}</code></pre>
         <p><code class="font-mono text-sm">programId</code> must be one of: ${PROGRAMS.map((p) => `<code class="font-mono text-xs">${p.id}</code>`).join(', ')}.
          <code class="font-mono text-sm">departTime</code>, <code class="font-mono text-sm">durationHours</code>, <code class="font-mono text-sm">stops</code> and
          <code class="font-mono text-sm">seats</code> are optional. The file may be a bare array or <code class="font-mono text-sm">{ "awards": [...] }</code>.
          Invalid or past-dated records are skipped and reported below.</p>
         <ol class="list-decimal space-y-1 pl-5">
          <li><strong>Hosted:</strong> set <code class="font-mono text-sm">data-awards-url="awards.json"</code> on the bundle's script tag in <code class="font-mono text-sm">index.html</code>.</li>
          <li><strong>Opened from disk:</strong> browsers block <code class="font-mono text-sm">fetch</code> on <code class="font-mono text-sm">file://</code>, so instead add a script before the bundle that sets <code class="font-mono text-sm">window.POINTSCANNER_AWARDS = [...]</code>.</li>
          <li><strong>Just this tab:</strong> load a file here. It stays in memory and is gone when you close the tab.</li>
         </ol>
         <div class="flex flex-wrap items-center gap-3">
           <label class="btn btn-primary cursor-pointer">Load award file…<input type="file" accept=".json,application/json" class="sr-only" data-load-file /></label>
           <button type="button" class="btn" data-reset-data>Use synthetic data</button>
         </div>
         <div id="source-status">${sourceStatusHtml()}</div>`,
      )}
      ${section(
        'about-score',
        'How the deal score works',
        `<p>Points from different programs aren't worth the same, so comparing 60,000 of one with 75,000 of another tells you nothing.
          Pointscanner prices every award in cents per point against an estimated cash fare, then divides by the program's baseline value:</p>
         <pre class="overflow-x-auto rounded-lg bg-ink-100 p-3 text-xs text-ink-800"><code>cash      = max(floor[cabin], rate[cabin] × distance_km) × carrier_premium
cpm       = max($40, cash − taxes) × 100 ÷ miles
score     = cpm ÷ baseline_cpm[program]
sweet spot: score ≥ ${SWEET_SPOT_THRESHOLD}×</code></pre>
         <ul class="list-disc space-y-0.5 pl-5">${rate}</ul>
         <p>Premium cabins on some carriers are worth more than others (${esc(premiums)}); short-haul business within one region counts at 70%.
          The model is deliberately coarse. It ignores seasonality in cash fares and route-specific quirks, so treat the score as
          "beats this program's usual value", not as a fare prediction.</p>`,
      )}
      ${section(
        'about-connections',
        'Connecting itineraries',
        `<p>When a route has no direct award in your cabin for a given date and program, Pointscanner stitches two awards from the same
          program through a connection point, allowing ${MIN_CONNECT_MINUTES} minutes to ${MAX_CONNECT_MINUTES / 60} hours between flights and
          at most a ${Math.round((MAX_DETOUR_RATIO - 1) * 100)}% detour. Prices are the sum of the two awards. If the legs are in different cabins the itinerary is flagged as
          <em>mixed cabin</em> with the share of distance flown in the cabin you asked for. Nothing is averaged away.</p>`,
      )}
      ${section(
        'about-privacy',
        'Privacy',
        `<p>No account, no cookies, no analytics, no ads and no third-party requests: fonts and styles are served with the site, and
          searches run entirely in your browser. Saved routes, wallet balances and your theme stay in this browser's
          <code class="font-mono text-sm">localStorage</code>. Details, plus export and delete buttons, are on the
          <a class="link" href="#/privacy">privacy page</a>.</p>`,
      )}
      ${section(
        'about-license',
        'License',
        `<p>MIT. Source, issues and contributions on <a class="link" href="${REPO_URL}" target="_blank" rel="noopener noreferrer">GitHub</a>.</p>`,
      )}
    </div>`,
  );

  const status = root.querySelector('#source-status');
  root.querySelector('[data-load-file]').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = loadAwardsFromJson(JSON.parse(await file.text()), file.name);
      if (!result.ok) {
        status.innerHTML = `<p class="rounded-lg bg-bad-100 p-3 text-sm text-bad-800" role="alert">No usable awards in ${esc(file.name)}. ${esc(result.warnings.join(' '))}</p>`;
        return;
      }
      announce(`Loaded ${file.name}`);
    } catch (err) {
      status.innerHTML = `<p class="rounded-lg bg-bad-100 p-3 text-sm text-bad-800" role="alert">${esc(file.name)} isn't valid JSON: ${esc(err.message)}</p>`;
    }
  });
  root.querySelector('[data-reset-data]').addEventListener('click', () => {
    resetToSynthetic();
    announce('Using synthetic data');
  });
}
