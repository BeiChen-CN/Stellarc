import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logger } from '../lib/logger'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/** 顶层渲染错误兜底：未捕获的组件异常不再白屏，记日志后展示可恢复界面 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('ErrorBoundary', 'Unhandled render error:', error, info.componentStack || '')
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
          <div className="text-xl font-semibold text-on-surface">界面出现了问题</div>
          <p className="max-w-md text-sm text-on-surface-variant">
            渲染过程中发生未预期的错误，已记录到应用日志。您的数据文件不受影响。
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => this.setState({ error: null })}
              className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground cursor-pointer"
            >
              重试
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-surface-container-high px-5 py-2 text-sm text-on-surface cursor-pointer"
            >
              重新加载
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
