import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: ['packages/**/__tests__/**/*.test.ts', 'holons/**/__tests__/**/*.test.ts', 'cli/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts', 'holons/*/src/**/*.ts'],
      exclude: ['**/index.ts', '**/__tests__/**'],
    },
  },
})
