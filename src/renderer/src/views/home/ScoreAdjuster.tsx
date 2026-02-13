import { Minus, Plus } from 'lucide-react'
import { useClassesStore } from '../../store/classesStore'

interface ScoreAdjusterProps {
  classId: string
  studentId: string
  score: number
  size?: 'sm' | 'md'
}

export function ScoreAdjuster({ classId, studentId, score, size = 'md' }: ScoreAdjusterProps) {
  const updateStudentScore = useClassesStore((state) => state.updateStudentScore)

  const isMd = size === 'md'

  return (
    <div className="flex items-center gap-2 justify-center">
      <button
        onClick={() => updateStudentScore(classId, studentId, score - 1)}
        className={`${isMd ? 'w-10 h-10' : 'w-8 h-8'} rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors cursor-pointer`}
      >
        <Minus className={isMd ? 'w-5 h-5' : 'w-4 h-4'} />
      </button>
      <span
        className={`${isMd ? 'text-lg min-w-[48px]' : 'text-sm min-w-[36px]'} font-bold text-on-surface text-center tabular-nums`}
      >
        {score} 分
      </span>
      <button
        onClick={() => updateStudentScore(classId, studentId, score + 1)}
        className={`${isMd ? 'w-10 h-10' : 'w-8 h-8'} rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer`}
      >
        <Plus className={isMd ? 'w-5 h-5' : 'w-4 h-4'} />
      </button>
    </div>
  )
}
