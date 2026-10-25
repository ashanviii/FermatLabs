// Trip-currency helpers shared by the plan, money and payment panels. Amounts are whole units of trip.currency.
import { formatMoney } from '@/lib/format';

/** The trip's currency; old projections without one are Indian (INR). */
export const tripCurrency = (trip: any): string => trip?.currency || trip?.activePlan?.currency || 'INR';

/** The trip's home country (ISO2); old projections without one are Indian. */
export const tripHome = (trip: any): string => trip?.homeCountry || 'IN';

/** Just the symbol or code for input adornments: rupee, dollar, euro, "MX$", yen. */
export const currencySymbol = (currency: string): string => formatMoney(0, currency).replace(/[\d\s., ]/g, '') || currency;

/** Compact money for tight spaces. INR keeps lakh precision (80k, 1.04L); others use the locale's compact form ($2.4K). */
export function compactMoney(amount: number, currency: string): string {
  if (currency === 'INR' && amount >= 1e5 && amount < 1e7) return `${currencySymbol(currency)}${(amount / 1e5).toFixed(2).replace(/\.?0+$/, '')}L`;
  // Under 10,000 the full amount is short enough ($1,885 reads better than $1.9K).
  if (currency !== 'INR' && Math.abs(amount) < 1e4) return formatMoney(amount, currency);
  return formatMoney(amount, currency, { compact: true });
}

/** "~80k" style, with the currency symbol, for estimates. */
export const approxMoney = (amount: number, currency: string): string => `~${compactMoney(amount, currency)}`;
