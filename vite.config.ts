import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),

      // fix loading all icon chunks in dev mode
      // https://github.com/tabler/tabler-icons/issues/1233
      '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
    },
  },
  server: {
    proxy: {
      // 将本地 /api 代理到后端，避免跨域并支持 cookie
      '/api': {
        target: 'https://service-dev.meetchances.com',
        changeOrigin: true,
        secure: false,
        // 由于后端实际前缀为 /api/v1，这里重写路径
        rewrite: (p) => p.replace(/^\/api/, '/api/v1'),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 将体积较大的 SDK 与其扩展拆分为独立 chunk
          if (id.includes('@volcengine/rtc/extension-ainr')) return 'volc-rtc-ainr';
          if (id.includes('@volcengine/rtc')) return 'volc-rtc';

          // 将常见大型依赖做基础分包，避免单包过大
          if (id.includes('node_modules')) {
            if (id.includes('@tanstack/')) return 'tanstack';
            if (id.includes('react')) return 'react-vendor';
            if (id.includes('lucide-react') || id.includes('@tabler/icons-react')) return 'icons';
            if (id.includes('zustand')) return 'zustand';
          }
        },
      },
    },
  },
})
