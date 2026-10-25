// Build src/lib/geo/holidays.json: national public holidays 2026-2027 for the launch countries.
// Source: date-holidays (https://github.com/commenthol/date-holidays), code ISC, holiday data CC-BY-3.0 (attribution required).
// It is a dev-time tool only: install it in a throwaway directory, never in the app.
//   mkdir -p /tmp/fermat-dh && cd /tmp/fermat-dh && npm init -y && npm install --ignore-scripts date-holidays
//   node tools/geo_holidays.mjs <app root> /tmp/fermat-dh/node_modules/date-holidays
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const [root, libDir] = process.argv.slice(2);
if (!root || !libDir) throw new Error('Usage: node geo_holidays.mjs <app root> <path to node_modules/date-holidays>');
const require = createRequire(import.meta.url);
const Holidays = require(path.resolve(libDir));
const pkg = require(path.join(path.resolve(libDir), 'package.json'));

const COUNTRIES = ['IN', 'US', 'GB', 'CA', 'AU', 'AE', 'SG', 'DE', 'FR', 'ES', 'NL', 'IE', 'NZ', 'ZA', 'JP', 'IT', 'PT', 'MX', 'BR', 'MY', 'PH', 'SA', 'QA', 'KR', 'HK', 'CH', 'SE', 'BE', 'AT', 'PL'];
const YEARS = [2026, 2027];

const countries = {};
for (const code of COUNTRIES) {
  const hd = new Holidays(code, { languages: ['en'], types: ['public'] });
  const seen = new Set(); const list = [];
  for (const year of YEARS) {
    for (const holiday of hd.getHolidays(year, 'en') || []) {
      if (holiday.type !== 'public' || holiday.substitute) continue;
      const date = holiday.date.slice(0, 10); const key = `${date}|${holiday.name}`;
      if (seen.has(key)) continue; seen.add(key); list.push({ date, name: holiday.name });
    }
  }
  if (!list.length) { console.warn('No holidays for', code); continue; }
  countries[code] = list.sort((a, b) => a.date.localeCompare(b.date));
}
const out = {
  source: `date-holidays ${pkg.version} (npm), https://github.com/commenthol/date-holidays`,
  license: 'Holiday data CC-BY-3.0, code ISC',
  attribution: 'Public holidays from date-holidays by commenthol and contributors, CC-BY-3.0',
  fetchedAt: new Date().toISOString().slice(0, 10),
  years: YEARS,
  note: 'National public holidays only (no regional or observance days). Lunar dates can shift by a day; verify locally. India also keeps src/lib/indiaHolidays.json (festivals used by the UI).',
  countries,
};
const file = path.join(root, 'src/lib/geo/holidays.json');
writeFileSync(file, `${JSON.stringify(out)}\n`);
console.log('wrote', file, Object.keys(countries).join(' '));
