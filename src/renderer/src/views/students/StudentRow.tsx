import { memo, useState, useRef, useCallback } from 'react'
import { Plus, Minus, Trash2, UserX, CheckCircle, Camera } from 'lucide-react'
import { cn, toFileUrl } from '../../lib/utils'
import type { Student } from '../../types'

interface StudentRowProps {
  student: Student
  classId: string
  selected: boolean
  onToggleSelected: (studentId: string, checked: boolean) => void
  showWeight: boolean
  showStudentId: boolean
  onUploadPhoto: (classId: string, studentId: string) => void
  onUpdateWeight: (classId: string, studentId: string, weight: number) => void
  onUpdateScore: (classId: string, studentId: string, score: number) => void
  onUpdateStatus: (
    classId: string,
    studentId: string,
    status: 'active' | 'absent' | 'excluded'
  ) => void
  onUpdateName: (classId: string, studentId: string, name: string) => void
  onUpdateStudentId: (classId: string, studentId: string, studentId2: string | undefined) => void
  onUpdateTags: (classId: string, studentId: string, tags: string[]) => void
  onRemove: (classId: string, studentId: string) => void
}

function EditableCell({
  value,
  placeholder,
  onSave
}: {
  value: string
  placeholder: string
  onSave: (val: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = useCallback(() => {
    setDraft(value)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }, [value])

  const commit = useCallback(() => {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) {
      onSave(trimmed)
    }
  }, [draft, value, onSave])

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setEditing(false)
        }}
        placeholder={placeholder}
        className="w-full px-1.5 py-0.5 border border-primary rounded text-sm bg-surface-container-low outline-none text-on-surface"
        autoFocus
      />
    )
  }

  return (
    <span
      onDoubleClick={startEdit}
      className="cursor-text hover:bg-surface-container-high/60 rounded px-1 -mx-1 transition-colors"
      title="双击编辑"
    >
      {value || <span className="text-on-surface-variant/50">{placeholder}</span>}
    </span>
  )
}

export const StudentRow = memo(function StudentRow({
  student,
  classId,
  selected,
  onToggleSelected,
  showWeight,
  showStudentId,
  onUploadPhoto,
  onUpdateWeight,
  onUpdateScore,
  onUpdateStatus,
  onUpdateName,
  onUpdateStudentId,
  onUpdateTags,
  onRemove
}: StudentRowProps) {
  const score = student.score || 0
  const weight = student.weight || 1
  const latestScoreLog = student.scoreHistory?.[0]

  return (
    <tr className="border-b border-outline-variant/30 last:border-0 hover:bg-surface-container-high/50 transition-colors">
      <td className="px-3 py-3 text-center">
        <button
          onClick={() => onToggleSelected(student.id, !selected)}
          className={cn(
            'w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer',
            selected
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-outline-variant/70 bg-surface-container'
          )}
          title={selected ? '取消选择' : '选择学生'}
        >
          {selected && <CheckCircle className="w-3 h-3" />}
        </button>
      </td>
      <td className="px-4 py-3 font-medium text-on-surface">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUploadPhoto(classId, student.id)}
            className="relative w-8 h-8 rounded-full shrink-0 group/avatar cursor-pointer overflow-hidden"
            title="点击上传照片"
          >
            {student.photo ? (
              <img
                src={toFileUrl(student.photo)}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                {student.name.slice(0, 1)}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
              <Camera className="w-3.5 h-3.5 text-white" />
            </div>
          </button>
          <div className="flex flex-col min-w-0">
            <EditableCell
              value={student.name}
              placeholder="姓名"
              onSave={(name) => onUpdateName(classId, student.id, name)}
            />
            {showStudentId && (
              <EditableCell
                value={student.studentId || ''}
                placeholder="学号"
                onSave={(sid) => onUpdateStudentId(classId, student.id, sid || undefined)}
              />
            )}
            <EditableCell
              value={(student.tags || []).join(' / ')}
              placeholder="标签（/ 分隔）"
              onSave={(tags) =>
                onUpdateTags(
                  classId,
                  student.id,
                  tags
                    .split('/')
                    .map((tag) => tag.trim())
                    .filter((tag) => tag.length > 0)
                )
              }
            />
          </div>
        </div>
      </td>

      {showWeight && (
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center space-x-1">
            <button
              onClick={() => onUpdateWeight(classId, student.id, Math.max(0, weight - 1))}
              className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center text-on-surface">{weight}</span>
            <button
              onClick={() => onUpdateWeight(classId, student.id, weight + 1)}
              className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      )}

      <td className="px-4 py-3 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center justify-center space-x-1">
            <button
              onClick={() => onUpdateScore(classId, student.id, score - 1)}
              className="p-1.5 rounded-full hover:bg-destructive/10 text-on-surface-variant hover:text-destructive cursor-pointer transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span
              className={`w-10 text-center font-bold tabular-nums text-sm ${score > 0 ? 'text-green-600 dark:text-green-400' : score < 0 ? 'text-destructive' : 'text-on-surface-variant'}`}
            >
              {score}
            </span>
            <button
              onClick={() => onUpdateScore(classId, student.id, score + 1)}
              className="p-1.5 rounded-full hover:bg-primary/10 text-on-surface-variant hover:text-primary cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          {latestScoreLog && (
            <span
              className="text-[10px] text-on-surface-variant mt-0.5"
              title={`${latestScoreLog.taskName} ${latestScoreLog.delta > 0 ? '+' : ''}${latestScoreLog.delta} · ${new Date(latestScoreLog.timestamp).toLocaleString()}`}
            >
              最近 {latestScoreLog.delta > 0 ? '+' : ''}
              {latestScoreLog.delta}
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-3 text-center">
        <span className="inline-flex items-center justify-center min-w-[1.5rem] px-2.5 py-0.5 rounded-full bg-secondary-container text-secondary-container-foreground text-xs font-medium">
          {student.pickCount}
        </span>
      </td>

      <td className="px-4 py-3 text-center">
        <span
          className={cn(
            'px-2.5 py-1 rounded-full text-xs font-medium',
            student.status === 'active'
              ? 'bg-secondary-container text-secondary-container-foreground'
              : student.status === 'absent'
                ? 'bg-tertiary-container text-tertiary'
                : 'bg-destructive/10 text-destructive'
          )}
        >
          {student.status === 'active' ? '正常' : student.status === 'absent' ? '缺席' : '排除'}
        </span>
      </td>

      <td className="px-4 py-3 text-right space-x-1">
        <button
          title={student.status === 'active' ? '设为缺席' : '设为正常'}
          onClick={() =>
            onUpdateStatus(classId, student.id, student.status === 'active' ? 'absent' : 'active')
          }
          className="p-2 hover:bg-surface-container-high rounded-full text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
        >
          {student.status === 'active' ? (
            <UserX className="w-4 h-4" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
        </button>
        <button
          title="删除学生"
          onClick={() => onRemove(classId, student.id)}
          className="p-2 hover:bg-destructive/10 rounded-full text-on-surface-variant hover:text-destructive transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  )
})
