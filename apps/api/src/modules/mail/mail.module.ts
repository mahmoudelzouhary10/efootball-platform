import { Global, Module } from '@nestjs/common';
import { APP_CONFIG, AppConfig } from '../../config/env';
import { LogMailer, Mailer, SmtpMailer } from './mailer';

@Global()
@Module({
  providers: [
    {
      provide: Mailer,
      inject: [APP_CONFIG],
      useFactory: (cfg: AppConfig): Mailer =>
        cfg.MAIL_TRANSPORT === 'smtp'
          ? new SmtpMailer(cfg.SMTP_URL!, cfg.MAIL_FROM)
          : new LogMailer(),
    },
  ],
  exports: [Mailer],
})
export class MailModule {}
