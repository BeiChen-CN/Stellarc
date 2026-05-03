import { useState, type ReactElement } from 'react'
import {
  BarChart3,
  ChevronDown,
  Scale,
  ShieldCheck,
  Shuffle,
  SlidersHorizontal,
  Target,
  TrendingUp,
  XOctagon
} from 'lucide-react'

import { getStrategyDisplayList } from '../../engine/selection/strategies'
import { cn } from '../../lib/utils'
import { useSettingsStore } from '../../store/settingsStore'
import { MD3Switch } from './MD3Switch'

export function FairnessSection(): ReactElement {
  const { fairness, setFairness, scoreRules, setScoreRules } = useSettingsStore()
  const [advancedExpanded, setAdvancedExpanded] = useState(false)

  return (
    <section className="space-y-4">
      <h3 className="flex items-center gap-2 text-xl font-semibold text-on-surface">
        <Scale className="h-5 w-5 text-primary" />
        抽选规则
      </h3>

      <div className="overflow-hidden rounded-[28px] bg-surface-container">
        <div
          className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-surface-container-high/50"
          onClick={() => setFairness({ ...fairness, weightedRandom: !fairness.weightedRandom })}
        >
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium text-on-surface">启用权重系统</h4>
              <p className="mt-0.5 text-xs text-on-surface-variant">允许为学生设置不同的抽中概率</p>
            </div>
          </div>
          <div
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <MD3Switch
              checked={fairness.weightedRandom}
              onClick={() => setFairness({ ...fairness, weightedRandom: !fairness.weightedRandom })}
              label="启用权重系统"
            />
          </div>
        </div>

        <div className="border-t border-outline-variant/20 bg-surface-container-high/30 p-5 transition-colors hover:bg-surface-container-high/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium text-sm text-on-surface">策略预设</h4>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  经典: 按权重抽取；均衡: 降低高频学生权重；激励: 提高高分学生权重
                </p>
              </div>
            </div>
          </div>

          <div className="pl-14 mt-3 grid grid-cols-3 gap-3">
            {getStrategyDisplayList().map((item) => {
              const iconMap: Record<string, typeof Shuffle> = {
                classic: Shuffle,
                balanced: BarChart3,
                momentum: TrendingUp
              }
              const Icon = iconMap[item.id] || Shuffle
              const isActive = fairness.strategyPreset === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => setFairness({ ...fairness, strategyPreset: item.id })}
                  className={cn(
                    'flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all duration-200',
                    isActive
                      ? 'border-outline bg-secondary-container'
                      : 'border-transparent hover:bg-surface-container-high'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full',
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-on-surface">{item.name}</span>
                  <span className="text-center text-[10px] leading-tight text-on-surface-variant">
                    {item.description}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div
          className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-surface-container-high/50"
          onClick={() => setFairness({ ...fairness, preventRepeat: !fairness.preventRepeat })}
        >
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <XOctagon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium text-on-surface">防止重复抽选</h4>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                被抽中的学生在一定轮次内不会再次被抽中
              </p>
            </div>
          </div>
          <div
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <MD3Switch
              checked={fairness.preventRepeat}
              onClick={() => setFairness({ ...fairness, preventRepeat: !fairness.preventRepeat })}
              label="防止重复抽选"
            />
          </div>
        </div>

        {fairness.preventRepeat && (
          <div className="border-t border-outline-variant/20 bg-surface-container-high/30 p-5 transition-colors hover:bg-surface-container-high/50">
            <div className="pl-14">
              <h4 className="font-medium text-sm text-on-surface">冷却轮次</h4>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                多少轮后可再次被抽中 (0 = 直到所有人都被抽过一轮)
              </p>
              <input
                type="number"
                min="0"
                value={fairness.cooldownRounds}
                onChange={(e) =>
                  setFairness({ ...fairness, cooldownRounds: parseInt(e.target.value) || 0 })
                }
                className="ui-number mt-2 w-20 rounded-full px-3 text-center text-sm"
              />
            </div>
          </div>
        )}

        <div className="border-t border-outline-variant/20 p-5 transition-colors hover:bg-surface-container-high/50">
          <button
            type="button"
            onClick={() => setAdvancedExpanded(!advancedExpanded)}
            className="flex w-full items-center justify-between cursor-pointer"
          >
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <ChevronDown
                  className={cn('h-5 w-5 transition-transform duration-200', advancedExpanded && 'rotate-180')}
                />
              </div>
              <div className="text-left">
                <h4 className="font-medium text-on-surface">高级公平</h4>
                <p className="mt-0.5 text-xs text-on-surface-variant">默认折叠，只有需要细调时再展开</p>
              </div>
            </div>
          </button>

          {advancedExpanded && (
            <div className="mt-4 space-y-4 pl-14">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium text-sm text-on-surface">阶段公平轮次</h4>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
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
                    className="ui-number mt-2 w-24 rounded-full px-3 text-center text-sm"
                  />
                </div>

                <div>
                  <h4 className="font-medium text-sm text-on-surface">优先未抽中人数</h4>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    每次至少优先抽取 N 名本学期未抽中过的学生
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
                    className="ui-number mt-2 w-24 rounded-full px-3 text-center text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setFairness({ ...fairness, balanceByTerm: !fairness.balanceByTerm })}
                  className={cn(
                    'cursor-pointer rounded-full border border-outline-variant/50 px-3 py-1.5 text-xs',
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
                    'cursor-pointer rounded-full border border-outline-variant/50 px-3 py-1.5 text-xs',
                    fairness.autoRelaxOnConflict
                      ? 'bg-secondary-container text-secondary-container-foreground'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  )}
                >
                  冲突自动放宽 {fairness.autoRelaxOnConflict ? '开' : '关'}
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4">
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-on-surface">分组算法</h4>
                    <p className="mt-0.5 text-xs text-on-surface-variant">
                      随机分组或按积分均衡分组，减少历史搭档重复
                    </p>
                  </div>
                </div>
                <div className="flex overflow-hidden rounded-full border border-outline-variant">
                  <button
                    onClick={() => setFairness({ ...fairness, groupStrategy: 'random' })}
                    className={cn(
                      'cursor-pointer px-3 py-1.5 text-xs font-medium transition-all',
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
                      'cursor-pointer px-3 py-1.5 text-xs font-medium transition-all',
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
                <div className="flex items-center justify-between rounded-2xl bg-surface-container-high/30 p-4">
                  <div className="pl-0">
                    <h4 className="font-medium text-sm text-on-surface">搭档回避轮次</h4>
                    <p className="mt-0.5 text-xs text-on-surface-variant">
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
                    className="ui-number w-20 rounded-full px-3 text-center text-sm"
                  />
                </div>
              )}

              <div className="border-t border-outline-variant/20 pt-4">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-on-surface">积分规则引擎</h4>
                    <p className="mt-0.5 text-xs text-on-surface-variant">
                      统一限制积分范围、单次变动幅度，并可阻止同任务当天重复记分
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <div className="mb-1 text-xs text-on-surface-variant">积分上限</div>
                    <input
                      type="number"
                      value={scoreRules.maxScorePerStudent}
                      onChange={(e) =>
                        setScoreRules({
                          ...scoreRules,
                          maxScorePerStudent: parseInt(e.target.value) || 0
                        })
                      }
                      className="ui-number w-24 rounded-full px-3 text-center text-sm"
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-on-surface-variant">积分下限</div>
                    <input
                      type="number"
                      value={scoreRules.minScorePerStudent}
                      onChange={(e) =>
                        setScoreRules({
                          ...scoreRules,
                          minScorePerStudent: parseInt(e.target.value) || 0
                        })
                      }
                      className="ui-number w-24 rounded-full px-3 text-center text-sm"
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-on-surface-variant">单次最大变更</div>
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
                      className="ui-number w-24 rounded-full px-3 text-center text-sm"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <button
                    onClick={() =>
                      setScoreRules({
                        ...scoreRules,
                        preventDuplicateTaskPerDay: !scoreRules.preventDuplicateTaskPerDay
                      })
                    }
                    className={cn(
                      'cursor-pointer rounded-full border border-outline-variant/50 px-3 py-1.5 text-xs',
                      scoreRules.preventDuplicateTaskPerDay
                        ? 'bg-secondary-container text-secondary-container-foreground'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    )}
                  >
                    同任务当天去重 {scoreRules.preventDuplicateTaskPerDay ? '开' : '关'}
                  </button>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <div>
                      <div className="mb-1 text-xs text-on-surface-variant">同任务日内上限</div>
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
                        className="ui-number w-20 rounded-full px-3 text-center text-sm"
                      />
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-on-surface-variant">可重复任务（逗号分隔）</div>
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
                        className="ui-number w-72 rounded-full px-3 text-sm"
                        placeholder="例如：课堂纪律,加分挑战"
                      />
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-on-surface-variant">禁用任务（逗号分隔）</div>
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
                        className="ui-number w-72 rounded-full px-3 text-sm"
                        placeholder="例如：临时测试"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
