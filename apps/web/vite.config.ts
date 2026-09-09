/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wyw from '@wyw-in-js/vite'

export default defineConfig({
  // Linaria 8 is built on wyw-in-js; the transform must run after the React plugin.
  plugins: [react(), wyw({ include: ['**/*.{ts,tsx}'] })],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Vendor code changes far less often than page code, so it stays cached across deploys
        // instead of being re-downloaded whenever a single route chunk changes. This build uses
        // Vite's Rolldown bundler, whose `codeSplitting.groups` replaces Rollup's object-form
        // `manualChunks` (unsupported here).
        codeSplitting: {
          groups: [{ name: 'vendor', test: /[\\/]node_modules[\\/]/ }],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})

