import { Module } from '@nestjs/common';
import { AuthTokenService } from './auth-token.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionCookie } from './session-cookie';
import { SessionService } from './session.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthTokenService,
    PasswordService,
    SessionService,
    SessionCookie,
    AuthGuard,
  ],
  exports: [SessionService, SessionCookie, AuthGuard, PasswordService],
})
export class IdentityModule {}
