## Design & Compliance Audit — Pointscanner — 2026-11-12

Audited against [`DESIGN_GUIDELINES.md`](DESIGN_GUIDELINES.md), then fixed in
the guideline's priority order (legal/accessibility → UX laws → polish →
motion → aesthetics). "Before" is the state at commit `a3ddfe6`; "After" is
this change. Evidence points at the code after the change unless marked
*(before)*.

### Summary

|  | Before | After |
| --- | --- | --- |
| ❌ Fail | 19 | 0 |
| ⚠️ Partial | 18 | 5 |
| ✅ Pass | 27 | 59 |
| N/A | 36 | 36 |

The five remaining partials: three legal pages/details that need the owner's
real information and a lawyer (§1.1, §1.2, §1.16), type sizes not yet
tokenised (§2.5), and the tooltip hiding without an exit animation (§4.12).

### Results

#### §1 Legal & compliance

| § | Item | Before | After | Evidence (file:line) | Fix |
| --- | --- | --- | --- | --- | --- |
| 1.1 | Privacy policy | ⚠️ | ⚠️ | `assets/js/pages/privacy.js:1` | Dedicated Privacy page written from what the code does (no server, no cookies, three localStorage keys, no third parties). Marked DRAFT. Operator details are `[[TODO]]`. Linked from the footer. |
| 1.2 | Terms of service | ❌ | ⚠️ | `assets/js/pages/terms.js:1` | Draft Terms: service description, "verify before transferring" disclaimer, no-affiliation and trademark notice, no warranty, MIT source. Governing law is `[[TODO]]`. No signup, so no acceptance flow. |
| 1.3 | Refund policy | N/A | N/A | — | Nothing is sold. |
| 1.4 | Cookie / storage policy | ⚠️ | ✅ | `assets/js/pages/privacy.js:12` | Storage table lists every key with purpose, category and duration. `test/legal.test.js` fails if code writes a key the table doesn't list. |
| 1.5 | Consent banner | N/A | N/A | — | No non-essential storage or trackers. First-load network check shows zero third-party requests, and the remaining localStorage is functional storage the user asked for. |
| 1.6 | Form consents | N/A | N/A | — | No forms collect personal data. |
| 1.7 | No unnecessary data | ✅ | ✅ | — | Nothing is collected. |
| 1.8 | Third-party SDK audit | ❌ | ✅ | `index.html:29` *(before)*; `assets/css/styles.css:3` | Google Fonts and the Tailwind Play CDN received every visitor's IP. Fonts are now self-hosted (OFL) and Tailwind is compiled into `dist/pointscanner.css`. Verified: zero external requests over `file://` and http. |
| 1.9 | Dark patterns | ✅ | ✅ | `assets/js/pages/privacy.js:104` | None found. Delete asks once to confirm, with an equally visible "Keep my data". |
| 1.10 | Hidden fees | ✅ | ✅ | `assets/js/components/awardCard.js:34` | Taxes and fees are shown next to every price. |
| 1.11 | Fake reviews | ✅ | ✅ | — | None. |
| 1.12 | Unsupported claims | ❌ | ✅ | `assets/js/pages/home.js:95` | "Scans award space" was untrue with demo data. See *Claims removed or rewritten*. |
| 1.13 | Alt text / icon labels | ✅ | ✅ | `assets/js/components/icons.js:15`, `assets/js/pages/calendar.js:84` | Icons are `aria-hidden` next to text. Icon-only buttons have `aria-label`. Heatmap cells carry full text labels, plus a text summary. |
| 1.14 | Colour contrast | ⚠️ | ✅ | `assets/css/styles.css:73`, `assets/js/components/badges.js:8` | Input, select and chip borders were ~1.5:1. They now use a `--field-border` token (≥3.1:1 on every surface, both themes). Dark program swatches got a neutral ring. axe: 0 violations on all 11 views, light and dark. |
| 1.15 | Keyboard navigation | ⚠️ | ✅ | `assets/js/components/header.js:75` | Added Esc and outside-click closing to the mobile menu, with focus returned to the button. Skip link is the first Tab stop. Heatmap arrow keys, visible focus ring and focus to the new heading on navigation were already in place. |
| 1.16 | Business details | ❌ | ⚠️ | `assets/js/components/header.js:141` | Footer and legal pages show `[[TODO]]` placeholders for name, contact and address. Needs owner input. |
| 1.17 | Children | ⚠️ | ✅ | `assets/js/pages/privacy.js` (Children) | States the site isn't directed at children and collects no personal data. No age gate needed. |
| 1.18 | Email unsubscribe | N/A | N/A | — | No email. |
| 1.19 | Font/image licenses | ❌ | ✅ | `CREDITS.md`, `assets/fonts/*-OFL.txt` | Credits every font, tool and mark. No photos are used. |
| 1.20 | Data deletion | ⚠️ | ✅ | `assets/js/pages/privacy.js:104` | In-app "Download my data (JSON)" and "Delete my Pointscanner data" (Pointscanner keys only, tested). |

#### §2 Unslop

| § | Item | Before | After | Evidence | Fix |
| --- | --- | --- | --- | --- | --- |
| 2.1 | Filler badges | ✅ | ✅ | — | Badges carry real state (Demo data, filter count, cabin, deal score). |
| 2.2 | Redundant labels | ✅ | ✅ | — | Placeholders add examples ("Any, e.g. 80k"), not repeats. |
| 2.3 | Random italics | ✅ | ✅ | — | None. |
| 2.4 | Mono only where needed | ⚠️ | ✅ | `assets/js/components/airportSelect.js:21` | Location inputs were forced mono uppercase ("NEW YORK"). Mono is now limited to IATA codes, flight numbers and code. |
| 2.5 | Design system / tokens | ⚠️ | ⚠️ | `assets/css/styles.css:150` | Added space, radius, elevation, motion, control-height and target-size tokens, and moved primitives onto them. Font sizes in primitives (11–14px) are still literals. |
| 2.6 | Show the product | ✅ | ✅ | `assets/js/pages/home.js:125` | The hero is the real search form. The home example is computed from live data. |
| 2.7 | Enlarge the main feature | ✅ | ✅ | — | Headline and search form lead. Card grids are result lists. |
| 2.8 | Group with spacing | ⚠️ | ✅ | `assets/js/pages/home.js` (stats) | Stats lost their four boxes and are grouped by spacing between rules. The boxed three-card section is gone (see 6.16). |
| 2.9 | Specific headlines | ✅ | ✅ | — | "Find the award seats worth your points." |
| 2.10 | One primary CTA | ⚠️ | ✅ | `assets/js/pages/saved.js:81` | Each saved route had a filled "Mark as seen". Now secondary. |
| 2.11 | One accent colour | ⚠️ | ✅ | `assets/css/styles.css:404` | Amber was used for demo data, alert counts and target hits. Now blue = action/focus/active, amber = sweet spots only, green/red = alert deltas. |
| 2.12 | Consistent icons | ❌ | ✅ | `assets/js/components/icons.js:1` | Replaced the ★ ☆ ⇄ ✕ ← → text glyphs with one SVG set (24px grid, 2px stroke). |
| 2.13 | Remove embellishments | ⚠️ | ✅ | `assets/js/components/header.js` | Removed the header's translucent blur. |
| 2.14 | Concentric radii | ✅ | ✅ | — | No flush nested corners; flush children are clipped by the parent radius. |
| 2.15 | Text contrast | ✅ | ✅ | — | Secondary text ≥5.3:1 (tuned earlier). |
| 2.16 | Headline wrapping | ❌ | ✅ | `assets/css/styles.css:192` | `text-wrap: balance` on h1–h3, `pretty` on paragraphs, hero h1 capped at 18ch. |
| 2.17 | Optical alignment | ✅ | ✅ | — | Checked in screenshots; icons are centred with text. |
| 2.18 | Tabular numbers | ✅ | ✅ | `assets/css/styles.css:240` | Extended to every table cell. |
| 2.19 | Loading/empty/error/success | ⚠️ | ✅ | `assets/js/main.js:109`, `assets/js/pages/search.js:181` | Boot failure now offers "Reload the page". A route with no direct space says so instead of "no awards match these filters". |
| 2.20 | Useful feedback motion | ⚠️ | ✅ | `assets/css/styles.css:611` | Saving a route pulses the new "Saved" state once and moves focus to it. |

#### §3 UX laws & animation principles

| § | Item | Before | After | Evidence | Fix |
| --- | --- | --- | --- | --- | --- |
| 3.1 | Squash & stretch | N/A | N/A | — | No toggles or knobs. Buttons compress on press (4.4). |
| 3.2 | Anticipation | N/A | N/A | — | — |
| 3.3 | Staging | ✅ | ✅ | — | One changing element at a time. |
| 3.4 | Pose to pose | ✅ | ✅ | — | State-driven CSS transitions. |
| 3.5 | Follow through | N/A | N/A | — | — |
| 3.6 | Slow in & slow out | ⚠️ | ✅ | `assets/css/styles.css:166` | Default `ease` replaced by ease-out/in-out tokens. |
| 3.7 | Arcs | N/A | N/A | — | — |
| 3.8 | Secondary action | N/A | N/A | — | — |
| 3.9 | Snappy timing | ✅ | ✅ | — | 100–300ms. |
| 3.10 | Exaggerated feedback | ✅ | ✅ | — | Errors are explicit inline alerts. |
| 3.11 | Solid drawing | ✅ | ✅ | `assets/css/styles.css` (`--shadow-*`) | One elevation scale. |
| 3.12 | Appeal | ✅ | ✅ | — | — |
| 3.13 | Fitts's law | ✅ | ✅ | — | "Remove" sits away from "Mark as seen". |
| 3.14 | Hit areas | ❌ | ✅ | `assets/css/styles.css:382`, `:434` | Filter All/None (~16px), sort headers and card links (20px) now meet 24px via `.link-target`. Buttons, chips and inputs are 44px on touch. Verified: no non-inline target under 24×24 on any page. |
| 3.15 | Hick's law | ⚠️ | ✅ | `assets/js/components/filters.js:163` | The 20 program checkboxes are collapsed by default and open when a program filter is active. |
| 3.16 | Miller's law | ✅ | ✅ | — | Seven nav items. |
| 3.17 | Doherty threshold | ✅ | ✅ | — | Filters update immediately; press feedback is instant. |
| 3.18 | Postel's law | ⚠️ | ✅ | `assets/js/util/number.js:4` | Amount fields accept "90k", "75,000", "90 000", "$250" and "1.2m" (tested). |
| 3.19 | Jakob's law | ✅ | ✅ | — | — |
| 3.20 | Frequency of use | ✅ | ✅ | — | Filtering, sorting and paging are instant. Only page changes and rare events animate. |

#### §4 Motion

| § | Item | Before | After | Evidence | Fix |
| --- | --- | --- | --- | --- | --- |
| 4.1 | Ease-out entrances | ❌ | ✅ | `assets/css/styles.css` (`.heat-tooltip`, `.mobile-nav`) | Tooltip and menu enter with ease-out. |
| 4.2 | Dropdowns 150–250ms | ❌ | ✅ | `assets/css/styles.css:585` | Menu 200ms, tooltip 150ms. |
| 4.3 | Stagger list rows | N/A | N/A | — | Results re-render on every filter change; §3.20 says don't animate those. |
| 4.4 | Scale 0.97 on press | ❌ | ✅ | `assets/css/styles.css:295` | Buttons, chips, heatmap cells. |
| 4.5 | Knob stretch | N/A | N/A | — | — |
| 4.6 | Stagger as details settle | N/A | N/A | — | — |
| 4.7 | Arcs | N/A | N/A | — | — |
| 4.8 | Pulse to confirm | ❌ | ✅ | `assets/css/styles.css:611` | Once, on save. |
| 4.9 | Ease-in-out for moves | N/A | N/A | — | Nothing repositions on screen. |
| 4.10 | Popovers from 0.95 | ❌ | ✅ | `assets/css/styles.css` (`@keyframes pop-in`) | — |
| 4.11 | Enter from the trigger | ❌ | ✅ | `assets/js/pages/calendar.js` (`--tip-origin`) | Tooltip grows from the side facing its cell; the menu drops from the header. |
| 4.12 | Exit to the trigger | ❌ | ⚠️ | — | The menu exits upward. The tooltip hides instantly, kept for hover speed (§3.20). |
| 4.13 | No bounce | ✅ | ✅ | — | — |
| 4.14 | Don't tween while held | N/A | N/A | — | No dragging. |
| 4.15 | Exits 20% shorter | ❌ | ✅ | `assets/css/styles.css` (`--dur-exit`) | 160ms out vs 200ms in. |
| 4.16 | Overlap old & new | ❌ | ✅ | `assets/js/util/router.js:66` | Page changes crossfade with View Transitions (progressive). Skipped on first load, in-page updates and reduced motion. |
| 4.17 | Masks for reveals | N/A | N/A | — | Optional; not used. |
| 4.18 | Icon crossfade + blur | ❌ | ✅ | `assets/css/styles.css` (`.icon-swap-in`) | Theme toggle icon. |
| 4.19 | Rubber band | N/A | N/A | — | — |
| 4.20 | Shared element identity | ❌ | ✅ | `assets/css/styles.css:623` | Header keeps its own `view-transition-name`, so it doesn't flicker between pages. |
| — | Reduced motion | ✅ | ✅ | `assets/css/styles.css:643` | Transitions, animations, view transitions and hover scale are off (verified: 0s transitions, no crossfade). |

#### §5 Backgrounds

Menu, not checklist. None added. The app is dense data UI, and §5.0 says not
to put atmospheric backgrounds behind it. If a marketing page is ever added, a
contour-line or square-dot texture behind its hero would suit a travel/data
brand.

#### §6 Trend watch

| § | Item | Before | After | Evidence | Fix |
| --- | --- | --- | --- | --- | --- |
| 6.16 | Three icon cards | ⚠️ | ✅ | `assets/js/pages/home.js:125` | The "1 · 2 · 3 How it works" boxes became a live comparison from the current data: a cheaper-in-miles award beside a better-value one, with value per point, the program baseline and the deal score. |
| 6.1–6.15, 6.17–6.20 | Other trends | N/A | N/A | — | Not used: no cream background, serif or italic word, eyebrow, sparkle, pulsing dot, marquee, glass, gradient hero or squircle. |

### Needs owner input

- [ ] Name of the person or legal entity operating the site (§1.16, Privacy, Terms)
- [ ] Contact email (footer, Privacy, Terms)
- [ ] Postal address, if required where the operator is based (§1.16)
- [ ] Hosting provider and a link to its privacy statement (Privacy → Hosting)
- [ ] Governing law and jurisdiction, and limitation-of-liability wording (Terms)
- [ ] Review of the Privacy and Terms drafts by a qualified lawyer (§0.3)
- [ ] Confirm the audience: Privacy states the site isn't directed at children (§1.17)

Search for `[[TODO` to find every placeholder.

### Claims removed or rewritten (§1.12)

- "Pointscanner **scans** award space across 20 loyalty programs and scores
  every seat against what those points are **normally worth**, so 60k … and
  90k … are **finally** comparable" → "compares award seats across 20 loyalty
  programs and scores each one against **an estimate** of what those points
  are usually worth, so … can be compared fairly". With demo data nothing is
  scanned, valuations are estimates, and "finally" is puffery.
- "award seats scanned" (stat) → "sample award seats" with demo data, "award
  seats loaded" with real data.
- "Programs we scan" → "Programs covered". On the Programs page, "programs
  Pointscanner scans … right now" → "covers … in the current data".
- Page meta description and README "Scan award space" → "Compare award space".
- About page: "The page loads Tailwind CSS from cdn.tailwindcss.com and fonts
  from Google Fonts" → removed (no longer true); it now says the site makes
  no third-party requests.
- Kept, because they're verifiable: "Free and open source" (MIT) and "No
  account, no email, no tracking" (no cookies, analytics or third-party
  requests).

### Changes made

- **Privacy:** fonts self-hosted (Inter, JetBrains Mono, OFL); Tailwind compiled
  by `build.mjs` into `dist/pointscanner.css` (pinned `tailwindcss@3.4.17` via
  `npx`, checked by `--check` in CI); Play CDN and Google Fonts removed.
- **Legal:** draft Privacy and Terms pages with storage inventory, data
  export/delete, no-affiliation and trademark notice; `CREDITS.md`; footer
  links and contact placeholder.
- **Accessibility:** field-border contrast token; 24px minimum targets, 44px on
  touch; Esc and outside-click close the mobile menu with focus return;
  swatch ring for dark brand colours.
- **UX:** forgiving amount inputs; collapsible program filter; sans-serif
  location inputs; reload on boot failure; clearer no-route empty state.
- **Polish:** design tokens; one SVG icon set; amber reserved for sweet spots;
  one primary CTA per view; balanced headlines; unboxed stats; real
  deal-score example instead of three generic cards; solid header.
- **Motion:** easing and duration tokens; press scale; tooltip pop-in from its
  cell; menu drop with shorter exit; page crossfade (View Transitions); theme
  icon crossfade; save pulse; reduced-motion coverage.
- **Docs:** `docs/DESIGN_GUIDELINES.md` added; `CLAUDE.md` points every session
  at it; README and HANDOFF updated.

### Verification

- `node build.mjs --check`: bundle and compiled CSS up to date.
- `npm test`: 69/69 pass, including new tests for the storage inventory, no
  external `<script>`/`<link>`, draft markers, data export/delete, amount
  parsing and the home example.
- axe-core 4.10: 0 violations on 11 views × light and dark.
- Playwright (Chromium): 33-step UI walkthrough passes over `file://` and
  http. Guideline checks pass: no target under 24×24, touch targets ≥44px,
  skip link first, Esc closes the menu and returns focus, "90k"/"60,000"
  accepted, export/delete work, reduced motion disables transitions and the
  page crossfade, no horizontal overflow at 390px.
- First-load network: zero third-party requests and no console errors, over
  `file://` and http.
- Before/after screenshots compared (home, search, calendar, privacy; light,
  dark, phone).

### Follow-ups

- Tokenise the type scale in `styles.css` primitives (§2.5).
- Optional tooltip exit animation if it doesn't slow hover scanning (§4.12).
- Re-run this audit after the owner fills in the placeholders.
