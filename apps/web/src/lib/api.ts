import type { ErrorCode, ProblemDetails } from '@efp/contracts';

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

export async function apiPost<T = void>(path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'network');
  }
  if (!res.ok) throw await toApiError(res);
  if (res.status === 204 || res.status === 202) return undefined as T;
  return (await res.json()) as T;
}

async function toApiError(res: Response): Promise<ApiError> {
  try {
    const problem = (await res.json()) as ProblemDetails;
    return new ApiError(res.status, problem.code, problem.errors ?? {});
  } catch {
    return new ApiError(res.status, 'INTERNAL_ERROR');
  }
}
