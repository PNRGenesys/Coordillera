import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['dotenv/config'],
    // Integration tests share one PostgreSQL database, so they must not run concurrently.
    fileParallelism: false,
  },
})
