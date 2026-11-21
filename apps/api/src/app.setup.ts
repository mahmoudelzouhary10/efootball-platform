import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { APP_CONFIG, AppConfig } from './config/env';

export const API_PREFIX = 'api/v1';

/** HTTP-level configuration shared by main.ts and the integration tests. */
export function configureApp(app: INestApplication): void {
  const cfg = app.get<AppConfig>(APP_CONFIG);
  const http = app as NestExpressApplication;

  http.set('trust proxy', cfg.TRUST_PROXY_HOPS);
  http.disable('x-powered-by');
  // The API serves JSON only; a strict CSP costs nothing here.
  http.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'none'"] } } }));
  http.use(cookieParser());
  http.use(express.json({ limit: '100kb' }));

  app.setGlobalPrefix(API_PREFIX);
  app.enableShutdownHooks();
}
