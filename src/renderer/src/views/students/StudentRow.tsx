import { memo, useState, useRef, useCallback, type ReactElement } from 'react'
import { Plus, Minus, Trash2, UserX, CheckCircle } from 'lucide-react'
import type { Student } from '../../types'
import {
  AvatarButton,
  GenderToggle,
  ScoreValue,
  SelectCheckbox,
  StatusBadge,
  StepperButton,
  splitTagInput
} from './StudentBits'

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
  onUpdateStudentId: (classId: string, studentId: string, newStudentId: string | undefined) => void
  onUpdateGender: (
    classId: string,
    studentId: string,
    gender: 'male' | 'female' | undefined
  ) => void
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
}): ReactElement {
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
  onUpdateGender,
  onUpdateTags,
  onRemove
}: StudentRowProps) {
  const score = student.score || 0
  const weight = student.weight || 1
  const latestScoreLog = student.scoreHistory?.[0]

  return (
    <tr className="border-b border-outline-variant/30 last:border-0 hover:bg-surface-container-high/50 transition-colors">
      <td className="px-3 py-3 text-center">
        <SelectCheckbox studentId={student.id} selected={selected} onToggle={onToggleSelected} />
      </td>
      <td className="px-4 py-3 font-medium text-on-surface">
        <div className="flex items-center gap-2">
          <AvatarButton
            student={student}
            classId={classId}
            onUploadPhoto={onUploadPhoto}
            sizeClass="w-8 h-8"
          />
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
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] text-on-surface-variant">性别</span>
              <GenderToggle
                classId={classId}
                studentId={student.id}
                gender={student.gender}
                onUpdateGender={onUpdateGender}
              />
            </div>
            <EditableCell
              value={(student.tags || []).join(' / ')}
              placeholder="标签（/ 分隔）"
              onSave={(tags) => onUpdateTags(classId, student.id, splitTagInput(tags))}
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
            <StepperButton
              direction="down"
              tone="score"
              onClick={() => onUpdateScore(classId, student.id, score - 1)}
            />
            <ScoreValue score={score} className="w-10 text-center font-bold text-sm" />
            <StepperButton
              direction="up"
              tone="score"
              onClick={() => onUpdateScore(classId, student.id, score + 1)}
            />
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
        <StatusBadge status={student.status} className="px-2.5 py-1 text-xs" />
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

export const StudentMobileCard = memo(function StudentMobileCard({
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
  onUpdateGender,
  onUpdateTags,
  onRemove
}: StudentRowProps): ReactElement {
  const score = student.score || 0
  const weight = student.weight || 1

  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container p-3 space-y-2.5">
      <div className="flex items-start gap-2.5">
        <SelectCheckbox
          studentId={student.id}
          selected={selected}
          onToggle={onToggleSelected}
          className="mt-1 shrink-0"
        />

        <AvatarButton
          student={student}
          classId={classId}
          onUploadPhoto={onUploadPhoto}
          sizeClass="w-9 h-9"
        />

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <div className="font-medium text-on-surface truncate">
              <EditableCell
                value={student.name}
                placeholder="姓名"
                onSave={(name) => onUpdateName(classId, student.id, name)}
              />
            </div>
            <span className="inline-flex items-center justify-center min-w-[1.5rem] px-2 py-0.5 rounded-full bg-secondary-container text-secondary-container-foreground text-[10px] font-medium">
              {student.pickCount}
            </span>
          </div>

          {showStudentId && (
            <div className="text-xs text-on-surface-variant">
              <EditableCell
                value={student.studentId || ''}
                placeholder="学号"
                onSave={(sid) => onUpdateStudentId(classId, student.id, sid || undefined)}
              />
            </div>
          )}

          <div className="flex items-center gap-1">
            <GenderToggle
              classId={classId}
              studentId={student.id}
              gender={student.gender}
              onUpdateGender={onUpdateGender}
              padClass="px-2"
            />
            <StatusBadge
              status={student.status}
              className="ml-auto px-2 py-0.5 text-[10px]"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {showWeight && (
          <div className="rounded-xl border border-outline-variant/30 px-2.5 py-2">
            <div className="text-on-surface-variant mb-1">权重</div>
            <div className="flex items-center justify-between">
              <StepperButton
                direction="down"
                tone="neutral"
                onClick={() => onUpdateWeight(classId, student.id, Math.max(0, weight - 1))}
              />
              <span className="font-semibold text-on-surface tabular-nums">{weight}</span>
              <StepperButton
                direction="up"
                tone="neutral"
                onClick={() => onUpdateWeight(classId, student.id, weight + 1)}
              />
            </div>
          </div>
        )}

        <div className="rounded-xl border border-outline-variant/30 px-2.5 py-2">
          <div className="text-on-surface-variant mb-1">积分</div>
          <div className="flex items-center justify-between">
            <StepperButton
              direction="down"
              tone="score"
              onClick={() => onUpdateScore(classId, student.id, score - 1)}
            />
            <ScoreValue score={score} className="font-semibold" />
            <StepperButton
              direction="up"
              tone="score"
              onClick={() => onUpdateScore(classId, student.id, score + 1)}
            />
          </div>
        </div>
      </div>

      <div className="text-xs text-on-surface-variant">
        <EditableCell
          value={(student.tags || []).join(' / ')}
          placeholder="标签（/ 分隔）"
          onSave={(tags) => onUpdateTags(classId, student.id, splitTagInput(tags))}
        />
      </div>

      <div className="flex items-center justify-end gap-1.5 pt-1">
        <button
          title={student.status === 'active' ? '设为缺席' : '设为正常'}
          onClick={() =>
            onUpdateStatus(classId, student.id, student.status === 'active' ? 'absent' : 'active')
          }
          className="h-9 px-3 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface cursor-pointer"
        >
          {student.status === 'active' ? '设缺席' : '设正常'}
        </button>
        <button
          title="删除学生"
          onClick={() => onRemove(classId, student.id)}
          className="h-9 px-3 rounded-full bg-destructive/10 text-destructive cursor-pointer"
        >
          删除
        </button>
      </div>
    </div>
  )
})
