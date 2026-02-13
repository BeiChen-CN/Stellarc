import { useState, useEffect } from 'react'
import { Database, Save, History, Trash2, Power, Stethoscope, CloudUpload, CloudDownload, ChevronDown, CalendarDays } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { useSettingsStore } from '../../store/settingsStore'
import { useToastStore } from '../../store/toastStore'
import { useConfirmStore } from '../../store/confirmStore'
import { useDiagnosticsStore } from '../../store/diagnosticsStore'
import { MD3Switch } from './MD3Switch'
import { UpdateChecker } from './UpdateChecker'

export function DataSection() {
  const { maxHistoryRecords, setMaxHistoryRecords, syncEnabled, toggleSyncEnabled, syncFolder, setSyncFolder, semester, setSemester } =
    useSettingsStore()
  const addToast = useToastStore((state) => state.addToast)
  const showConfirm = useConfirmStore((state) => state.show)
  const { loading: diagnosticsLoading, migrationState, healthReport, lastLoadedAt, loadDiagnostics } =
    useDiagnosticsStore()
  const [autoLaunch, setAutoLaunchState] = useState(false)
  const [syncExpanded, setSyncExpanded] = useState(false)
  const [diagExpanded, setDiagExpanded] = useState(false)

  useEffect(() => {
    window.electronAPI.getAutoLaunch().then(setAutoLaunchState)
    loadDiagnostics()
  }, [])

  const handleBackup = async () => {
    const filePath = await window.electronAPI.saveFile({
      title: '备份数据文件',
      defaultPath: 'spotlight-backup.zip',
      filters: [{ name: 'Zip 压缩文件', extensions: ['zip'] }]
    })
    if (filePath) {
      const success = await window.electronAPI.backupData(filePath)
      addToast(success ? '备份创建成功！' : '备份失败。', success ? 'success' : 'error')
    }
  }

  const handleRestore = async () => {
    showConfirm('恢复数据', '恢复数据将覆盖当前所有数据。确定要继续吗？', async () => {
      const filePath = await window.electronAPI.selectFile({
        title: '选择备份文件',
        filters: [{ name: 'Zip 压缩文件', extensions: ['zip'] }]
      })
      if (filePath) {
        const success = await window.electronAPI.restoreData(filePath)
        if (success) {
          addToast('恢复成功！应用将重新加载。', 'success')
          setTimeout(() => window.location.reload(), 1500)
        } else {
          addToast('恢复失败。', 'error')
        }
      }
    })
  }

  const handleDeleteAllData = () => {
    showConfirm(
      '清除所有数据',
      '此操作将删除所有班级、历史记录和设置，且不可撤销。确定要继续吗？',
      async () => {
        await window.electronAPI.writeJson('classes.json', { classes: [], currentClassId: null })
        await window.electronAPI.writeJson('history.json', [])
        await window.electronAPI.writeJson('settings.json', {})
        addToast('所有数据已清除，即将重新加载...', 'success')
        setTimeout(() => window.location.reload(), 1500)
      }
    )
  }

  const handleChooseSyncFolder = async () => {
    const folder = await window.electronAPI.selectFolder()
    if (!folder) return
    setSyncFolder(folder)
    addToast('已设置同步目录', 'success')
  }

  const handleSyncToFolder = async () => {
    if (!syncFolder) {
      addToast('请先选择同步目录', 'error')
      return
    }
    const ok = await window.electronAPI.syncDataToFolder(syncFolder)
    addToast(ok ? '已同步到共享目录' : '同步失败', ok ? 'success' : 'error')
  }

  const handleSyncFromFolder = async () => {
    if (!syncFolder) {
      addToast('请先选择同步目录', 'error')
      return
    }
    const ok = await window.electronAPI.syncDataFromFolder(syncFolder)
    if (ok) {
      addToast('已从共享目录拉取，应用将重新加载', 'success')
      setTimeout(() => window.location.reload(), 1200)
    } else {
      addToast('拉取失败', 'error')
    }
  }

  const handleToggleAutoLaunch = async () => {
    const next = !autoLaunch
    const ok = await window.electronAPI.setAutoLaunch(next)
    if (ok) {
      setAutoLaunchState(next)
      addToast(next ? '已启用开机自启动' : '已关闭开机自启动', 'success')
    } else {
      addToast('设置失败', 'error')
    }
  }

  return (
    <>
      {/* Data Management */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-on-surface">
          <Database className="w-5 h-5 text-primary" />
          数据管理
        </h3>
        <div className="bg-surface-container rounded-[28px] overflow-hidden">
          <div className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 text-primary rounded-full">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-on-surface">历史记录上限</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">最多保留的历史记录条数</p>
              </div>
            </div>
            <input
              type="number"
              min="100"
              max="10000"
              step="100"
              value={maxHistoryRecords}
              onChange={(e) => setMaxHistoryRecords(Math.max(100, parseInt(e.target.value) || 1000))}
              className="w-24 px-3 py-1.5 border border-outline-variant rounded-full text-sm text-center bg-surface-container-low focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-on-surface"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <button
            onClick={handleBackup}
            className="flex flex-col items-center justify-center p-6 border border-outline-variant rounded-[28px] hover:bg-surface-container-high transition-all duration-200 group cursor-pointer"
          >
            <div className="p-3 bg-primary/5 text-primary rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Save className="w-6 h-6" />
            </div>
            <span className="font-medium mb-1 text-on-surface">备份数据</span>
            <span className="text-xs text-on-surface-variant text-center">导出所有设置和记录为 ZIP 文件</span>
          </button>
          <button
            onClick={handleRestore}
            className="flex flex-col items-center justify-center p-6 border border-outline-variant rounded-[28px] hover:bg-destructive/5 hover:border-destructive/30 transition-all duration-200 group cursor-pointer"
          >
            <div className="p-3 bg-destructive/5 text-destructive rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Database className="w-6 h-6" />
            </div>
            <span className="font-medium mb-1 text-destructive">恢复数据</span>
            <span className="text-xs text-on-surface-variant text-center">从备份文件恢复所有数据</span>
          </button>
          <button
            onClick={handleDeleteAllData}
            className="flex flex-col items-center justify-center p-6 border border-outline-variant rounded-[28px] hover:bg-destructive/5 hover:border-destructive/30 transition-all duration-200 group cursor-pointer"
          >
            <div className="p-3 bg-destructive/5 text-destructive rounded-full mb-3 group-hover:10 transition-transform">
              <Trash2 className="w-6 h-6" />
            </div>
            <span className="font-medium mb-1 text-destructive">清除数据</span>
            <span className="text-xs text-on-surface-variant text-center">删除所有班级、历史和设置</span>
          </button>
        </div>
      </section>

      {/* Semester Setting */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-on-surface">
          <CalendarDays className="w-5 h-5 text-primary" />
          学期设置
        </h3>
        <div className="bg-surface-container rounded-[28px] overflow-hidden">
          <div className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 text-primary rounded-full">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-on-surface">当前学期</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">用于统计页面的「本学期」时间范围筛选</p>
              </div>
            </div>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="px-3 py-1.5 border border-outline-variant rounded-full text-sm bg-surface-container-low focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-on-surface cursor-pointer"
            >
              <option value="">自动检测</option>
              {(() => {
                const now = new Date()
                const y = now.getFullYear()
                const options: { value: string; label: string }[] = []
                for (let year = y + 1; year >= y - 2; year--) {
                  options.push({ value: `${year}-spring`, label: `${year} 年春季学期` })
                  options.push({ value: `${year}-fall`, label: `${year} 年秋季学期` })
                }
                return options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))
              })()}
            </select>
          </div>
        </div>
      </section>

      {/* Multi-device Sync */}
      <section className="space-y-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setSyncExpanded(!syncExpanded)}
        >
          <h3 className="text-xl font-semibold flex items-center gap-2 text-on-surface">
            <CloudUpload className="w-5 h-5 text-primary" />
            多终端同步（可选）
          </h3>
          <button className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-all cursor-pointer">
            <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', syncExpanded && 'rotate-180')} />
          </button>
        </div>
        <AnimatePresence initial={false}>
          {syncExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="bg-surface-container rounded-[28px] overflow-hidden">
                <div
                  className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors cursor-pointer select-none"
                  onClick={toggleSyncEnabled}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 text-primary rounded-full">
                      <CloudUpload className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-on-surface">启用目录同步</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">通过共享文件夹在多台设备间同步数据</p>
                    </div>
                  </div>
                  <MD3Switch checked={syncEnabled} onClick={toggleSyncEnabled} label="目录同步" />
                </div>
                <div className="p-5 border-t border-outline-variant/20">
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={handleChooseSyncFolder}
                      className="px-4 py-1.5 border border-outline-variant rounded-full text-sm font-medium text-on-surface cursor-pointer hover:bg-surface-container-high transition-colors"
                    >
                      选择同步目录
                    </button>
                    <span className="text-xs text-on-surface-variant truncate">{syncFolder || '未选择目录'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={!syncEnabled || !syncFolder}
                      onClick={handleSyncToFolder}
                      className="px-4 py-1.5 rounded-full text-sm font-medium bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-1">
                        <CloudUpload className="w-4 h-4" /> 推送到目录
                      </span>
                    </button>
                    <button
                      disabled={!syncEnabled || !syncFolder}
                      onClick={handleSyncFromFolder}
                      className="px-4 py-1.5 rounded-full text-sm font-medium bg-secondary-container text-secondary-container-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-1">
                        <CloudDownload className="w-4 h-4" /> 从目录拉取
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Diagnostics */}
      <section className="space-y-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setDiagExpanded(!diagExpanded)}
        >
          <h3 className="text-xl font-semibold flex items-center gap-2 text-on-surface">
            <Stethoscope className="w-5 h-5 text-primary" />
            可观测性与诊断
          </h3>
          <button className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-all cursor-pointer">
            <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', diagExpanded && 'rotate-180')} />
          </button>
        </div>
        <AnimatePresence initial={false}>
          {diagExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="bg-surface-container rounded-[28px] overflow-hidden p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-on-surface">诊断报告</h4>
                    <p className="text-xs text-on-surface-variant">
                      最近刷新：{lastLoadedAt ? new Date(lastLoadedAt).toLocaleString() : '未加载'}
                    </p>
                  </div>
                  <button
                    onClick={loadDiagnostics}
                    className="px-4 py-1.5 border border-outline-variant rounded-full text-sm font-medium text-on-surface cursor-pointer hover:bg-surface-container-high transition-colors"
                  >
                    {diagnosticsLoading ? '刷新中...' : '刷新'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-surface-container-high/40 p-3">
                    <div className="text-xs text-on-surface-variant">迁移状态</div>
                    <div className="text-sm font-semibold text-on-surface mt-1">{migrationState?.status || 'unknown'}</div>
                  </div>
                  <div className="rounded-2xl bg-surface-container-high/40 p-3">
                    <div className="text-xs text-on-surface-variant">自检修复数</div>
                    <div className="text-sm font-semibold text-on-surface mt-1">{healthReport?.summary?.repaired ?? '-'}</div>
                  </div>
                  <div className="rounded-2xl bg-surface-container-high/40 p-3">
                    <div className="text-xs text-on-surface-variant">自检错误数</div>
                    <div className="text-sm font-semibold text-on-surface mt-1">{healthReport?.summary?.error ?? '-'}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* System */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-on-surface">
          <Power className="w-5 h-5 text-primary" />
          系统
        </h3>
        <div className="bg-surface-container rounded-[28px] overflow-hidden">
          <div className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 text-primary rounded-full">
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-on-surface">开机自启动</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">系统启动时自动运行 Stellarc</p>
              </div>
            </div>
            <MD3Switch checked={autoLaunch} onClick={handleToggleAutoLaunch} label="开机自启动" />
          </div>
        </div>
        <UpdateChecker />
      </section>
    </>
  )
}
