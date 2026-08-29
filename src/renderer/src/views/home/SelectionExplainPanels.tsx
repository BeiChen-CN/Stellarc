import type { ReactElement } from 'react'
import type { HistorySelectionMeta } from '../../engine/selection/types'

/**
 * 抽选解释相关面板：抽选前预览、学生视角未抽中原因、抽选解释。
 * reason code 的文案映射随面板一起维护（code 定义在引擎 types 中）。
 */

export const REASON_LABELS: Record<string, string> = {
  eligible: '可抽取',
  excluded_by_status: '状态排除',
  excluded_by_manual: '手动禁选',
  excluded_by_cooldown: '冷却排除',
  weighted: '权重抽取',
  strategy_adjusted: '策略修正',
  balance_target_boost: '学期均衡',
  stage_fairness_boost: '阶段公平',
  priority_unpicked: '优先未抽中',
  fallback_relaxed_constraints: '自动放宽',
  fallback_random: '随机兜底'
}

export const REASON_TOOLTIPS: Record<string, string> = {
  eligible: '该学生满足当前抽选条件，可参与本轮抽选。',
  excluded_by_status: '学生状态不是“可参与”（如缺席/排除），因此不参与本轮。',
  excluded_by_manual: '你在“临时禁选”中手动排除了该学生。',
  excluded_by_cooldown: '该学生命中防重复冷却规则，暂时不参与本轮。',
  weighted: '本轮使用权重抽取，学生基础权重会影响被抽中概率。',
  strategy_adjusted: '策略预设对基础权重进行了额外修正。',
  balance_target_boost: '学期均衡策略会降低高频学生权重，提升整体公平性。',
  stage_fairness_boost: '最近多次被抽中的学生会在阶段公平中被适度降权。',
  priority_unpicked: '该学生属于“本学期未抽中优先”名额。',
  fallback_relaxed_constraints: '因约束冲突导致无可选人，系统自动放宽了部分限制。',
  fallback_random: '当前使用随机兜底逻辑，按候选集合随机抽取。'
}

const REASON_CATEGORIES: Array<{ key: 'eligibility' | 'fairness' | 'fallback'; label: string }> = [
  { key: 'eligibility', label: '资格过滤' },
  { key: 'fairness', label: '公平策略' },
  { key: 'fallback', label: '兜底策略' }
]

function getReasonCategory(reason: string): 'eligibility' | 'fairness' | 'fallback' {
  if (
    reason.startsWith('excluded_') ||
    reason === 'eligible' ||
    reason === 'weighted' ||
    reason === 'strategy_adjusted'
  ) {
    return 'eligibility'
  }
  if (reason.includes('balance') || reason.includes('fairness') || reason.includes('priority')) {
    return 'fairness'
  }
  return 'fallback'
}

export interface PickPreview {
  totalCandidates: number
  eligibleCount: number
  excludedCount: number
  excludedBreakdown: Array<{ reason: string; count: number }>
}

export function PickPreviewPanel({ preview }: { preview: PickPreview }): ReactElement {
  return (
    <div className="mt-2 w-full max-w-2xl rounded-2xl bg-surface-container-high/70 border border-outline-variant/30 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-on-surface-variant">抽选前预览</span>
        <span className="text-xs text-on-surface-variant">
          候选 {preview.totalCandidates} / 可抽 {preview.eligibleCount} / 排除{' '}
          {preview.excludedCount}
        </span>
      </div>
      {preview.excludedBreakdown.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {preview.excludedBreakdown.map((item) => (
            <span
              key={item.reason}
              className="px-2 py-0.5 rounded-full text-[10px] bg-surface-container text-on-surface-variant"
            >
              {REASON_LABELS[item.reason] || item.reason} {item.count}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export type StudentExplain =
  | { notFound: true }
  | {
      notFound: false
      student: { id: string; name: string }
      eligible: boolean
      reasons: string[]
      finalWeight: number
      baseWeight: number
    }

export function StudentExplainPanel({
  explain,
  query,
  onQueryChange
}: {
  explain: StudentExplain | null
  query: string
  onQueryChange: (value: string) => void
}): ReactElement {
  return (
    <div className="mt-2 w-full max-w-2xl rounded-2xl bg-surface-container-high/70 border border-outline-variant/30 p-3">
      <div className="text-xs text-on-surface-variant mb-2">未抽中原因（学生视角）</div>
      <input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface outline-none"
        placeholder="输入姓名或学号查看该生当前抽选状态"
      />
      {explain && (
        <div className="mt-2 text-[11px] text-on-surface-variant">
          {'notFound' in explain && explain.notFound ? (
            <span>未匹配到学生</span>
          ) : (
            <>
              <div>
                {explain.student.name}：{explain.eligible ? '当前可抽取' : '当前不可抽取'}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {explain.reasons.map((reason) => (
                  <span
                    key={`${explain.student.id}-${reason}`}
                    className="px-1.5 py-0.5 rounded-md bg-surface-container text-on-surface-variant"
                    title={REASON_TOOLTIPS[reason] || reason}
                  >
                    {REASON_LABELS[reason] || reason}
                  </span>
                ))}
              </div>
              <div className="mt-1">
                权重 {explain.baseWeight.toFixed(2)} -&gt; {explain.finalWeight.toFixed(2)}
              </div>
              <details className="mt-1.5 rounded-lg bg-surface-container-low/60 px-2 py-1.5">
                <summary className="cursor-pointer text-[11px] text-on-surface">规则说明</summary>
                <div className="mt-1.5 space-y-1">
                  {explain.reasons.map((reason) => (
                    <div key={`tip-${explain.student.id}-${reason}`}>
                      <span className="font-medium text-on-surface">
                        {REASON_LABELS[reason] || reason}
                      </span>
                      <span className="ml-1">{REASON_TOOLTIPS[reason] || '暂无说明'}</span>
                    </div>
                  ))}
                </div>
              </details>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function SelectionExplainPanel({
  meta,
  requestedCount
}: {
  meta: HistorySelectionMeta | null
  requestedCount: number
}): ReactElement {
  const reasonCount = new Map<string, number>()
  const winnerExplanations = meta?.winnerExplanations || []
  winnerExplanations.forEach((item) => {
    item.reasons.forEach((reason) => {
      reasonCount.set(reason, (reasonCount.get(reason) || 0) + 1)
    })
  })
  const flattened = Array.from(reasonCount.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
  const reasonOverview = REASON_CATEGORIES.map((category) => ({
    ...category,
    items: flattened.filter((item) => getReasonCategory(item.reason) === category.key)
  })).filter((group) => group.items.length > 0)

  return (
    <div className="mt-2 w-full max-w-2xl rounded-2xl bg-surface-container-high/70 border border-outline-variant/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-on-surface-variant">抽选解释</div>
        <div className="text-[11px] text-on-surface-variant">
          本次抽取 {meta?.actualCount || winnerExplanations.length} 人 / 请求{' '}
          {meta?.requestedCount || requestedCount} 人
        </div>
      </div>

      {meta?.explanationSummary && (
        <div className="mb-2 text-[11px] text-on-surface-variant bg-surface-container-low/70 border border-outline-variant/20 rounded-xl px-2.5 py-1.5">
          {meta.explanationSummary}
        </div>
      )}

      {(meta?.fallbackNotes || []).length > 0 && (
        <div className="mb-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300">
          {(meta?.fallbackNotes || []).join('；')}
        </div>
      )}

      {reasonOverview.length > 0 && (
        <div className="mb-2 rounded-xl bg-surface-container-low/70 border border-outline-variant/20 p-2.5">
          <div className="text-[11px] text-on-surface-variant mb-1.5">规则命中概览</div>
          <div className="space-y-1.5">
            {reasonOverview.map((group) => (
              <div key={`reason-group-${group.key}`}>
                <div className="text-[10px] text-on-surface-variant mb-1">{group.label}</div>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <span
                      key={`reason-overview-${group.key}-${item.reason}`}
                      className="px-2 py-0.5 rounded-full text-[10px] bg-surface-container-high text-on-surface-variant"
                      title={REASON_TOOLTIPS[item.reason] || item.reason}
                    >
                      {REASON_LABELS[item.reason] || item.reason} x {item.count}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar">
        {winnerExplanations.map((item) => (
          <div
            key={item.id}
            className="rounded-xl bg-surface-container-low/70 p-2.5 border border-outline-variant/20"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-on-surface truncate">{item.name}</span>
              <span className="text-[11px] text-on-surface-variant shrink-0">
                概率约 {(item.estimatedProbability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="mt-1 text-[11px] text-on-surface-variant">
              权重 {item.baseWeight.toFixed(2)} -&gt; {item.finalWeight.toFixed(2)}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {item.reasons.map((reason) => (
                <span
                  key={`${item.id}-${reason}`}
                  className="px-1.5 py-0.5 rounded-md text-[10px] bg-surface-container-high text-on-surface-variant"
                  title={REASON_TOOLTIPS[reason] || reason}
                >
                  {REASON_LABELS[reason] || reason}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
