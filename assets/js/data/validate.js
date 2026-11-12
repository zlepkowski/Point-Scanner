import { programById } from './programs.js';
import { isIsoDate, parseHm } from '../util/date.js';
import { CABINS } from '../util/format.js';

const IATA = /^[A-Z0-9]{2,3}$/;

function problem(rec) {
  if (!rec || typeof rec !== 'object') return 'not an object';
  if (typeof rec.from !== 'string' || !/^[A-Z]{3}$/.test(rec.from)) return 'from must be a 3-letter IATA code';
  if (typeof rec.to !== 'string' || !/^[A-Z]{3}$/.test(rec.to)) return 'to must be a 3-letter IATA code';
  if (rec.from === rec.to) return 'from and to are the same';
  if (!isIsoDate(rec.date)) return 'date must be YYYY-MM-DD';
  if (!CABINS.includes(rec.cabin)) return `cabin must be one of ${CABINS.join(', ')}`;
  if (!programById.has(rec.programId)) return `unknown programId "${rec.programId}"`;
  if (!Number.isFinite(rec.miles) || rec.miles <= 0) return 'miles must be a positive number';
  if (!Number.isFinite(rec.taxesUsd) || rec.taxesUsd < 0) return 'taxesUsd must be a non-negative number';
  if (!Number.isFinite(rec.distanceKm) || rec.distanceKm <= 0) return 'distanceKm must be a positive number';
  if (typeof rec.airline !== 'string' || !IATA.test(rec.airline)) return 'airline must be an IATA carrier code';
  if (rec.departTime != null && parseHm(rec.departTime) == null) return 'departTime must be HH:MM';
  return null;
}

// Accepts either a bare Award[] or { awards: Award[] }. Invalid records are
// dropped (with a sample of reasons) rather than failing the whole file, and
// awards dated before `today` are discarded as stale.
export function normalizeAwards(input, { today } = {}) {
  const list = Array.isArray(input) ? input : Array.isArray(input?.awards) ? input.awards : null;
  if (!list) return { awards: [], warnings: ['Expected an array of awards or an object with an "awards" array.'] };

  const awards = [];
  const reasons = new Map();
  let stale = 0;
  list.forEach((rec, i) => {
    const why = problem(rec);
    if (why) {
      if (!reasons.has(why)) reasons.set(why, i);
      return;
    }
    if (today && rec.date < today) {
      stale++;
      return;
    }
    awards.push({
      id: awards.length + 1,
      from: rec.from,
      to: rec.to,
      distanceKm: Math.round(rec.distanceKm),
      durationHours: Number.isFinite(rec.durationHours) ? rec.durationHours : null,
      date: rec.date,
      departTime: rec.departTime ?? null,
      cabin: rec.cabin,
      miles: Math.round(rec.miles),
      taxesUsd: Math.round(rec.taxesUsd * 100) / 100,
      airline: rec.airline,
      flightNo: typeof rec.flightNo === 'string' ? rec.flightNo : '',
      programId: rec.programId,
      stops: Number.isInteger(rec.stops) && rec.stops >= 0 ? rec.stops : 0,
      seats: Number.isInteger(rec.seats) && rec.seats > 0 ? rec.seats : 1,
    });
  });

  const warnings = [];
  const dropped = list.length - awards.length - stale;
  if (dropped) {
    warnings.push(`Dropped ${dropped} invalid record(s).`);
    for (const [why, i] of reasons) warnings.push(`  e.g. record ${i}: ${why}`);
  }
  if (stale) warnings.push(`Skipped ${stale} record(s) dated before ${today}.`);
  return { awards, warnings };
}
