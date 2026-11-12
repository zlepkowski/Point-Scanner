import { airportByIata } from '../../assets/js/data/airports.js';
import { haversineKm, flightHours } from '../../assets/js/util/geo.js';

// Fills the fields programs rarely return (distance, duration) so adapters only
// map what the site actually gives them. Unknown airports keep distance null,
// and normalizeAwards drops the record with a reason.
export function toAward(fields) {
  const a = airportByIata.get(fields.from);
  const b = airportByIata.get(fields.to);
  const distanceKm = fields.distanceKm ?? (a && b ? haversineKm(a, b) : null);
  return {
    stops: 0,
    seats: 1,
    flightNo: '',
    departTime: null,
    ...fields,
    distanceKm,
    durationHours: fields.durationHours ?? (distanceKm ? flightHours(distanceKm) : null),
  };
}
