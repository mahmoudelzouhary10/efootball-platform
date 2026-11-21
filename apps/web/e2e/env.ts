import path from 'node:path';

const apiPort = 4100;
const webPort = 3100;
const webUrl = `http://localhost:${webPort}`;

export const E2E = {
  apiPort,
  webPort,
  apiUrl: `http://localhost:${apiPort}`,
  webUrl,
  databaseUrl: process.env.E2E_DATABASE_URL ?? 'postgres://efp:efp@localhost:5432/efp_e2e',
  redisUrl: process.env.E2E_REDIS_URL ?? 'redis://localhost:6379/14',
  mailFile: path.resolve(__dirname, '../.e2e-mail.jsonl'),
  get apiEnv(): Record<string, string> {
    return {
      NODE_ENV: 'test',
      PORT: String(apiPort),
      DATABASE_URL: this.databaseUrl,
      REDIS_URL: this.redisUrl,
      WEB_ORIGIN: webUrl,
      APP_PUBLIC_URL: webUrl,
      COOKIE_SECURE: 'false',
      MAIL_TRANSPORT: 'file',
      MAIL_FILE: this.mailFile,
    };
  },
};
