import { loadJson, saveJson } from '../util/storage.js';
import { programById } from './programs.js';

export const WALLET_KEY = 'pointscanner:wallet:v1';
export const STRETCH_RATIO = 1.15;

export function loadWallet() {
  const list = loadJson(WALLET_KEY, []);
  return Array.isArray(list) ? list.filter((b) => programById.has(b.programId) && b.amount > 0) : [];
}

export function saveWallet(balances) {
  saveJson(WALLET_KEY, balances);
}

export function parseBalances(str) {
  if (!str) return [];
  const out = [];
  for (const part of String(str).split(',')) {
    const [programId, amount] = part.split(':');
    const n = Number(amount);
    if (programById.has(programId) && Number.isFinite(n) && n > 0) out.push({ programId, amount: Math.round(n) });
  }
  return out;
}

export function formatBalances(balances) {
  return balances.map((b) => `${b.programId}:${b.amount}`).join(',');
}

// "I have X in program Y — what can I fly?" Ranks by deal score so the
// answer favours good value, not merely the cheapest seat in the program.
export function walletMatches(awardsForProgram, balances, { from = null, cabins = null, limit = 30 } = {}) {
  const fromSet = from ? new Set(from) : null;
  const cabinSet = cabins ? new Set(cabins) : null;
  const programs = balances.map(({ programId, amount }) => {
    const affordable = [];
    const stretch = [];
    const destinations = new Set();
    const bestByCabin = {};
    for (const a of awardsForProgram(programId)) {
      if (fromSet && !fromSet.has(a.from)) continue;
      if (cabinSet && !cabinSet.has(a.cabin)) continue;
      if (a.miles <= amount) {
        affordable.push(a);
        destinations.add(a.to);
        const best = bestByCabin[a.cabin];
        if (!best || a.score > best.score) bestByCabin[a.cabin] = a;
      } else if (a.miles <= amount * STRETCH_RATIO) {
        stretch.push(a);
      }
    }
    affordable.sort((x, y) => y.score - x.score || x.miles - y.miles);
    stretch.sort((x, y) => x.miles - y.miles || y.score - x.score);
    return {
      programId,
      amount,
      affordableCount: affordable.length,
      destinationCount: destinations.size,
      affordable: affordable.slice(0, limit),
      stretchCount: stretch.length,
      stretch: stretch.slice(0, 6),
      bestByCabin,
    };
  });

  const overall = programs
    .flatMap((p) => p.affordable)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit);
  return { programs, overall };
}
