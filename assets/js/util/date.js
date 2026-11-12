// All date math runs on "YYYY-MM-DD" strings interpreted as UTC midnight, so
// results never shift with the viewer's time zone or DST.
const DAY_MS = 86400000;

const toUtc = (iso) => Date.parse(iso + 'T00:00:00Z');
const fromUtc = (ms) => new Date(ms).toISOString().slice(0, 10);

export function todayIso(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(iso, n) {
  return fromUtc(toUtc(iso) + n * DAY_MS);
}

export function daysBetween(a, b) {
  return Math.round((toUtc(b) - toUtc(a)) / DAY_MS);
}

// 0 = Sunday … 6 = Saturday
export function dayOfWeek(iso) {
  return new Date(toUtc(iso)).getUTCDay();
}

export function isIsoDate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(toUtc(s));
}

export function dateRange(start, count) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(addDays(start, i));
  return out;
}

export function thanksgiving(year) {
  const nov1 = dayOfWeek(`${year}-11-01`);
  const firstThu = 1 + ((4 - nov1 + 7) % 7);
  return `${year}-11-${String(firstThu + 21).padStart(2, '0')}`;
}

export function parseHm(hm) {
  if (typeof hm !== 'string' || !/^\d{2}:\d{2}$/.test(hm)) return null;
  const [h, m] = hm.split(':').map(Number);
  return h < 24 && m < 60 ? h * 60 + m : null;
}

export function fmtHm(minutes) {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
