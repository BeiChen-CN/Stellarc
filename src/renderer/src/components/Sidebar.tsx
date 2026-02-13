import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Users, Settings as SettingsIcon, History as HistoryIcon, GraduationCap, Info, BarChart3, PanelLeftClose } from 'lucide-react'
import { cn } from '../lib/utils'

interface SidebarProps {
  currentView: 'home' | 'students' | 'history' | 'statistics' | 'settings' | 'about'
  onViewChange: (view: 'home' | 'students' | 'history' | 'statistics' | 'settings' | 'about') => void
}

const items = [
  { id: 'home', label: '随机点名', icon: Home },
  { id: 'students', label: '学生管理', icon: Users },
  { id: 'history', label: '历史记录', icon: HistoryIcon },
  { id: 'statistics', label: '数据统计', icon: BarChart3 },
  { id: 'settings', label: '系统设置', icon: SettingsIcon },
  { id: 'about', label: '关于页面', icon: Info }
] as const

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.div
      animate={{ width: collapsed ? 64 : 208 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="bg-surface-container flex flex-col h-full z-10 overflow-hidden shrink-0"
      role="navigation"
      aria-label="主导航"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2 min-h-[60px] flex items-center">
        <motion.div
          className="flex items-center gap-2 min-w-0"
          animate={{ justifyContent: collapsed ? 'center' : 'flex-start', width: '100%' }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        >
          <GraduationCap className="w-7 h-7 text-primary shrink-0" />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h1 className="text-xl font-black text-primary tracking-tight">Stellarc</h1>
                <p className="text-[11px] text-on-surface-variant font-medium">智能课堂点名助手</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5" aria-label="页面导航">
        {items.map((item) => {
          const isActive = currentView === item.id
          const Icon = item.icon
          return (
            <motion.button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              animate={{ paddingLeft: collapsed ? 0 : 12, paddingRight: collapsed ? 0 : 12 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className={cn(
                'flex items-center w-full py-2.5 text-sm font-medium rounded-full group relative overflow-hidden',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-secondary-container text-secondary-container-foreground'
                  : 'text-on-surface-variant hover:bg-secondary-container/40 hover:text-on-surface'
              )}
            >
              <Icon className={cn(
                'w-5 h-5 shrink-0',
                isActive ? 'scale-110' : 'group-hover:scale-105'
              )} />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                    animate={{ opacity: 1, width: 'auto', marginLeft: 12 }}
                    exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 flex justify-center">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
          title={collapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <PanelLeftClose className="w-4 h-4" />
          </motion.div>
        </button>
      </div>
    </motion.div>
  )
}
