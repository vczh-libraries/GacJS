import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/Testing_Protocol_*.js'],
    globalSetup: './test/Protocol_GlobalSetup.js',
    testTimeout: 300000,
    hookTimeout: 300000,
    fileParallelism: false,
  },
})
