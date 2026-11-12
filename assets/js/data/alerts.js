import { loadJson, saveJson } from '../util/storage.js';

export const SAVED_KEY = 'pointscanner:saved:v1';

// A snapshot keeps the cheapest miles per program per date, which is enough
// to tell "new dates opened", "dates gone" and "price dropped" apart.
export function snapshotRoute(routeAwards, { cabin, programId = null }) {
  const days = {};
  for (const a of routeAwards) {
    if (cabin !== 'any' && a.cabin !== cabin) continue;
    if (programId && a.programId !== programId) continue;
    const day = (days[a.date] ??= {});
    if (day[a.programId] == null || a.miles < day[a.programId]) day[a.programId] = a.miles;
  }
  return days;
}

function lowest(days, today) {
  let low = null;
  for (const [date, programs] of Object.entries(days)) {
    if (date < today) continue;
    for (const miles of Object.values(programs)) if (low == null || miles < low) low = miles;
  }
  return low;
}

export function diffSnapshots(prev, curr, today, targetMiles = null) {
  const opened = [];
  const closed = [];
  const drops = [];
  const targetHits = [];

  for (const date of Object.keys(curr).sort()) {
    if (date < today) continue;
    const before = prev[date];
    if (!before) {
      opened.push(date);
    } else {
      for (const [programId, miles] of Object.entries(curr[date])) {
        if (before[programId] != null && miles < before[programId]) {
          drops.push({ date, programId, from: before[programId], to: miles });
        }
      }
    }
    if (targetMiles) {
      const nowMin = Math.min(...Object.values(curr[date]));
      const beforeMin = before ? Math.min(...Object.values(before)) : Infinity;
      if (nowMin <= targetMiles && beforeMin > targetMiles) targetHits.push({ date, miles: nowMin });
    }
  }
  for (const date of Object.keys(prev).sort()) {
    if (date >= today && !curr[date]) closed.push(date);
  }

  const prevLow = lowest(prev, today);
  const currLow = lowest(curr, today);
  return {
    opened,
    closed,
    drops,
    targetHits,
    prevLow,
    currLow,
    newLow: currLow != null && (prevLow == null || currLow < prevLow),
  };
}

export function isNoteworthy(diff) {
  return diff.opened.length > 0 || diff.drops.length > 0 || diff.targetHits.length > 0 || diff.newLow;
}

export function savedId({ from, to, cabin, programId }) {
  return [from, to, cabin, programId || 'all'].join('|');
}

export function listSaved() {
  const list = loadJson(SAVED_KEY, []);
  return Array.isArray(list) ? list : [];
}

function write(list) {
  saveJson(SAVED_KEY, list);
}

export function findSaved(query) {
  const id = savedId(query);
  return listSaved().find((s) => s.id === id) ?? null;
}

export function addSaved({ from, to, cabin, programId = null, targetMiles = null }, routeAwards, now = new Date()) {
  const id = savedId({ from, to, cabin, programId });
  const list = listSaved().filter((s) => s.id !== id);
  const entry = {
    id,
    from,
    to,
    cabin,
    programId,
    targetMiles,
    createdAt: now.toISOString(),
    seenAt: now.toISOString(),
    snapshot: snapshotRoute(routeAwards, { cabin, programId }),
  };
  list.push(entry);
  write(list);
  return entry;
}

export function removeSaved(id) {
  write(listSaved().filter((s) => s.id !== id));
}

export function markSeen(id, routeAwards, now = new Date()) {
  write(
    listSaved().map((s) =>
      s.id === id ? { ...s, seenAt: now.toISOString(), snapshot: snapshotRoute(routeAwards, s) } : s,
    ),
  );
}

export function setTarget(id, targetMiles) {
  write(listSaved().map((s) => (s.id === id ? { ...s, targetMiles: targetMiles || null } : s)));
}

export function evaluateSaved(getRouteAwards, today) {
  return listSaved().map((saved) => {
    const current = snapshotRoute(getRouteAwards(saved.from, saved.to), saved);
    const diff = diffSnapshots(saved.snapshot ?? {}, current, today, saved.targetMiles);
    return { saved, current, diff, noteworthy: isNoteworthy(diff) };
  });
}
