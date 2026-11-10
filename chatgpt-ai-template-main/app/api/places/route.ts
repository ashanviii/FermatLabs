import 'server-only';
import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { identity } from '@/lib/server/identity';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

const { readJsonBody, RequestError } = require('@/lib/server/jsonRequest');
const { searchCities } = require('@/lib/geo/cityDirectory.server');
const geo = require('@/lib/geo');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  try {
    const user = await identity(request);
    const body = await readJsonBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).sort().join(',') !== 'country,query' ||
      typeof body.query !== 'string' || body.query.trim().length < 2 || body.query.length > 100 || /[\x00-\x1f]/.test(body.query) ||
      (body.country !== '' && !geo.isCountry(body.country))) return reply({ error: 'Enter a city name of 2-100 characters.' }, 400);
    const firestore = firebaseAdmin().firestore;
    const bucket = firestore.doc(`_placeSearchLimits/${createHash('sha256').update(user.uid).digest('hex')}`);
    const globalBucket = firestore.doc('_placeSearchLimits/global');
    await firestore.runTransaction(async (transaction: any) => {
      const snapshots = await Promise.all([transaction.get(bucket), transaction.get(globalBucket)]);
      const now = Date.now();
      const changes = snapshots.map((snapshot: any, index: number) => {
        const record = snapshot.data(); const active = Number(record?.resetAt) > now;
        const count = active ? Number(record.count) : 0;
        if (!Number.isFinite(count) || count >= (index === 0 ? 30 : 300)) throw new RequestError('RATE_LIMITED', 'Too many city searches. Try again shortly.', 429);
        return { count: count + 1, resetAt: active ? record.resetAt : now + 60_000, expiresAt: new Date(now + 3_600_000) };
      });
      transaction.set(bucket, changes[0]); transaction.set(globalBucket, changes[1]);
    });
    return reply(searchCities(body.query, body.country));
  } catch (error) {
    if (error instanceof Error && error.message === 'AUTH_REQUIRED') return reply({ error: 'Sign in to search cities.' }, 401);
    if (error instanceof RequestError) return reply({ error: (error as Error).message }, (error as { status: number }).status);
    return reply({ error: 'City search is unavailable. Please try again shortly.' }, 503);
  }
}