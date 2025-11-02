import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: path.resolve(__dirname, 'tests/setup.ts'),
    include: ['tests/**/*.spec.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      // Mock next/image for tests
      'next/image': path.resolve(__dirname, 'tests/mocks/next-image.tsx'),
      // Support project alias '@' used in imports (e.g. '@/lib/utils')
      '@': path.resolve(__dirname, '.'),
    },
  },
})
