export const CABINS = ['economy', 'premium', 'business', 'first'];

export const CABIN_LABEL = {
  economy: 'Economy',
  premium: 'Premium economy',
  business: 'Business',
  first: 'First',
};

export const CABIN_SHORT = {
  economy: 'Economy',
  premium: 'Premium',
  business: 'Business',
  first: 'First',
};

export const CABIN_RANK = { economy: 0, premium: 1, business: 2, first: 3 };

const LOCALE = 'en-US';
const numberFmt = new Intl.NumberFormat(LOCALE);
const usdFmt = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const shortDateFmt = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const longDateFmt = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const monthFmt = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric', timeZone: 'UTC' });

const asDate = (iso) => new Date(iso + 'T00:00:00Z');

export function fmtNumber(n) {
  return numberFmt.format(n);
}

export function fmtMilesShort(n) {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return (Number.isInteger(k) ? k : k.toFixed(k < 100 ? 1 : 0).replace(/\.0$/, '')) + 'k';
}

export function fmtUsd(n) {
  return usdFmt.format(n);
}

export function fmtDate(iso) {
  return shortDateFmt.format(asDate(iso));
}

export function fmtDateLong(iso) {
  return longDateFmt.format(asDate(iso));
}

export function fmtMonth(iso) {
  return monthFmt.format(asDate(iso));
}

export function fmtDuration(hours) {
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function fmtScore(score) {
  return score.toFixed(1) + '×';
}

export function fmtCpm(cpm) {
  return cpm.toFixed(1) + '¢';
}

export function plural(n, one, many = one + 's') {
  return `${fmtNumber(n)} ${n === 1 ? one : many}`;
}

export function fmtStops(stops) {
  return stops === 0 ? 'Nonstop' : stops === 1 ? '1 stop' : `${stops} stops`;
}

const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export function fmtDateTime(iso) {
  return dateTimeFmt.format(new Date(iso));
}

export function hoursSince(iso, now = Date.now()) {
  return (now - Date.parse(iso)) / 3600000;
}
