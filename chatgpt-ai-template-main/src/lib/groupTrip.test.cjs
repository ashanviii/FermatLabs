const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildReadinessRows,
  clearTripDraft,
  createDefaultDraft,
  loadTripDraft,
  recommendDestinations,
  resetTripDraft,
  saveTripDraft,
  STORAGE_KEY,
} = require('./groupTrip');

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    values,
  };
}

const readyGroup = {
  tripName: 'December escape',
  durationDays: 6,
  travelMonth: '2026-12',
  budgetPerPerson: 100000,
  travellers: [
    {
      id: 'shubham',
      name: 'Shubham',
      departureCity: 'Delhi',
      passportExpiry: '2028-06',
      visas: [],
    },
    {
      id: 'riya',
      name: 'Riya',
      departureCity: 'Mumbai',
      passportExpiry: '2028-01',
      visas: [],
    },
  ],
};

test('recommends the feasible trip before a more expensive, visa-heavy option', () => {
  const recommendations = recommendDestinations(readyGroup);

  assert.equal(recommendations.length, 3);
  assert.equal(recommendations[0].id, 'bangkok');
  assert.ok(recommendations[0].fitScore > recommendations[2].fitScore);
  assert.deepEqual(recommendations[0].blockers, []);
});

test('explains budget, passport, and visa blockers for every affected traveller', () => {
  const constrainedGroup = {
    ...readyGroup,
    budgetPerPerson: 80000,
    travellers: [
      {
        id: 'aman',
        name: 'Aman',
        departureCity: 'Delhi',
        passportExpiry: '2026-12',
        visas: [],
      },
    ],
  };

  const [paris] = recommendDestinations(constrainedGroup, ['paris']);

  assert.equal(paris.fitScore < 50, true);
  assert.deepEqual(
    paris.blockers.map((blocker) => blocker.kind).sort(),
    ['budget', 'passport'],
  );
  assert.deepEqual(paris.actions.map((action) => action.kind), ['visa']);
  assert.ok(paris.summary.includes('2 blockers'));
});

test('builds a readiness dashboard without repeating the shared numeric budget in every row', () => {
  const rows = buildReadinessRows(readyGroup, 'paris');

  assert.equal(rows.length, 2);
  assert.equal(rows[0].travellerName, 'Shubham');
  assert.equal(rows[0].budget, undefined);
  assert.equal(JSON.stringify(rows[0]).includes('100000'), false);
  assert.equal(rows[0].passport.status, 'ready');
  assert.equal(rows[0].visa.status, 'action');
  assert.match(rows[0].visa.detail, /Schengen/i);
});

test('uses a stable seed order when destinations have identical feasibility and fit', () => {
  const recommendations = recommendDestinations(readyGroup, ['dubai', 'bangkok']);
  const tied = recommendations.map((destination) => ({ ...destination, fitScore: 80 }));

  assert.deepEqual(
    tied.sort((a, b) => a.seedOrder - b.seedOrder).map((destination) => destination.id),
    ['bangkok', 'dubai'],
  );
});

test('unknown passport data remains unknown instead of being marked ready', () => {
  const group = {
    ...readyGroup,
    travellers: [{ ...readyGroup.travellers[0], passportExpiry: '' }],
  };

  const [row] = buildReadinessRows(group, 'bangkok');

  assert.equal(row.passport.status, 'unknown');
});

test('returns a clean draft when storage is empty', () => {
  const storage = memoryStorage({ unrelated: 'keep me' });

  assert.deepEqual(loadTripDraft(storage), createDefaultDraft());
  assert.equal(storage.getItem('unrelated'), 'keep me');
});

test('saves only the namespaced group-trip record and restores it', () => {
  const storage = memoryStorage({ unrelated: 'keep me' });
  const draft = {
    ...createDefaultDraft(),
    stage: 'compare',
    tripName: 'December escape',
    selectedDestinationId: 'bangkok',
  };

  saveTripDraft(storage, draft);

  assert.equal(storage.values.size, 2);
  assert.equal(storage.getItem('unrelated'), 'keep me');
  assert.deepEqual(loadTripDraft(storage), draft);
});

test('uses last-write-wins for repeated saves', () => {
  const storage = memoryStorage();
  const first = { ...createDefaultDraft(), tripName: 'First' };
  const second = { ...createDefaultDraft(), tripName: 'Latest' };

  saveTripDraft(storage, first);
  saveTripDraft(storage, second);

  assert.equal(loadTripDraft(storage).tripName, 'Latest');
});

test('recovers from corrupt and unsupported records', () => {
  for (const saved of ['not-json', JSON.stringify({ version: 99, tripName: 'future' })]) {
    const storage = memoryStorage({ [STORAGE_KEY]: saved, unrelated: 'keep me' });
    const warnings = [];

    assert.deepEqual(loadTripDraft(storage, (warning) => warnings.push(warning)), createDefaultDraft());
    assert.equal(storage.getItem(STORAGE_KEY), saved);
    assert.equal(storage.getItem('unrelated'), 'keep me');
    assert.equal(warnings.length, 1);
  }
});

test('confirmed reset deletes only the group-trip record', () => {
  const storage = memoryStorage({ [STORAGE_KEY]: '{}', unrelated: 'keep me' });

  assert.equal(resetTripDraft(storage, true), true);

  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.equal(storage.getItem('unrelated'), 'keep me');
});

test('cancelled reset preserves the draft and storage', () => {
  const storage = memoryStorage({ [STORAGE_KEY]: '{"version":1}' });

  assert.equal(resetTripDraft(storage, false), false);
  assert.equal(storage.getItem(STORAGE_KEY), '{"version":1}');
});

test('reports unavailable storage without losing the in-memory draft', () => {
  const warnings = [];
  const blockedStorage = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('full');
    },
    removeItem: () => {
      throw new Error('blocked');
    },
  };
  const draft = { ...createDefaultDraft(), tripName: 'Still in memory' };

  assert.deepEqual(loadTripDraft(blockedStorage, (warning) => warnings.push(warning)), createDefaultDraft());
  assert.equal(saveTripDraft(blockedStorage, draft, (warning) => warnings.push(warning)), false);
  assert.equal(clearTripDraft(blockedStorage, (warning) => warnings.push(warning)), false);
  assert.equal(draft.tripName, 'Still in memory');
  assert.equal(warnings.length, 3);
});
