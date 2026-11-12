import { ALLIANCE_MEMBERS } from './airlines.js';

const STAR = ALLIANCE_MEMBERS['Star Alliance'];
const ONEWORLD = ALLIANCE_MEMBERS.oneworld;
const SKYTEAM = ALLIANCE_MEMBERS.SkyTeam;

// Partner lists are simplified to alliance membership plus a few well-known
// bilateral partners. They are illustrative, not a booking reference.
export const PROGRAMS = [
  { id: 'aeroplan', name: 'Aeroplan', airline: 'AC', alliance: 'Star Alliance', currency: 'Aeroplan points', color: '#d22630', partners: [...STAR, 'EY', 'EK'] },
  { id: 'united', name: 'MileagePlus', airline: 'UA', alliance: 'Star Alliance', currency: 'United miles', color: '#005daa', partners: [...STAR, 'EI', 'EK'] },
  { id: 'lifemiles', name: 'LifeMiles', airline: 'AV', alliance: 'Star Alliance', currency: 'LifeMiles', color: '#e4002b', partners: [...STAR] },
  { id: 'krisflyer', name: 'KrisFlyer', airline: 'SQ', alliance: 'Star Alliance', currency: 'KrisFlyer miles', color: '#f99f1c', partners: [...STAR, 'VS'] },
  { id: 'ana', name: 'ANA Mileage Club', airline: 'NH', alliance: 'Star Alliance', currency: 'ANA miles', color: '#13448f', partners: [...STAR, 'VS'] },
  { id: 'turkish', name: 'Miles&Smiles', airline: 'TK', alliance: 'Star Alliance', currency: 'Miles&Smiles miles', color: '#c8102e', partners: [...STAR] },
  { id: 'milesandmore', name: 'Miles & More', airline: 'LH', alliance: 'Star Alliance', currency: 'Miles & More miles', color: '#05164d', partners: [...STAR] },

  { id: 'aadvantage', name: 'AAdvantage', airline: 'AA', alliance: 'oneworld', currency: 'AAdvantage miles', color: '#0078d2', partners: [...ONEWORLD, 'EY'] },
  { id: 'atmos', name: 'Atmos Rewards', airline: 'AS', alliance: 'oneworld', currency: 'Atmos points', color: '#01426a', partners: [...ONEWORLD, 'EI'] },
  { id: 'britishairways', name: 'British Airways Club', airline: 'BA', alliance: 'oneworld', currency: 'Avios', color: '#2e5c99', partners: [...ONEWORLD, 'EI'] },
  { id: 'qantas', name: 'Qantas Frequent Flyer', airline: 'QF', alliance: 'oneworld', currency: 'Qantas Points', color: '#e40000', partners: [...ONEWORLD, 'EK'] },
  { id: 'asiamiles', name: 'Asia Miles', airline: 'CX', alliance: 'oneworld', currency: 'Asia Miles', color: '#006564', partners: [...ONEWORLD] },
  { id: 'jal', name: 'JAL Mileage Bank', airline: 'JL', alliance: 'oneworld', currency: 'JAL miles', color: '#cc0000', partners: [...ONEWORLD, 'EK'] },
  { id: 'qatar', name: 'Privilege Club', airline: 'QR', alliance: 'oneworld', currency: 'Avios', color: '#5c0632', partners: [...ONEWORLD] },

  { id: 'flyingblue', name: 'Flying Blue', airline: 'AF', alliance: 'SkyTeam', currency: 'Flying Blue miles', color: '#051039', partners: [...SKYTEAM] },
  { id: 'delta', name: 'SkyMiles', airline: 'DL', alliance: 'SkyTeam', currency: 'SkyMiles', color: '#c01933', partners: [...SKYTEAM, 'LA'] },
  { id: 'virgin', name: 'Flying Club', airline: 'VS', alliance: 'SkyTeam', currency: 'Virgin Points', color: '#da0530', partners: [...SKYTEAM, 'NH', 'SQ'] },
  { id: 'korean', name: 'SKYPASS', airline: 'KE', alliance: 'SkyTeam', currency: 'SKYPASS miles', color: '#00256c', partners: [...SKYTEAM] },

  { id: 'emirates', name: 'Skywards', airline: 'EK', alliance: 'None', currency: 'Skywards Miles', color: '#d71921', partners: ['EK', 'QF'] },
  { id: 'etihad', name: 'Etihad Guest', airline: 'EY', alliance: 'None', currency: 'Etihad Guest Miles', color: '#bd8b13', partners: ['EY', 'AA'] },
];

export const programById = new Map(PROGRAMS.map((p) => [p.id, p]));

export const ALLIANCES = ['Star Alliance', 'oneworld', 'SkyTeam', 'None'];

// Baseline value of one mile/point in US cents. A deal score of 1.0× means an
// award returns exactly this; sweet spots return far more.
export const milesValuationCents = {
  aeroplan: 1.5,
  united: 1.3,
  lifemiles: 1.5,
  krisflyer: 1.4,
  ana: 1.5,
  turkish: 1.4,
  milesandmore: 1.2,
  aadvantage: 1.5,
  atmos: 1.5,
  britishairways: 1.4,
  qantas: 1.2,
  asiamiles: 1.3,
  jal: 1.4,
  qatar: 1.4,
  flyingblue: 1.3,
  delta: 1.2,
  virgin: 1.4,
  korean: 1.5,
  emirates: 1.1,
  etihad: 1.2,
};

export function programName(id) {
  return programById.get(id)?.name ?? id;
}
