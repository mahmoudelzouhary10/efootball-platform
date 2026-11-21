import { Inject, Injectable } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { APP_CONFIG, AppConfig } from '../../config/env';
import { SESSION_COOKIE, SESSION_COOKIE_SECURE } from './identity.constants';

@Injectable()
export class SessionCookie {
  constructor(@Inject(APP_CONFIG) private readonly cfg: AppConfig) {}

  get name(): string {
    return this.cfg.COOKIE_SECURE ? SESSION_COOKIE_SECURE : SESSION_COOKIE;
  }

  private options(): CookieOptions {
    return { httpOnly: true, secure: this.cfg.COOKIE_SECURE, sameSite: 'lax', path: '/' };
  }

  read(req: Request): string | null {
    const value = (req.cookies as Record<string, unknown> | undefined)?.[this.name];
    return typeof value === 'string' && value.length > 0 && value.length <= 128 ? value : null;
  }

  set(res: Response, token: string, expires: Date): void {
    res.cookie(this.name, token, { ...this.options(), expires });
  }

  clear(res: Response): void {
    res.clearCookie(this.name, this.options());
  }
}
