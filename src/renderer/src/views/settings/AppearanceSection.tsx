import { useState, type ReactElement, type ReactNode } from 'react'
import {
  BarChart3,
  Camera,
  Check,
  ChevronDown,
  CreditCard,
  ImageIcon,
  Layers,
  Monitor,
  Moon,
  Palette,
  PartyPopper,
  Pipette,
  Shuffle,
  Sun,
  Target,
  Users,
  Volume2,
  VolumeX,
  Zap
} from 'lucide-react'

import { cn, toFileUrl } from '../../lib/utils'
import {
  type AnimationSpeed,
  type AnimationStyle,
  type ColorTheme,
  useSettingsStore
} from '../../store/settingsStore'
import { DesignStylePreview } from './DesignStylePreview'
import { designStyles } from './designStyles'
import { MD3Switch } from './MD3Switch'

const COLOR_THEMES: Array<{ id: ColorTheme; label: string; color: string }> = [
  { id: 'klein-blue', label: '克莱因蓝', color: 'hsl(223, 100%, 33%)' },
  { id: 'tiffany', label: '蒂芙尼蓝', color: 'hsl(174, 46%, 68%)' },
  { id: 'prussian', label: '普鲁士蓝', color: 'hsl(204, 100%, 16%)' },
  { id: 'titian', label: '提香红', color: 'hsl(23, 67%, 41%)' },
  { id: 'china-red', label: '中国红', color: 'hsl(0, 100%, 45%)' },
  { id: 'burgundy', label: '勃艮第红', color: 'hsl(346, 100%, 28%)' },
  { id: 'schonbrunn', label: '申布伦黄', color: 'hsl(43, 95%, 70%)' },
  { id: 'vandyke', label: '凡戴克棕', color: 'hsl(20, 56%, 36%)' },
  { id: 'marrs', label: '马尔斯绿', color: 'hsl(178, 98%, 26%)' },
  { id: 'turquoise', label: '只此青绿', color: 'hsl(174, 72%, 56%)' },
  { id: 'cloud', label: '云上舞白', color: 'hsl(30, 12%, 52%)' },
  { id: 'morandi', label: '莫兰迪绿', color: 'hsl(150, 15%, 60%)' },
  { id: 'hermes', label: '爱马仕橙', color: 'hsl(24, 95%, 48%)' },
  { id: 'blue', label: '经典蓝', color: 'hsl(221.2, 83.2%, 53.3%)' },
  { id: 'violet', label: '梦幻紫', color: 'hsl(262.1, 83.3%, 57.8%)' },
  { id: 'rose', label: '玫瑰红', color: 'hsl(346.8, 77.2%, 49.8%)' },
  { id: 'green', label: '翡翠绿', color: 'hsl(142.1, 76.2%, 36.3%)' },
  { id: 'orange', label: '活力橙', color: 'hsl(24.6, 95%, 53.1%)' },
  { id: 'amber', label: '琥珀金', color: 'hsl(43, 96%, 56%)' },
  { id: 'teal', label: '青碧色', color: 'hsl(172, 66%, 40%)' },
  { id: 'slate', label: '石墨灰', color: 'hsl(215, 16%, 47%)' },
  { id: 'corundum', label: '刚玉蓝', color: 'hsl(220, 22%, 40%)' },
  { id: 'kiwi', label: '猕猴桃绿', color: 'hsl(120, 35%, 52%)' },
  { id: 'spicy', label: '辛辣红', color: 'hsl(15, 55%, 40%)' },
  { id: 'bright-teal', label: '明水鸭色', color: 'hsl(180, 35%, 45%)' },
  { id: 'sakura', label: '樱花', color: 'hsl(340, 55%, 55%)' },
  { id: 'forest', label: '森林', color: 'hsl(100, 52%, 34%)' },
  { id: 'ocean', label: '海洋', color: 'hsl(180, 100%, 21%)' },
  { id: 'mocha', label: '摩卡', color: 'hsl(25, 42%, 40%)' }
]

const ANIMATION_STYLES: Array<{ id: AnimationStyle; label: string }> = [
  { id: 'slot', label: '老虎机' },
  { id: 'scroll', label: '滚动' },
  { id: 'flip', label: '翻转' },
  { id: 'wheel', label: '转盘' },
  { id: 'bounce', label: '弹跳' },
  { id: 'typewriter', label: '打字机' },
  { id: 'ripple', label: '涟漪' },
  { id: 'charByChar', label: '逐字' }
]

const ANIMATION_SPEEDS: Array<{ id: AnimationSpeed; label: string }> = [
  { id: 'elegant', label: '舒缓' },
  { id: 'balanced', label: '均衡' },
  { id: 'fast', label: '快速' }
]

interface AppearanceSectionProps {
  variant: 'appearance' | 'experience'
  onSelectBackground: () => void
}

interface ToggleRowProps {
  icon: ReactNode
  title: string
  desc: string
  checked: boolean
  disabled?: boolean
  onToggle: () => void
}

function ToggleRow({ icon, title, desc, checked, disabled, onToggle }: ToggleRowProps): ReactElement {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'flex w-full items-center justify-between gap-4 border-t border-outline-variant/20 p-5 text-left transition-colors',
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:bg-surface-container-high/50'
      )}
    >
      <div className="flex min-w-0 items-center space-x-4">
        <div className="rounded-full bg-primary/10 p-2 text-primary">{icon}</div>
        <div className="min-w-0">
          <h4 className="font-medium text-on-surface">{title}</h4>
          <p className="mt-0.5 text-xs text-on-surface-variant">{desc}</p>
        </div>
      </div>
      <MD3Switch checked={checked} onClick={onToggle} label={title} />
    </button>
  )
}

export function AppearanceSection({
  variant,
  onSelectBackground
}: AppearanceSectionProps): ReactElement {
  const isAppearance = variant === 'appearance'
  const [advancedExpanded, setAdvancedExpanded] = useState(false)
  const [colorsExpanded, setColorsExpanded] = useState(true)
  const visibleColorThemes = colorsExpanded ? COLOR_THEMES : COLOR_THEMES.slice(0, 9)
  const {
    theme,
    setTheme,
    colorTheme,
    setColorTheme,
    customColor,
    setCustomColor,
    designStyle,
    setDesignStyle,
    animationStyle,
    setAnimationStyle,
    animationSpeed,
    setAnimationSpeed,
    animationDurationScale,
    setAnimationDurationScale,
    projectorMode,
    toggleProjectorMode,
    backgroundImage,
    setBackgroundImage,
    dynamicColor,
    toggleDynamicColor,
    soundEnabled,
    soundIntensity,
    toggleSoundEnabled,
    setSoundIntensity,
    confettiEnabled,
    toggleConfettiEnabled,
    photoMode,
    togglePhotoMode,
    showStudentId,
    toggleShowStudentId,
    showTemporaryExclusion,
    toggleShowTemporaryExclusion,
    showAutoDraw,
    toggleShowAutoDraw,
    showSelectionExplanation,
    toggleShowSelectionExplanation,
    showPickGenderFilter,
    showPickEligibleCount,
    toggleShowPickGenderFilter,
    toggleShowPickEligibleCount,
    showPickPreviewPanel,
    toggleShowPickPreviewPanel,
    showPickMissReasonPanel,
    toggleShowPickMissReasonPanel,
    showTaskScorePanel,
    toggleShowTaskScorePanel,
    showBatchEditPanel,
    toggleShowBatchEditPanel,
    showScoreLogPanel,
    toggleShowScoreLogPanel,
    showGroupTaskTemplatePanel,
    toggleShowGroupTaskTemplatePanel
  } = useSettingsStore()

  if (!isAppearance) {
    return (
      <section className="space-y-4">
        <h3 className="flex items-center gap-2 text-xl font-semibold text-on-surface">
          <Zap className="h-5 w-5 text-primary" />
          体验
        </h3>

        <div className="overflow-hidden rounded-[28px] bg-surface-container">
          <button
            type="button"
            onClick={() => setAdvancedExpanded(!advancedExpanded)}
            className="flex w-full cursor-pointer items-center justify-between p-5 text-left transition-colors hover:bg-surface-container-high/50"
          >
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <ChevronDown
                  className={cn(
                    'h-5 w-5 transition-transform duration-200',
                    advancedExpanded && 'rotate-180'
                  )}
                />
              </div>
              <div>
                <h4 className="font-medium text-on-surface">高级体验</h4>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  低频开关默认收起，避免日常设置页堆满细项
                </p>
              </div>
            </div>
          </button>

          {advancedExpanded && (
            <>
              <ToggleRow
                icon={<Monitor className="h-5 w-5" />}
                title="投屏模式"
                desc="主页采用大字号高可读布局"
                checked={projectorMode}
                onToggle={toggleProjectorMode}
              />
              <ToggleRow
                icon={soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                title="启用音效"
                desc="抽选时播放声音反馈"
                checked={soundEnabled}
                onToggle={toggleSoundEnabled}
              />
              {soundEnabled && (
                <div className="border-t border-outline-variant/20 p-5 pl-14">
                  <div className="mb-2 text-xs text-on-surface-variant">音效强度</div>
                  <div className="flex overflow-hidden rounded-full border border-outline-variant w-fit">
                    {(['low', 'medium', 'high'] as const).map((item) => (
                      <button
                        key={item}
                        onClick={() => setSoundIntensity(item)}
                        className={cn(
                          'cursor-pointer px-3 py-1.5 text-xs font-medium transition-colors',
                          soundIntensity === item
                            ? 'bg-secondary-container text-secondary-container-foreground'
                            : 'text-on-surface-variant hover:bg-surface-container-high'
                        )}
                      >
                        {item === 'low' ? '低' : item === 'medium' ? '中' : '高'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <ToggleRow
                icon={<PartyPopper className="h-5 w-5" />}
                title="五彩纸屑"
                desc="抽选结果揭晓时显示庆祝动画"
                checked={confettiEnabled}
                onToggle={toggleConfettiEnabled}
              />
              <ToggleRow
                icon={<Camera className="h-5 w-5" />}
                title="显示头像"
                desc="抽选结果中显示学生头像"
                checked={photoMode}
                onToggle={togglePhotoMode}
              />
              <ToggleRow
                icon={<CreditCard className="h-5 w-5" />}
                title="显示学号"
                desc="在姓名旁显示学号"
                checked={showStudentId}
                onToggle={toggleShowStudentId}
              />
              <ToggleRow
                icon={<Users className="h-5 w-5" />}
                title="临时禁选"
                desc="主页显示临时排除候选人的面板"
                checked={showTemporaryExclusion}
                onToggle={toggleShowTemporaryExclusion}
              />
              <ToggleRow
                icon={<Shuffle className="h-5 w-5" />}
                title="连续抽取"
                desc="主页显示连抽设置和控制"
                checked={showAutoDraw}
                onToggle={toggleShowAutoDraw}
              />
              <ToggleRow
                icon={<BarChart3 className="h-5 w-5" />}
                title="抽选解释"
                desc="抽选后展示权重和原因解释"
                checked={showSelectionExplanation}
                onToggle={toggleShowSelectionExplanation}
              />
              <ToggleRow
                icon={<Users className="h-5 w-5" />}
                title="性别筛选"
                desc="主页显示按性别缩小抽选范围"
                checked={showPickGenderFilter}
                onToggle={toggleShowPickGenderFilter}
              />
              <ToggleRow
                icon={<Target className="h-5 w-5" />}
                title="可抽人数"
                desc="显示当前筛选范围内的候选人数"
                checked={showPickEligibleCount}
                disabled={!showPickGenderFilter}
                onToggle={toggleShowPickEligibleCount}
              />
              <ToggleRow
                icon={<Target className="h-5 w-5" />}
                title="抽选前预览"
                desc="首页显示候选、可抽、排除统计"
                checked={showPickPreviewPanel}
                onToggle={toggleShowPickPreviewPanel}
              />
              <ToggleRow
                icon={<Target className="h-5 w-5" />}
                title="未抽中原因"
                desc="首页按学生查看未抽中原因"
                checked={showPickMissReasonPanel}
                onToggle={toggleShowPickMissReasonPanel}
              />
              <ToggleRow
                icon={<CreditCard className="h-5 w-5" />}
                title="任务积分"
                desc="学生页显示任务积分模块"
                checked={showTaskScorePanel}
                onToggle={toggleShowTaskScorePanel}
              />
              <ToggleRow
                icon={<CreditCard className="h-5 w-5" />}
                title="批量编辑"
                desc="学生页显示批量编辑模块"
                checked={showBatchEditPanel}
                onToggle={toggleShowBatchEditPanel}
              />
              <ToggleRow
                icon={<BarChart3 className="h-5 w-5" />}
                title="积分日志"
                desc="学生页显示积分日志面板"
                checked={showScoreLogPanel}
                onToggle={toggleShowScoreLogPanel}
              />
              <ToggleRow
                icon={<Layers className="h-5 w-5" />}
                title="分组任务模板"
                desc="分组结果中显示任务模板分配"
                checked={showGroupTaskTemplatePanel}
                onToggle={toggleShowGroupTaskTemplatePanel}
              />
            </>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <h3 className="flex items-center gap-2 text-xl font-semibold text-on-surface">
        <Palette className="h-5 w-5 text-primary" />
        外观
      </h3>

      <div className="overflow-hidden rounded-[28px] bg-surface-container">
        <div className="flex items-center justify-between p-5 transition-colors hover:bg-surface-container-high/50">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </div>
            <div>
              <h4 className="font-medium text-on-surface">主题模式</h4>
              <p className="mt-0.5 text-xs text-on-surface-variant">切换亮色、深色或跟随系统</p>
            </div>
          </div>
          <div className="flex overflow-hidden rounded-full border border-outline-variant">
            {([
              { value: 'light', label: '浅色', icon: Sun },
              { value: 'system', label: '系统', icon: Monitor },
              { value: 'dark', label: '深色', icon: Moon }
            ] as const).map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium transition-all duration-200',
                    theme === opt.value
                      ? 'bg-secondary-container text-secondary-container-foreground'
                      : 'text-on-surface-variant hover:bg-surface-container-high/60'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="border-t border-outline-variant/20 p-5 transition-colors hover:bg-surface-container-high/50">
          <div className="mb-3 flex items-center space-x-4">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium text-on-surface">主题颜色</h4>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                选择界面主色调，支持 28+ 配色
              </p>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2 pl-14">
            {visibleColorThemes.map((item) => (
              <button
                key={item.id}
                data-testid="theme-color-option"
                onClick={() => {
                  setColorTheme(item.id)
                  setCustomColor(undefined)
                }}
                className={cn(
                  'relative flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 p-2.5 transition-all duration-200',
                  colorTheme === item.id && !customColor
                    ? 'border-outline bg-secondary-container'
                    : 'border-transparent hover:bg-surface-container-high'
                )}
              >
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-black/5"
                  style={{ backgroundColor: item.color }}
                >
                  {colorTheme === item.id && !customColor && (
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  )}
                </div>
                <span className="text-center text-xs font-medium leading-tight text-on-surface-variant">
                  {item.label}
                </span>
              </button>
            ))}
            <div
              className={cn(
                'relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-2.5 transition-all duration-200',
                customColor
                  ? 'border-outline bg-secondary-container'
                  : 'border-transparent hover:bg-surface-container-high'
              )}
            >
              <label
                className="flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-1 ring-black/5"
                style={{
                  backgroundColor: customColor || undefined,
                  background: customColor
                    ? undefined
                    : 'conic-gradient(from 0deg, hsl(0 80% 60%), hsl(60 80% 60%), hsl(120 80% 60%), hsl(180 80% 60%), hsl(240 80% 60%), hsl(300 80% 60%), hsl(360 80% 60%))'
                }}
              >
                {customColor ? (
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                ) : (
                  <Pipette className="h-3 w-3 text-white drop-shadow-sm" />
                )}
                <input
                  type="color"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  value={customColor || '#6366f1'}
                  onChange={(e) => setCustomColor(e.target.value)}
                />
              </label>
              <span className="text-center text-xs font-medium leading-tight text-on-surface-variant">
                自定义
              </span>
              {customColor && (
                <button
                  onClick={() => setCustomColor(undefined)}
                  className="absolute -right-1 -top-1 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-destructive text-[8px] leading-none text-white transition-colors hover:bg-destructive/80"
                >
                  ×
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setColorsExpanded((expanded) => !expanded)}
            className="ml-14 mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 hover:text-primary/80"
          >
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                colorsExpanded && 'rotate-180'
              )}
            />
            {colorsExpanded ? '收起主题颜色' : `展开全部 ${COLOR_THEMES.length} 种配色`}
          </button>
        </div>

        <div className="border-t border-outline-variant/20 p-5 transition-colors hover:bg-surface-container-high/50">
          <div className="mb-3 flex items-center space-x-4">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium text-on-surface">设计风格</h4>
              <p className="mt-0.5 text-xs text-on-surface-variant">选择界面的整体视觉风格</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pl-14 sm:grid-cols-3 xl:grid-cols-4">
            {designStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => setDesignStyle(style.id)}
                className={cn(
                  'relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all duration-200',
                  designStyle === style.id
                    ? 'border-outline bg-secondary-container'
                    : 'border-transparent hover:bg-surface-container-high'
                )}
              >
                <DesignStylePreview type={style.preview} isActive={designStyle === style.id} />
                <span className="text-xs font-medium text-on-surface">{style.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-outline-variant/20 p-5 transition-colors hover:bg-surface-container-high/50">
          <div className="mb-3 flex items-center space-x-4">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium text-on-surface">抽选动画</h4>
              <p className="mt-0.5 text-xs text-on-surface-variant">动画保留为单一区块，避免散落成多个开关</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pl-14 md:grid-cols-4">
            {ANIMATION_STYLES.map((item) => (
              <button
                key={item.id}
                onClick={() => setAnimationStyle(item.id)}
                className={cn(
                  'cursor-pointer rounded-xl border px-3 py-2 text-xs transition-colors',
                  animationStyle === item.id
                    ? 'border-outline bg-secondary-container text-secondary-container-foreground'
                    : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 pl-14">
            <div className="flex overflow-hidden rounded-full border border-outline-variant">
              {ANIMATION_SPEEDS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setAnimationSpeed(item.id)}
                  className={cn(
                    'cursor-pointer px-3 py-1.5 text-xs font-medium transition-colors',
                    animationSpeed === item.id
                      ? 'bg-secondary-container text-secondary-container-foreground'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs text-on-surface-variant">
              时长
              <input
                type="range"
                min={0.6}
                max={1.8}
                step={0.1}
                value={animationDurationScale}
                onChange={(e) => setAnimationDurationScale(Number(e.target.value))}
              />
            </label>
          </div>
        </div>

        <div
          className="flex cursor-pointer items-center justify-between border-t border-outline-variant/20 p-5 transition-colors hover:bg-surface-container-high/50"
          onClick={onSelectBackground}
        >
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium text-on-surface">背景图片</h4>
              <p className="mt-0.5 text-xs text-on-surface-variant">自定义主页背景</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {backgroundImage && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setBackgroundImage(undefined)
                }}
                className="mr-2 text-xs text-destructive hover:underline"
              >
                清除
              </button>
            )}
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-surface-container-high">
              {backgroundImage ? (
                <img src={toFileUrl(backgroundImage)} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-on-surface-variant">默认</span>
              )}
            </div>
          </div>
        </div>

        <ToggleRow
          icon={<Pipette className="h-5 w-5" />}
          title="动态取色"
          desc={backgroundImage ? '从背景图片提取主色调' : '请先设置背景图片'}
          checked={dynamicColor && !!backgroundImage}
          disabled={!backgroundImage}
          onToggle={() => {
            if (backgroundImage) toggleDynamicColor()
          }}
        />
      </div>
    </section>
  )
}
