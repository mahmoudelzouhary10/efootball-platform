import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppError } from '../../common/errors/app-error';
import type { AuthedRequest } from '../identity/auth.decorators';
import { Permission, permissionsFor } from './permissions';

const REQUIRED_PERMISSIONS = 'requiredPermissions';

/** Requires every listed platform permission. Runs after AuthGuard. */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(REQUIRED_PERMISSIONS, permissions);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[] | undefined>(
      REQUIRED_PERMISSIONS,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!required?.length) return true;

    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    if (!req.auth) throw AppError.unauthenticated();
    const granted = permissionsFor(req.auth.roles);
    if (!required.every((p) => granted.has(p))) throw AppError.forbidden();
    return true;
  }
}
