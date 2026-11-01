import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

const domain = require('@/lib/collaborativeTrip');
const service = require('@/lib/groupTripCommandService');
const { FieldPath, FieldValue } = require('firebase-admin/firestore');

class RateLimitError extends Error {
  retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super('Too many requests. Please wait a moment and try again.');
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

class PayloadError extends Error {}

async function jsonBody(request: NextRequest) {
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > 128 * 1024) throw new PayloadError('Request is too large.');
  const text = await request.text();
  if (text.length > 128 * 1024) throw new PayloadError('Request is too large.');
  try {
    return JSON.parse(text);
  } catch {
    throw new PayloadError('Request body must be valid JSON.');
  }
}

const millis = (value: any) =>
  typeof value?.toMillis === 'function' ? value.toMillis() : Number(value || 0);

/**
 * A small Firestore-backed fixed-window limit. Admin-only documents keep the
 * limit consistent across Vercel instances without exposing IP addresses.
 */
async function enforceRateLimit(
  firestore: any,
  uid: string,
  scope: string,
  limit: number,
  windowMs: number,
) {
  const id = createHash('sha256').update(`${uid}:${scope}`).digest('hex');
  const ref = firestore.doc(`_rateLimits/${id}`);
  const now = Date.now();

  await firestore.runTransaction(async (transaction: any) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data() || {};
    const existingReset = millis(data.resetAt);
    const active = existingReset > now;
    const count = active ? Number(data.count || 0) : 0;
    const resetAt = active ? existingReset : now + windowMs;

    if (count >= limit) {
      throw new RateLimitError(Math.max(1, Math.ceil((resetAt - now) / 1000)));
    }

    transaction.set(ref, {
      count: count + 1,
      resetAt: new Date(resetAt),
      // Can be connected to a Firestore TTL policy without changing the API.
      expiresAt: new Date(resetAt + 24 * 60 * 60 * 1000),
    });
  });
}

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
  const status = error instanceof RateLimitError ? 429 : error instanceof PayloadError ? 413 : message === 'AUTH_REQUIRED' ? 401 : /not configured|credentials|project ID/i.test(message) ? 503 : /not found/i.test(message) ? 404 : /required|stale|capacity|expired|absent|allowed|unknown|incomplete|budget|membership|organizer|voting|invite|idempotency/i.test(message) ? 409 : 500;
  const headers = error instanceof RateLimitError
    ? { 'Retry-After': String(error.retryAfterSeconds) }
    : undefined;
  return NextResponse.json({ error: message }, { status, headers });
}

export async function GET(request: NextRequest) {
  try {
    const token = await identity(request); const tripId = request.nextUrl.searchParams.get('tripId');
    if (!tripId) {
      const { firestore } = firebaseAdmin();
      const memberPath = new FieldPath('state', 'members', token.uid, 'status');
      const pendingPath = new FieldPath('state', 'pending', token.uid, 'status');
      const [memberTrips, pendingTrips] = await Promise.all([
        firestore.collection('groupTrips').where(memberPath, '==', 'approved').limit(50).get(),
        firestore.collection('groupTrips').where(pendingPath, '==', 'pending').limit(50).get(),
      ]);
      const docs = new Map([...memberTrips.docs, ...pendingTrips.docs].map((doc: any) => [doc.id, doc]));
      const today = new Date().toISOString().slice(0, 10);
      const trips = [...docs.values()]
        .flatMap((doc: any) => { try { return [domain.buildTripSummary(doc.data()?.state, token.uid)]; } catch { return []; } })
        .sort((a: any, b: any) => Number(a.endDate < today) - Number(b.endDate < today) || (a.endDate < today ? b.startDate.localeCompare(a.startDate) : a.startDate.localeCompare(b.startDate)) || a.name.localeCompare(b.name));
      return NextResponse.json({ trips });
    }
    const snap = await firebaseAdmin().firestore.doc(`groupTrips/${tripId}`).get();
    if (!snap.exists) throw new Error('Trip not found');
    return NextResponse.json({ trip: domain.buildTripProjection(snap.data()?.state, token.uid) });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    const token = await identity(request); const body = await jsonBody(request); const { firestore } = firebaseAdmin();
    await enforceRateLimit(firestore, token.uid, 'mutations-minute', 60, 60 * 1000);
    if (body.action === 'create') {
      await enforceRateLimit(firestore, token.uid, 'create-hour', 10, 60 * 60 * 1000);
      if (token.firebase?.sign_in_provider === 'anonymous') throw new Error('A recoverable organizer identity is required');
      const result = await service.createTrip({ firestore, uid: token.uid, body, serverTimestamp: () => FieldValue.serverTimestamp() });
      return NextResponse.json({ trip: domain.buildTripProjection(result.state, token.uid), ...(result.invite ? { invite: result.invite } : {}) });
    }
    if (body.action === 'join') {
      await enforceRateLimit(firestore, token.uid, 'join-ten-minutes', 20, 10 * 60 * 1000);
    }
    const result = await service.mutateTrip({ firestore, uid: token.uid, body, serverTimestamp: () => FieldValue.serverTimestamp() });
    return NextResponse.json({ trip: domain.buildTripProjection(result.state, token.uid), ...(result.invite ? { invite: result.invite } : {}) });
  } catch (error) { return errorResponse(error); }
}
