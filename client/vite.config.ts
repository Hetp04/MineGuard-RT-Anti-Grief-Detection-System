import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api':   { target: 'http://localhost:3000', changeOrigin: true },
      '/cable': { target: 'ws://localhost:3000',   ws: true, changeOrigin: true },
    },
  },
  build: {
    outDir: '../public/app',
    emptyOutDir: true,
    assetsDir: 'assets',
  },
  base: '/app/',
})
