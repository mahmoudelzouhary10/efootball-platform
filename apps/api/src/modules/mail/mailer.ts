import { Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

/** Outgoing email port. Implementations: SMTP (dev via mailpit, prod), log, in-memory (tests). */
export abstract class Mailer {
  abstract send(message: MailMessage): Promise<void>;
}

export class SmtpMailer extends Mailer {
  private readonly transport: Transporter;

  constructor(
    smtpUrl: string,
    private readonly from: string,
  ) {
    super();
    this.transport = nodemailer.createTransport(smtpUrl);
  }

  async send(message: MailMessage): Promise<void> {
    await this.transport.sendMail({ from: this.from, ...message });
  }
}

/** Development only: prints the message instead of sending it. Refused in production by config. */
export class LogMailer extends Mailer {
  private readonly logger = new Logger('LogMailer');

  async send(message: MailMessage): Promise<void> {
    this.logger.log(`To: ${message.to}\nSubject: ${message.subject}\n\n${message.text}`);
  }
}

/** Test double: keeps messages in memory so tests can read tokens from them. */
export class MemoryMailer extends Mailer {
  readonly sent: MailMessage[] = [];

  async send(message: MailMessage): Promise<void> {
    this.sent.push(message);
  }

  lastTo(to: string): MailMessage | undefined {
    return [...this.sent].reverse().find((m) => m.to.toLowerCase() === to.toLowerCase());
  }

  clear(): void {
    this.sent.length = 0;
  }
}
