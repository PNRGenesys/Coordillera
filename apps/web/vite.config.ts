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
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})

