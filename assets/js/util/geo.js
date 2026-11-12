const EARTH_RADIUS_KM = 6371;
const toRad = (deg) => (deg * Math.PI) / 180;

export function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h)));
}

// Cruise ~830 km/h plus ~35 minutes for taxi, climb and approach.
export function flightHours(km) {
  return Math.round((km / 830 + 0.6) * 10) / 10;
}

export const BUCKETS = ['short', 'medium', 'long', 'ultra'];

export function distanceBucket(km) {
  if (km < 1500) return 'short';
  if (km < 4000) return 'medium';
  if (km < 8000) return 'long';
  return 'ultra';
}
