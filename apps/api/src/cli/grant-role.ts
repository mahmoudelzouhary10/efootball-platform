import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { loadLocalEnvFile } from '../config/load-env-file';
import { PLATFORM_ROLES, PlatformRole } from '../db/schema';
import { RoleService } from '../modules/access/role.service';

/**
 * Bootstrap tool for the first admin (there is deliberately no HTTP endpoint that can
 * create an admin from nothing). Usage: node dist/cli/grant-role.js <username> <admin|moderator>
 */
async function main(): Promise<void> {
  loadLocalEnvFile();
  const [username, role] = process.argv.slice(2);
  if (!username || !PLATFORM_ROLES.includes(role as PlatformRole)) {
    console.error(`Usage: grant-role <username> <${PLATFORM_ROLES.join('|')}>`);
    process.exit(1);
  }
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  try {
    await app.get(RoleService).grant(username, role as PlatformRole, null);
    console.log(`Granted ${role} to ${username}`);
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
