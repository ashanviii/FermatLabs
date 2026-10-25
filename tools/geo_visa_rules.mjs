// Build src/lib/geo/visaRules.json from ilyankou/passport-index-dataset (MIT) https://github.com/ilyankou/passport-index-dataset.
// Compact encoding: `destinations` is the ordered list of destination ISO2 codes; rules[passport] is a string with one
// character per destination:
//   H home country   R visa required   E e-visa   T eta (electronic travel authorisation)   V visa on arrival
//   X no admission   F visa free (days not stated)   a..q visa free for N days (see freeDays)   - no data
// Usage: NODE_USE_ENV_PROXY=1 node tools/geo_visa_rules.mjs <app root>
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.argv[2];
if (!root) throw new Error('Usage: node geo_visa_rules.mjs <app root>');
const URL = 'https://raw.githubusercontent.com/ilyankou/passport-index-dataset/master/passport-index-tidy-iso2.csv';

const response = await fetch(URL);
if (!response.ok) throw new Error(`passport-index-dataset returned ${response.status}`);
const rows = (await response.text()).trim().split(/\r?\n/).slice(1).map((line) => line.split(','));
const commit = await fetch('https://api.github.com/repos/ilyankou/passport-index-dataset/commits?per_page=1').then((r) => (r.ok ? r.json() : [])).catch(() => []);

const passports = [...new Set(rows.map((r) => r[0]))].sort();
const destinations = [...new Set(rows.map((r) => r[1]))].sort();
const freeDays = [...new Set(rows.map((r) => r[2]).filter((v) => /^\d+$/.test(v) && Number(v) > 0).map(Number))].sort((a, b) => a - b);
if (freeDays.length > 17) throw new Error('Too many distinct visa-free durations for the a..q encoding');
const letter = (days) => String.fromCharCode(97 + freeDays.indexOf(days));
const encode = (value) => {
  if (value === '-1') return 'H';
  if (/^\d+$/.test(value)) return letter(Number(value));
  return { 'visa required': 'R', 'e-visa': 'E', eta: 'T', 'visa on arrival': 'V', 'no admission': 'X', 'visa free': 'F' }[value] || (() => { throw new Error(`Unknown requirement: ${value}`); })();
};
const index = Object.fromEntries(destinations.map((code, i) => [code, i]));
const rules = {};
for (const passport of passports) rules[passport] = Array(destinations.length).fill('-');
for (const [passport, dest, value] of rows) rules[passport][index[dest]] = encode(value);
for (const passport of passports) { rules[passport][index[passport]] = 'H'; rules[passport] = rules[passport].join(''); }

const out = {
  source: URL,
  license: 'MIT (ilyankou/passport-index-dataset, Copyright (c) 2019 Ilya Ilyankou); data compiled from Passport Index',
  datasetUpdatedAt: commit?.[0]?.commit?.committer?.date?.slice(0, 10) || null,
  fetchedAt: new Date().toISOString().slice(0, 10),
  note: 'Indicative only: always check the official source before booking. See header of tools/geo_visa_rules.mjs for the encoding.',
  encoding: { H: 'home', R: 'required', E: 'evisa', T: 'eta', V: 'voa', X: 'noAdmission', F: 'free', '-': 'unknown' },
  freeDays,
  destinations,
  rules,
};
const file = path.join(root, 'src/lib/geo/visaRules.json');
writeFileSync(file, `${JSON.stringify(out)}\n`);
console.log('wrote', file, passports.length, 'passports x', destinations.length, 'destinations');
