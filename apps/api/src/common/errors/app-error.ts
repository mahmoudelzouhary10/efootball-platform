import { ErrorCode } from '@efp/contracts';

/**
 * The only error type business code should throw for expected failures.
 * It is rendered as RFC 9457 problem+json by ProblemFilter.
 */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    readonly detail?: string,
    readonly errors?: Record<string, string[]>,
    /** Extra response headers, e.g. Retry-After. */
    readonly headers?: Record<string, string>,
  ) {
    super(detail ?? code);
    this.name = 'AppError';
  }

  static unauthenticated(): AppError {
    return new AppError(401, ErrorCode.UNAUTHENTICATED, 'Authentication required');
  }

  static forbidden(detail = 'You do not have permission to perform this action'): AppError {
    return new AppError(403, ErrorCode.FORBIDDEN, detail);
  }

  static notFound(detail = 'Resource not found'): AppError {
    return new AppError(404, ErrorCode.NOT_FOUND, detail);
  }

  static validation(errors: Record<string, string[]>): AppError {
    return new AppError(400, ErrorCode.VALIDATION_FAILED, 'Request validation failed', errors);
  }
}
