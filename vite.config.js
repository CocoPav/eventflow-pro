import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/helloasso': {
        target: 'https://api.helloasso.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/helloasso/, ''),
      },
    },
  },
})
