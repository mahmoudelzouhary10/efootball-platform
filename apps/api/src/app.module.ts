import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { Clock, SystemClock } from './common/clock';
import { ProblemFilter } from './common/errors/problem.filter';
import { RateLimiter } from './common/rate-limit/rate-limiter.service';
import { RedisModule } from './common/redis/redis.module';
import { OriginCheckMiddleware } from './common/security/origin-check.middleware';
import { ConfigModule } from './config/config.module';
import { DbModule } from './db/db.module';
import { AccessModule } from './modules/access/access.module';
import { PermissionsGuard } from './modules/access/permissions.guard';
import { AuditModule } from './modules/audit/audit.module';
import { HealthController } from './modules/health/health.controller';
import { AuthGuard } from './modules/identity/auth.guard';
import { IdentityModule } from './modules/identity/identity.module';
import { MailModule } from './modules/mail/mail.module';
import { ClansModule } from './modules/clans/clans.module';
import { MediaModule } from './modules/media/media.module';
import { PlayersModule } from './modules/players/players.module';
import { Global } from '@nestjs/common';

/** Cross-cutting providers available to every module. */
@Global()
@Module({
  providers: [{ provide: Clock, useClass: SystemClock }, RateLimiter],
  exports: [Clock, RateLimiter],
})
class CoreModule {}

@Module({
  imports: [
    ConfigModule,
    DbModule,
    RedisModule,
    CoreModule,
    MailModule,
    AuditModule,
    IdentityModule,
    AccessModule,
    MediaModule,
    PlayersModule,
    ClansModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: ProblemFilter },
    // Order matters: authenticate first, then authorize.
    { provide: APP_GUARD, useExisting: AuthGuard },
    { provide: APP_GUARD, useExisting: PermissionsGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(OriginCheckMiddleware).forRoutes('{*splat}');
  }
}
