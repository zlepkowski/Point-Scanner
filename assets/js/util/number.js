// Postel's law for amounts: accept "90000", "90,000", "90 000", "90k", "1.5m",
// "$250" or "75k points" and return a whole number, or null when empty or
// unreadable (callers treat null as "no limit").
export function parseAmount(input) {
  if (input === undefined || input === null) return null;
  const s = String(input)
    .trim()
    .toLowerCase()
    .replace(/[$€£,\s_]/g, '')
    .replace(/(miles?|points?|pts|usd)$/, '');
  const m = s.match(/^(\d+(?:\.\d+)?)(k|m)?$/);
  if (!m) return null;
  const n = Number(m[1]) * (m[2] === 'k' ? 1e3 : m[2] === 'm' ? 1e6 : 1);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}
