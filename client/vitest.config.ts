import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '__tests__/',
        '**/*.d.ts',
        '**/*.config.*'
      ],
      thresholds: {
        lines: 85,
        branches: 80,
        functions: 85,
        statements: 85
      }
    },
    include: ['__tests__/**/*.test.ts'],
    testTimeout: 10000
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../shared')
    }
  }
});
