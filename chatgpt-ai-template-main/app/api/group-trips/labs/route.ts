import 'server-only';
import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { identity } from '@/lib/server/identity';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

const { AIConfigurationError, AIProviderError } = require('@/lib/ai/providers');
const { createUserProvider } = require('@/lib/ai/userProvider');
const { AIWorkflowError } = require('@/lib/ai/contracts');
const { RequestError } = require('@/lib/server/jsonRequest');
const { assertLabsEnabled } = require('@/lib/ai/labsGate');
const { assertDestinationOrganizer } = require('@/lib/ai/destinations');
const { collectDiscoveryContext } = require('@/lib/ai/agents/destination');
const { readLabsRequest, discoverCities, localDayIdeas } = require('@/lib/ai/labs');
const { rateBucket } = require('@/lib/ai/proposals');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const hash = (value: string) => createHash('sha256').update(value).digest('hex');

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

function failure(error: unknown) {
  if (error instanceof Error && error.message === 'AUTH_REQUIRED') return reply({ code: 'AUTH_REQUIRED', error: 'Sign in to use AI Labs.' }, 401);
  if (error instanceof AIWorkflowError || error instanceof AIConfigurationError || error instanceof AIProviderError || error instanceof RequestError) {
    const safe = error as Error & { code: string; status: number };
    return reply({ code: safe.code, error: safe.message }, safe.status);
  }
  return reply({ code: 'AI_LABS_UNAVAILABLE', error: 'AI Labs is unavailable. Your trip was not changed.' }, 503);
}

async function consume(uid: string, now = Date.now()) {
  const firestore = firebaseAdmin().firestore;
  const burstRef = firestore.doc(`_aiUsage/${hash(`burst\0${uid}`)}`);
  const userRef = firestore.doc(`_aiUsage/${hash(uid)}`);
  const globalRef = firestore.doc('_aiUsage/global');
  await firestore.runTransaction(async (transaction: any) => {
    const [burstUsage, userUsage, globalUsage] = await Promise.all(
      [burstRef, userRef, globalRef].map((ref) => transaction.get(ref)),
    );
    transaction.set(burstRef, rateBucket(burstUsage.data(), now, 3, 60 * 1000));
    transaction.set(userRef, rateBucket(userUsage.data(), now, 10, 60 * 60 * 1000));
    transaction.set(globalRef, rateBucket(globalUsage.data(), now, 100, 24 * 60 * 60 * 1000));
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await identity(request);
    assertLabsEnabled(user);
    const body = await readLabsRequest(request);
    const snapshot = await firebaseAdmin().firestore.doc(`groupTrips/${body.tripId}`).get();
    const state = snapshot.data()?.state;
    assertDestinationOrganizer(state, user.uid);
    collectDiscoveryContext(state);
    await consume(user.uid);
    const provider = createUserProvider(user.uid);
    if (body.action === 'discover') return reply(await discoverCities({ state, provider }));
    return reply(await localDayIdeas({ state, placeId: body.placeId, provider }));
  } catch (error) { return failure(error); }
}
