import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

const domain = require('@/lib/collaborativeTrip');
const { FieldValue } = require('firebase-admin/firestore');
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

async function identity(request: NextRequest) {
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ')) throw new Error('AUTH_REQUIRED');
  return firebaseAdmin().auth.verifyIdToken(header.slice(7), true);
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected shared-planning error';
  const status = message === 'AUTH_REQUIRED' ? 401 : /not configured|credentials|project ID/i.test(message) ? 503 : /required|stale|capacity|expired|absent|allowed|unknown|incomplete|budget|membership|organizer|voting|invite/i.test(message) ? 409 : 500;
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
      const tripId = randomUUID(); const inviteSecret = randomBytes(24).toString('base64url');
      const state = domain.createTripState({ ...body.trip, id: tripId, ownerUid: token.uid });
      await firestore.doc(`groupTrips/${tripId}`).create({ state, inviteHash: hash(inviteSecret), inviteExpiresAt: Date.now() + 7 * 86400000, createdAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ trip: domain.buildTripProjection(state, token.uid), invite: `${tripId}.${inviteSecret}` });
    }
    const tripId = String(body.tripId || ''); if (!tripId) throw new Error('Trip ID is required'); const ref = firestore.doc(`groupTrips/${tripId}`);
    const state = await firestore.runTransaction(async (transaction: any) => {
      const snap = await transaction.get(ref); if (!snap.exists) throw new Error('Trip not found'); const record = snap.data()!; let next = record.state;
      if (body.action === 'join') {
        if (!body.inviteSecret || hash(body.inviteSecret) !== record.inviteHash || record.inviteExpiresAt <= Date.now()) throw new Error('Invite is invalid, revoked, or expired');
        next = domain.applyCommand(next, { type: 'requestJoin', uid: token.uid, nickname: body.nickname, now: Date.now() });
      } else next = domain.applyCommand(next, { ...body.command, uid: token.uid });
      transaction.update(ref, { state: next, updatedAt: FieldValue.serverTimestamp() }); return next;
    });
    return NextResponse.json({ trip: domain.buildTripProjection(state, token.uid) });
  } catch (error) { return errorResponse(error); }
}
