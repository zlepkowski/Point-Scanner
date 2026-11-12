# Live data — first pass (to refine later)

**Status: started 2026-11-12. Framework built and tested; no program adapter
is enabled yet.** This is a working note, not a final design. Revisit
everything below before the site shows collected data publicly.

## Decision so far

- Collect award availability **directly from loyalty-program websites**.
- **No account linking or logged-in searches.** Programs close accounts for
  automated use, and the miles go with them.
- **No data from other award-search sites** (seats.aero and similar): their
  terms require attribution/linking, which we don't want, and it would be
  copying their work.
- Output is the same `awards.json` the site already loads through
  `data-awards-url` (README → *Use your own data*), so the site stays static.

## Ground rules the collector enforces

These are built into `collector/lib/http.js` and covered by
`test/collector.test.js`:

1. Identify honestly: `PointscannerBot/0.1 (+repo URL)`. No browser
   impersonation.
2. Check `robots.txt` before every request (RFC 9309; an unreachable or 5xx
   robots.txt counts as "disallow everything").
3. At least 4 s between requests to the same host.
4. On 401/403/429/444, stop using that host for the rest of the run. No
   retries, proxy rotation, fingerprint spoofing or CAPTCHA solving.
5. Each run records every adapter's outcome (`ok` / `blocked` / `disallowed` /
   `failing`) under `sources` in the output.

## Program survey (2026-11-12, from a cloud datacenter IP)

| Program | Site | Login needed to search? | What we saw | Status |
| --- | --- | --- | --- | --- |
| AAdvantage | www.aa.com | No | robots.txt doesn't restrict award search | **Candidate**: verify the search endpoint (see below) |
| Atmos (Alaska) | www.alaskaair.com | No | robots.txt disallows `/search/results?`, `/search/calendar?`, `/shopping/` | Skip (respect robots.txt) |
| Flying Blue | wwws.airfrance.us, www.klm.com | No | robots.txt disallows `/search` and `/*/search` | Skip (respect robots.txt) |
| MileagePlus | www.united.com | No | Connection reset at the CDN edge | Skip (blocks automated traffic) |
| SkyMiles | www.delta.com | No | "Access Denied" even for robots.txt | Skip (blocks automated traffic) |
| Flying Club | www.virginatlantic.com | No | HTTP 444 | Skip (blocks automated traffic) |
| Aeroplan | aircanada.com | No | Not tested | Skip while Air Canada v. seats.aero is in court |
| Others (BA, Qantas, KrisFlyer, ANA, Asia Miles, Turkish, …) | — | Mostly yes | Not tested | Out of scope under "no login" |

Blocks were seen from a datacenter IP; GitHub Actions runners are datacenter
IPs too, so expect the same there.

## Open items — refine later

1. **AAdvantage adapter.** The first test request to aa.com's award-search
   endpoint was stopped by this session's safety check before it was sent, so
   the endpoint, request shape and response format are **unverified**. Next
   step needs the project owner's go-ahead for a handful of test requests,
   then: write `collector/adapters/aa.js`, save one real response as a test
   fixture, and map it to the Award shape (AA results include partner
   flights priced in AAdvantage miles).
2. **Coverage.** With only AA, live data would be one program. Decide whether
   that's worth showing publicly, and how the UI should say "live for
   AAdvantage only".
3. **Mixing.** Don't mix synthetic and real awards in one view. Today the site
   uses real data only when `awards.json` has usable records; keep it that way.
4. **Provenance in the UI.** Show `generatedAt` and per-program status from the
   output file (footer and About page).
5. **Scheduling.** Run the collector in the Pages workflow (scheduled + on
   push), publish `awards.json` with the site, and set `data-awards-url` in
   the deployed copy only when the file has records. Current config is 8
   routes × 30 days ≈ 240 searches per program, ≥16 min per program at 4 s
   spacing; tune routes/days once an adapter works.
6. **GitHub's terms.** Check that a scheduled data-collection job fits GitHub
   Actions' acceptable-use terms, or run it elsewhere.
7. **Legal review.** Even polite, robots-respecting collection may breach a
   site's terms of use. Get advice before publishing collected data.
8. **Re-survey.** robots.txt files and bot defences change; re-check the table
   above before enabling or re-enabling any program.

## Running it

```bash
node collector/run.js --dry-run          # request plan only
node collector/run.js --out awards.json  # run enabled adapters
npm test                                 # includes collector tests
```

The `Point-Scanner` cloud environment allows these hosts for development:
www.united.com, www.aa.com, www.alaskaair.com, www.delta.com,
www.virginatlantic.com, wwws.airfrance.us, www.klm.com.
