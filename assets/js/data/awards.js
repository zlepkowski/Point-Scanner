import { AIRPORTS } from './airports.js';
import { AIRLINES, airlineByIata } from './airlines.js';
import { PROGRAMS } from './programs.js';
import { haversineKm, flightHours, distanceBucket } from '../util/geo.js';
import { seeded, pick, pickWeighted, intBetween, between, roundToChart } from '../util/rand.js';
import { addDays, dayOfWeek, daysBetween, thanksgiving, todayIso, fmtHm } from '../util/date.js';

export const WINDOW_DAYS = 60;
export const MIN_ROUTE_KM = 200;
export const MAX_ROUTE_KM = 12000;

export const BASE_MILES = {
  short: { economy: 10000, premium: 15000, business: 25000, first: 35000 },
  medium: { economy: 20000, premium: 30000, business: 45000, first: 60000 },
  long: { economy: 35000, premium: 50000, business: 75000, first: 110000 },
  ultra: { economy: 45000, premium: 65000, business: 90000, first: 130000 },
};

// Dynamic programs price off cash fares, so they swing much further from the
// chart in both directions than fixed-chart programs do.
export const PROGRAM_PRICING = {
  aeroplan: { mult: 1.0 },
  united: { mult: 1.1, dynamic: true },
  lifemiles: { mult: 0.95 },
  krisflyer: { mult: 1.0 },
  ana: { mult: 0.85 },
  turkish: { mult: 0.8 },
  milesandmore: { mult: 1.2 },
  aadvantage: { mult: 1.0 },
  atmos: { mult: 0.95 },
  britishairways: { mult: 1.05 },
  qantas: { mult: 1.05 },
  asiamiles: { mult: 1.0 },
  jal: { mult: 0.9 },
  qatar: { mult: 0.95 },
  flyingblue: { mult: 1.05, dynamic: true },
  delta: { mult: 1.3, dynamic: true },
  virgin: { mult: 0.9 },
  korean: { mult: 0.95 },
  emirates: { mult: 1.3, dynamic: true },
  etihad: { mult: 1.0 },
};

// Programs that don't pass carrier-imposed surcharges through on awards.
export const NO_YQ_PROGRAMS = new Set(['aeroplan', 'united', 'lifemiles', 'atmos']);

const YQ_BY_LEVEL = {
  high: { economy: 260, premium: 360, business: 520, first: 680 },
  mid: { economy: 90, premium: 140, business: 200, first: 260 },
  low: { economy: 0, premium: 0, business: 0, first: 0 },
};

const CABIN_WEIGHTS = {
  short: [['economy', 70], ['premium', 4], ['business', 26]],
  medium: [['economy', 55], ['premium', 12], ['business', 29], ['first', 4]],
  long: [['economy', 46], ['premium', 16], ['business', 30], ['first', 8]],
  ultra: [['economy', 42], ['premium', 17], ['business', 31], ['first', 10]],
};

const SEAT_WEIGHTS = {
  economy: [[1, 8], [2, 14], [3, 12], [4, 12], [5, 10], [6, 10], [7, 8], [8, 8], [9, 18]],
  premium: [[1, 30], [2, 35], [3, 20], [4, 15]],
  business: [[1, 40], [2, 35], [3, 15], [4, 10]],
  first: [[1, 60], [2, 40]],
};

const BUCKET_AVAILABILITY = { short: 1, medium: 0.9, long: 0.8, ultra: 0.7 };
const SLOTS_PER_DAY = 3;
const SLOT_PROBABILITY = 0.45;

// Daily churn: a slice of yesterday's space disappears and some new space
// appears, so saved-route alerts have something real to report.
const CHURN_DROP = 0.05;
const CHURN_ADD = 0.06;
const CLOSE_IN_DAYS = 14;
const CLOSE_IN_PREMIUM_BOOST = 0.1;

// 0 = Sunday. Fridays and Sundays are the expensive days to fly.
const DOW_MULT = [1.08, 1.0, 0.94, 0.94, 1.0, 1.08, 0.98];

const MAX_DETOUR = { short: 2.0, medium: 1.5, long: 1.25, ultra: 1.2 };

export const PROGRAMS_BY_PARTNER = new Map(
  AIRLINES.map((al) => [al.iata, PROGRAMS.filter((p) => p.partners.includes(al.iata))]),
);

const airportsByIata = new Map(AIRPORTS.map((a) => [a.iata, a]));

function makeFlights(key, airline, bucket, stops) {
  const rng = seeded(`${key}|${airline}|flights`);
  const count = stops === 0 && (bucket === 'short' || bucket === 'medium') ? intBetween(rng, 1, 3) : intBetween(rng, 1, 2);
  const used = new Set();
  const flights = [];
  for (let i = 0; i < count; i++) {
    const base = bucket === 'short' || bucket === 'medium' ? 1000 : 1;
    let num = base + Math.floor(rng() * 999);
    while (used.has(num)) num++;
    used.add(num);
    const departMinutes = 6 * 60 + Math.floor(rng() * ((23.5 - 6) * 12)) * 5;
    flights.push({ flightNo: `${airline}${num}`, departTime: fmtHm(departMinutes) });
  }
  return flights.sort((x, y) => x.departTime.localeCompare(y.departTime));
}

function carriersFor(a, b, km, bucket, key) {
  const direct = AIRLINES.filter((al) => al.hubs.includes(a.iata) || al.hubs.includes(b.iata)).map((al) => ({
    airline: al.iata,
    stops: 0,
    via: null,
    durationHours: flightHours(km),
  }));

  const connecting = [];
  for (const al of AIRLINES) {
    if (direct.some((d) => d.airline === al.iata)) continue;
    let best = null;
    for (const hubCode of al.hubs) {
      const hub = airportsByIata.get(hubCode);
      if (!hub) continue;
      const leg1 = haversineKm(a, hub);
      const leg2 = haversineKm(hub, b);
      if (leg1 < MIN_ROUTE_KM || leg2 < MIN_ROUTE_KM) continue;
      const ratio = (leg1 + leg2) / km;
      if (ratio > MAX_DETOUR[bucket]) continue;
      if (!best || ratio < best.ratio) best = { hub: hubCode, ratio, leg1, leg2 };
    }
    if (best) {
      const layover = 1.5 + (hashLayover(key, al.iata) % 4) * 0.5;
      connecting.push({
        airline: al.iata,
        stops: 1,
        via: best.hub,
        ratio: best.ratio,
        durationHours: Math.round((flightHours(best.leg1) + flightHours(best.leg2) + layover) * 10) / 10,
      });
    }
  }
  connecting.sort((x, y) => x.ratio - y.ratio || x.airline.localeCompare(y.airline));
  const keepConnecting = direct.length === 0 ? 3 : bucket === 'long' || bucket === 'ultra' ? 2 : 0;

  return [...direct, ...connecting.slice(0, keepConnecting)].map(({ ratio, ...c }) => ({
    ...c,
    flights: makeFlights(key, c.airline, bucket, c.stops),
  }));
}

function hashLayover(key, airline) {
  return Math.floor(seeded(`${key}|${airline}|layover`)() * 1000);
}

let routesCache = null;

export function buildRoutes() {
  if (routesCache) return routesCache;
  const routes = [];
  for (const a of AIRPORTS) {
    for (const b of AIRPORTS) {
      if (a === b) continue;
      const km = haversineKm(a, b);
      if (km < MIN_ROUTE_KM || km > MAX_ROUTE_KM) continue;
      if (!(a.focus || b.focus || a.region === b.region)) continue;
      const key = `${a.iata}-${b.iata}`;
      const bucket = distanceBucket(km);
      const carriers = carriersFor(a, b, km, bucket, key);
      if (!carriers.length) continue;
      const weight = a.focus && b.focus ? 1 : a.focus || b.focus ? 0.35 : 0.3;
      const carrierWeights = carriers.map((c) => [c, c.stops === 0 ? 3 : 1]);
      const touchesNorthAmerica = a.region === 'North America' || b.region === 'North America';
      routes.push({ key, from: a.iata, to: b.iata, distanceKm: km, bucket, weight, carriers, carrierWeights, touchesNorthAmerica });
    }
  }
  routesCache = routes;
  return routes;
}

export function peakFactor(date, touchesNorthAmerica) {
  const md = date.slice(5);
  if (md >= '12-18' || md <= '01-04') return 1.25;
  if (md >= '07-01' && md <= '08-20') return 1.12;
  if (touchesNorthAmerica) {
    const diff = daysBetween(thanksgiving(Number(date.slice(0, 4))), date);
    if (diff >= -3 && diff <= 4) return 1.15;
  }
  return 1;
}

const PROGRAM_WEIGHTS = new Map(
  [...PROGRAMS_BY_PARTNER].map(([airline, programs]) => [
    airline,
    programs.map((p) => [p, p.airline === airline ? 3 : 1]),
  ]),
);

function pickProgram(rng, airline) {
  return pickWeighted(rng, PROGRAM_WEIGHTS.get(airline));
}

function pickCabin(rng, bucket, airline) {
  let cabin = pickWeighted(rng, CABIN_WEIGHTS[bucket]);
  if (cabin === 'first' && !airlineByIata.get(airline).first) cabin = 'business';
  return cabin;
}

function priceMiles(rng, route, cabin, programId, day, peak) {
  const pricing = PROGRAM_PRICING[programId] ?? { mult: 1 };
  let miles = BASE_MILES[route.bucket][cabin] * pricing.mult * day.dowMult * peak;
  if (pricing.dynamic) {
    miles *= Math.exp(between(rng, -0.3, 0.55));
  } else {
    miles *= between(rng, 0.9, 1.1);
    if (rng() < 0.12) miles *= 1.6; // standard/"anytime" space, not saver
  }
  return roundToChart(miles, pricing.dynamic);
}

function taxesFor(rng, route, airline, programId, cabin) {
  let t = 12 + route.distanceKm * 0.006 + (cabin === 'economy' ? 0 : 15);
  // UK Air Passenger Duty on long-haul departures from London.
  if (route.from === 'LHR' && route.bucket !== 'short') t += cabin === 'economy' ? 105 : 230;
  if (!NO_YQ_PROGRAMS.has(programId)) {
    t += YQ_BY_LEVEL[airlineByIata.get(airline).yq][cabin] * Math.min(1, route.distanceKm / 6000);
  }
  return Math.round(t * between(rng, 0.92, 1.08) * 100) / 100;
}

function makeAward(rng, route, day, peak, cabinOverride) {
  const carrier = pickWeighted(rng, route.carrierWeights);
  const program = pickProgram(rng, carrier.airline);
  const cabin = cabinOverride ?? pickCabin(rng, route.bucket, carrier.airline);
  const flight = pick(rng, carrier.flights);
  return {
    from: route.from,
    to: route.to,
    distanceKm: route.distanceKm,
    durationHours: carrier.durationHours,
    date: day.date,
    departTime: flight.departTime,
    cabin,
    miles: priceMiles(rng, route, cabin, program.id, day, peak),
    taxesUsd: taxesFor(rng, route, carrier.airline, program.id, cabin),
    airline: carrier.airline,
    flightNo: flight.flightNo,
    programId: program.id,
    stops: carrier.stops,
    seats: pickWeighted(rng, SEAT_WEIGHTS[cabin]),
  };
}

function awardsForRouteDate(route, day, today) {
  const { date } = day;
  const peak = route.touchesNorthAmerica ? day.peakNorthAmerica : day.peak;
  const p = SLOT_PROBABILITY * route.weight * BUCKET_AVAILABILITY[route.bucket] * (peak > 1 ? 0.65 : 1);

  // Base layer: depends only on route + date, so a given flight on a given
  // day looks the same no matter which day you load the page.
  const rng = seeded(`${route.key}|${date}`);
  const base = [];
  for (let s = 0; s < SLOTS_PER_DAY; s++) {
    if (rng() < p) base.push(makeAward(rng, route, day, peak));
  }

  const churn = seeded(`${route.key}|${date}|${today}`);
  const kept = base.filter(() => churn() >= CHURN_DROP);
  for (const award of kept) {
    if (churn() < 0.25) award.seats = Math.max(1, award.seats - 1);
  }
  if (churn() < CHURN_ADD * route.weight) kept.push(makeAward(churn, route, day, peak));
  if (day.daysOut <= CLOSE_IN_DAYS && churn() < CLOSE_IN_PREMIUM_BOOST * route.weight) {
    kept.push(makeAward(churn, route, day, peak, 'business'));
  }

  const seen = new Set();
  return kept.filter((a) => {
    const k = `${a.flightNo}|${a.cabin}|${a.programId}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function generateAwards({ today = todayIso(), days = WINDOW_DAYS } = {}) {
  const routes = buildRoutes();
  const dayInfo = [];
  for (let d = 0; d < days; d++) {
    const date = addDays(today, d);
    dayInfo.push({
      date,
      daysOut: d,
      dowMult: DOW_MULT[dayOfWeek(date)],
      peak: peakFactor(date, false),
      peakNorthAmerica: peakFactor(date, true),
    });
  }
  const out = [];
  let id = 1;
  for (const route of routes) {
    for (const day of dayInfo) {
      for (const award of awardsForRouteDate(route, day, today)) {
        out.push({ id: id++, ...award });
      }
    }
  }
  return out;
}
