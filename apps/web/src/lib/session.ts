import 'server-only';
import type { MeResponse } from '@efp/contracts';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { cache } from 'react';

const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

export type ServerResult<T> = { ok: true; data: T } | { ok: false; status: number };

/**
 * Server-side GET against the API, forwarding the browser's cookies. The API stays the only
 * authority on sessions and permissions; pages only render what it returns.
 */
export async function serverGet<T>(path: string): Promise<ServerResult<T>> {
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${API_INTERNAL_URL}/api/v1${path}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cache: 'no-store',
  });
  if (res.ok) return { ok: true, data: (await res.json()) as T };
  if (res.status >= 500) throw new Error(`API ${path} failed with ${res.status}`);
  return { ok: false, status: res.status };
}

/** Like serverGet, but a 404 renders the not-found page. */
export async function serverGetOr404<T>(path: string): Promise<T> {
  const r = await serverGet<T>(path);
  if (!r.ok) notFound();
  return r.data;
}

/** Who is signed in for this request (deduplicated across layout and page). */
export const getCurrentUser = cache(async (): Promise<MeResponse | null> => {
  const cookieHeader = (await cookies()).toString();
  if (!cookieHeader) return null;
  const r = await serverGet<MeResponse>('/auth/me');
  return r.ok ? r.data : null;
});

export const isStaff = (user: MeResponse | null) =>
  !!user?.roles.some((r) => r === 'admin' || r === 'moderator');
