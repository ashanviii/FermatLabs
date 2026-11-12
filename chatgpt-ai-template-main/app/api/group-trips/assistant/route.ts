import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { identity } from '@/lib/server/identity';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

const { createProvider, AIConfigurationError, AIProviderError } = require('@/lib/ai/providers');
const { AIWorkflowError, readRequest, GOALS, LAB_GOALS } = require('@/lib/ai/contracts');
const { labsEnabled, assertLabsEnabled } = require('@/lib/ai/labsGate');
const { assertOrganizer } = require('@/lib/ai/agents/catalog');
const { generateProposal, applyProposal } = require('@/lib/ai/proposals');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

function failure(error: unknown) {
  if (error instanceof Error && error.message === 'AUTH_REQUIRED') return reply({ code: 'AUTH_REQUIRED', error: 'Sign in to use the trip assistant.' }, 401);
  if (error instanceof AIWorkflowError || error instanceof AIConfigurationError || error instanceof AIProviderError) {
    const safe = error as Error & { code: string; status: number };
    return reply({ code: safe.code, error: safe.message }, safe.status);
  }
  return reply({ code: 'ASSISTANT_UNAVAILABLE', error: 'The assistant is unavailable. Your trip has not been changed by this request.' }, 503);
}

export async function GET(request: NextRequest) {
  try {
    const user = await identity(request);
    const tripId = request.nextUrl.searchParams.get('tripId') || '';
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(tripId)) return reply({ code: 'INVALID_REQUEST', error: 'A valid trip ID is required.' }, 400);
    const snapshot = await firebaseAdmin().firestore.doc(`groupTrips/${tripId}`).get();
    assertOrganizer(snapshot.data()?.state, user.uid);
    const provider = createProvider();
    return reply({ mode: provider.mode, label: provider.label, goals: GOALS, labs: labsEnabled(user) });
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await identity(request);
    const body = await readRequest(request);
    if (body.action === 'propose' && LAB_GOALS.includes(body.goal)) assertLabsEnabled(user);
    const provider = createProvider();
    const options = { firestore: firebaseAdmin().firestore, uid: user.uid, body, provider };
    if (body.action === 'propose') return reply({ proposal: await generateProposal(options) });
    return reply(await applyProposal(options));
  } catch (error) { return failure(error); }
}
