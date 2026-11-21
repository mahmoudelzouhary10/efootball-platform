import type { ErrorCode, MediaResponse, ProblemDetails } from '@efp/contracts';

/** Browser-side API client. Same-origin `/api/v1`, cookies sent automatically. */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode | 'network',
    readonly fieldErrors: Record<string, string[]> = {},
  ) {
    super(code);
  }
}

async function request<T>(method: 'POST' | 'PATCH', path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'network');
  }
  return parse<T>(res);
}

/** Client-side GET (for incremental loading after the server-rendered first page). */
export async function apiGet<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, { credentials: 'same-origin' });
  } catch {
    throw new ApiError(0, 'network');
  }
  return parse<T>(res);
}

export const apiPost = <T = void>(path: string, body?: unknown) => request<T>('POST', path, body);
export const apiPatch = <T = void>(path: string, body: unknown) => request<T>('PATCH', path, body);

/** Uploads an image; the server validates, crops and re-encodes it. */
export async function apiUploadImage(
  kind: 'avatar' | 'clan_logo',
  file: File,
): Promise<MediaResponse> {
  const form = new FormData();
  form.append('file', file);
  let res: Response;
  try {
    res = await fetch(`/api/v1/media/images?kind=${kind}`, {
      method: 'POST',
      credentials: 'same-origin',
      body: form,
    });
  } catch {
    throw new ApiError(0, 'network');
  }
  return parse<MediaResponse>(res);
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) throw await toApiError(res);
  if (res.status === 204 || res.status === 202) return undefined as T;
  return (await res.json()) as T;
}

async function toApiError(res: Response): Promise<ApiError> {
  try {
    const problem = (await res.json()) as ProblemDetails;
    return new ApiError(res.status, problem.code, problem.errors ?? {});
  } catch {
    // Proxies and body-size limits can answer without problem+json.
    return new ApiError(res.status, res.status === 413 ? 'MEDIA_INVALID' : 'INTERNAL_ERROR');
  }
}
