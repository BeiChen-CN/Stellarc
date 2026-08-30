import './assets/main.css'
import './i18n'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { logger } from './lib/logger'

// 全局兜底：未捕获异常上报主进程日志（生产环境原本会完全丢失这些信息）
window.addEventListener('error', (event) => {
  logger.error('Global', 'Uncaught error:', event.error || event.message)
})
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Global', 'Unhandled rejection:', event.reason)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
