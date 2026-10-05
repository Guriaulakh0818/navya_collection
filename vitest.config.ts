import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'tests/unit/**/*.test.{ts,tsx}',
      'tests/components/**/*.test.{ts,tsx}',
      'tests/integration/**/*.test.{ts,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', '.next/', 'tests/'],
    },
  },
  resolve: {
    alias: [
      { find: '@/frontend', replacement: path.resolve(__dirname, './src/frontend') },
      { find: '@/backend', replacement: path.resolve(__dirname, './src/backend') },
      { find: '@/shared', replacement: path.resolve(__dirname, './src/shared') },
      { find: '@/components', replacement: path.resolve(__dirname, './src/frontend/components') },
      { find: '@/features', replacement: path.resolve(__dirname, './src/frontend/features') },
      { find: '@/hooks', replacement: path.resolve(__dirname, './src/frontend/hooks') },
      { find: '@/providers', replacement: path.resolve(__dirname, './src/frontend/providers') },
      { find: '@/stores', replacement: path.resolve(__dirname, './src/frontend/stores') },
      { find: '@/styles', replacement: path.resolve(__dirname, './src/frontend/styles') },
      { find: '@/assets', replacement: path.resolve(__dirname, './src/frontend/assets') },
      { find: '@/services', replacement: path.resolve(__dirname, './src/backend/services') },
      { find: '@/lib', replacement: path.resolve(__dirname, './src/backend/lib') },
      { find: '@/actions', replacement: path.resolve(__dirname, './src/backend/actions') },
      { find: '@/middleware', replacement: path.resolve(__dirname, './src/backend/middleware') },
      { find: '@/schemas', replacement: path.resolve(__dirname, './src/backend/schemas') },
      { find: '@/validations', replacement: path.resolve(__dirname, './src/backend/validations') },
      { find: '@/types', replacement: path.resolve(__dirname, './src/shared/types') },
      { find: '@/config', replacement: path.resolve(__dirname, './src/shared/config') },
      { find: '@/constants', replacement: path.resolve(__dirname, './src/shared/constants') },
      { find: '@/utils', replacement: path.resolve(__dirname, './src/shared/utils') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
});
