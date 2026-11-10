import 'server-only';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

export async function identity(request: Request) {
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ') || header.length > 8192) throw new Error('AUTH_REQUIRED');
  try { return await firebaseAdmin().auth.verifyIdToken(header.slice(7), true); }
  catch (error) {
    if (error instanceof Error && /not configured|credentials|project ID/i.test(error.message)) throw error;
    throw new Error('AUTH_REQUIRED');
  }
}