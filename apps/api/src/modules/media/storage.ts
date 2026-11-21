import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

/** Object storage port. Keys are server-generated (never user input). */
export abstract class Storage {
  abstract put(key: string, body: Buffer, contentType: string): Promise<void>;
  abstract get(key: string): Promise<Buffer | null>;
  abstract delete(key: string): Promise<void>;
}

const SAFE_KEY = /^[a-z0-9/_-]+\.[a-z0-9]+$/;

/**
 * Stores files on local disk (development, tests, single-server deployments with a volume).
 * An S3/R2 driver implementing the same port is planned for multi-instance production.
 */
export class LocalDiskStorage extends Storage {
  constructor(private readonly root: string) {
    super();
  }

  private resolve(key: string): string {
    if (!SAFE_KEY.test(key) || key.includes('..')) throw new Error(`Unsafe storage key: ${key}`);
    return path.join(this.root, key);
  }

  async put(key: string, body: Buffer): Promise<void> {
    const file = this.resolve(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body);
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.resolve(key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }
}
