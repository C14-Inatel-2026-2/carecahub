import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
      '@db': resolve(import.meta.dirname, 'src/drizzle/index.ts'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
