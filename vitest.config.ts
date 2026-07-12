import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // forks/threads на Node 25 ломают runner context в bench
    // (TypeError: Cannot read properties of undefined (reading 'config'))
    pool: 'vmThreads',
  },
});
