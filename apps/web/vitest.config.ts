import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/components': path.resolve(__dirname, './components'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/hooks': path.resolve(__dirname, './hooks'),
      '@/config': path.resolve(__dirname, './config'),
      '@/app': path.resolve(__dirname, './app'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    pool: 'threads',
    // Parallel jsdom suites on this machine exceed the 5s default under load
    // (userEvent typing + contenteditable); 15s keeps flakes out of the signal.
    testTimeout: 15_000,
    hookTimeout: 15_000,
  },
});
