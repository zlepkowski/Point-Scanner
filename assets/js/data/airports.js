export const REGIONS = [
  'North America',
  'Latin America',
  'Europe',
  'Middle East & Africa',
  'Asia',
  'Oceania',
];

// tz is the standard-time UTC offset in hours (DST ignored — good enough for
// connection windows on synthetic schedules). focus marks the big hubs that
// anchor the route network.
const RAW = [
  ['JFK', 'New York', 'John F. Kennedy', 'US', 'North America', 40.6413, -73.7781, -5, 1],
  ['EWR', 'Newark', 'Newark Liberty', 'US', 'North America', 40.6895, -74.1745, -5, 1],
  ['BOS', 'Boston', 'Logan', 'US', 'North America', 42.3656, -71.0096, -5, 0],
  ['IAD', 'Washington', 'Dulles', 'US', 'North America', 38.9531, -77.4565, -5, 1],
  ['ATL', 'Atlanta', 'Hartsfield–Jackson', 'US', 'North America', 33.6407, -84.4277, -5, 1],
  ['MIA', 'Miami', 'Miami International', 'US', 'North America', 25.7959, -80.287, -5, 1],
  ['ORD', 'Chicago', "O'Hare", 'US', 'North America', 41.9742, -87.9073, -6, 1],
  ['DFW', 'Dallas', 'Dallas/Fort Worth', 'US', 'North America', 32.8998, -97.0403, -6, 1],
  ['IAH', 'Houston', 'George Bush Intercontinental', 'US', 'North America', 29.9902, -95.3368, -6, 0],
  ['DEN', 'Denver', 'Denver International', 'US', 'North America', 39.8561, -104.6737, -7, 0],
  ['LAX', 'Los Angeles', 'Los Angeles International', 'US', 'North America', 33.9416, -118.4085, -8, 1],
  ['SFO', 'San Francisco', 'San Francisco International', 'US', 'North America', 37.6213, -122.379, -8, 1],
  ['SEA', 'Seattle', 'Seattle–Tacoma', 'US', 'North America', 47.4502, -122.3088, -8, 0],
  ['HNL', 'Honolulu', 'Daniel K. Inouye', 'US', 'North America', 21.3187, -157.9225, -10, 0],
  ['YYZ', 'Toronto', 'Pearson', 'CA', 'North America', 43.6777, -79.6248, -5, 1],
  ['YVR', 'Vancouver', 'Vancouver International', 'CA', 'North America', 49.1967, -123.1815, -8, 0],
  ['YUL', 'Montréal', 'Trudeau', 'CA', 'North America', 45.4706, -73.7408, -5, 0],

  ['MEX', 'Mexico City', 'Benito Juárez', 'MX', 'Latin America', 19.4361, -99.0719, -6, 1],
  ['CUN', 'Cancún', 'Cancún International', 'MX', 'Latin America', 21.0365, -86.8771, -5, 0],
  ['PTY', 'Panama City', 'Tocumen', 'PA', 'Latin America', 9.0714, -79.3835, -5, 0],
  ['BOG', 'Bogotá', 'El Dorado', 'CO', 'Latin America', 4.7016, -74.1469, -5, 0],
  ['LIM', 'Lima', 'Jorge Chávez', 'PE', 'Latin America', -12.0219, -77.1143, -5, 0],
  ['GRU', 'São Paulo', 'Guarulhos', 'BR', 'Latin America', -23.4356, -46.4731, -3, 1],
  ['EZE', 'Buenos Aires', 'Ezeiza', 'AR', 'Latin America', -34.8222, -58.5358, -3, 0],
  ['SCL', 'Santiago', 'Arturo Merino Benítez', 'CL', 'Latin America', -33.393, -70.7858, -4, 0],

  ['LHR', 'London', 'Heathrow', 'GB', 'Europe', 51.47, -0.4543, 0, 1],
  ['CDG', 'Paris', 'Charles de Gaulle', 'FR', 'Europe', 49.0097, 2.5479, 1, 1],
  ['AMS', 'Amsterdam', 'Schiphol', 'NL', 'Europe', 52.3105, 4.7683, 1, 1],
  ['FRA', 'Frankfurt', 'Frankfurt am Main', 'DE', 'Europe', 50.0379, 8.5622, 1, 1],
  ['MUC', 'Munich', 'Franz Josef Strauss', 'DE', 'Europe', 48.3537, 11.775, 1, 0],
  ['ZRH', 'Zurich', 'Zurich', 'CH', 'Europe', 47.4582, 8.5555, 1, 0],
  ['VIE', 'Vienna', 'Vienna International', 'AT', 'Europe', 48.1103, 16.5697, 1, 0],
  ['BRU', 'Brussels', 'Brussels', 'BE', 'Europe', 50.9014, 4.4844, 1, 0],
  ['CPH', 'Copenhagen', 'Kastrup', 'DK', 'Europe', 55.618, 12.6508, 1, 0],
  ['HEL', 'Helsinki', 'Helsinki-Vantaa', 'FI', 'Europe', 60.3172, 24.9633, 2, 0],
  ['WAW', 'Warsaw', 'Chopin', 'PL', 'Europe', 52.1657, 20.9671, 1, 0],
  ['MAD', 'Madrid', 'Barajas', 'ES', 'Europe', 40.4983, -3.5676, 1, 0],
  ['BCN', 'Barcelona', 'El Prat', 'ES', 'Europe', 41.2974, 2.0833, 1, 0],
  ['LIS', 'Lisbon', 'Humberto Delgado', 'PT', 'Europe', 38.7742, -9.1342, 0, 0],
  ['FCO', 'Rome', 'Fiumicino', 'IT', 'Europe', 41.8003, 12.2389, 1, 0],
  ['ATH', 'Athens', 'Eleftherios Venizelos', 'GR', 'Europe', 37.9364, 23.9445, 2, 0],
  ['DUB', 'Dublin', 'Dublin', 'IE', 'Europe', 53.4264, -6.2499, 0, 0],
  ['IST', 'Istanbul', 'Istanbul', 'TR', 'Europe', 41.2753, 28.7519, 3, 1],

  ['DXB', 'Dubai', 'Dubai International', 'AE', 'Middle East & Africa', 25.2532, 55.3657, 4, 1],
  ['DOH', 'Doha', 'Hamad', 'QA', 'Middle East & Africa', 25.2731, 51.6081, 3, 1],
  ['AUH', 'Abu Dhabi', 'Zayed International', 'AE', 'Middle East & Africa', 24.433, 54.6511, 4, 0],
  ['RUH', 'Riyadh', 'King Khalid', 'SA', 'Middle East & Africa', 24.9576, 46.6988, 3, 0],
  ['AMM', 'Amman', 'Queen Alia', 'JO', 'Middle East & Africa', 31.7226, 35.9932, 3, 0],
  ['ADD', 'Addis Ababa', 'Bole', 'ET', 'Middle East & Africa', 8.9779, 38.7993, 3, 0],
  ['NBO', 'Nairobi', 'Jomo Kenyatta', 'KE', 'Middle East & Africa', -1.3192, 36.9278, 3, 0],
  ['JNB', 'Johannesburg', 'O. R. Tambo', 'ZA', 'Middle East & Africa', -26.1392, 28.246, 2, 0],
  ['CPT', 'Cape Town', 'Cape Town International', 'ZA', 'Middle East & Africa', -33.9715, 18.6021, 2, 0],

  ['HND', 'Tokyo', 'Haneda', 'JP', 'Asia', 35.5494, 139.7798, 9, 1],
  ['NRT', 'Tokyo', 'Narita', 'JP', 'Asia', 35.772, 140.3929, 9, 0],
  ['ICN', 'Seoul', 'Incheon', 'KR', 'Asia', 37.4602, 126.4407, 9, 1],
  ['TPE', 'Taipei', 'Taoyuan', 'TW', 'Asia', 25.0797, 121.2342, 8, 0],
  ['HKG', 'Hong Kong', 'Hong Kong International', 'HK', 'Asia', 22.308, 113.9185, 8, 1],
  ['PVG', 'Shanghai', 'Pudong', 'CN', 'Asia', 31.1443, 121.8083, 8, 0],
  ['SIN', 'Singapore', 'Changi', 'SG', 'Asia', 1.3644, 103.9915, 8, 1],
  ['BKK', 'Bangkok', 'Suvarnabhumi', 'TH', 'Asia', 13.69, 100.7501, 7, 0],
  ['KUL', 'Kuala Lumpur', 'KLIA', 'MY', 'Asia', 2.7456, 101.7099, 8, 0],
  ['SGN', 'Ho Chi Minh City', 'Tan Son Nhat', 'VN', 'Asia', 10.8188, 106.6519, 7, 0],
  ['DEL', 'Delhi', 'Indira Gandhi', 'IN', 'Asia', 28.5562, 77.1, 5.5, 0],
  ['BOM', 'Mumbai', 'Chhatrapati Shivaji Maharaj', 'IN', 'Asia', 19.0896, 72.8656, 5.5, 0],
  ['CMB', 'Colombo', 'Bandaranaike', 'LK', 'Asia', 7.1808, 79.8841, 5.5, 0],

  ['SYD', 'Sydney', 'Kingsford Smith', 'AU', 'Oceania', -33.9399, 151.1753, 10, 1],
  ['MEL', 'Melbourne', 'Tullamarine', 'AU', 'Oceania', -37.669, 144.841, 10, 0],
  ['BNE', 'Brisbane', 'Brisbane', 'AU', 'Oceania', -27.3842, 153.1175, 10, 0],
  ['PER', 'Perth', 'Perth', 'AU', 'Oceania', -31.9385, 115.9672, 8, 0],
  ['AKL', 'Auckland', 'Auckland', 'NZ', 'Oceania', -37.0082, 174.785, 12, 0],
];

export const AIRPORTS = RAW.map(([iata, city, name, country, region, lat, lon, tz, focus]) => ({
  iata, city, name, country, region, lat, lon, tz, focus: focus === 1,
}));

export const airportByIata = new Map(AIRPORTS.map((a) => [a.iata, a]));

export function airportLabel(iata) {
  const a = airportByIata.get(iata);
  return a ? `${a.city} (${a.iata})` : iata;
}

export function regionOf(iata) {
  return airportByIata.get(iata)?.region ?? 'Other';
}

// Accepts "JFK", "jfk, ewr", "Tokyo", "Tokyo (HND)", "Europe" or any
// comma-separated mix. Returns a sorted list of IATA codes, or null when
// nothing resolves. Unknown tokens that look like IATA codes are kept so
// imported datasets can use airports we don't list.
export function resolveLocation(input) {
  if (!input || !String(input).trim()) return null;
  const out = new Set();
  for (const raw of String(input).split(',')) {
    const token = raw.trim();
    if (!token) continue;
    const lower = token.toLowerCase();
    const region = REGIONS.find((r) => r.toLowerCase() === lower);
    const inParens = token.match(/\(([A-Za-z]{3})\)\s*$/);
    const cityMatches = AIRPORTS.filter((a) => a.city.toLowerCase() === lower);
    if (region) {
      for (const a of AIRPORTS) if (a.region === region) out.add(a.iata);
    } else if (inParens) {
      out.add(inParens[1].toUpperCase());
    } else if (cityMatches.length) {
      for (const a of cityMatches) out.add(a.iata);
    } else if (/^[a-z]{3}$/i.test(token)) {
      out.add(token.toUpperCase());
    }
  }
  return out.size ? [...out].sort() : null;
}

export function isRegion(input) {
  return REGIONS.some((r) => r.toLowerCase() === String(input ?? '').trim().toLowerCase());
}
