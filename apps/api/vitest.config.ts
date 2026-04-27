import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Prisma SQLite test database is shared across files in this package.
    // Run files sequentially to prevent write-lock races in CI.
    fileParallelism: false,
    environment: 'node',
    include: ['tests/**/*.test.ts']
  }
});
