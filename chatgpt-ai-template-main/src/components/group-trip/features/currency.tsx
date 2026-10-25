'use client';
// Money helpers shared by the feature panels: every amount is a whole number in the trip currency (trip.currency).
import { Input, type InputProps } from '@/components/ui/field';
import { formatMoney } from '@/lib/format';
import fx from '@/lib/geo/fx.json';

const rates = fx.rates as Record<string, number>;
const INR_CAP = 10000000;

/** The trip's ISO-4217 currency; trips saved before currencies existed are in rupees. */
export const tripCurrency = (trip: any): string => trip?.currency || 'INR';
/** The group's ISO-2 home country; old trips are Indian. */
export const tripHomeCountry = (trip: any): string => trip?.homeCountry || 'IN';

/** Mirrors the engine's per-currency cap: one crore rupees or its equivalent, never below 10,000,000 units. */
export function maxAmountFor(currency: string): number {
  if (currency === 'INR' || !rates[currency] || !rates.INR) return INR_CAP;
  return Math.max(INR_CAP, Math.round((INR_CAP / rates.INR) * rates[currency]));
}

/** A round input step worth about ₹1,000 in the trip currency: 1000 for INR, 10 for USD/EUR/GBP, 1000 for JPY. */
export function moneyStep(currency: string): number {
  if (currency === 'INR' || !rates[currency] || !rates.INR) return 1000;
  return 10 ** Math.max(0, Math.round(Math.log10((1000 / rates.INR) * rates[currency])));
}

/** Rounds up to the currency's step, never below one step. */
export const roundUpMoney = (value: number, currency: string) => { const step = moneyStep(currency); return Math.max(step, Math.ceil(value / step) * step); };

/** "₹", "$", "€", "¥"; multi-letter forms like "MX$" or "AED" for currencies without a one-character symbol. */
export function currencySymbol(currency: string): string {
  return formatMoney(0, currency).replace(/[\d.,\s\u00A0\u202F-]/g, '') || currency;
}

/** "whole rupees" for INR, otherwise a neutral phrase. */
export const wholeUnits = (currency: string) => (currency === 'INR' ? 'whole rupees' : 'a whole amount');

/** Number input with the trip currency's symbol inside the left edge, or its ISO code on the right when the symbol is long. */
export function MoneyInput({ currency, ...props }: Omit<InputProps, 'leading' | 'trailing'> & { currency: string }) {
  const symbol = currencySymbol(currency);
  const short = symbol.length === 1;
  return <Input type="number" inputMode="numeric" min={1} max={maxAmountFor(currency)} {...props} {...(short ? { leading: symbol } : { trailing: currency })} />;
}
