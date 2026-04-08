import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei'],
    force: true
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      '.preview.emergentcf.cloud',
      '.preview.emergentagent.com',
      '.emergent.host',
      'localhost'
    ],
    hmr: {
      clientPort: 443,
      protocol: 'wss'
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  }
})
