import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    testTimeout: 600 * 1000,
    setupFiles: ['./setup.ts'],
  },
});
