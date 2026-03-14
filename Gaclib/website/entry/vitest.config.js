import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/Test*.js'],
    testTimeout: 300000,
  },
})
