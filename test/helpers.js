import { enrich } from '../assets/js/data/store.js';

let nextId = 1;

export function award(overrides = {}) {
  return {
    id: nextId++,
    from: 'JFK',
    to: 'LHR',
    distanceKm: 5540,
    durationHours: 7.3,
    date: '2026-12-01',
    departTime: '18:00',
    cabin: 'business',
    miles: 60000,
    taxesUsd: 100,
    airline: 'AC',
    flightNo: 'AC100',
    programId: 'aeroplan',
    stops: 0,
    seats: 2,
    ...overrides,
  };
}

export function awards(list) {
  return enrich(list.map(award));
}

export function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    clear: () => data.clear(),
    key: (i) => [...data.keys()][i] ?? null,
    get length() {
      return data.size;
    },
  };
}
