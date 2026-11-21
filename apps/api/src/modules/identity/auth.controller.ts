import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import {
  ChangePasswordInput,
  changePasswordSchema,
  LoginInput,
  loginSchema,
  MeResponse,
  RegisterInput,
  registerSchema,
  RequestPasswordResetInput,
  requestPasswordResetSchema,
  ResetPasswordInput,
  resetPasswordSchema,
  VerifyEmailInput,
  verifyEmailSchema,
} from '@efp/contracts';
import type { Request, Response } from 'express';
import { requestMeta } from '../../common/http/request-meta';
import { ZodPipe } from '../../common/validation/zod-body.pipe';
import { CurrentAuth, Public } from './auth.decorators';
import { AuthService } from './auth.service';
import { SessionCookie } from './session-cookie';
import type { AuthContext } from './session.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookie: SessionCookie,
  ) {}

  @Public()
  @Post('register')
  async register(
    @Body(new ZodPipe(registerSchema)) body: RegisterInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MeResponse> {
    const session = await this.auth.register(body, requestMeta(req));
    this.cookie.set(res, session.token, session.absoluteExpiresAt);
    res.status(201);
    return this.auth.meByToken(session.token);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body(new ZodPipe(loginSchema)) body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MeResponse> {
    const session = await this.auth.login(body, requestMeta(req));
    this.cookie.set(res, session.token, session.absoluteExpiresAt);
    return this.auth.meByToken(session.token);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @CurrentAuth() auth: AuthContext,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.logout(auth);
    this.cookie.clear(res);
  }

  @Post('logout-all')
  @HttpCode(204)
  async logoutAll(
    @CurrentAuth() auth: AuthContext,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.logoutEverywhere(auth);
    this.cookie.clear(res);
  }

  @Get('me')
  me(@CurrentAuth() auth: AuthContext): Promise<MeResponse> {
    return this.auth.me(auth);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(204)
  async verifyEmail(
    @Body(new ZodPipe(verifyEmailSchema)) body: VerifyEmailInput,
    @Req() req: Request,
  ) {
    await this.auth.verifyEmail(body.token, requestMeta(req));
  }

  @Post('verify-email/resend')
  @HttpCode(202)
  async resendVerification(@CurrentAuth() auth: AuthContext): Promise<void> {
    await this.auth.resendVerification(auth);
  }

  @Public()
  @Post('password-reset/request')
  @HttpCode(202)
  async requestReset(
    @Body(new ZodPipe(requestPasswordResetSchema)) body: RequestPasswordResetInput,
    @Req() req: Request,
  ): Promise<void> {
    await this.auth.requestPasswordReset(body.email, requestMeta(req));
  }

  @Public()
  @Post('password-reset/confirm')
  @HttpCode(204)
  async confirmReset(
    @Body(new ZodPipe(resetPasswordSchema)) body: ResetPasswordInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.resetPassword(body, requestMeta(req));
    // Every session was revoked, including any on this browser.
    this.cookie.clear(res);
  }

  @Post('password')
  @HttpCode(204)
  async changePassword(
    @CurrentAuth() auth: AuthContext,
    @Body(new ZodPipe(changePasswordSchema)) body: ChangePasswordInput,
    @Req() req: Request,
  ): Promise<void> {
    await this.auth.changePassword(auth, body, requestMeta(req));
  }
}
