import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/api/invoke': {
        target: 'https://smart.shopee.io',
        changeOrigin: true,
        rewrite: () => '/apis/smart/v1/orchestrator/platform/invoke',
      },
      '/api/debug-tree': {
        target: 'https://smart.shopee.io',
        changeOrigin: true,
        rewrite: () => '/apis/smart/v1/orchestrator/get_debug_tree',
      },
    },
  },
})
