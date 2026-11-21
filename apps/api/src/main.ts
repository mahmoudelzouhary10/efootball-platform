import 'reflect-metadata';
import { loadLocalEnvFile } from './config/load-env-file';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { APP_CONFIG, AppConfig } from './config/env';

async function bootstrap(): Promise<void> {
  loadLocalEnvFile();
  // bodyParser: false — configureApp installs the JSON parser with an explicit size limit.
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  configureApp(app);
  const cfg = app.get<AppConfig>(APP_CONFIG);
  await app.listen(cfg.PORT);
  new Logger('Bootstrap').log(`API listening on :${cfg.PORT} (${cfg.NODE_ENV})`);
}

void bootstrap();
