import { CheckCircle, Camera, Plus, Minus } from 'lucide-react'
import { cn, toFileUrl } from '../../lib/utils'
import type { Student } from '../../types'

/**
 * StudentRow（桌面表格行）与 StudentMobileCard（移动卡片）共用的子组件。
 * 两处布局容器不同，但每个控件的状态着色与交互完全一致。
 */

export function SelectCheckbox({
  studentId,
  selected,
  onToggle,
  className
}: {
  studentId: string
  selected: boolean
  onToggle: (studentId: string, checked: boolean) => void
  className?: string
}): React.ReactElement {
  return (
    <button
      onClick={() => onToggle(studentId, !selected)}
      className={cn(
        'w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer',
        selected
          ? 'bg-primary border-primary text-primary-foreground'
          : 'border-outline-variant/70 bg-surface-container',
        className
      )}
      title={selected ? '取消选择' : '选择学生'}
    >
      {selected && <CheckCircle className="w-3 h-3" />}
    </button>
  )
}

export function AvatarButton({
  student,
  onUploadPhoto,
  classId,
  sizeClass
}: {
  student: Student
  onUploadPhoto: (classId: string, studentId: string) => void
  classId: string
  sizeClass: string
}): React.ReactElement {
  return (
    <button
      onClick={() => onUploadPhoto(classId, student.id)}
      className={cn(
        'relative rounded-full shrink-0 group/avatar cursor-pointer overflow-hidden',
        sizeClass
      )}
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
  )
}

export function GenderToggle({
  classId,
  studentId,
  gender,
  onUpdateGender,
  padClass = 'px-1.5'
}: {
  classId: string
  studentId: string
  gender: 'male' | 'female' | undefined
  onUpdateGender: (
    classId: string,
    studentId: string,
    gender: 'male' | 'female' | undefined
  ) => void
  padClass?: string
}): React.ReactElement {
  return (
    <>
      <button
        onClick={() => onUpdateGender(classId, studentId, 'male')}
        className={cn(
          `${padClass} py-0.5 rounded-full text-[10px] cursor-pointer border`,
          gender === 'male'
            ? 'bg-secondary-container text-secondary-container-foreground border-transparent'
            : 'bg-surface-container-low text-on-surface-variant border-outline-variant/40'
        )}
      >
        男
      </button>
      <button
        onClick={() => onUpdateGender(classId, studentId, 'female')}
        className={cn(
          `${padClass} py-0.5 rounded-full text-[10px] cursor-pointer border`,
          gender === 'female'
            ? 'bg-secondary-container text-secondary-container-foreground border-transparent'
            : 'bg-surface-container-low text-on-surface-variant border-outline-variant/40'
        )}
      >
        女
      </button>
    </>
  )
}

export function StatusBadge({
  status,
  className
}: {
  status: Student['status']
  className?: string
}): React.ReactElement {
  const label = status === 'active' ? '正常' : status === 'absent' ? '缺席' : '排除'
  return (
    <span
      className={cn(
        'rounded-full font-medium',
        status === 'active'
          ? 'bg-secondary-container text-secondary-container-foreground'
          : status === 'absent'
            ? 'bg-tertiary-container text-tertiary'
            : 'bg-destructive/10 text-destructive',
        className
      )}
    >
      {label}
    </span>
  )
}

export function ScoreValue({
  score,
  className
}: {
  score: number
  className?: string
}): React.ReactElement {
  return (
    <span
      className={cn(
        'tabular-nums',
        score > 0
          ? 'text-green-600 dark:text-green-400'
          : score < 0
            ? 'text-destructive'
            : 'text-on-surface-variant',
        className
      )}
    >
      {score}
    </span>
  )
}

export function StepperButton({
  direction,
  onClick,
  tone
}: {
  direction: 'up' | 'down'
  onClick: () => void
  tone: 'neutral' | 'score'
}): React.ReactElement {
  const Icon = direction === 'up' ? Plus : Minus
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-1.5 rounded-full text-on-surface-variant transition-colors cursor-pointer',
        tone === 'score'
          ? direction === 'up'
            ? 'hover:bg-primary/10 hover:text-primary'
            : 'hover:bg-destructive/10 hover:text-destructive'
          : 'hover:bg-surface-container-high hover:text-on-surface'
      )}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  )
}
