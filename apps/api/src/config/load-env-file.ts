import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Loads apps/api/.env for local development (Node's built-in loader; existing variables win).
 * Production gets its environment from the platform and never reads a file.
 */
export function loadLocalEnvFile(): void {
  if (process.env.NODE_ENV === 'production') return;
  const file = path.resolve(__dirname, '../../.env');
  if (existsSync(file)) process.loadEnvFile(file);
}
