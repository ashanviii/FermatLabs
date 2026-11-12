const fs = require('node:fs');
const path = require('node:path');
const geo = require('./index');

const DATA_FILE = path.join(process.cwd(), 'data/cities.json');
const normalize = (value) => String(value).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().trim();
const PLACE_ID = /^(?:geonames:\d{1,12}|ourairports:[A-Z0-9]{3,4})$/;

function validCity(city) {
  return city && /^geonames:\d{1,12}$/.test(city.id) && typeof city.name === 'string' && city.name.length > 0 && city.name.length <= 200 &&
    typeof city.label === 'string' && city.label.length <= 400 && geo.isCountry(city.countryCode) &&
    Number.isFinite(city.lat) && city.lat >= -90 && city.lat <= 90 && Number.isFinite(city.lon) && city.lon >= -180 && city.lon <= 180;
}

function createCityDirectory(snapshot) {
  const usable = snapshot?.source === 'GeoNames' && Array.isArray(snapshot.cities) && typeof snapshot.fetchedAt === 'string';
  const source = usable ? 'GeoNames' : 'OurAirports';
  const fetchedAt = usable ? snapshot.fetchedAt : geo.sources.departureCities.fetchedAt;
  const byId = new Map();
  const entries = [];
  for (const city of usable ? snapshot.cities : geo.departureCities) {
    if (usable && (!validCity(city) || byId.has(city.id))) continue;
    const record = usable ? { id: city.id, name: city.name, label: city.label, countryCode: city.countryCode, lat: city.lat, lon: city.lon, source: 'GeoNames', fetchedAt }
      : { id: city.iata ? `ourairports:${city.iata}` : null, name: city.name, label: `${city.name}${city.iata ? ` (${city.iata})` : ''}, ${geo.countryName(city.countryCode)}`, countryCode: city.countryCode, lat: city.lat, lon: city.lon, source, fetchedAt };
    if (record.id) byId.set(record.id, record);
    const aliases = Array.isArray(city.aliases) ? city.aliases.filter((alias) => typeof alias === 'string').slice(0, 40) : [];
    entries.push({ record, name: normalize(city.name), aliases: aliases.map(normalize), haystack: normalize([record.label, city.iata || '', ...aliases].join(' ')), population: Math.max(0, Number(city.population) || 0) });
  }
  function search(query, homeCountry = '') {
    if (typeof query !== 'string' || query.trim().length < 2 || query.length > 100 || /[\x00-\x1f]/.test(query)) throw new Error('Search must be 2-100 characters.');
    const needle = normalize(query); const tokens = needle.split(/\s+/);
    const matches = [];
    for (const entry of entries) {
      if (!tokens.every((token) => entry.haystack.includes(token))) continue;
      const score = entry.name === needle ? 0 : entry.aliases.includes(needle) ? 1 : entry.name.startsWith(needle) ? 2 : 3;
      matches.push({ ...entry, score });
    }
    matches.sort((left, right) => left.score - right.score || Number(right.record.countryCode === homeCountry) - Number(left.record.countryCode === homeCountry) || right.population - left.population || left.record.label.localeCompare(right.record.label));
    return {
      cities: matches.slice(0, 12).map(({ record }) => ({ id: record.id, name: record.name, label: record.label, countryCode: record.countryCode })),
      source, fetchedAt, fallback: !usable, totalCities: entries.length,
      attributionUrl: usable ? 'https://www.geonames.org/' : 'https://ourairports.com/data/',
    };
  }
  function resolve(id) {
    if (typeof id !== 'string' || !PLACE_ID.test(id)) throw new Error('Invalid departure place ID.');
    const record = byId.get(id);
    if (!record) throw new Error('Departure place is unavailable. Search and select it again.');
    return { ...record };
  }
  return { search, resolve };
}

let cached;
let cachedStamp;
function directory() {
  let stamp = 0;
  try { stamp = fs.statSync(DATA_FILE).mtimeMs; } catch {}
  if (!cached || stamp !== cachedStamp) {
    let snapshot;
    try { if (stamp) snapshot = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch {}
    cached = createCityDirectory(snapshot);
    cachedStamp = stamp;
  }
  return cached;
}

module.exports = { createCityDirectory, searchCities: (query, country) => directory().search(query, country), resolveCity: (id) => directory().resolve(id) };
