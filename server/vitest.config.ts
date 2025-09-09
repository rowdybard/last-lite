import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
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
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    testTimeout: 10000
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../shared')
    }
  }
});
