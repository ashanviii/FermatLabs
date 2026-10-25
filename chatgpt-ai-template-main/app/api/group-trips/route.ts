import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

const domain = require('@/lib/collaborativeTrip');
const service = require('@/lib/groupTripCommandService');
const { FieldValue } = require('firebase-admin/firestore');

async function identity(request: NextRequest) {
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ')) throw new Error('AUTH_REQUIRED');
  try { return await firebaseAdmin().auth.verifyIdToken(header.slice(7), true); }
  catch (error) {
    if (error instanceof Error && /not configured|credentials|project ID/i.test(error.message)) throw error;
    throw new Error('AUTH_REQUIRED');
  }
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected shared-planning error';
  const status = message === 'AUTH_REQUIRED' ? 401 : /not configured|credentials|project ID/i.test(message) ? 503 : /not found/i.test(message) ? 404 : /required|stale|capacity|expired|absent|allowed|unknown|incomplete|budget|membership|organizer|voting|invite|idempotency/i.test(message) ? 409 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const token = await identity(request); const tripId = request.nextUrl.searchParams.get('tripId');
    if (!tripId) throw new Error('Trip ID is required');
    const snap = await firebaseAdmin().firestore.doc(`groupTrips/${tripId}`).get();
    if (!snap.exists) throw new Error('Trip not found');
    return NextResponse.json({ trip: domain.buildTripProjection(snap.data()?.state, token.uid) });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    const token = await identity(request); const body = await request.json(); const { firestore } = firebaseAdmin();
    if (body.action === 'create') {
      if (token.firebase?.sign_in_provider === 'anonymous') throw new Error('A recoverable organizer identity is required');
      const result = await service.createTrip({ firestore, uid: token.uid, body, serverTimestamp: () => FieldValue.serverTimestamp() });
      return NextResponse.json({ trip: domain.buildTripProjection(result.state, token.uid), ...(result.invite ? { invite: result.invite } : {}) });
    }
    const result = await service.mutateTrip({ firestore, uid: token.uid, body, serverTimestamp: () => FieldValue.serverTimestamp() });
    return NextResponse.json({ trip: domain.buildTripProjection(result.state, token.uid), ...(result.invite ? { invite: result.invite } : {}) });
  } catch (error) { return errorResponse(error); }
}
