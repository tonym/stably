import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['packages/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['packages/**/*.ts'],
      exclude: [
        '**/index.ts', // barrel files
        '**/*.types.ts', // type-only files
        '**/*.stories.ts', // storybook files
        '**/*.test.ts' // obviously
      ]
    },
    passWithNoTests: true
  }
});
