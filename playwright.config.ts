import { defineConfig } from '@playwright/test'

// 渲染进程 dev server 端口与 electron.vite.config.ts 联动：
//   STELLARC_RENDERER_PORT=4199 npx electron-vite dev --rendererOnly
//   PLAYWRIGHT_BASE_URL=http://127.0.0.1:4199 npx playwright test
// 浏览器下载受阻的环境可改用系统浏览器：PLAYWRIGHT_BROWSER_CHANNEL=msedge
const rendererPort = Number(process.env.STELLARC_RENDERER_PORT) || 4173
const browserChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL

export default defineConfig({
  testDir: 'tests/ui',
  timeout: 30_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${rendererPort}`,
    ...(browserChannel ? { channel: browserChannel } : {})
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev -- --rendererOnly',
        url: `http://127.0.0.1:${rendererPort}`,
        reuseExistingServer: true,
        timeout: 120_000
      }
})
