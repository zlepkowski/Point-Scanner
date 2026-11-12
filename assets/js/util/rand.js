export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a, 32-bit.
export function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function seeded(key) {
  return mulberry32(hashString(key));
}

export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

export function pickWeighted(rng, entries) {
  let total = 0;
  for (const [, w] of entries) total += w;
  let r = rng() * total;
  for (const [value, w] of entries) {
    r -= w;
    if (r < 0) return value;
  }
  return entries[entries.length - 1][0];
}

export function intBetween(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function between(rng, min, max) {
  return min + rng() * (max - min);
}

// Award charts publish round numbers; dynamic programs still land on 100s.
export function roundToChart(miles, dynamic = false) {
  if (dynamic) return Math.max(500, Math.round(miles / 100) * 100);
  const step = miles < 30000 ? 500 : 2500;
  return Math.max(step, Math.round(miles / step) * step);
}
