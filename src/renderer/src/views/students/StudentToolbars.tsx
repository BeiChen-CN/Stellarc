import { useState, type ReactElement } from 'react'
import { BadgeCheck, Clock3, PencilLine, Undo2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { ScoreLogEntry } from '../../types'
import { InlineSelect, type DropdownOption } from './InlineSelect'
import i18next from 'i18next'

/** 学生页顶部工具条：批量编辑 / 任务积分 / 分组任务模板 / 积分日志 */

export interface StudentScoreLog extends ScoreLogEntry {
  studentId: string
  studentName: string
}

export interface BatchEditPatch {
  gender?: 'male' | 'female'
  status?: 'active' | 'absent' | 'excluded'
  weight?: number
  tags?: string[]
  tagsMode: 'replace' | 'append'
}

/** 批量编辑条：草稿状态内聚在组件内，应用时上抛 patch */
export function BatchEditBar({
  selectedCount,
  genderOptions,
  statusOptions,
  onApply
}: {
  selectedCount: number
  genderOptions: DropdownOption[]
  statusOptions: DropdownOption[]
  onApply: (patch: BatchEditPatch) => void
}): ReactElement {
  const [gender, setGender] = useState<'keep' | 'male' | 'female'>('keep')
  const [status, setStatus] = useState<'keep' | 'active' | 'absent' | 'excluded'>('keep')
  const [weight, setWeight] = useState('')
  const [tags, setTags] = useState('')
  const [tagsMode, setTagsMode] = useState<'replace' | 'append'>('append')

  const apply = (): void => {
    const parsedTags = tags
      .split('/')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
    onApply({
      gender: gender === 'keep' ? undefined : gender,
      status: status === 'keep' ? undefined : status,
      weight: weight.trim() ? Math.max(1, Math.trunc(Number(weight) || 1)) : undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
      tagsMode
    })
  }

  return (
    <div className="mb-3 rounded-2xl border border-outline-variant/30 bg-surface-container-high/70 px-3 py-2">
      <div className="flex items-center gap-2 mb-2">
        <PencilLine className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs text-on-surface-variant">
          批量编辑（仅已选 {selectedCount} 人）
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <InlineSelect
          value={gender}
          onChange={(value) => setGender(value as 'keep' | 'male' | 'female')}
          options={genderOptions}
          placeholder={i18next.t('性别不变')}
        />
        <InlineSelect
          value={status}
          onChange={(value) => setStatus(value as 'keep' | 'active' | 'absent' | 'excluded')}
          options={statusOptions}
          placeholder={i18next.t('状态不变')}
        />
        <input
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-24 px-2 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface outline-none"
          placeholder={i18next.t('权重')}
        />
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-44 px-2 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface outline-none"
          placeholder={i18next.t('标签（/分隔）')}
        />
        <button
          onClick={() => setTagsMode((m) => (m === 'append' ? 'replace' : 'append'))}
          className="px-2.5 py-1.5 rounded-xl text-xs bg-surface-container-low text-on-surface-variant border border-outline-variant/40 cursor-pointer"
        >
          标签模式：{tagsMode === 'append' ? '追加' : '替换'}
        </button>
        <button
          onClick={apply}
          className="px-3 py-1.5 rounded-xl text-xs bg-primary text-primary-foreground cursor-pointer"
        >
          {i18next.t('应用批量编辑')}
        </button>
      </div>
    </div>
  )
}

/** 任务积分条（草稿状态保留在 Students，应用范围由父级处理） */
export function TaskScoreBar({
  taskName,
  onTaskNameChange,
  taskDelta,
  onTaskDeltaChange,
  taskTagQuery,
  onTaskTagQueryChange,
  selectedCount,
  matchedTagCount,
  tagOptions,
  onApply
}: {
  taskName: string
  onTaskNameChange: (value: string) => void
  taskDelta: number
  onTaskDeltaChange: (value: number) => void
  taskTagQuery: string
  onTaskTagQueryChange: (value: string) => void
  selectedCount: number
  matchedTagCount: number
  tagOptions: Array<{ tag: string; count: number }>
  onApply: (scope: 'selected' | 'all' | 'tag') => void
}): ReactElement {
  return (
    <>
      <div className="mb-3 flex items-center gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-high/70 px-3 py-2">
        <span className="text-xs text-on-surface-variant">{i18next.t('任务积分')}</span>
        <input
          value={taskName}
          onChange={(e) => onTaskNameChange(e.target.value)}
          className="w-40 px-3 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface outline-none"
          placeholder={i18next.t('任务名称')}
        />
        <input
          type="number"
          value={taskDelta}
          onChange={(e) => onTaskDeltaChange(Number(e.target.value) || 0)}
          className="w-20 px-2 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface outline-none text-center"
          title={i18next.t('分值')}
        />
        <div className="flex items-center gap-1">
          {[1, 2, 5, -1, -2].map((preset) => (
            <button
              key={preset}
              onClick={() => onTaskDeltaChange(preset)}
              className="px-2 py-1 rounded-lg text-[11px] bg-surface-container-low text-on-surface-variant hover:bg-surface-container cursor-pointer"
            >
              {preset > 0 ? '+' : ''}
              {preset}
            </button>
          ))}
        </div>
        <button
          onClick={() => onApply('selected')}
          className="px-3 py-1.5 rounded-xl text-xs bg-primary text-primary-foreground cursor-pointer"
        >
          应用到已选（{selectedCount}）
        </button>
        <button
          onClick={() => onApply('all')}
          className="px-3 py-1.5 rounded-xl text-xs bg-secondary-container text-secondary-container-foreground cursor-pointer"
        >
          {i18next.t('应用到全体')}
        </button>
        <div className="flex items-center gap-1 pl-2 border-l border-outline-variant/30">
          <BadgeCheck className="w-3.5 h-3.5 text-primary" />
          <input
            value={taskTagQuery}
            onChange={(e) => onTaskTagQueryChange(e.target.value)}
            className="w-24 px-2 py-1 rounded-lg border border-outline-variant/40 bg-surface-container-low text-[11px] text-on-surface outline-none"
            placeholder={i18next.t('按标签')}
          />
          <button
            onClick={() => onApply('tag')}
            className="px-2.5 py-1.5 rounded-xl text-xs bg-primary/10 text-primary border border-primary/20 cursor-pointer"
          >
            标签应用（{matchedTagCount}）
          </button>
        </div>
      </div>

      {tagOptions.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {tagOptions.slice(0, 10).map((item) => (
            <button
              key={item.tag}
              onClick={() => onTaskTagQueryChange(item.tag)}
              className="px-2 py-1 rounded-full text-[11px] bg-surface-container-high text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              {item.tag} ({item.count})
            </button>
          ))}
        </div>
      )}
    </>
  )
}

/** 分组任务模板条：草稿状态内聚在组件内 */
export function GroupTaskTemplateBar({
  defaultDraft,
  onSave
}: {
  defaultDraft: string
  onSave: (draft: string) => void
}): ReactElement {
  const [draft, setDraft] = useState(defaultDraft)
  return (
    <div className="mb-3 flex items-center gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-high/70 px-3 py-2">
      <span className="text-xs text-on-surface-variant">{i18next.t('分组任务模板')}</span>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="flex-1 px-3 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface outline-none"
        placeholder={i18next.t('格式：任务A:+1,任务B:+2')}
      />
      <button
        onClick={() => onSave(draft)}
        className="px-3 py-1.5 rounded-xl text-xs bg-primary/10 text-primary border border-primary/20 cursor-pointer"
      >
        {i18next.t('保存模板')}
      </button>
    </div>
  )
}

/** 积分日志面板 */
export function ScoreLogPanel({
  logs,
  studentFilter,
  onStudentFilterChange,
  sourceFilter,
  onSourceFilterChange,
  taskFilter,
  onTaskFilterChange,
  studentOptions,
  sourceOptions,
  onRollback
}: {
  logs: StudentScoreLog[]
  studentFilter: string
  onStudentFilterChange: (value: string) => void
  sourceFilter: 'all' | 'manual' | 'task-assignment' | 'batch'
  onSourceFilterChange: (value: 'all' | 'manual' | 'task-assignment' | 'batch') => void
  taskFilter: string
  onTaskFilterChange: (value: string) => void
  studentOptions: DropdownOption[]
  sourceOptions: DropdownOption[]
  onRollback: (studentId: string, logId: string) => void
}): ReactElement {
  return (
    <div className="mb-3 rounded-2xl border border-outline-variant/30 bg-surface-container-high/50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Clock3 className="w-4 h-4 text-primary" />
        <span className="text-xs text-on-surface-variant">{i18next.t('积分日志面板')}</span>
        <span className="text-[11px] text-on-surface-variant">共 {logs.length} 条</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        <InlineSelect
          value={studentFilter}
          onChange={onStudentFilterChange}
          options={studentOptions}
          placeholder={i18next.t('全部学生')}
        />
        <InlineSelect
          value={sourceFilter}
          onChange={onSourceFilterChange}
          options={sourceOptions}
          placeholder={i18next.t('全部来源')}
        />
        <input
          value={taskFilter}
          onChange={(e) => onTaskFilterChange(e.target.value)}
          placeholder={i18next.t('筛选任务名')}
          className="px-3 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface outline-none"
        />
      </div>

      <div className="max-h-44 overflow-y-auto custom-scrollbar space-y-1.5">
        {logs.slice(0, 120).map((log) => (
          <div
            key={log.id}
            className="flex items-center justify-between gap-2 rounded-xl bg-surface-container px-2.5 py-1.5 border border-outline-variant/20"
          >
            <div className="min-w-0">
              <div className="text-xs text-on-surface truncate">
                {log.studentName} · {log.taskName}
              </div>
              <div className="text-[10px] text-on-surface-variant">
                {new Date(log.timestamp).toLocaleString()} · {log.source}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={cn(
                  'text-xs font-semibold',
                  log.delta > 0
                    ? 'text-green-600 dark:text-green-400'
                    : log.delta < 0
                      ? 'text-destructive'
                      : 'text-on-surface-variant'
                )}
              >
                {log.delta > 0 ? '+' : ''}
                {log.delta}
              </span>
              <button
                onClick={() => onRollback(log.studentId, log.id)}
                className="px-2 py-1 rounded-lg text-[11px] bg-destructive/10 text-destructive cursor-pointer inline-flex items-center gap-1"
              >
                <Undo2 className="w-3 h-3" />
                {i18next.t('撤销')}
              </button>
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-xs text-on-surface-variant text-center py-4">
            {i18next.t('暂无匹配日志')}
          </div>
        )}
      </div>
    </div>
  )
}
