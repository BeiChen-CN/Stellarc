import type { ReactElement } from 'react'
import { Check } from 'lucide-react'
import type { Student } from '../../types'
import { cn } from '../../lib/utils'
import type { TemporaryExclusionState } from './hooks/useTemporaryExclusion'

/** 临时禁选入口按钮与下拉菜单（状态由 useTemporaryExclusion 持有） */
export function TemporaryExclusionMenu({
  currentClass,
  exclusion
}: {
  currentClass: { students: Student[] } | undefined
  exclusion: TemporaryExclusionState
}): ReactElement {
  const {
    excludedMenuOpen,
    setExcludedMenuOpen,
    excludedSearch,
    setExcludedSearch,
    excludedOnly,
    setExcludedOnly,
    manualExcludedIds,
    manualExcludedSet,
    excludedMenuRef,
    filteredExcludedCandidates,
    updateManualExcludedIds
  } = exclusion

  return (
    <div className="relative" ref={excludedMenuRef}>
      <button
        onClick={() => setExcludedMenuOpen((v) => !v)}
        className="px-3 py-1.5 rounded-full text-xs bg-surface-container border border-outline-variant/40 text-on-surface cursor-pointer"
      >
        临时禁选 {manualExcludedIds.length}
      </button>
      {excludedMenuOpen && (
        <div className="absolute left-0 mt-1 w-[min(360px,calc(100vw-2rem))] max-h-[420px] overflow-hidden bg-surface-container rounded-2xl border border-outline-variant/40 elevation-2 z-40">
          <div className="px-3 py-2 border-b border-outline-variant/30 flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">
              可选 {currentClass?.students.filter((s) => s.status === 'active').length || 0} 人
            </span>
            <span className="text-xs text-on-surface-variant">
              已禁选 {manualExcludedIds.length} 人
            </span>
          </div>

          <div className="px-3 py-2 border-b border-outline-variant/30 space-y-2">
            <input
              value={excludedSearch}
              onChange={(e) => setExcludedSearch(e.target.value)}
              placeholder="搜索姓名/学号"
              className="w-full px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface outline-none"
            />
            <button
              onClick={() => setExcludedOnly((v) => !v)}
              className={cn(
                'inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs border transition-colors cursor-pointer',
                excludedOnly
                  ? 'bg-secondary-container text-secondary-container-foreground border-outline'
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant/40 hover:bg-surface-container-high'
              )}
            >
              <span
                className={cn(
                  'w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center',
                  excludedOnly
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-outline-variant/60 bg-transparent'
                )}
              >
                {excludedOnly && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
              </span>
              仅显示已禁选
            </button>
          </div>

          <div className="max-h-[250px] overflow-y-auto custom-scrollbar p-1">
            {filteredExcludedCandidates.map((student) => {
              const checked = manualExcludedSet.has(student.id)
              return (
                <button
                  key={student.id}
                  onClick={() => {
                    updateManualExcludedIds(
                      checked
                        ? manualExcludedIds.filter((id) => id !== student.id)
                        : [...manualExcludedIds, student.id]
                    )
                  }}
                  className={cn(
                    'w-full text-left px-2.5 py-2 rounded-xl text-xs cursor-pointer flex items-center justify-between gap-2',
                    checked
                      ? 'bg-secondary-container text-secondary-container-foreground'
                      : 'text-on-surface hover:bg-surface-container-high'
                  )}
                >
                  <span className="truncate">{student.name}</span>
                  <span className="text-[10px] opacity-80">{checked ? '已禁选' : '可抽取'}</span>
                </button>
              )
            })}
            {filteredExcludedCandidates.length === 0 && (
              <div className="px-2.5 py-4 text-xs text-on-surface-variant text-center">
                无匹配学生
              </div>
            )}
          </div>

          <div className="px-2 py-2 border-t border-outline-variant/30 flex items-center gap-2">
            <button
              onClick={() => {
                const allActiveIds =
                  currentClass?.students.filter((s) => s.status === 'active').map((s) => s.id) || []
                updateManualExcludedIds(allActiveIds)
              }}
              className="flex-1 px-2.5 py-1.5 rounded-xl text-xs text-on-surface hover:bg-surface-container-high cursor-pointer"
            >
              全部禁选
            </button>
            <button
              onClick={() => updateManualExcludedIds([])}
              className="flex-1 px-2.5 py-1.5 rounded-xl text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              清空禁选
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** 连抽设置开关与轮次/间隔控制 */
export function AutoDrawBar({
  autoDrawEnabled,
  onToggleEnabled,
  autoDrawRounds,
  onRoundsChange,
  autoDrawIntervalMs,
  onIntervalChange,
  autoDrawRemaining,
  onStart,
  onStop,
  isSpinning,
  canDraw
}: {
  autoDrawEnabled: boolean
  onToggleEnabled: () => void
  autoDrawRounds: number
  onRoundsChange: (value: number) => void
  autoDrawIntervalMs: number
  onIntervalChange: (value: number) => void
  autoDrawRemaining: number
  onStart: () => void
  onStop: () => void
  isSpinning: boolean
  canDraw: boolean
}): ReactElement {
  return (
    <>
      <button
        onClick={onToggleEnabled}
        title="Ctrl/Cmd + Enter 可快速开始/停止连抽"
        className={cn(
          'px-3 py-1.5 rounded-full text-xs border border-outline-variant/40 cursor-pointer',
          autoDrawEnabled
            ? 'bg-secondary-container text-secondary-container-foreground'
            : 'bg-surface-container text-on-surface'
        )}
      >
        连抽设置 {autoDrawEnabled ? '开' : '关'}
      </button>

      {autoDrawEnabled && (
        <>
          <div className="flex items-center gap-1 rounded-full bg-surface-container border border-outline-variant/40 px-2 py-1">
            <span className="text-[11px] text-on-surface-variant">轮次</span>
            <input
              type="number"
              min={1}
              max={20}
              value={autoDrawRounds}
              onChange={(e) => onRoundsChange(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              className="w-12 bg-transparent text-xs text-on-surface text-center outline-none"
            />
          </div>
          <div className="flex items-center gap-1 rounded-full bg-surface-container border border-outline-variant/40 px-2 py-1">
            <span className="text-[11px] text-on-surface-variant">间隔ms</span>
            <input
              type="number"
              min={2500}
              max={12000}
              step={100}
              value={autoDrawIntervalMs}
              onChange={(e) =>
                onIntervalChange(Math.max(2500, Math.min(12000, Number(e.target.value) || 3600)))
              }
              className="w-16 bg-transparent text-xs text-on-surface text-center outline-none"
            />
          </div>
          {autoDrawRemaining === 0 ? (
            <button
              onClick={onStart}
              disabled={isSpinning || !canDraw}
              title="Ctrl/Cmd + Enter"
              className="px-3 py-1.5 rounded-full text-xs bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              开始连抽
            </button>
          ) : (
            <button
              onClick={onStop}
              title="Ctrl/Cmd + Enter"
              className="px-3 py-1.5 rounded-full text-xs bg-destructive/10 text-destructive border border-destructive/20 cursor-pointer"
            >
              停止连抽（剩余 {autoDrawRemaining}）
            </button>
          )}
        </>
      )}
    </>
  )
}
