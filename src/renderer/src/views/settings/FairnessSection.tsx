import { useState } from 'react'
import {
  Scale,
  Target,
  XOctagon,
  ChevronDown,
  Shuffle,
  BarChart3,
  TrendingUp,
  Puzzle,
  SlidersHorizontal,
  ShieldCheck
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { useSettingsStore } from '../../store/settingsStore'
import { useToastStore } from '../../store/toastStore'
import { getStrategyDisplayList, useStrategyStore } from '../../store/strategyStore'
import { MD3Switch } from './MD3Switch'

export function FairnessSection() {
  const { fairness, setFairness, scoreRules, setScoreRules } = useSettingsStore()
  const addToast = useToastStore((state) => state.addToast)
  const { loadedCount, skippedCount, lastErrors, lastDetails, loadPlugins, sourceFile } =
    useStrategyStore()
  const [strategyExpanded, setStrategyExpanded] = useState(false)

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
              <p className="text-xs text-on-surface-variant mt-0.5">
                允许为学生设置不同的被抽中概率
              </p>
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
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  strategyExpanded && 'rotate-180'
                )}
              />
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
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-primary/10 text-primary'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-medium text-on-surface">{item.name}</span>
                        <span className="text-[10px] text-on-surface-variant text-center leading-tight">
                          {descMap[item.id] || '插件策略'}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className="pl-14 mt-3 flex items-center gap-3 text-xs text-on-surface-variant">
                  <span>插件策略: {loadedCount}</span>
                  <span>跳过: {skippedCount}</span>
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
                {lastDetails.length > 0 && (
                  <div className="pl-14 mt-2 space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                    {lastDetails.slice(0, 6).map((detail) => (
                      <div key={detail.id} className="text-[11px] text-on-surface-variant">
                        {detail.id} · {detail.status}
                        {detail.reason ? ` (${detail.reason})` : ''}
                      </div>
                    ))}
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

        {/* Advanced Fairness */}
        <div className="p-5 hover:bg-surface-container-high/50 transition-colors bg-surface-container-high/30 border-t border-outline-variant/20">
          <div className="pl-14 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-on-surface">阶段公平轮次</h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                最近 N 轮被抽中越多，权重衰减越明显
              </p>
              <input
                type="number"
                min="0"
                max="20"
                value={fairness.stageFairnessRounds}
                onChange={(e) =>
                  setFairness({
                    ...fairness,
                    stageFairnessRounds: Math.max(0, Math.min(20, parseInt(e.target.value) || 0))
                  })
                }
                className="mt-2 w-24 px-3 py-1.5 border border-outline-variant rounded-full text-sm text-center bg-surface-container-low focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-on-surface"
              />
            </div>

            <div>
              <h4 className="font-medium text-sm text-on-surface">优先未抽中人数</h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                每次至少优先抽取 N 名本学期未抽中过学生
              </p>
              <input
                type="number"
                min="0"
                max="5"
                value={fairness.prioritizeUnpickedCount}
                onChange={(e) =>
                  setFairness({
                    ...fairness,
                    prioritizeUnpickedCount: Math.max(0, Math.min(5, parseInt(e.target.value) || 0))
                  })
                }
                className="mt-2 w-24 px-3 py-1.5 border border-outline-variant rounded-full text-sm text-center bg-surface-container-low focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-on-surface"
              />
            </div>
          </div>

          <div className="pl-14 mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFairness({ ...fairness, balanceByTerm: !fairness.balanceByTerm })}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs border border-outline-variant/50 cursor-pointer',
                fairness.balanceByTerm
                  ? 'bg-secondary-container text-secondary-container-foreground'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              )}
            >
              学期均衡 {fairness.balanceByTerm ? '开' : '关'}
            </button>

            <button
              onClick={() =>
                setFairness({ ...fairness, autoRelaxOnConflict: !fairness.autoRelaxOnConflict })
              }
              className={cn(
                'px-3 py-1.5 rounded-full text-xs border border-outline-variant/50 cursor-pointer',
                fairness.autoRelaxOnConflict
                  ? 'bg-secondary-container text-secondary-container-foreground'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              )}
            >
              冲突自动放宽 {fairness.autoRelaxOnConflict ? '开' : '关'}
            </button>
          </div>
        </div>

        {/* Group Strategy */}
        <div className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors border-t border-outline-variant/20">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-primary/10 text-primary rounded-full">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-medium text-on-surface">分组算法</h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                随机分组或按积分均衡分组（并减少历史搭档重复）
              </p>
            </div>
          </div>
          <div className="flex rounded-full border border-outline-variant overflow-hidden">
            <button
              onClick={() => setFairness({ ...fairness, groupStrategy: 'random' })}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-all cursor-pointer',
                fairness.groupStrategy === 'random'
                  ? 'bg-secondary-container text-secondary-container-foreground'
                  : 'text-on-surface-variant hover:bg-surface-container-high/60'
              )}
            >
              随机
            </button>
            <button
              onClick={() => setFairness({ ...fairness, groupStrategy: 'balanced-score' })}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-all cursor-pointer',
                fairness.groupStrategy === 'balanced-score'
                  ? 'bg-secondary-container text-secondary-container-foreground'
                  : 'text-on-surface-variant hover:bg-surface-container-high/60'
              )}
            >
              均衡
            </button>
          </div>
        </div>

        {fairness.groupStrategy === 'balanced-score' && (
          <div className="flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors bg-surface-container-high/30">
            <div className="pl-14">
              <h4 className="font-medium text-sm text-on-surface">搭档回避轮次</h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                最近 N 轮同组出现过的组合会被降低优先级
              </p>
            </div>
            <input
              type="number"
              min="0"
              max="20"
              value={fairness.pairAvoidRounds}
              onChange={(e) =>
                setFairness({
                  ...fairness,
                  pairAvoidRounds: Math.max(0, Math.min(20, parseInt(e.target.value) || 0))
                })
              }
              className="w-20 px-3 py-1.5 border border-outline-variant rounded-full text-sm text-center bg-surface-container-low focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-on-surface"
            />
          </div>
        )}

        <div className="p-5 hover:bg-surface-container-high/50 transition-colors border-t border-outline-variant/20">
          <div className="flex items-center space-x-4 mb-3">
            <div className="p-2 bg-primary/10 text-primary rounded-full">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-medium text-on-surface">积分规则引擎</h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                统一限制积分范围、单次变动幅度，并可阻止同任务当天重复记分
              </p>
            </div>
          </div>

          <div className="pl-14 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-on-surface-variant mb-1">积分上限</div>
              <input
                type="number"
                value={scoreRules.maxScorePerStudent}
                onChange={(e) =>
                  setScoreRules({
                    ...scoreRules,
                    maxScorePerStudent: parseInt(e.target.value) || 0
                  })
                }
                className="w-24 px-3 py-1.5 border border-outline-variant rounded-full text-sm text-center bg-surface-container-low outline-none text-on-surface"
              />
            </div>
            <div>
              <div className="text-xs text-on-surface-variant mb-1">积分下限</div>
              <input
                type="number"
                value={scoreRules.minScorePerStudent}
                onChange={(e) =>
                  setScoreRules({
                    ...scoreRules,
                    minScorePerStudent: parseInt(e.target.value) || 0
                  })
                }
                className="w-24 px-3 py-1.5 border border-outline-variant rounded-full text-sm text-center bg-surface-container-low outline-none text-on-surface"
              />
            </div>
            <div>
              <div className="text-xs text-on-surface-variant mb-1">单次最大变更</div>
              <input
                type="number"
                min="1"
                value={scoreRules.maxDeltaPerOperation}
                onChange={(e) =>
                  setScoreRules({
                    ...scoreRules,
                    maxDeltaPerOperation: parseInt(e.target.value) || 1
                  })
                }
                className="w-24 px-3 py-1.5 border border-outline-variant rounded-full text-sm text-center bg-surface-container-low outline-none text-on-surface"
              />
            </div>
          </div>

          <div className="pl-14 mt-3">
            <button
              onClick={() =>
                setScoreRules({
                  ...scoreRules,
                  preventDuplicateTaskPerDay: !scoreRules.preventDuplicateTaskPerDay
                })
              }
              className={cn(
                'px-3 py-1.5 rounded-full text-xs border border-outline-variant/50 cursor-pointer',
                scoreRules.preventDuplicateTaskPerDay
                  ? 'bg-secondary-container text-secondary-container-foreground'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              )}
            >
              同任务当日去重 {scoreRules.preventDuplicateTaskPerDay ? '开' : '关'}
            </button>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div>
                <div className="text-xs text-on-surface-variant mb-1">同任务日内上限</div>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={scoreRules.taskDailyLimitPerStudent}
                  onChange={(e) =>
                    setScoreRules({
                      ...scoreRules,
                      taskDailyLimitPerStudent: Math.max(
                        1,
                        Math.min(50, parseInt(e.target.value) || 1)
                      )
                    })
                  }
                  className="w-20 px-3 py-1.5 border border-outline-variant rounded-full text-sm text-center bg-surface-container-low outline-none text-on-surface"
                />
              </div>
              <div>
                <div className="text-xs text-on-surface-variant mb-1">可重复任务（逗号分隔）</div>
                <input
                  value={(scoreRules.allowRepeatTasks || []).join(',')}
                  onChange={(e) =>
                    setScoreRules({
                      ...scoreRules,
                      allowRepeatTasks: e.target.value
                        .split(',')
                        .map((item) => item.trim())
                        .filter((item) => item.length > 0)
                    })
                  }
                  className="w-72 px-3 py-1.5 border border-outline-variant rounded-full text-sm bg-surface-container-low outline-none text-on-surface"
                  placeholder="例：课堂纪律,加分挑战"
                />
              </div>
              <div>
                <div className="text-xs text-on-surface-variant mb-1">禁用任务（逗号分隔）</div>
                <input
                  value={(scoreRules.blockedTasks || []).join(',')}
                  onChange={(e) =>
                    setScoreRules({
                      ...scoreRules,
                      blockedTasks: e.target.value
                        .split(',')
                        .map((item) => item.trim())
                        .filter((item) => item.length > 0)
                    })
                  }
                  className="w-72 px-3 py-1.5 border border-outline-variant rounded-full text-sm bg-surface-container-low outline-none text-on-surface"
                  placeholder="例：临时测试"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
