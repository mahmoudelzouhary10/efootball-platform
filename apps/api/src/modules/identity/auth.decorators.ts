import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
import { AppError } from '../../common/errors/app-error';
import type { AuthContext } from './session.service';

export const IS_PUBLIC = 'isPublic';

/** Marks a route as reachable without a session. Every other route requires one (secure by default). */
export const Public = () => SetMetadata(IS_PUBLIC, true);

export type AuthedRequest = Request & { auth?: AuthContext | null };

/** Injects the authenticated principal. Only valid on non-public routes. */
export const CurrentAuth = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthContext => {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    if (!req.auth) throw AppError.unauthenticated();
    return req.auth;
  },
);
