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
      external: [
        '@volcengine/rtc',
        '@volcengine/rtc/extension-ainr',
      ],
      output: {
        globals: {
          '@volcengine/rtc': 'VERTC',
        },
      },
    },
  },
})
