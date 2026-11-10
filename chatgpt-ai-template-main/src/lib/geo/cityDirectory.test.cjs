const test = require('node:test');
const assert = require('node:assert/strict');
const { createCityDirectory } = require('./cityDirectory.server');

const snapshot = {
  source: 'GeoNames', fetchedAt: '2026-11-10', cities: [
    { id: 'geonames:1', name: 'Springfield', label: 'Springfield, Illinois, United States', countryCode: 'US', lat: 39.78, lon: -89.65, population: 100000, aliases: [] },
    { id: 'geonames:2', name: 'Springfield', label: 'Springfield, Queensland, Australia', countryCode: 'AU', lat: -27.65, lon: 152.91, population: 20000, aliases: [] },
    { id: 'geonames:3', name: 'Mysuru', label: 'Mysuru, Karnataka, India', countryCode: 'IN', lat: 12.3, lon: 76.65, population: 900000, aliases: ['Mysore'] },
    { id: 'geonames:4', name: 'Malaga', label: 'Malaga, Andalusia, Spain', countryCode: 'ES', lat: 36.72, lon: -4.42, aliases: ['Málaga'] },
  ],
};

test('city search handles aliases, accents, regional ambiguity and country preference', () => {
  const directory = createCityDirectory(snapshot);
  assert.equal(directory.search('Mysore').cities[0].name, 'Mysuru');
  assert.equal(directory.search('Málaga').cities[0].id, 'geonames:4');
  assert.equal(directory.search('Springfield', 'AU').cities[0].countryCode, 'AU');
  assert.equal(directory.search('Springfield Illinois').cities[0].id, 'geonames:1');
  assert.equal(directory.search('Springfield').cities.length, 2);
  assert.equal('lat' in directory.search('Mysore').cities[0], false);
});

test('only valid source records resolve; unknown IDs and malformed queries fail', () => {
  const directory = createCityDirectory({ ...snapshot, cities: [...snapshot.cities, { ...snapshot.cities[0], id: 'geonames:9', lat: 999 }] });
  assert.equal(directory.resolve('geonames:3').lat, 12.3);
  assert.throws(() => directory.resolve('geonames:9'), /unavailable/);
  assert.throws(() => directory.resolve('../../secret'), /invalid/i);
  assert.throws(() => directory.search('a'));
  assert.throws(() => directory.search('x'.repeat(101)));
  assert.throws(() => directory.search('Delhi\nprivate'));
});

test('missing city extract exposes an explicitly labelled airport-data fallback', () => {
  const result = createCityDirectory().search('DEL', 'IN');
  assert.equal(result.fallback, true);
  assert.equal(result.source, 'OurAirports');
  assert.ok(result.cities.some((city) => city.name === 'Delhi'));
  assert.equal(result.cities[0].id, null);
});