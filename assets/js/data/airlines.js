// yq: how heavily the carrier's fuel/carrier surcharges hit award tickets.
// first: whether the carrier sells a true first-class cabin on long-haul.
const RAW = [
  ['AC', 'Air Canada', 'Star Alliance', ['YYZ', 'YVR', 'YUL'], 0, 'mid'],
  ['UA', 'United', 'Star Alliance', ['EWR', 'ORD', 'SFO', 'IAD', 'DEN', 'IAH', 'LAX'], 0, 'low'],
  ['LH', 'Lufthansa', 'Star Alliance', ['FRA', 'MUC'], 1, 'high'],
  ['LX', 'Swiss', 'Star Alliance', ['ZRH'], 1, 'high'],
  ['OS', 'Austrian', 'Star Alliance', ['VIE'], 0, 'high'],
  ['SN', 'Brussels Airlines', 'Star Alliance', ['BRU'], 0, 'high'],
  ['TK', 'Turkish Airlines', 'Star Alliance', ['IST'], 0, 'mid'],
  ['SQ', 'Singapore Airlines', 'Star Alliance', ['SIN'], 1, 'mid'],
  ['NH', 'ANA', 'Star Alliance', ['HND', 'NRT'], 1, 'mid'],
  ['TG', 'Thai Airways', 'Star Alliance', ['BKK'], 0, 'mid'],
  ['NZ', 'Air New Zealand', 'Star Alliance', ['AKL'], 0, 'mid'],
  ['ET', 'Ethiopian', 'Star Alliance', ['ADD'], 0, 'low'],
  ['AV', 'Avianca', 'Star Alliance', ['BOG'], 0, 'low'],
  ['CM', 'Copa', 'Star Alliance', ['PTY'], 0, 'low'],
  ['TP', 'TAP Air Portugal', 'Star Alliance', ['LIS'], 0, 'mid'],
  ['LO', 'LOT Polish', 'Star Alliance', ['WAW'], 0, 'mid'],
  ['AI', 'Air India', 'Star Alliance', ['DEL', 'BOM'], 0, 'low'],

  ['AA', 'American Airlines', 'oneworld', ['DFW', 'MIA', 'JFK', 'ORD', 'LAX'], 1, 'low'],
  ['BA', 'British Airways', 'oneworld', ['LHR'], 1, 'high'],
  ['IB', 'Iberia', 'oneworld', ['MAD'], 0, 'mid'],
  ['QF', 'Qantas', 'oneworld', ['SYD', 'MEL', 'BNE', 'PER'], 1, 'mid'],
  ['CX', 'Cathay Pacific', 'oneworld', ['HKG'], 1, 'mid'],
  ['JL', 'Japan Airlines', 'oneworld', ['HND', 'NRT'], 1, 'mid'],
  ['QR', 'Qatar Airways', 'oneworld', ['DOH'], 1, 'mid'],
  ['AY', 'Finnair', 'oneworld', ['HEL'], 0, 'mid'],
  ['AS', 'Alaska Airlines', 'oneworld', ['SEA'], 0, 'low'],
  ['MH', 'Malaysia Airlines', 'oneworld', ['KUL'], 0, 'mid'],
  ['RJ', 'Royal Jordanian', 'oneworld', ['AMM'], 0, 'mid'],
  ['UL', 'SriLankan', 'oneworld', ['CMB'], 0, 'mid'],

  ['DL', 'Delta', 'SkyTeam', ['ATL', 'JFK', 'LAX', 'SEA'], 0, 'low'],
  ['AF', 'Air France', 'SkyTeam', ['CDG'], 1, 'high'],
  ['KL', 'KLM', 'SkyTeam', ['AMS'], 0, 'high'],
  ['KE', 'Korean Air', 'SkyTeam', ['ICN'], 1, 'mid'],
  ['VS', 'Virgin Atlantic', 'SkyTeam', ['LHR'], 0, 'high'],
  ['AM', 'Aeroméxico', 'SkyTeam', ['MEX'], 0, 'low'],
  ['VN', 'Vietnam Airlines', 'SkyTeam', ['SGN'], 0, 'mid'],
  ['CI', 'China Airlines', 'SkyTeam', ['TPE'], 0, 'mid'],
  ['SV', 'Saudia', 'SkyTeam', ['RUH'], 0, 'mid'],
  ['AR', 'Aerolíneas Argentinas', 'SkyTeam', ['EZE'], 0, 'low'],
  ['KQ', 'Kenya Airways', 'SkyTeam', ['NBO'], 0, 'mid'],
  ['SK', 'SAS', 'SkyTeam', ['CPH'], 0, 'mid'],

  ['EK', 'Emirates', 'None', ['DXB'], 1, 'high'],
  ['EY', 'Etihad', 'None', ['AUH'], 1, 'mid'],
  ['LA', 'LATAM', 'None', ['SCL', 'LIM', 'GRU'], 0, 'low'],
  ['EI', 'Aer Lingus', 'None', ['DUB'], 0, 'mid'],
];

export const AIRLINES = RAW.map(([iata, name, alliance, hubs, first, yq]) => ({
  iata, name, alliance, hubs, first: first === 1, yq,
}));

export const airlineByIata = new Map(AIRLINES.map((a) => [a.iata, a]));

export function airlineName(iata) {
  return airlineByIata.get(iata)?.name ?? iata;
}

export const ALLIANCE_MEMBERS = {
  'Star Alliance': AIRLINES.filter((a) => a.alliance === 'Star Alliance').map((a) => a.iata),
  oneworld: AIRLINES.filter((a) => a.alliance === 'oneworld').map((a) => a.iata),
  SkyTeam: AIRLINES.filter((a) => a.alliance === 'SkyTeam').map((a) => a.iata),
};
