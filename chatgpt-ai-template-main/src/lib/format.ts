/**
 * Display formatting helpers for Fermat screens. Pure functions, no domain logic.
 * Import: import { formatINR, formatDateRange, plural } from '@/lib/format';
 */

const inrFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const numberFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** ₹1,50,000. Non-finite input renders as an em dash. */
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return '—';
  return inrFormatter.format(Math.round(amount));
}

/**
 * Short Indian-style money for tight spaces: ₹850, ₹12k, ₹1.5L, ₹2.3Cr.
 * Use in pills, stat tiles and cards. Use formatINR when the exact amount matters (payments).
 */
export function formatINRCompact(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return '—';
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  const trim = (value: number) => (value >= 10 ? Math.round(value).toString() : value.toFixed(1).replace(/\.0$/, ''));
  if (abs >= 1e7) return `${sign}₹${trim(abs / 1e7)}Cr`;
  if (abs >= 1e5) return `${sign}₹${trim(abs / 1e5)}L`;
  if (abs >= 1e3) return `${sign}₹${trim(abs / 1e3)}k`;
  return `${sign}₹${Math.round(abs)}`;
}

/** "~₹42,000" for estimates. */
export function formatApproxINR(amount: number | null | undefined, compact = false): string {
  const value = compact ? formatINRCompact(amount) : formatINR(amount);
  return value === '—' ? value : `~${value}`;
}

/** "₹38,000–₹46,000"; collapses to one value when min === max. */
export function formatINRRange(min: number, max: number, compact = false): string {
  const f = compact ? formatINRCompact : formatINR;
  return Math.round(min) === Math.round(max) ? f(min) : `${f(min)}–${f(max)}`;
}

// Locale per trip currency: the home convention for the symbol and grouping ($ for USD/CAD/AUD, en-IN lakh grouping for INR).
// Anything else uses en-US, which prints an unambiguous code or symbol (MX$, AED, ¥).
const MONEY_LOCALES: Record<string, string> = {
  INR: 'en-IN', USD: 'en-US', CAD: 'en-CA', AUD: 'en-AU', NZD: 'en-NZ', GBP: 'en-GB', EUR: 'en-IE', SGD: 'en-SG', AED: 'en-AE', ZAR: 'en-ZA', JPY: 'en-US',
};
const moneyFormatters = new Map<string, Intl.NumberFormat>();
function moneyFormatter(currency: string, compact: boolean): Intl.NumberFormat {
  const key = `${currency}|${compact}`;
  let formatter = moneyFormatters.get(key);
  if (!formatter) {
    const locale = MONEY_LOCALES[currency] ?? 'en-US';
    try {
      formatter = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: compact ? 1 : 0, minimumFractionDigits: 0, ...(compact ? { notation: 'compact' as const } : {}) });
    } catch {
      // Unknown currency code: plain "XYZ 1,234" rather than throwing during render.
      formatter = { format: (value: number) => `${currency} ${numberFormatter.format(value)}` } as Intl.NumberFormat;
    }
    moneyFormatters.set(key, formatter);
  }
  return formatter;
}

/**
 * Whole amounts in the trip currency: formatMoney(150000, 'INR') -> "₹1,50,000", formatMoney(2400, 'USD') -> "$2,400",
 * formatMoney(1890, 'EUR') -> "€1,890". { compact: true } -> "₹1.5L", "$2.4K", "€1.9K" for pills and tiles.
 * INR output is identical to formatINR / formatINRCompact. Non-finite input renders as an em dash.
 */
export function formatMoney(amount: number | null | undefined, currency = 'INR', options: { compact?: boolean } = {}): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return '—';
  if (currency === 'INR') return options.compact ? formatINRCompact(amount) : formatINR(amount);
  const value = options.compact ? amount : Math.round(amount);
  return moneyFormatter(currency, Boolean(options.compact)).format(value);
}

/** "~$2,400" for estimates in any currency. */
export function formatApproxMoney(amount: number | null | undefined, currency = 'INR', options: { compact?: boolean } = {}): string {
  const value = formatMoney(amount, currency, options);
  return value === '—' ? value : `~${value}`;
}

/** 1,50,000 (no currency symbol). */
export function formatNumber(value: number): string {
  return Number.isFinite(value) ? numberFormatter.format(value) : '—';
}

/** Parse 'YYYY-MM-DD' (or a full ISO string) as a UTC calendar date, so days never shift with the viewer's timezone. */
function toUtcDate(iso: string): Date | null {
  if (!iso) return null;
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00Z` : iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export type DateStyle = 'short' | 'medium' | 'long' | 'weekday';
const dateOptions: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  short: { day: 'numeric', month: 'short' }, // 12 Dec
  medium: { day: 'numeric', month: 'short', year: 'numeric' }, // 12 Dec 2026
  long: { weekday: 'long', day: 'numeric', month: 'long' }, // Saturday, 12 December
  weekday: { weekday: 'short', day: 'numeric', month: 'short' }, // Sat, 12 Dec
};

/** formatDate('2026-12-12') -> "12 Dec"; style 'medium' adds the year, 'weekday' -> "Sat, 12 Dec". */
export function formatDate(iso: string, style: DateStyle = 'short'): string {
  const date = toUtcDate(iso);
  return date ? date.toLocaleDateString('en-IN', { ...dateOptions[style], timeZone: 'UTC' }) : '—';
}

/** "12–16 Dec", "28 Dec – 2 Jan", "28 Dec 2026 – 2 Jan 2027" (year shown only when it changes). */
export function formatDateRange(startIso: string, endIso: string): string {
  const start = toUtcDate(startIso);
  const end = toUtcDate(endIso);
  if (!start || !end) return '—';
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();
  const month = (d: Date) => d.toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' });
  if (sameMonth) return start.getUTCDate() === end.getUTCDate() ? `${start.getUTCDate()} ${month(start)}` : `${start.getUTCDate()}–${end.getUTCDate()} ${month(end)}`;
  if (sameYear) return `${start.getUTCDate()} ${month(start)} – ${end.getUTCDate()} ${month(end)}`;
  return `${formatDate(startIso, 'medium')} – ${formatDate(endIso, 'medium')}`;
}

/** Whole nights between two 'YYYY-MM-DD' dates. */
export function nightsBetween(startIso: string, endIso: string): number {
  const start = toUtcDate(startIso);
  const end = toUtcDate(endIso);
  if (!start || !end) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000));
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Month labels, index 0 = January. */
export function monthNames(style: 'short' | 'long' = 'short'): string[] {
  return [...(style === 'short' ? MONTHS_SHORT : MONTHS_LONG)];
}

/** 'YYYY-MM' -> "Dec 2031". Returns '' for partial/empty values and "No passport yet" for 'none'. */
export function formatMonthYear(value: string | null | undefined, style: 'short' | 'long' = 'short'): string {
  if (value === 'none') return 'No passport yet';
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value || '');
  if (!match) return '';
  return `${monthNames(style)[Number(match[2]) - 1]} ${match[1]}`;
}

/**
 * plural(2, 'budget') -> "2 budgets"; plural(1, 'person', 'people') -> "1 person".
 * Pass { hideCount: true } to get just the word.
 */
export function plural(count: number, singular: string, pluralForm?: string, options: { hideCount?: boolean } = {}): string {
  const word = count === 1 ? singular : pluralForm ?? `${singular}s`;
  return options.hideCount ? word : `${formatNumber(count)} ${word}`;
}

/** ['Asha', 'Ravi', 'Meera'] -> "Asha, Ravi and Meera". */
export function formatList(items: string[], conjunction: 'and' | 'or' = 'and'): string {
  const list = items.filter(Boolean);
  if (list.length <= 1) return list[0] ?? '';
  return `${list.slice(0, -1).join(', ')} ${conjunction} ${list[list.length - 1]}`;
}

/** "Asha Rao" -> "AR", "meera" -> "ME", "" -> "?". */
export function initials(name: string | null | undefined): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** "3 of 5" style progress label. */
export function formatProgress(done: number, total: number): string {
  return `${formatNumber(done)} of ${formatNumber(total)}`;
}
