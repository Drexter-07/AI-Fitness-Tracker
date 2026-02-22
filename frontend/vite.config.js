import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // using our own manifest.json
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000 // 5 MiB
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/copilotkit': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      }
    }
  }
})
