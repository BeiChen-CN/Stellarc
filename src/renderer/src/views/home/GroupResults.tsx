import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { LayoutGrid } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Student } from '../../types'

interface GroupResultsProps {
  groups: Student[][]
  assignments?: Array<{
    groupIndex: number
    taskTemplateId: string
    taskName: string
    scoreDelta: number
  }>
  taskOptions?: Array<{
    id: string
    name: string
    scoreDelta: number
  }>
  onUpdateAssignment?: (
    groupIndex: number,
    patch: { taskName?: string; scoreDelta?: number }
  ) => void
  onApplyTemplateToGroup?: (groupIndex: number, templateId: string) => void
}

export function GroupResults({
  groups,
  assignments = [],
  taskOptions = [],
  onUpdateAssignment,
  onApplyTemplateToGroup
}: GroupResultsProps) {
  const assignmentMap = new Map(assignments.map((item) => [item.groupIndex, item]))
  const totalStudents = groups.reduce((sum, group) => sum + group.length, 0)
  const sizeList = groups.map((group) => group.length)
  const maxSize = sizeList.length > 0 ? Math.max(...sizeList) : 0
  const minSize = sizeList.length > 0 ? Math.min(...sizeList) : 0

  const TaskListPicker = ({
    groupIndex,
    taskTemplateId,
    taskName
  }: {
    groupIndex: number
    taskTemplateId: string
    taskName: string
  }) => {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (!open) return
      const handler = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, [open])

    return (
      <div ref={ref} className="relative flex-1 min-w-0">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="w-full text-left px-2 py-1 rounded-md border border-primary/20 bg-white/65 dark:bg-black/10 text-[11px] text-primary outline-none cursor-pointer truncate"
          title={taskName || '选择任务'}
        >
          {taskName || '选择任务'}
        </button>

        {open && (
          <div className="absolute z-30 mt-1 w-full min-w-[170px] rounded-lg border border-outline-variant/40 bg-surface-container p-1 shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
            {taskOptions.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onApplyTemplateToGroup?.(groupIndex, item.id)
                  setOpen(false)
                }}
                className={cn(
                  'w-full text-left px-2 py-1.5 rounded-md text-[11px] cursor-pointer',
                  item.id === taskTemplateId
                    ? 'bg-secondary-container text-secondary-container-foreground'
                    : 'text-on-surface hover:bg-surface-container-high'
                )}
              >
                {item.name}（{item.scoreDelta > 0 ? '+' : ''}
                {item.scoreDelta}）
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full min-h-0 flex flex-col"
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <LayoutGrid className="w-4 h-4 text-primary shrink-0" />
        <span className="text-base font-semibold text-on-surface">分组结果</span>
      </div>

      <div className="mb-3 text-center text-[11px] text-on-surface-variant">
        共 {groups.length} 组 / {totalStudents} 人，组内人数范围 {minSize}-{maxSize}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden pr-1">
        <div
          className={cn(
            'grid gap-3 w-full',
            groups.length === 1
              ? 'grid-cols-1'
              : groups.length <= 4
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          )}
        >
          {groups.map((group, gi) => (
            <motion.div
              key={gi}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.06, type: 'spring', stiffness: 220, damping: 22 }}
              className="bg-surface-container-high rounded-xl p-3 elevation-1 min-w-0"
            >
              <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-outline-variant/30">
                <span className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
                  {gi + 1}
                </span>
                <span className="text-xs font-semibold text-on-surface truncate">
                  第 {gi + 1} 组
                </span>
                <span className="text-[10px] text-on-surface-variant ml-auto shrink-0">
                  {group.length} 人
                </span>
              </div>

              {assignmentMap.has(gi + 1) && (
                <div className="mb-2 rounded-lg bg-primary/10 border border-primary/20 px-2 py-1.5 text-[11px] text-primary">
                  <div className="flex items-center gap-1.5">
                    <span className="shrink-0">任务：</span>
                    <TaskListPicker
                      groupIndex={gi + 1}
                      taskTemplateId={assignmentMap.get(gi + 1)?.taskTemplateId || ''}
                      taskName={assignmentMap.get(gi + 1)?.taskName || ''}
                    />
                    <input
                      type="number"
                      value={assignmentMap.get(gi + 1)?.scoreDelta || 0}
                      onChange={(e) =>
                        onUpdateAssignment?.(gi + 1, {
                          scoreDelta: Math.trunc(Number(e.target.value) || 0)
                        })
                      }
                      className="w-16 px-2 py-1 rounded-md border border-primary/20 bg-white/65 dark:bg-black/10 text-[11px] text-primary text-center outline-none"
                      title="该组任务分值"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {group.map((student, idx) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-2 px-1.5 py-1 rounded-md hover:bg-surface-container transition-colors"
                  >
                    <span className="text-[10px] text-on-surface-variant w-4 text-right shrink-0">
                      {idx + 1}
                    </span>
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[9px] font-bold shrink-0">
                      {student.name.slice(0, 1)}
                    </div>
                    <span className="text-xs text-on-surface truncate">{student.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
