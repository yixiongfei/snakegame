import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
    server: {
    port: 3001,
    host: true,
    strictPort: true, // 被占用就直接报错
    allowedHosts: true,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.VITE_BACKEND_PORT || 3000}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
})
