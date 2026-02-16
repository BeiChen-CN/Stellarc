import { useState, type ReactElement, type ReactNode } from 'react'
import {
  Sun,
  Moon,
  Monitor,
  Palette,
  Layers,
  Zap,
  Target,
  Camera,
  CreditCard,
  ImageIcon,
  Pipette,
  Volume2,
  VolumeX,
  PartyPopper,
  Check,
  ChevronDown,
  Users,
  Shuffle,
  BarChart3,
  TrendingUp
} from 'lucide-react'
import { cn, toFileUrl } from '../../lib/utils'
import { useSettingsStore, ColorTheme } from '../../store/settingsStore'
import { MD3Switch } from './MD3Switch'
import { DesignStylePreview } from './DesignStylePreview'
import { designStyles } from './designStyles'

const COLOR_THEMES: { id: ColorTheme; label: string; color: string }[] = [
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

const ANIMATION_STYLES = [
  { id: 'slot' as const, label: '老虎机', desc: '经典滚动' },
  { id: 'scroll' as const, label: '滚动', desc: '平滑滚动' },
  { id: 'flip' as const, label: '翻转', desc: '卡片翻转' },
  { id: 'wheel' as const, label: '转盘', desc: '幸运转盘' },
  { id: 'bounce' as const, label: '弹跳', desc: '弹跳球效果' },
  { id: 'typewriter' as const, label: '打字机', desc: '终端打字' },
  { id: 'ripple' as const, label: '涟漪', desc: '波纹扩散' },
  { id: 'charByChar' as const, label: '逐字', desc: '逐字揭晓' }
]

const ACTIVITY_PRESETS = [
  { id: 'quick-pick' as const, label: '快速点名', desc: '高频单人抽选' },
  { id: 'deep-focus' as const, label: '深度互动', desc: '强调公平轮换' },
  { id: 'group-battle' as const, label: '小组对抗', desc: '优先分组模式' }
]

interface AppearanceSectionProps {
  variant: 'appearance' | 'experience'
  onSelectBackground: () => void
}

export function AppearanceSection({
  variant,
  onSelectBackground
}: AppearanceSectionProps): ReactElement {
  const isAppearance = variant === 'appearance'
  const isExperience = variant === 'experience'
  const [colorsExpanded, setColorsExpanded] = useState(false)
  const [designExpanded, setDesignExpanded] = useState(false)
  const [animExpanded, setAnimExpanded] = useState(false)
  const [presetExpanded, setPresetExpanded] = useState(false)
  const {
    theme,
    setTheme,
    colorTheme,
    setColorTheme,
    customColor,
    setCustomColor,
    m3Mode,
    toggleM3Mode,
    designStyle,
    setDesignStyle,
    animationStyle,
    setAnimationStyle,
    animationSpeed,
    setAnimationSpeed,
    animationDurationScale,
    setAnimationDurationScale,
    activityPreset,
    setActivityPreset,
    showClassroomFlow,
    toggleShowClassroomFlow,
    showClassroomTemplate,
    toggleShowClassroomTemplate,
    showTemporaryExclusion,
    toggleShowTemporaryExclusion,
    showAutoDraw,
    toggleShowAutoDraw,
    showSelectionExplanation,
    toggleShowSelectionExplanation,
    revealSettleMs,
    setRevealSettleMs,
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
    showPickGenderFilter,
    showPickEligibleCount,
    toggleShowPickGenderFilter,
    toggleShowPickEligibleCount,
    showPickPreviewPanel,
    showPickMissReasonPanel,
    showTaskScorePanel,
    showBatchEditPanel,
    showScoreLogPanel,
    showGroupTaskTemplatePanel,
    toggleShowPickPreviewPanel,
    toggleShowPickMissReasonPanel,
    toggleShowTaskScorePanel,
    toggleShowBatchEditPanel,
    toggleShowScoreLogPanel,
    toggleShowGroupTaskTemplatePanel
  } = useSettingsStore()

  return (
    <section className="space-y-4">
      <h3 className="text-xl font-semibold flex items-center gap-2 text-on-surface">
        {isAppearance ? (
          <Palette className="w-5 h-5 text-primary" />
        ) : (
          <Zap className="w-5 h-5 text-primary" />
        )}
        {isAppearance ? '外观' : '体验'}
      </h3>
      <div className="bg-surface-container rounded-[28px] overflow-hidden">
        {/* Theme Mode */}
        {isAppearance && (
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
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium transition-all duration-200 relative',
                      theme === opt.value
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
        )}

        {/* Animation Speed (Global) */}
        {isExperience && (
          <div className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 text-primary rounded-full">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-on-surface">动画速率</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  控制软件所有动画与过渡的速度
                </p>
              </div>
            </div>
            <div className="flex rounded-full border border-outline-variant overflow-hidden">
              {(
                [
                  { value: 'elegant', label: '优雅' },
                  { value: 'balanced', label: '均衡' },
                  { value: 'fast', label: '快速' }
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAnimationSpeed(opt.value)}
                  className={cn(
                    'px-3.5 py-1.5 text-xs font-medium transition-all duration-200',
                    animationSpeed === opt.value
                      ? 'bg-secondary-container text-secondary-container-foreground'
                      : 'text-on-surface-variant hover:bg-surface-container-high/60'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {isExperience && (
          <div className="p-5 hover:bg-surface-container-high/50 transition-colors bg-surface-container-high/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-on-surface">动画时长</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    调整点名动画的总时长（更快或更慢）
                  </p>
                </div>
              </div>
              <div className="w-[220px] shrink-0">
                <input
                  type="range"
                  min="0.6"
                  max="1.8"
                  step="0.05"
                  value={animationDurationScale}
                  onChange={(e) => setAnimationDurationScale(parseFloat(e.target.value) || 1)}
                  className="ui-range"
                />
                <div className="flex items-center justify-between text-[11px] text-on-surface-variant mt-1">
                  <span>更快</span>
                  <span>{Math.round(animationDurationScale * 100)}%</span>
                  <span>更慢</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Color Theme */}
        {isAppearance && (
          <div className="p-5 hover:bg-surface-container-high/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-on-surface">主题配色</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">选择应用的主色调</p>
                </div>
              </div>
              <button
                onClick={() => setColorsExpanded(!colorsExpanded)}
                className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-all cursor-pointer"
              >
                <ChevronDown
                  className={cn(
                    'w-4 h-4 transition-transform duration-200',
                    colorsExpanded && 'rotate-180'
                  )}
                />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2 pl-14">
              {(colorsExpanded ? COLOR_THEMES : COLOR_THEMES.slice(0, 9)).map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => {
                    setColorTheme(ct.id)
                    setCustomColor(undefined)
                  }}
                  className={cn(
                    'relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-200',
                    colorTheme === ct.id && !customColor
                      ? 'bg-secondary-container border-2 border-outline'
                      : 'border-2 border-transparent hover:bg-surface-container-high'
                  )}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center ring-1 ring-black/5"
                    style={{ backgroundColor: ct.color }}
                  >
                    {colorTheme === ct.id && !customColor && (
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    )}
                  </div>
                  <span className="text-xs font-medium text-on-surface-variant leading-tight text-center">
                    {ct.label}
                  </span>
                </button>
              ))}
              {/* Custom Color */}
              <div
                className={cn(
                  'relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-200',
                  customColor
                    ? 'bg-secondary-container border-2 border-outline'
                    : 'border-2 border-transparent hover:bg-surface-container-high'
                )}
              >
                <label
                  className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer ring-1 ring-black/5 overflow-hidden"
                  style={{
                    backgroundColor: customColor || undefined,
                    background: customColor
                      ? undefined
                      : 'conic-gradient(from 0deg, hsl(0 80% 60%), hsl(60 80% 60%), hsl(120 80% 60%), hsl(180 80% 60%), hsl(240 80% 60%), hsl(300 80% 60%), hsl(360 80% 60%))'
                  }}
                >
                  {customColor ? (
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  ) : (
                    <Pipette className="w-3 h-3 text-white drop-shadow-sm" />
                  )}
                  <input
                    type="color"
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    value={customColor || '#6366f1'}
                    onChange={(e) => setCustomColor(e.target.value)}
                  />
                </label>
                <span className="text-xs font-medium text-on-surface-variant leading-tight text-center">
                  自定义
                </span>
                {customColor && (
                  <button
                    onClick={() => setCustomColor(undefined)}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center text-[8px] leading-none cursor-pointer hover:bg-destructive/80 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            {!colorsExpanded && COLOR_THEMES.length > 9 && (
              <button
                onClick={() => setColorsExpanded(true)}
                className="mt-2 ml-14 text-xs text-primary hover:text-primary/80 font-medium cursor-pointer transition-colors"
              >
                展开全部 {COLOR_THEMES.length} 种配色...
              </button>
            )}
          </div>
        )}

        {/* M3 Color Tint */}
        {isAppearance && (
          <ToggleRow
            icon={<Palette className="w-5 h-5" />}
            title="主题取色"
            desc="开启后背景、卡片、边框等都会带有主题色调"
            checked={m3Mode}
            onToggle={toggleM3Mode}
          />
        )}

        {/* Design Style */}
        {isAppearance && (
          <CollapsibleGrid
            icon={<Layers className="w-5 h-5" />}
            title="设计风格"
            desc="选择界面的视觉风格"
            expanded={designExpanded}
            onToggle={() => setDesignExpanded(!designExpanded)}
          >
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
          </CollapsibleGrid>
        )}

        {/* Animation Style */}
        {isExperience && (
          <CollapsibleGrid
            icon={<Zap className="w-5 h-5" />}
            title="抽选动画"
            desc="选择抽选时的动画效果"
            expanded={animExpanded}
            onToggle={() => setAnimExpanded(!animExpanded)}
          >
            <div className="grid grid-cols-4 gap-3 pl-14">
              {ANIMATION_STYLES.map((anim) => (
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
          </CollapsibleGrid>
        )}

        {/* Activity Preset */}
        {isExperience && (
          <CollapsibleGrid
            icon={<Target className="w-5 h-5" />}
            title="课堂活动预设"
            desc="预设会影响主页默认模式与抽选节奏"
            expanded={presetExpanded}
            onToggle={() => setPresetExpanded(!presetExpanded)}
          >
            <div className="grid grid-cols-3 gap-3 pl-14">
              {ACTIVITY_PRESETS.map((preset) => (
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
          </CollapsibleGrid>
        )}

        {isExperience && (
          <ToggleRow
            icon={<Layers className="w-5 h-5" />}
            title="课堂流程"
            desc="在主页显示课堂流程选择与步骤切换"
            checked={showClassroomFlow}
            onToggle={toggleShowClassroomFlow}
          />
        )}

        {isExperience && (
          <ToggleRow
            icon={<Target className="w-5 h-5" />}
            title="课堂模板"
            desc="在主页显示快速点名/深度互动/小组对抗模板"
            checked={showClassroomTemplate}
            onToggle={toggleShowClassroomTemplate}
          />
        )}

        {isExperience && (
          <ToggleRow
            icon={<Users className="w-5 h-5" />}
            title="临时禁选"
            desc="在主页上方显示临时禁选面板"
            checked={showTemporaryExclusion}
            onToggle={toggleShowTemporaryExclusion}
          />
        )}

        {isExperience && (
          <ToggleRow
            icon={<Shuffle className="w-5 h-5" />}
            title="连续抽取"
            desc="在主页上方显示连抽设置和控制"
            checked={showAutoDraw}
            onToggle={toggleShowAutoDraw}
          />
        )}

        {isExperience && showAutoDraw && (
          <div className="p-5 hover:bg-surface-container-high/50 transition-colors bg-surface-container-high/30 border-t border-outline-variant/20">
            <div className="pl-14 flex items-center justify-between gap-4">
              <div>
                <h4 className="font-medium text-sm text-on-surface">揭晓稳定等待（毫秒）</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  连抽时，上一轮揭晓结束后额外等待该时间再开始下一轮
                </p>
              </div>
              <input
                type="number"
                min="0"
                max="5000"
                step="100"
                value={revealSettleMs}
                onChange={(e) =>
                  setRevealSettleMs(Math.max(0, Math.min(5000, parseInt(e.target.value) || 0)))
                }
                className="ui-number w-24 rounded-full text-sm text-center px-3"
              />
            </div>
          </div>
        )}

        {isExperience && (
          <ToggleRow
            icon={<BarChart3 className="w-5 h-5" />}
            title="抽选解释"
            desc="在每次抽选后展示权重与原因解释"
            checked={showSelectionExplanation}
            onToggle={toggleShowSelectionExplanation}
          />
        )}

        {/* Projector Mode */}
        {isExperience && (
          <ToggleRow
            icon={<Monitor className="w-5 h-5" />}
            title="投屏模式"
            desc="主页采用大字号高可读布局，适合教室大屏"
            checked={projectorMode}
            onToggle={toggleProjectorMode}
          />
        )}

        {/* Background Image */}
        {isAppearance && (
          <div
            className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors cursor-pointer"
            onClick={onSelectBackground}
          >
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 text-primary rounded-full">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-on-surface">背景图片</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">自定义主页背景 (点击更换)</p>
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
        )}

        {/* Dynamic Color */}
        {isAppearance && (
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
        )}

        {/* Sound */}
        {isExperience && (
          <ToggleRow
            icon={soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            title="启用音效"
            desc="抽奖时的声音反馈"
            checked={soundEnabled}
            onToggle={toggleSoundEnabled}
          />
        )}

        {isExperience && soundEnabled && (
          <div className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors bg-surface-container-high/30">
            <div className="pl-14">
              <h4 className="font-medium text-sm text-on-surface">点名音效强度</h4>
              <p className="text-xs text-on-surface-variant mt-0.5">控制点名过程中的滴答音量大小</p>
            </div>
            <div className="flex rounded-full border border-outline-variant overflow-hidden">
              {(
                [
                  { value: 'low', label: '低' },
                  { value: 'medium', label: '中' },
                  { value: 'high', label: '高' }
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSoundIntensity(opt.value)}
                  className={cn(
                    'px-3.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer',
                    soundIntensity === opt.value
                      ? 'bg-secondary-container text-secondary-container-foreground'
                      : 'text-on-surface-variant hover:bg-surface-container-high/60'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Confetti */}
        {isExperience && (
          <ToggleRow
            icon={<PartyPopper className="w-5 h-5" />}
            title="五彩纸屑"
            desc="抽选结果揭晓时显示庆祝动画"
            checked={confettiEnabled}
            onToggle={toggleConfettiEnabled}
          />
        )}

        {/* Photo Mode */}
        {isExperience && (
          <ToggleRow
            icon={<Camera className="w-5 h-5" />}
            title="显示头像"
            desc="抽选时显示学生头像 (若有)"
            checked={photoMode}
            onToggle={togglePhotoMode}
          />
        )}

        {/* Show Student ID */}
        {isExperience && (
          <ToggleRow
            icon={<CreditCard className="w-5 h-5" />}
            title="显示学号"
            desc="在名字旁显示学号"
            checked={showStudentId}
            onToggle={toggleShowStudentId}
          />
        )}

        {isExperience && (
          <ToggleRow
            icon={<Users className="w-5 h-5" />}
            title="抽取范围筛选"
            desc="首页显示范围（全部/男生/女生）"
            checked={showPickGenderFilter}
            onToggle={toggleShowPickGenderFilter}
          />
        )}

        {isExperience && showPickGenderFilter && (
          <ToggleRow
            icon={<BarChart3 className="w-5 h-5" />}
            title="范围可抽人数"
            desc="范围按钮后显示当前可抽人数"
            checked={showPickEligibleCount}
            onToggle={toggleShowPickEligibleCount}
          />
        )}

        {isExperience && (
          <div className="p-5 hover:bg-surface-container-high/50 transition-colors border-t border-outline-variant/20">
            <div className="flex items-center space-x-4 mb-2">
              <div className="p-2 bg-primary/10 text-primary rounded-full">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-on-surface">功能模块显示</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">控制首页与学生管理模块显示</p>
              </div>
            </div>
          </div>
        )}

        {isExperience && (
          <ToggleRow
            icon={<Target className="w-5 h-5" />}
            title="抽选前预览"
            desc="首页显示候选/可抽/排除统计"
            checked={showPickPreviewPanel}
            onToggle={toggleShowPickPreviewPanel}
          />
        )}

        {isExperience && (
          <ToggleRow
            icon={<Target className="w-5 h-5" />}
            title="未抽中原因"
            desc="首页按学生查看未抽中原因"
            checked={showPickMissReasonPanel}
            onToggle={toggleShowPickMissReasonPanel}
          />
        )}

        {isExperience && (
          <ToggleRow
            icon={<CreditCard className="w-5 h-5" />}
            title="批量编辑"
            desc="学生页显示批量编辑模块"
            checked={showBatchEditPanel}
            onToggle={toggleShowBatchEditPanel}
          />
        )}

        {isExperience && (
          <ToggleRow
            icon={<TrendingUp className="w-5 h-5" />}
            title="任务积分"
            desc="学生页显示任务积分模块"
            checked={showTaskScorePanel}
            onToggle={toggleShowTaskScorePanel}
          />
        )}

        {isExperience && (
          <ToggleRow
            icon={<Layers className="w-5 h-5" />}
            title="分组任务模板"
            desc="学生页显示分组任务模板编辑"
            checked={showGroupTaskTemplatePanel}
            onToggle={toggleShowGroupTaskTemplatePanel}
          />
        )}

        {isExperience && (
          <ToggleRow
            icon={<BarChart3 className="w-5 h-5" />}
            title="积分日志面板"
            desc="学生页显示积分日志与回滚"
            checked={showScoreLogPanel}
            onToggle={toggleShowScoreLogPanel}
          />
        )}
      </div>
    </section>
  )
}

function CollapsibleGrid({
  icon,
  title,
  desc,
  expanded,
  onToggle,
  children
}: {
  icon: ReactNode
  title: string
  desc: string
  expanded: boolean
  onToggle: () => void
  children: ReactNode
}): ReactElement {
  return (
    <div className="p-5 hover:bg-surface-container-high/50 transition-colors">
      <div className="flex items-center justify-between mb-0">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-primary/10 text-primary rounded-full">{icon}</div>
          <div>
            <h4 className="font-medium text-on-surface">{title}</h4>
            <p className="text-xs text-on-surface-variant mt-0.5">{desc}</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-all cursor-pointer"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
      {expanded && <div className="overflow-hidden pt-4">{children}</div>}
    </div>
  )
}

function ToggleRow({
  icon,
  title,
  desc,
  checked,
  onToggle
}: {
  icon: React.ReactNode
  title: string
  desc: string
  checked: boolean
  onToggle: () => void
}): ReactElement {
  return (
    <div
      className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors cursor-pointer select-none"
      onClick={onToggle}
    >
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-primary/10 text-primary rounded-full">{icon}</div>
        <div>
          <h4 className="font-medium text-on-surface">{title}</h4>
          <p className="text-xs text-on-surface-variant mt-0.5">{desc}</p>
        </div>
      </div>
      <div
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <MD3Switch checked={checked} onClick={onToggle} label={title} />
      </div>
    </div>
  )
}
