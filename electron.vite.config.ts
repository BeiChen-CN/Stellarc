import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json'

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    server: {
      host: '127.0.0.1',
      // 默认 4173；端口被占用时可用 STELLARC_RENDERER_PORT 覆盖
      port: Number(process.env.STELLARC_RENDERER_PORT) || 4173,
      strictPort: true
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version)
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          // 大体积依赖独立分包：Statistics 懒加载 recharts，
          // 首屏无需解析图表库
          manualChunks: {
            recharts: ['recharts']
          }
        }
      }
    }
  }
})
