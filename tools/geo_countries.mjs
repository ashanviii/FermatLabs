// Snapshot ISO-3166 countries (name, primary currency, continent, Schengen membership) into src/lib/geo/countries.json.
// Source: annexare/Countries (MIT) https://github.com/annexare/Countries. No flags are copied.
// Usage: NODE_USE_ENV_PROXY=1 node tools/geo_countries.mjs <app root>
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.argv[2];
if (!root) throw new Error('Usage: node geo_countries.mjs <app root>');
const URL = 'https://raw.githubusercontent.com/annexare/Countries/main/dist/countries.min.json';

// Full Schengen members as of 2025 (Bulgaria and Romania joined fully on 2025-01-01). Used for the 45-day visa lead time.
const SCHENGEN = ['AT', 'BE', 'BG', 'CH', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'];

const response = await fetch(URL);
if (!response.ok) throw new Error(`annexare/Countries returned ${response.status}`);
const raw = await response.json();
const fx = JSON.parse(readFileSync(path.join(root, 'src/lib/geo/fx.json'), 'utf8'));

const countries = {};
for (const code of Object.keys(raw).sort()) {
  const item = raw[code];
  const currencies = item.currency || [];
  // Prefer a currency we hold a rate for (e.g. CHF over CHE/CHW, USD over USN).
  const currency = currencies.find((c) => fx.rates[c]) || currencies[0] || null;
  countries[code] = { name: item.name, currency, continent: item.continent, ...(SCHENGEN.includes(code) ? { schengen: true } : {}) };
}
const out = {
  source: URL,
  license: 'MIT (annexare/Countries, Copyright (c) 2014 Annexare Studio)',
  fetchedAt: new Date().toISOString().slice(0, 10),
  note: 'ISO-3166 alpha-2 -> English name, primary ISO-4217 currency, continent code. schengen marks full Schengen members.',
  countries,
};
const file = path.join(root, 'src/lib/geo/countries.json');
writeFileSync(file, `${JSON.stringify(out)}\n`);
console.log('wrote', file, Object.keys(countries).length, 'countries');
