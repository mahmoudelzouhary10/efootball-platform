import 'server-only';
import type { MeResponse } from '@efp/contracts';
import { cookies } from 'next/headers';

const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

/**
 * Server-side: who is signed in for this request? Forwards the browser's cookies to the API,
 * which remains the only authority on sessions. Returns null when signed out.
 */
export async function getCurrentUser(): Promise<MeResponse | null> {
  const cookieHeader = (await cookies()).toString();
  if (!cookieHeader) return null;
  const res = await fetch(`${API_INTERNAL_URL}/api/v1/auth/me`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Session lookup failed with ${res.status}`);
  return (await res.json()) as MeResponse;
}
