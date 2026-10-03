import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  // each storage test boots a fresh in-memory Postgres (PGlite): slow on a busy machine, so give setup room
  test: { include: ['src/**/*.test.ts'], hookTimeout: 60_000, testTimeout: 30_000 },
});
