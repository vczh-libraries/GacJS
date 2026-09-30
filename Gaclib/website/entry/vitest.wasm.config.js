import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['test/Testing_Wasm.js'],
        testTimeout: 120000,
        hookTimeout: 60000,
        fileParallelism: false,
    },
});
