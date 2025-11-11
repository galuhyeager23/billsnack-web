import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // During development, proxy /api requests to the backend server
  // so that relative fetch('/api/...') calls from the Vite dev server
  // are forwarded to the Express backend (commonly running on :4000).
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
        // preservePath ensures /api/* is forwarded as-is
      },
      // optionally proxy uploads/static if you serve them from backend
    }
  },
})
