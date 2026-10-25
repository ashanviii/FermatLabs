const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { after, before, test } = require('node:test');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, updateDoc } = require('firebase/firestore');

let environment;

before(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'demo-fermat',
    firestore: { rules: fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8') },
  });
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users/alice'), {
      email: 'alice@example.test', displayName: 'Alice', photoURL: null,
      queryCount: 0, isPro: false, createdAt: null, lastQueryAt: null, lastResetDate: '2026-10-25',
    });
  });
});

after(async () => { if (environment) await environment.cleanup(); });

test('a signed-in user can read and update only the allowed fields on their own profile', async () => {
  const alice = environment.authenticatedContext('alice').firestore();
  await assertSucceeds(getDoc(doc(alice, 'users/alice')));
  await assertSucceeds(updateDoc(doc(alice, 'users/alice'), { queryCount: 1, lastQueryAt: null }));
  await assertFails(updateDoc(doc(alice, 'users/alice'), { isPro: true }));
});

test('another user and an unauthenticated browser cannot read a profile', async () => {
  await assertFails(getDoc(doc(environment.authenticatedContext('mallory').firestore(), 'users/alice')));
  await assertFails(getDoc(doc(environment.unauthenticatedContext().firestore(), 'users/alice')));
});

test('browsers cannot read or write authoritative trip and idempotency records', async () => {
  const alice = environment.authenticatedContext('alice').firestore();
  await assertFails(getDoc(doc(alice, 'groupTrips/trip-1')));
  await assertFails(setDoc(doc(alice, 'groupTrips/trip-1'), { ownerUid: 'alice' }));
  await assertFails(setDoc(doc(alice, 'groupTripCreateRequests/request-1'), { uid: 'alice' }));
});
