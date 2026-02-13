import { Home, Users, Settings as SettingsIcon, History as HistoryIcon, GraduationCap, Info, BarChart3 } from 'lucide-react'
import { cn } from '../lib/utils'

interface SidebarProps {
  currentView: 'home' | 'students' | 'history' | 'statistics' | 'settings' | 'about'
  onViewChange: (view: 'home' | 'students' | 'history' | 'statistics' | 'settings' | 'about') => void
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const items = [
    { id: 'home', label: '随机点名', icon: Home },
    { id: 'students', label: '学生管理', icon: Users },
    { id: 'history', label: '历史记录', icon: HistoryIcon },
    { id: 'statistics', label: '数据统计', icon: BarChart3 },
    { id: 'settings', label: '系统设置', icon: SettingsIcon },
    { id: 'about', label: '关于', icon: Info },
  ] as const

  return (
    <div className="w-64 bg-surface-container flex flex-col h-full z-10 transition-colors duration-300" role="navigation" aria-label="主导航">
      <div className="p-6 pb-4">
        <h1 className="text-2xl font-black flex items-center gap-2 text-primary tracking-tight">
          <GraduationCap className="w-8 h-8" />
          <span>Stellarc</span>
        </h1>
        <p className="text-xs text-on-surface-variant mt-1 ml-10 font-medium">智能课堂点名助手</p>
      </div>

      <nav className="flex-1 px-3 space-y-1" aria-label="页面导航">
        {items.map((item) => {
          const isActive = currentView === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                "flex items-center w-full px-4 py-3 text-sm font-medium rounded-full transition-all duration-200 group relative",
                isActive
                  ? "bg-secondary-container text-secondary-container-foreground"
                  : "text-on-surface-variant hover:bg-secondary-container/40 hover:text-on-surface"
              )}
            >
              <Icon className={cn("w-5 h-5 mr-3 transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-105")} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="p-6">
        <div className="text-xs text-center text-on-surface-variant font-mono opacity-40">
          v{__APP_VERSION__}
        </div>
      </div>
    </div>
  )
}
