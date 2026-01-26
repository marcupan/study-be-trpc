import path from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/*.test.ts', 'packages/**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],

    // Execution configuration
    fileParallelism: true,
    testTimeout: 10000,
    hookTimeout: 10000,

    // Coverage configuration (Vitest 4 best practices)
    coverage: {
      provider: 'v8',
      enabled: false, // Enable via CLI: npm run test:coverage
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',

      // Vitest 4: Use 'include' instead of deprecated 'all' and 'extensions'
      include: [
        'packages/shared/src/**/*.ts',
        'packages/server/src/**/*.ts',
        'packages/client/src/**/*.{ts,tsx}',
      ],

      // Exclusions applied to files matching 'include' pattern above
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/__tests__/**',
        '**/test-helpers.ts',
        '**/*.config.ts',
        '**/*.config.js',
        '**/*.d.ts',
        '**/types/**',
        '**/dist/**',
        '**/.next/**',
      ],

      // Coverage thresholds
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },

    // Test sequencing
    sequence: {
      shuffle: false,
      concurrent: false,
    },
  },
  resolve: {
    alias: {
      '@tasksync/shared': path.resolve(__dirname, './packages/shared/src'),
    },
  },
});
