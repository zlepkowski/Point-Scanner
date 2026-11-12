import { airportByIata } from './airports.js';
import { routeKey } from './store.js';
import { estimateCashUsd, baselineCents, isSweetSpot, MIN_NET_CASH_USD } from '../util/cpm.js';
import { daysBetween, parseHm } from '../util/date.js';
import { haversineKm } from '../util/geo.js';
import { CABIN_RANK } from '../util/format.js';

export const MIN_CONNECT_MINUTES = 60;
export const MAX_CONNECT_MINUTES = 20 * 60;
export const MAX_DETOUR_RATIO = 1.3;
const EPOCH = '2000-01-01';

function departUtc(award) {
  const local = parseHm(award.departTime);
  const tz = airportByIata.get(award.from)?.tz;
  if (local == null || tz == null) return null;
  return daysBetween(EPOCH, award.date) * 1440 + local - tz * 60;
}

function arriveUtc(award) {
  const dep = departUtc(award);
  if (dep == null || !Number.isFinite(award.durationHours)) return null;
  return dep + Math.round(award.durationHours * 60);
}

// Two separately-bookable awards in the same program, stitched together.
// Booking them as one itinerary may price differently; we show the sum, which
// is what you'd pay booking them separately, and flag any change of cabin.
export function buildItinerary(leg1, leg2, layoverMinutes) {
  const legs = [leg1, leg2];
  const distanceKm = leg1.distanceKm + leg2.distanceKm;
  const longer = leg1.distanceKm >= leg2.distanceKm ? leg1 : leg2;
  const cabin = longer.cabin;
  const kmInCabin = legs.filter((l) => l.cabin === cabin).reduce((s, l) => s + l.distanceKm, 0);
  const miles = leg1.miles + leg2.miles;
  const taxesUsd = Math.round((leg1.taxesUsd + leg2.taxesUsd) * 100) / 100;
  const cash = estimateCashUsd(leg1) + estimateCashUsd(leg2);
  const cpm = (Math.max(MIN_NET_CASH_USD, cash - taxesUsd) * 100) / miles;
  const score = cpm / baselineCents(leg1.programId);

  const dep = departUtc(leg1);
  const arr = arriveUtc(leg2);
  const durationHours = dep != null && arr != null ? Math.round(((arr - dep) / 60) * 10) / 10 : null;

  return {
    kind: 'connection',
    from: leg1.from,
    via: leg1.to,
    to: leg2.to,
    date: leg1.date,
    programId: leg1.programId,
    cabin,
    mixed: leg1.cabin !== leg2.cabin,
    cabinShare: kmInCabin / distanceKm,
    topCabin: CABIN_RANK[leg1.cabin] >= CABIN_RANK[leg2.cabin] ? leg1.cabin : leg2.cabin,
    miles,
    taxesUsd,
    distanceKm,
    durationHours,
    layoverMinutes,
    seats: Math.min(leg1.seats, leg2.seats),
    legs,
    cpm,
    score,
    sweet: isSweetSpot(score),
  };
}

// Finds stitched itineraries for from→to on dates/programs where no direct
// award exists in a requested cabin. The longer leg must be in a requested
// cabin; the shorter leg may be in any cabin and is flagged as mixed.
export function findConnections(indexes, { from, to, cabins, programIds = null, dateFrom = null, dateTo = null }) {
  const origin = airportByIata.get(from);
  const dest = airportByIata.get(to);
  const directKm = origin && dest ? haversineKm(origin, dest) : null;
  const cabinSet = new Set(cabins);
  const programSet = programIds ? new Set(programIds) : null;

  const directCovered = new Set();
  for (const a of indexes.byRoute.get(routeKey(from, to)) ?? []) {
    if (cabinSet.has(a.cabin)) directCovered.add(`${a.date}|${a.programId}`);
  }

  const best = new Map();
  for (const leg1 of indexes.byFrom.get(from) ?? []) {
    const via = leg1.to;
    if (via === to) continue;
    if (dateFrom && leg1.date < dateFrom) continue;
    if (dateTo && leg1.date > dateTo) continue;
    if (programSet && !programSet.has(leg1.programId)) continue;
    if (directCovered.has(`${leg1.date}|${leg1.programId}`)) continue;

    const onward = indexes.byRoute.get(routeKey(via, to));
    if (!onward?.length) continue;
    if (directKm && leg1.distanceKm + onward[0].distanceKm > directKm * MAX_DETOUR_RATIO) continue;

    for (const leg2 of onward) {
      if (leg2.programId !== leg1.programId) continue;
      const gap = daysBetween(leg1.date, leg2.date);
      if (gap < 0 || gap > 1) continue;
      const longer = leg1.distanceKm >= leg2.distanceKm ? leg1 : leg2;
      if (!cabinSet.has(longer.cabin)) continue;

      const arr = arriveUtc(leg1);
      const dep = departUtc(leg2);
      let layover = null;
      if (arr != null && dep != null) {
        layover = dep - arr;
        if (layover < MIN_CONNECT_MINUTES || layover > MAX_CONNECT_MINUTES) continue;
      }

      const itin = buildItinerary(leg1, leg2, layover);
      const key = `${leg1.date}|${leg1.programId}|${via}|${itin.cabin}`;
      const prev = best.get(key);
      if (!prev || itin.miles < prev.miles || (itin.miles === prev.miles && itin.taxesUsd < prev.taxesUsd)) {
        best.set(key, itin);
      }
    }
  }
  return [...best.values()];
}
