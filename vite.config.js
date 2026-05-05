import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/smart-api': {
        target: 'https://smart.shopee.io',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
        rewrite: (path) => path.replace(/^\/smart-api/, ''),
      },
    },
  },
})
