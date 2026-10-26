// Build src/lib/geo/departureCities.json: ~90 major departure cities worldwide with country, coordinates and main airport.
// Coordinates and country come from OurAirports (public domain) https://ourairports.com/data/ via the GitHub mirror.
// The 13 Indian cities keep the exact names used by seeds.departureCities (the explicit fare table).
// Usage: NODE_USE_ENV_PROXY=1 node tools/geo_departure_cities.mjs <app root>
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.argv[2];
if (!root) throw new Error('Usage: node geo_departure_cities.mjs <app root>');
const URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv';

// [display name, IATA of the main airport]. Order: India first (identical names), then by region.
const CITIES = [
  ['Delhi', 'DEL'], ['Mumbai', 'BOM'], ['Bengaluru', 'BLR'], ['Hyderabad', 'HYD'], ['Chennai', 'MAA'], ['Kolkata', 'CCU'], ['Pune', 'PNQ'],
  ['Ahmedabad', 'AMD'], ['Kochi', 'COK'], ['Jaipur', 'JAI'], ['Goa', 'GOI'], ['Lucknow', 'LKO'], ['Chandigarh', 'IXC'],
  // United States and Canada
  ['New York', 'JFK'], ['Los Angeles', 'LAX'], ['Chicago', 'ORD'], ['San Francisco', 'SFO'], ['Dallas', 'DFW'], ['Houston', 'IAH'],
  ['Atlanta', 'ATL'], ['Miami', 'MIA'], ['Seattle', 'SEA'], ['Boston', 'BOS'], ['Washington DC', 'IAD'], ['Denver', 'DEN'],
  ['Phoenix', 'PHX'], ['Las Vegas', 'LAS'], ['Orlando', 'MCO'], ['Philadelphia', 'PHL'], ['Minneapolis', 'MSP'], ['Austin', 'AUS'],
  ['Toronto', 'YYZ'], ['Vancouver', 'YVR'], ['Montreal', 'YUL'], ['Calgary', 'YYC'],
  // UK and Ireland
  ['London', 'LHR'], ['Manchester', 'MAN'], ['Birmingham', 'BHX'], ['Edinburgh', 'EDI'], ['Dublin', 'DUB'],
  // Europe
  ['Paris', 'CDG'], ['Amsterdam', 'AMS'], ['Frankfurt', 'FRA'], ['Berlin', 'BER'], ['Munich', 'MUC'], ['Madrid', 'MAD'], ['Barcelona', 'BCN'],
  ['Rome', 'FCO'], ['Milan', 'MXP'], ['Lisbon', 'LIS'], ['Zurich', 'ZRH'], ['Vienna', 'VIE'], ['Brussels', 'BRU'], ['Copenhagen', 'CPH'],
  ['Stockholm', 'ARN'], ['Oslo', 'OSL'], ['Warsaw', 'WAW'], ['Athens', 'ATH'], ['Istanbul', 'IST'],
  // Middle East
  ['Dubai', 'DXB'], ['Abu Dhabi', 'AUH'], ['Doha', 'DOH'], ['Riyadh', 'RUH'], ['Jeddah', 'JED'], ['Muscat', 'MCT'], ['Kuwait City', 'KWI'], ['Tel Aviv', 'TLV'],
  // South, South-East and East Asia
  ['Dhaka', 'DAC'], ['Colombo', 'CMB'], ['Kathmandu', 'KTM'], ['Singapore', 'SIN'], ['Bangkok', 'BKK'], ['Kuala Lumpur', 'KUL'], ['Jakarta', 'CGK'],
  ['Manila', 'MNL'], ['Ho Chi Minh City', 'SGN'], ['Hong Kong', 'HKG'], ['Taipei', 'TPE'], ['Seoul', 'ICN'], ['Tokyo', 'HND'], ['Shanghai', 'PVG'],
  // Oceania
  ['Sydney', 'SYD'], ['Melbourne', 'MEL'], ['Brisbane', 'BNE'], ['Perth', 'PER'], ['Auckland', 'AKL'],
  // Latin America
  ['Mexico City', 'MEX'], ['São Paulo', 'GRU'], ['Buenos Aires', 'EZE'], ['Bogotá', 'BOG'], ['Lima', 'LIM'], ['Santiago', 'SCL'],
  // Africa
  ['Johannesburg', 'JNB'], ['Cape Town', 'CPT'], ['Nairobi', 'NBO'], ['Cairo', 'CAI'], ['Lagos', 'LOS'],
];

// Minimal RFC-4180 line parser (OurAirports quotes every text field; no embedded newlines in the columns we read).
function parseLine(line) {
  const out = []; let cur = ''; let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i += 1; } else if (ch === '"') quoted = false; else cur += ch; }
    else if (ch === '"') quoted = true; else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur); return out;
}

const response = await fetch(URL);
if (!response.ok) throw new Error(`OurAirports returned ${response.status}`);
const lines = (await response.text()).split(/\r?\n/);
const header = parseLine(lines[0]);
const col = (name) => header.indexOf(name);
const [iIata, iLat, iLon, iCountry, iType, iName] = ['iata_code', 'latitude_deg', 'longitude_deg', 'iso_country', 'type', 'name'].map(col);
const wanted = new Set(CITIES.map(([, iata]) => iata));
const airports = {};
for (const line of lines.slice(1)) {
  if (!line) continue; const row = parseLine(line);
  if (wanted.has(row[iIata]) && row[iType] !== 'closed') airports[row[iIata]] = row;
}
const cities = CITIES.map(([name, iata]) => {
  const row = airports[iata]; if (!row) throw new Error(`Airport ${iata} not found in OurAirports`);
  return { name, countryCode: row[iCountry], lat: Number(Number(row[iLat]).toFixed(4)), lon: Number(Number(row[iLon]).toFixed(4)), iata, airport: row[iName], airportType: row[iType] };
});
const out = {
  source: URL,
  license: 'Public domain (OurAirports data, https://ourairports.com/data/)',
  fetchedAt: new Date().toISOString().slice(0, 10),
  note: 'lat/lon are the main airport coordinates, used for great-circle fare estimates. Indian names match seeds.departureCities.',
  cities,
};
const file = path.join(root, 'src/lib/geo/departureCities.json');
writeFileSync(file, `${JSON.stringify(out, null, 1)}\n`);
console.log('wrote', file, cities.length, 'cities');
