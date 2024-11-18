import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    testTimeout: 600 * 1000,
    hookTimeout: 600 * 1000,
    globalSetup: ['./setup.ts'],
  },
});
