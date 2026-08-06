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
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/frontend': path.resolve(__dirname, './src/frontend'),
      '@/backend': path.resolve(__dirname, './src/backend'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/components': path.resolve(__dirname, './src/frontend/components'),
      '@/features': path.resolve(__dirname, './src/frontend/features'),
      '@/hooks': path.resolve(__dirname, './src/frontend/hooks'),
      '@/providers': path.resolve(__dirname, './src/frontend/providers'),
      '@/stores': path.resolve(__dirname, './src/frontend/stores'),
      '@/styles': path.resolve(__dirname, './src/frontend/styles'),
      '@/assets': path.resolve(__dirname, './src/frontend/assets'),
      '@/services': path.resolve(__dirname, './src/backend/services'),
      '@/lib': path.resolve(__dirname, './src/backend/lib'),
      '@/actions': path.resolve(__dirname, './src/backend/actions'),
      '@/middleware': path.resolve(__dirname, './src/backend/middleware'),
      '@/schemas': path.resolve(__dirname, './src/backend/schemas'),
      '@/validations': path.resolve(__dirname, './src/backend/validations'),
      '@/types': path.resolve(__dirname, './src/shared/types'),
      '@/config': path.resolve(__dirname, './src/shared/config'),
      '@/constants': path.resolve(__dirname, './src/shared/constants'),
      '@/utils': path.resolve(__dirname, './src/shared/utils'),
    },
  },
});
