// Snapshot exchange rates (units of each currency per 1 USD) into src/lib/geo/fx.json.
// Source: Frankfurter API v2 (https://frankfurter.dev), free, no key. Software MIT; rates are central-bank
// reference rates whose provider terms are listed at https://frankfurter.dev/license/.
// Usage (behind the corporate proxy): NODE_USE_ENV_PROXY=1 node tools/geo_fx.mjs <app root>
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.argv[2];
if (!root) throw new Error('Usage: node geo_fx.mjs <app root>');

// Must-have currencies (launch markets, departure cities, destinations); the snapshot keeps every rate Frankfurter returns
// so any country's home currency usually works. The run fails if one of these is missing.
const WANTED = [
  'INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'SGD', 'AED', 'SAR', 'QAR', 'OMR', 'KWD', 'BHD', 'JPY', 'KRW', 'CNY', 'HKD', 'TWD',
  'THB', 'IDR', 'VND', 'MYR', 'PHP', 'LKR', 'NPR', 'BDT', 'PKR', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'TRY', 'ILS',
  'MXN', 'BRL', 'ARS', 'CLP', 'COP', 'PEN', 'ZAR', 'EGP', 'KES', 'NGN', 'MAD', 'ISK',
];

const response = await fetch('https://api.frankfurter.dev/v2/rates?base=USD');
if (!response.ok) throw new Error(`Frankfurter returned ${response.status}`);
const rows = await response.json();
const byQuote = Object.fromEntries(rows.map((row) => [row.quote, row]));
const rates = { USD: 1 };
const dates = new Set();
const missing = WANTED.filter((code) => code !== 'USD' && !(byQuote[code]?.rate > 0));
if (missing.length) throw new Error(`No rate for ${missing.join(', ')}`);
for (const code of [...WANTED, ...Object.keys(byQuote).sort()]) {
  const row = byQuote[code];
  if (code === 'USD' || rates[code] || !(row?.rate > 0)) continue;
  rates[code] = row.rate; dates.add(row.date);
}
const sorted = [...dates].sort();
const out = {
  source: 'Frankfurter API v2 https://api.frankfurter.dev/v2/rates?base=USD',
  license: 'Frankfurter software MIT; central-bank reference rates, provider terms at https://frankfurter.dev/license/',
  attribution: 'Exchange rates from Frankfurter (frankfurter.dev), central-bank reference data',
  fetchedAt: new Date().toISOString().slice(0, 10),
  rateDates: { from: sorted[0], to: sorted[sorted.length - 1] },
  base: 'USD',
  note: 'Units of each currency per 1 USD. Snapshot for estimates only; refresh with tools/geo_fx.mjs.',
  rates,
};
const file = path.join(root, 'src/lib/geo/fx.json');
writeFileSync(file, `${JSON.stringify(out, null, 1)}\n`);
console.log('wrote', file, Object.keys(rates).length, 'currencies');
