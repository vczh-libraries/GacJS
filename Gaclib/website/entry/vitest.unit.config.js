import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['test/**/*.test.ts'],
        // Real browser suites share the machine with the root workspace's native
        // RPC build. Keep browser files sequential with bounded engine timeouts.
        fileParallelism: false,
        testTimeout: 30000,
        hookTimeout: 60000,
    },
});
