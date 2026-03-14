import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/Testing_Protocol_*.js'],
    testTimeout: 300000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
})
