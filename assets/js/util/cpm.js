import { milesValuationCents } from '../data/programs.js';
import { regionOf } from '../data/airports.js';

// Coarse cash-fare model: a per-km rate with a floor per cabin. Tuned against
// the synthetic generator so that roughly 5% of awards clear the sweet-spot
// threshold, skewed towards business and first (see test/cpm.test.js).
export const CASH_PER_KM = { economy: 0.1, premium: 0.145, business: 0.235, first: 0.32 };
export const CASH_FLOOR = { economy: 110, premium: 240, business: 600, first: 1200 };

// Premium-cabin cash fares are not uniform: a Singapore suite is worth more
// than a domestic recliner sold as "first". Economy is treated as a commodity.
export const CARRIER_PREMIUM = {
  SQ: 1.25, QR: 1.2, CX: 1.15, NH: 1.15, JL: 1.15, EK: 1.15,
  EY: 1.1, AF: 1.1, LX: 1.1, KE: 1.05,
};
const SHORT_HAUL_PREMIUM_DISCOUNT = 0.7;

export const SWEET_SPOT_THRESHOLD = 1.8;
export const MIN_NET_CASH_USD = 40;
const DEFAULT_BASELINE_CENTS = 1.3;

export function estimateCashUsd({ cabin, distanceKm, airline, from, to }) {
  let cash = Math.max(CASH_FLOOR[cabin], CASH_PER_KM[cabin] * distanceKm);
  if (cabin === 'business' || cabin === 'first') {
    cash *= CARRIER_PREMIUM[airline] ?? 1;
    if (distanceKm < 3000 && from && to && regionOf(from) === regionOf(to)) {
      cash *= SHORT_HAUL_PREMIUM_DISCOUNT;
    }
  }
  return cash;
}

export function baselineCents(programId) {
  return milesValuationCents[programId] ?? DEFAULT_BASELINE_CENTS;
}

export function centsPerMile(award) {
  const net = Math.max(MIN_NET_CASH_USD, estimateCashUsd(award) - award.taxesUsd);
  return (net * 100) / award.miles;
}

export function dealScore(award) {
  return centsPerMile(award) / baselineCents(award.programId);
}

export function isSweetSpot(score) {
  return score >= SWEET_SPOT_THRESHOLD;
}
