import { useState } from 'react'
import { Scale, Target, XOctagon, ChevronDown, Shuffle, BarChart3, TrendingUp, Puzzle, SlidersHorizontal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { useSettingsStore } from '../../store/settingsStore'
import { useToastStore } from '../../store/toastStore'
import { getStrategyDisplayList, useStrategyStore } from '../../store/strategyStore'
import { MD3Switch } from './MD3Switch'
import { ShortcutRecorder, formatAccelerator } from './ShortcutRecorder'

export function FairnessSection() {
  const { fairness, setFairness, shortcutKey, setShortcutKey } = useSettingsStore()
  const addToast = useToastStore((state) => state.addToast)
  const { loadedCount, lastErrors, loadPlugins, sourceFile } = useStrategyStore()
  const [strategyExpanded, setStrategyExpanded] = useState(false)

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
              <p className="text-xs text-on-surface-variant mt-0.5">允许为学生设置不同的被抽中概率</p>
            </div>
          </div>
          <MD3Switch
            checked={fairness.weightedRandom}
            onClick={() => setFairness({ ...fairness, weightedRandom: !fairness.weightedRandom })}
            label="启用权重系统"
          />
        </div>

        {/* Strategy Presets */}
        <div className="p-5 hover:bg-surface-container-high/50 transition-colors bg-surface-container-high/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 text-primary rounded-full">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-sm text-on-surface">策略预设</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  经典: 按权重抽取；均衡: 降低高频学生权重；激励: 提高高分学生权重
                </p>
              </div>
            </div>
            <button
              onClick={() => setStrategyExpanded(!strategyExpanded)}
              className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-all cursor-pointer"
            >
              <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', strategyExpanded && 'rotate-180')} />
            </button>
          </div>
          <AnimatePresence initial={false}>
            {strategyExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="pl-14 mt-3 grid grid-cols-3 gap-3">
                  {getStrategyDisplayList().map((item) => {
                    const iconMap: Record<string, typeof Shuffle> = {
                      classic: Shuffle,
                      balanced: BarChart3,
                      momentum: TrendingUp
                    }
                    const descMap: Record<string, string> = {
                      classic: '按权重随机抽取',
                      balanced: '降低高频学生权重',
                      momentum: '提高高分学生权重'
                    }
                    const Icon = iconMap[item.id] || Puzzle
                    const isActive = fairness.strategyPreset === item.id
                    return (
                    <button
                      key={item.id}
                      onClick={() => setFairness({ ...fairness, strategyPreset: item.id })}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 cursor-pointer',
                        isActive
                          ? 'bg-secondary-container border-2 border-outline'
                          : 'border-2 border-transparent hover:bg-surface-container-high'
                      )}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium text-on-surface">{item.name}</span>
                      <span className="text-[10px] text-on-surface-variant text-center leading-tight">{descMap[item.id] || '插件策略'}</span>
                    </button>
                    )
                  })}
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
              </motion.div>
            )}
          </AnimatePresence>
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
              <p className="text-xs text-on-surface-variant mt-0.5">被抽中的学生在一定轮次内不会再次被抽中</p>
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
  )
}
