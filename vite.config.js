import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    historyApiFallback: true,  // SPA fallback so /t/:slug doesn't 404 in dev
  },
  preview: {
    historyApiFallback: true,
  },
})
