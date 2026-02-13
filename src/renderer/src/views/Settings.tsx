import { useState, useEffect } from 'react'
import { useSettingsStore, ColorTheme } from '../store/settingsStore'
import { useToastStore } from '../store/toastStore'
import { useConfirmStore } from '../store/confirmStore'
import {
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Save,
  Database,
  Monitor,
  Scale,
  Target,
  XOctagon,
  Image as ImageIcon,
  CreditCard,
  Camera,
  History,
  Palette,
  Check,
  Layers,
  Zap,
  PartyPopper,
  Power,
  Trash2,
  Pipette,
  CloudUpload,
  CloudDownload,
  Stethoscope
} from 'lucide-react'
import { cn, toFileUrl } from '../lib/utils'
import { getStrategyDisplayList, useStrategyStore } from '../store/strategyStore'
import { useDiagnosticsStore } from '../store/diagnosticsStore'
import { MD3Switch } from './settings/MD3Switch'
import { ShortcutRecorder, formatAccelerator } from './settings/ShortcutRecorder'
import { UpdateChecker } from './settings/UpdateChecker'
import { DesignStylePreview, designStyles } from './settings/DesignStylePreview'

const colorThemes: { id: ColorTheme; label: string; color: string }[] = [
  { id: 'blue', label: '经典蓝', color: 'hsl(221.2, 83.2%, 53.3%)' },
  { id: 'violet', label: '梦幻紫', color: 'hsl(262.1, 83.3%, 57.8%)' },
  { id: 'rose', label: '玫瑰红', color: 'hsl(346.8, 77.2%, 49.8%)' },
  { id: 'green', label: '翡翠绿', color: 'hsl(142.1, 76.2%, 36.3%)' },
  { id: 'orange', label: '活力橙', color: 'hsl(24.6, 95%, 53.1%)' },
  { id: 'amber', label: '琥珀金', color: 'hsl(43, 96%, 56%)' },
  { id: 'teal', label: '青碧色', color: 'hsl(172, 66%, 40%)' },
  { id: 'slate', label: '石墨灰', color: 'hsl(215, 16%, 47%)' },
  { id: 'cloud', label: '云上舞白', color: 'hsl(30, 12%, 52%)' },
  { id: 'corundum', label: '刚玉蓝', color: 'hsl(220, 22%, 40%)' },
  { id: 'kiwi', label: '猕猴桃绿', color: 'hsl(120, 35%, 52%)' },
  { id: 'spicy', label: '辛辣红', color: 'hsl(15, 55%, 40%)' },
  { id: 'bright-teal', label: '明水鸭色', color: 'hsl(180, 35%, 45%)' },
  { id: 'indigo', label: '靛蓝', color: 'hsl(231, 45%, 53%)' },
  { id: 'sakura', label: '樱花', color: 'hsl(340, 55%, 55%)' },
  { id: 'forest', label: '森林', color: 'hsl(100, 52%, 34%)' },
  { id: 'ocean', label: '海洋', color: 'hsl(180, 100%, 21%)' },
  { id: 'mocha', label: '摩卡', color: 'hsl(25, 42%, 40%)' }
]

export function Settings() {
  const {
    theme,
    setTheme,
    colorTheme,
    setColorTheme,
    m3Mode,
    toggleM3Mode,
    projectorMode,
    toggleProjectorMode,
    activityPreset,
    setActivityPreset,
    syncEnabled,
    toggleSyncEnabled,
    syncFolder,
    setSyncFolder,
    designStyle,
    setDesignStyle,
    soundEnabled,
    toggleSoundEnabled,
    fairness,
    setFairness,
    showStudentId,
    toggleShowStudentId,
    photoMode,
    togglePhotoMode,
    backgroundImage,
    setBackgroundImage,
    animationStyle,
    setAnimationStyle,
    dynamicColor,
    toggleDynamicColor,
    confettiEnabled,
    toggleConfettiEnabled,
    maxHistoryRecords,
    setMaxHistoryRecords,
    shortcutKey,
    setShortcutKey
  } = useSettingsStore()
  const addToast = useToastStore((state) => state.addToast)
  const showConfirm = useConfirmStore((state) => state.show)
  const { loadedCount, lastErrors, loadPlugins, sourceFile } = useStrategyStore()
  const {
    loading: diagnosticsLoading,
    migrationState,
    healthReport,
    lastLoadedAt,
    loadDiagnostics
  } = useDiagnosticsStore()
  const [autoLaunch, setAutoLaunchState] = useState(false)

  useEffect(() => {
    window.electronAPI.getAutoLaunch().then(setAutoLaunchState)
    loadDiagnostics()
  }, [])

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

  const handleBackup = async () => {
    const filePath = await window.electronAPI.saveFile({
      title: '备份数据文件',
      defaultPath: 'spotlight-backup.zip',
      filters: [{ name: 'Zip 压缩文件', extensions: ['zip'] }]
    })
    if (filePath) {
      const success = await window.electronAPI.backupData(filePath)
      if (success) {
        addToast('备份创建成功！', 'success')
      } else {
        addToast('备份失败。', 'error')
      }
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

  const handleSelectBackground = async () => {
    const filePath = await window.electronAPI.selectFile({
      title: '选择背景图片',
      filters: [{ name: '图片文件', extensions: ['jpg', 'png', 'jpeg', 'webp'] }]
    })
    if (filePath) {
      setBackgroundImage(filePath)
    }
  }

  const handleSetShortcutKey = async (key: string) => {
    const success = await setShortcutKey(key)
    if (!success) {
      addToast('快捷键注册失败，可能已被系统或其他应用占用。', 'error')
      return false
    }

    if (key) {
      addToast(`快捷键已设置为 ${formatAccelerator(key)}`, 'success')
    } else {
      addToast('已清除全局快捷键', 'success')
    }

    return true
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-6 space-y-10 pb-20">
      <div>
        <h2 className="text-3xl font-bold mb-2 text-on-surface">设置</h2>
        <p className="text-on-surface-variant text-sm">自定义您的应用体验与数据管理。</p>
      </div>

      <div className="space-y-8">
        {/* Appearance & Sound */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-on-surface">
            <Monitor className="w-5 h-5 text-primary" />
            外观与体验
          </h3>
          <div className="bg-surface-container rounded-[28px] overflow-hidden">
            {/* Theme */}
            <div className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-medium text-on-surface">主题模式</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">切换应用的亮色或暗色外观</p>
                </div>
              </div>
              <div className="flex rounded-full border border-outline-variant overflow-hidden">
                {(
                  [
                    { value: 'light', label: '浅色', icon: Sun },
                    { value: 'system', label: '系统', icon: Monitor },
                    { value: 'dark', label: '深色', icon: Moon }
                  ] as const
                ).map((opt) => {
                  const Icon = opt.icon
                  const isActive = theme === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={cn(
                        'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium transition-all duration-200 relative',
                        isActive
                          ? 'bg-secondary-container text-secondary-container-foreground'
                          : 'text-on-surface-variant hover:bg-surface-container-high/60'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
            {/* Color Theme */}
            <div className="p-5 hover:bg-surface-container-high/50 transition-colors">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-on-surface">主题配色</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">选择应用的主色调</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 pl-14">
                {colorThemes.map((ct) => (
                  <button
                    key={ct.id}
                    onClick={() => setColorTheme(ct.id)}
                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 ${
                      colorTheme === ct.id
                        ? 'bg-secondary-container border-2 border-outline'
                        : 'border-2 border-transparent hover:bg-surface-container-high'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: ct.color }}
                    >
                      {colorTheme === ct.id && (
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      )}
                    </div>
                    <span className="text-xs font-medium text-on-surface-variant">{ct.label}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* M3 Color Tint Mode */}
            <div
              className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors cursor-pointer select-none"
              onClick={toggleM3Mode}
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-on-surface">主题取色</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    开启后背景、卡片、边框等都会带有主题色调
                  </p>
                </div>
              </div>
              <MD3Switch checked={m3Mode} onClick={toggleM3Mode} label="M3 色调模式" />
            </div>
            {/* Design Style */}
            <div className="p-5 hover:bg-surface-container-high/50 transition-colors">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-on-surface">设计风格</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">选择界面的视觉风格</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pl-14">
                {designStyles.map((ds) => (
                  <button
                    key={ds.id}
                    onClick={() => setDesignStyle(ds.id)}
                    className={`relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 ${
                      designStyle === ds.id
                        ? 'bg-secondary-container border-2 border-outline'
                        : 'border-2 border-transparent hover:bg-surface-container-high'
                    }`}
                  >
                    <DesignStylePreview type={ds.preview} isActive={designStyle === ds.id} />
                    <span className="text-xs font-medium text-on-surface">{ds.label}</span>
                    <span className="text-[10px] text-on-surface-variant leading-tight text-center">
                      {ds.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {/* Animation Style */}
            <div className="p-5 hover:bg-surface-container-high/50 transition-colors">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-on-surface">抽选动画</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">选择抽选时的动画效果</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 pl-14">
                {[
                  { id: 'slot' as const, label: '老虎机', desc: '经典滚动' },
                  { id: 'scroll' as const, label: '滚动', desc: '平滑滚动' },
                  { id: 'flip' as const, label: '翻转', desc: '卡片翻转' },
                  { id: 'wheel' as const, label: '转盘', desc: '幸运转盘' },
                  { id: 'bounce' as const, label: '弹跳', desc: '弹跳球效果' },
                  { id: 'typewriter' as const, label: '打字机', desc: '终端打字' },
                  { id: 'ripple' as const, label: '涟漪', desc: '波纹扩散' }
                ].map((anim) => (
                  <button
                    key={anim.id}
                    onClick={() => setAnimationStyle(anim.id)}
                    className={cn(
                      'relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 cursor-pointer',
                      animationStyle === anim.id
                        ? 'bg-secondary-container border-2 border-outline'
                        : 'border-2 border-transparent hover:bg-surface-container-high'
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {animationStyle === anim.id && (
                        <Check className="w-4 h-4 text-primary" strokeWidth={3} />
                      )}
                    </div>
                    <span className="text-xs font-medium text-on-surface">{anim.label}</span>
                    <span className="text-[10px] text-on-surface-variant">{anim.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Activity Preset */}
            <div className="p-5 hover:bg-surface-container-high/50 transition-colors">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-on-surface">课堂活动预设</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    预设会影响主页默认模式与抽选节奏
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pl-14">
                {[
                  { id: 'quick-pick' as const, label: '快速点名', desc: '高频单人抽选' },
                  { id: 'deep-focus' as const, label: '深度互动', desc: '强调公平轮换' },
                  { id: 'group-battle' as const, label: '小组对抗', desc: '优先分组模式' }
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setActivityPreset(preset.id)}
                    className={cn(
                      'relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 cursor-pointer',
                      activityPreset === preset.id
                        ? 'bg-secondary-container border-2 border-outline'
                        : 'border-2 border-transparent hover:bg-surface-container-high'
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {activityPreset === preset.id && (
                        <Check className="w-4 h-4 text-primary" strokeWidth={3} />
                      )}
                    </div>
                    <span className="text-xs font-medium text-on-surface">{preset.label}</span>
                    <span className="text-[10px] text-on-surface-variant text-center">
                      {preset.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {/* Projector Mode */}
            <div
              className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors cursor-pointer select-none"
              onClick={toggleProjectorMode}
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-on-surface">投屏模式</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    主页采用大字号高可读布局，适合教室大屏
                  </p>
                </div>
              </div>
              <MD3Switch checked={projectorMode} onClick={toggleProjectorMode} label="投屏模式" />
            </div>
            {/* Background Image */}
            <div
              className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors cursor-pointer"
              onClick={handleSelectBackground}
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-on-surface">背景图片</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    自定义主页背景 (点击更换)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {backgroundImage && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setBackgroundImage(undefined)
                    }}
                    className="text-xs text-destructive hover:underline mr-2"
                  >
                    清除
                  </button>
                )}
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center overflow-hidden">
                  {backgroundImage ? (
                    <img
                      src={toFileUrl(backgroundImage)}
                      alt="bg"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-on-surface-variant">默认</span>
                  )}
                </div>
              </div>
            </div>
            {/* Dynamic Color from Wallpaper */}
            <div
              className={cn(
                'flex items-center justify-between p-5 transition-colors select-none',
                backgroundImage
                  ? 'hover:bg-surface-container-high/50 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => {
                if (backgroundImage) toggleDynamicColor()
              }}
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  <Pipette className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-on-surface">动态取色</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {backgroundImage ? '从背景图片提取主色调作为主题色' : '请先设置背景图片'}
                  </p>
                </div>
              </div>
              <MD3Switch
                checked={dynamicColor && !!backgroundImage}
                onClick={() => {
                  if (backgroundImage) toggleDynamicColor()
                }}
                label="动态取色"
              />
            </div>
            {/* Sound */}
            <div
              className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors cursor-pointer select-none"
              onClick={toggleSoundEnabled}
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-medium text-on-surface">启用音效</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">抽奖时的声音反馈</p>
                </div>
              </div>
              <MD3Switch checked={soundEnabled} onClick={toggleSoundEnabled} label="启用音效" />
            </div>
            {/* Confetti */}{' '}
            <div
              className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors cursor-pointer select-none"
              onClick={toggleConfettiEnabled}
            >
              {' '}
              <div className="flex items-center space-x-4">
                {' '}
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  {' '}
                  <PartyPopper className="w-5 h-5" />{' '}
                </div>{' '}
                <div>
                  {' '}
                  <h4 className="font-medium text-on-surface">五彩纸屑</h4>{' '}
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    抽选结果揭晓时显示庆祝动画
                  </p>{' '}
                </div>{' '}
              </div>{' '}
              <MD3Switch
                checked={confettiEnabled}
                onClick={toggleConfettiEnabled}
                label="五彩纸屑"
              />{' '}
            </div>
            {/* Photo Mode */}
            <div
              className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors cursor-pointer select-none"
              onClick={togglePhotoMode}
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-on-surface">显示头像</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    抽选时显示学生头像 (若有)
                  </p>
                </div>
              </div>
              <MD3Switch checked={photoMode} onClick={togglePhotoMode} label="显示头像" />
            </div>
            {/* Show Student ID */}
            <div
              className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors cursor-pointer select-none"
              onClick={toggleShowStudentId}
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-on-surface">显示学号</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">在名字旁显示学号</p>
                </div>
              </div>
              <MD3Switch checked={showStudentId} onClick={toggleShowStudentId} label="显示学号" />
            </div>
          </div>
        </section>

        {/* Fairness */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-on-surface">
            <Scale className="w-5 h-5 text-primary" />
            抽选规则
          </h3>
          <div className="bg-surface-container rounded-[28px] overflow-hidden">
            {/* Weighted Random */}
            <div
              className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors cursor-pointer select-none"
              onClick={() => setFairness({ ...fairness, weightedRandom: !fairness.weightedRandom })}
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-on-surface">启用权重系统</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    允许为学生设置不同的被抽中概率
                  </p>
                </div>
              </div>
              <MD3Switch
                checked={fairness.weightedRandom}
                onClick={() =>
                  setFairness({ ...fairness, weightedRandom: !fairness.weightedRandom })
                }
                label="启用权重系统"
              />
            </div>

            <div className="p-5 hover:bg-surface-container-high/50 transition-colors bg-surface-container-high/30">
              <div className="pl-14">
                <h4 className="font-medium text-sm text-on-surface">策略预设</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  经典: 按权重抽取；均衡: 降低高频学生权重；激励: 提高高分学生权重
                </p>
              </div>
              <div className="pl-14 mt-3 grid grid-cols-3 gap-2">
                {getStrategyDisplayList().map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFairness({ ...fairness, strategyPreset: item.id })}
                    className={cn(
                      'px-3 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer',
                      fairness.strategyPreset === item.id
                        ? 'bg-secondary-container text-secondary-container-foreground'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                    )}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
              <div className="pl-14 mt-3 flex items-center gap-3 text-xs text-on-surface-variant">
                <span>插件策略: {loadedCount}</span>
                <button
                  onClick={async () => {
                    await loadPlugins()
                    addToast('策略插件已重新加载', 'success')
                  }}
                  className="px-2 py-1 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors text-on-surface cursor-pointer"
                >
                  重新加载
                </button>
                <span>来源: {sourceFile}</span>
              </div>
              {lastErrors.length > 0 && (
                <div className="pl-14 mt-2 text-[11px] text-destructive">
                  {`插件错误: ${lastErrors[0]}`}
                </div>
              )}
            </div>

            {/* Prevent Repeat */}
            <div
              className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors cursor-pointer select-none"
              onClick={() => setFairness({ ...fairness, preventRepeat: !fairness.preventRepeat })}
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  <XOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-on-surface">防止重复抽选</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    被抽中的学生在一定轮次内不会再次被抽中
                  </p>
                </div>
              </div>
              <MD3Switch
                checked={fairness.preventRepeat}
                onClick={() => setFairness({ ...fairness, preventRepeat: !fairness.preventRepeat })}
                label="防止重复抽选"
              />
            </div>

            {/* Cooldown Rounds */}
            {fairness.preventRepeat && (
              <div className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors bg-surface-container-high/30">
                <div className="pl-14">
                  <h4 className="font-medium text-sm text-on-surface">冷却轮次</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    多少轮后可再次被抽中 (0 = 直到所有人被抽过一轮)
                  </p>
                </div>
                <input
                  type="number"
                  min="0"
                  value={fairness.cooldownRounds}
                  onChange={(e) =>
                    setFairness({ ...fairness, cooldownRounds: parseInt(e.target.value) || 0 })
                  }
                  className="w-20 px-3 py-1.5 border border-outline-variant rounded-full text-sm text-center bg-surface-container-low focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-on-surface"
                />
              </div>
            )}

            {/* Global Shortcut */}
            <ShortcutRecorder shortcutKey={shortcutKey} setShortcutKey={handleSetShortcutKey} />
          </div>
        </section>

        {/* Data Management */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-on-surface">
            <Database className="w-5 h-5 text-primary" />
            数据管理
          </h3>
          <div className="bg-surface-container rounded-[28px] overflow-hidden">
            {/* Max History Records */}
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
                onChange={(e) =>
                  setMaxHistoryRecords(Math.max(100, parseInt(e.target.value) || 1000))
                }
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
              <span className="text-xs text-on-surface-variant text-center">
                导出所有设置和记录为 ZIP 文件
              </span>
            </button>
            <button
              onClick={handleRestore}
              className="flex flex-col items-center justify-center p-6 border border-outline-variant rounded-[28px] hover:bg-destructive/5 hover:border-destructive/30 transition-all duration-200 group cursor-pointer"
            >
              <div className="p-3 bg-destructive/5 text-destructive rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Database className="w-6 h-6" />
              </div>
              <span className="font-medium mb-1 text-destructive">恢复数据</span>
              <span className="text-xs text-on-surface-variant text-center">
                从备份文件恢复所有数据
              </span>
            </button>
            <button
              onClick={handleDeleteAllData}
              className="flex flex-col items-center justify-center p-6 border border-outline-variant rounded-[28px] hover:bg-destructive/5 hover:border-destructive/30 transition-all duration-200 group cursor-pointer"
            >
              <div className="p-3 bg-destructive/5 text-destructive rounded-full mb-3 group-hover:10 transition-transform">
                <Trash2 className="w-6 h-6" />
              </div>
              <span className="font-medium mb-1 text-destructive">清除数据</span>
              <span className="text-xs text-on-surface-variant text-center">
                删除所有班级、历史和设置
              </span>
            </button>
          </div>
        </section>

        {/* Multi-device Sync */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-on-surface">
            <CloudUpload className="w-5 h-5 text-primary" />
            多终端同步（可选）
          </h3>
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
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    通过共享文件夹在多台设备间同步数据
                  </p>
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
                <span className="text-xs text-on-surface-variant truncate">
                  {syncFolder || '未选择目录'}
                </span>
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
        </section>

        {/* Diagnostics */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-on-surface">
            <Stethoscope className="w-5 h-5 text-primary" />
            可观测性与诊断
          </h3>
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
                <div className="text-sm font-semibold text-on-surface mt-1">
                  {migrationState?.status || 'unknown'}
                </div>
              </div>
              <div className="rounded-2xl bg-surface-container-high/40 p-3">
                <div className="text-xs text-on-surface-variant">自检修复数</div>
                <div className="text-sm font-semibold text-on-surface mt-1">
                  {healthReport?.summary?.repaired ?? '-'}
                </div>
              </div>
              <div className="rounded-2xl bg-surface-container-high/40 p-3">
                <div className="text-xs text-on-surface-variant">自检错误数</div>
                <div className="text-sm font-semibold text-on-surface mt-1">
                  {healthReport?.summary?.error ?? '-'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* System */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-on-surface">
            <Power className="w-5 h-5 text-primary" />
            系统
          </h3>
          <div className="bg-surface-container rounded-[28px] overflow-hidden">
            {/* Auto Launch */}
            <div className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-on-surface">开机自启动</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    系统启动时自动运行 Stellarc
                  </p>
                </div>
              </div>
              <MD3Switch checked={autoLaunch} onClick={handleToggleAutoLaunch} label="开机自启动" />
            </div>
          </div>
          <UpdateChecker />
        </section>
      </div>
    </div>
  )
}
