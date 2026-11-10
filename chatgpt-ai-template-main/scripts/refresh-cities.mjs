import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { createReadStream } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const countries = JSON.parse(await fs.readFile(path.join(root, 'src/lib/geo/countries.json'), 'utf8')).countries;
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'fermat-cities-'));
const sourceUrl = 'https://download.geonames.org/export/dump/cities1000.zip';

async function download(url, maxBytes) {
  const response = await fetch(url, { signal: AbortSignal.timeout(180_000), redirect: 'error' });
  if (!response.ok || !response.body) throw new Error(`City data download returned HTTP ${response.status}`);
  const chunks = []; let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('City data download exceeded its size limit');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

try {
  console.log('Downloading the licensed GeoNames city extract. No traveller data is sent.');
  const archive = await download(sourceUrl, 64 * 1024 * 1024);
  const archivePath = path.join(temporary, 'cities.zip');
  await fs.writeFile(archivePath, archive);
  execFileSync('unzip', ['-tq', archivePath], { stdio: 'pipe' });
  const text = execFileSync('unzip', ['-p', archivePath, 'cities1000.txt'], { maxBuffer: 150 * 1024 * 1024 });
  const tsvPath = path.join(temporary, 'cities.tsv');
  await fs.writeFile(tsvPath, text);
  const adminText = (await download('https://download.geonames.org/export/dump/admin1CodesASCII.txt', 4 * 1024 * 1024)).toString('utf8');
  const adminNames = new Map(adminText.split('\n').map((line) => { const fields = line.split('\t'); return [fields[0], fields[1]]; }));
  const cities = []; const ids = new Set();
  for await (const line of readline.createInterface({ input: createReadStream(tsvPath), crlfDelay: Infinity })) {
    const fields = line.split('\t');
    if (fields.length !== 19 || fields[6] !== 'P' || !countries[fields[8]] || !/^\d+$/.test(fields[0])) continue;
    const lat = Number(fields[4]); const lon = Number(fields[5]);
    if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon) || Math.abs(lon) > 180 || !fields[1] || fields[1].length > 200) continue;
    const id = `geonames:${fields[0]}`;
    if (ids.has(id)) continue;
    ids.add(id);
    const region = adminNames.get(`${fields[8]}.${fields[10]}`);
    cities.push({ id, name: fields[1], label: [fields[1], region, countries[fields[8]].name].filter(Boolean).join(', '), countryCode: fields[8], lat, lon,
      aliases: [...new Set([fields[2], ...fields[3].split(',')])].filter((value) => value && value.length <= 200).slice(0, 40), population: Number(fields[14]) || 0 });
  }
  if (cities.length < 50_000) throw new Error('City extract was unexpectedly incomplete; the old index was preserved.');
  const snapshot = { source: 'GeoNames', license: 'CC BY 4.0', sourceUrl, fetchedAt: new Date().toISOString(), archiveSha256: createHash('sha256').update(archive).digest('hex'), cities };
  const directory = path.join(root, 'data');
  await fs.mkdir(directory, { recursive: true });
  const destination = path.join(directory, 'cities.json');
  await fs.writeFile(`${destination}.tmp`, JSON.stringify(snapshot));
  await fs.rename(`${destination}.tmp`, destination);
  console.log(`Updated ${cities.length.toLocaleString('en-US')} city records. Attribution: GeoNames, CC BY 4.0.`);
} finally { await fs.rm(temporary, { recursive: true, force: true }); }