import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { ErrorCode } from '@efp/contracts';
import type { NextFunction, Request, Response } from 'express';
import { APP_CONFIG, AppConfig } from '../../config/env';
import { AppError } from '../errors/app-error';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence in depth (on top of SameSite=Lax cookies).
 *
 * Browsers attach an Origin header to every cross-origin request and to same-origin
 * non-GET requests. If a state-changing request carries an Origin (or, failing that, a
 * Referer) that is not ours, it is rejected. Requests with neither header cannot come
 * from a browser form or script on another site, so non-browser clients (mobile app,
 * scripts) keep working.
 */
@Injectable()
export class OriginCheckMiddleware implements NestMiddleware {
  constructor(@Inject(APP_CONFIG) private readonly cfg: AppConfig) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    if (SAFE_METHODS.has(req.method)) return next();

    // Not `??`: a present-but-invalid Origin (null) must not fall through to Referer.
    const origin = originOf(req.headers.origin);
    const source = origin !== undefined ? origin : originOf(req.headers.referer);
    if (source === undefined) return next();
    if (source !== null && this.cfg.allowedOrigins.includes(source)) return next();

    // Thrown (not passed to next) so Nest routes it through the global ProblemFilter.
    throw new AppError(403, ErrorCode.CSRF_REJECTED, 'Cross-site request rejected');
  }
}

/** undefined = header absent; null = present but unparseable or "null". */
function originOf(value: string | string[] | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || raw === 'null') return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}
