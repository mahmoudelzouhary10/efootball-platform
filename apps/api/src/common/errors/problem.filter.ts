import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ErrorCode, ProblemDetails } from '@efp/contracts';
import type { Request, Response } from 'express';
import { AppError } from './app-error';

const TITLES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
};

const STATUS_CODES: Partial<Record<number, ErrorCode>> = {
  400: ErrorCode.VALIDATION_FAILED,
  401: ErrorCode.UNAUTHENTICATED,
  403: ErrorCode.FORBIDDEN,
  404: ErrorCode.NOT_FOUND,
  429: ErrorCode.RATE_LIMITED,
};

/** Renders every error as application/problem+json. Internal details never leak to clients. */
@Catch()
export class ProblemFilter implements ExceptionFilter {
  private readonly logger = new Logger('ProblemFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const req = host.switchToHttp().getRequest<Request>();

    let problem: ProblemDetails;
    let headers: Record<string, string> | undefined;

    if (exception instanceof AppError) {
      problem = {
        type: 'about:blank',
        title: TITLES[exception.status] ?? 'Error',
        status: exception.status,
        code: exception.code,
        ...(exception.detail ? { detail: exception.detail } : {}),
        ...(exception.errors ? { errors: exception.errors } : {}),
      };
      headers = exception.headers;
    } else if (exception instanceof HttpException) {
      // Framework-level errors: unknown route, malformed JSON body, payload too large.
      const status = exception.getStatus();
      problem = {
        type: 'about:blank',
        title: TITLES[status] ?? 'Error',
        status,
        code:
          STATUS_CODES[status] ??
          (status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.VALIDATION_FAILED),
      };
    } else if (isBodyParserError(exception)) {
      const status = exception.status;
      problem = {
        type: 'about:blank',
        title: TITLES[status] ?? 'Bad Request',
        status,
        code: ErrorCode.VALIDATION_FAILED,
        detail: status === 413 ? 'Request body too large' : 'Malformed request body',
      };
    } else {
      this.logger.error(
        `Unhandled error on ${req.method} ${req.originalUrl}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      problem = {
        type: 'about:blank',
        title: TITLES[HttpStatus.INTERNAL_SERVER_ERROR]!,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        code: ErrorCode.INTERNAL_ERROR,
      };
    }

    if (headers) for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    res.status(problem.status).type('application/problem+json').send(JSON.stringify(problem));
  }
}

function isBodyParserError(e: unknown): e is { status: number; type: string } {
  return (
    typeof e === 'object' &&
    e !== null &&
    typeof (e as { status?: unknown }).status === 'number' &&
    typeof (e as { type?: unknown }).type === 'string'
  );
}
