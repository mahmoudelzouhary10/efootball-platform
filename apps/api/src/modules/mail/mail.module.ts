import { Global, Module } from '@nestjs/common';
import { APP_CONFIG, AppConfig } from '../../config/env';
import { FileMailer, LogMailer, Mailer, SmtpMailer } from './mailer';

@Global()
@Module({
  providers: [
    {
      provide: Mailer,
      inject: [APP_CONFIG],
      useFactory: (cfg: AppConfig): Mailer => {
        switch (cfg.MAIL_TRANSPORT) {
          case 'smtp':
            return new SmtpMailer(cfg.SMTP_URL!, cfg.MAIL_FROM);
          case 'file':
            return new FileMailer(cfg.MAIL_FILE!);
          case 'log':
            return new LogMailer();
        }
      },
    },
  ],
  exports: [Mailer],
})
export class MailModule {}
