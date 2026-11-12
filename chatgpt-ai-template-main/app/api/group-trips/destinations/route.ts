import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { identity } from '@/lib/server/identity';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

const { AIConfigurationError, AIProviderError } = require('@/lib/ai/providers');
const { createUserProvider } = require('@/lib/ai/userProvider');
const { AIWorkflowError } = require('@/lib/ai/contracts');
const { RequestError } = require('@/lib/server/jsonRequest');
const { labsEnabled } = require('@/lib/ai/labsGate');
const { assertDestinationOrganizer, destinationCapabilities, readDestinationRequest,
  generateDestinationProposal, addDestinationProposal } = require('@/lib/ai/destinations');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

function destinationProvider(uid: string) {
  return createUserProvider(uid, { ...process.env,
    FERMAT_AI_PROVIDER: process.env.FERMAT_DESTINATION_PROVIDER || process.env.FERMAT_AI_PROVIDER });
}

function failure(error: unknown) {
  if (error instanceof Error && error.message === 'AUTH_REQUIRED') return reply({ code: 'AUTH_REQUIRED', error: 'Sign in to plan a destination.' }, 401);
  if (error instanceof AIWorkflowError || error instanceof AIConfigurationError || error instanceof RequestError) {
    const safe = error as Error & { code: string; status: number };
    return reply({ code: safe.code, error: safe.message }, safe.status);
  }
  if (error instanceof AIProviderError) return reply({ code: 'AI_DESTINATION_UNAVAILABLE', error: 'AI destination planning is unavailable. Try again later.' }, 503);
  return reply({ code: 'DESTINATIONS_UNAVAILABLE', error: 'Destination planning is unavailable. Refresh the trip before retrying.' }, 503);
}

export async function GET(request: NextRequest) {
  try {
    const user = await identity(request);
    const tripId = request.nextUrl.searchParams.get('tripId') || '';
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(tripId)) return reply({ code: 'INVALID_REQUEST', error: 'A valid trip ID is required.' }, 400);
    const snapshot = await firebaseAdmin().firestore.doc(`groupTrips/${tripId}`).get();
    const state = snapshot.data()?.state;
    assertDestinationOrganizer(state, user.uid);
    return reply({ ...destinationCapabilities({ state, uid: user.uid, provider: destinationProvider(user.uid) }), labs: labsEnabled(user) });
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await identity(request);
    const body = await readDestinationRequest(request);
    const options = { firestore: firebaseAdmin().firestore, uid: user.uid, body, provider: destinationProvider(user.uid) };
    if (body.action === 'generate') return reply({ draft: await generateDestinationProposal(options) });
    return reply(await addDestinationProposal(options));
  } catch (error) { return failure(error); }
}
