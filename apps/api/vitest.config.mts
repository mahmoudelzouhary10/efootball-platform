import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// SWC is required so Nest's decorator metadata (constructor injection) survives transpilation.
const plugins = [swc.vite({ module: { type: 'es6' } })];

export default defineConfig({
  test: {
    projects: [
      {
        plugins,
        test: {
          name: 'unit',
          include: ['src/**/*.spec.ts'],
          environment: 'node',
        },
      },
      {
        plugins,
        test: {
          name: 'integration',
          include: ['test/**/*.int.test.ts'],
          environment: 'node',
          globalSetup: ['test/global-setup.ts'],
          // Tests share one database and one Redis DB; run files serially.
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
