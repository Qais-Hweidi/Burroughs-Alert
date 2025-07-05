import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      reportsDirectory: './coverage'
    }
  },
  resolve: {
    alias: {
      '@': resolve(process.cwd(), './src'),
      '@/components': resolve(process.cwd(), './src/components'),
      '@/lib': resolve(process.cwd(), './src/lib'),
      '@/types': resolve(process.cwd(), './src/lib/types'),
      '@/utils': resolve(process.cwd(), './src/lib/utils'),
    },
  },
});
