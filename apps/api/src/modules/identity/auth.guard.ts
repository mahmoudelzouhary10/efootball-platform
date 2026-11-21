import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppError } from '../../common/errors/app-error';
import { AuthedRequest, IS_PUBLIC } from './auth.decorators';
import { SessionCookie } from './session-cookie';
import { SessionService } from './session.service';

/**
 * Global guard. Resolves the session cookie on every request and attaches `req.auth`.
 * Routes are authenticated unless marked @Public().
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
    private readonly cookie: SessionCookie,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const token = this.cookie.read(req);
    req.auth = token ? await this.sessions.resolve(token) : null;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!isPublic && !req.auth) throw AppError.unauthenticated();
    return true;
  }
}
