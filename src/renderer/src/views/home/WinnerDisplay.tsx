import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Crown, Sparkles, User } from 'lucide-react'
import { cn, toFileUrl } from '../../lib/utils'
import { ScoreAdjuster } from './ScoreAdjuster'
import type { Student, ClassGroup } from '../../types'

interface WinnerDisplayProps {
  winners: Student[]
  currentClass: ClassGroup
  showStudentId: boolean
  photoMode: boolean
}

export function WinnerDisplay({
  winners,
  currentClass,
  showStudentId,
  photoMode
}: WinnerDisplayProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 6 + 2,
        delay: Math.random() * 0.5
      })),
    []
  )

  const prefersReducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  return (
    <motion.div
      key="winner"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative text-center w-full py-2"
    >
      {!prefersReducedMotion &&
        particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-primary/20"
            style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0, 1.5, 0],
              y: [0, -40 - Math.random() * 60]
            }}
            transition={{ duration: 2, delay: p.delay, ease: 'easeOut' }}
          />
        ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="flex items-center justify-center gap-2 mb-4"
      >
        <Crown className="w-5 h-5 text-tertiary" />
        <span className="text-lg text-on-surface-variant font-medium tracking-wide">
          {winners.length > 1 ? `已选中 ${winners.length} 人` : '天选之子'}
        </span>
        <Crown className="w-5 h-5 text-tertiary" />
      </motion.div>

      {winners.length === 1 ? (
        <SingleWinner
          student={winners[0]}
          currentClass={currentClass}
          showStudentId={showStudentId}
          photoMode={photoMode}
        />
      ) : (
        <MultiWinnerGrid
          winners={winners}
          currentClass={currentClass}
          showStudentId={showStudentId}
          photoMode={photoMode}
        />
      )}

      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className="absolute -top-2 -right-2 text-tertiary/80"
      >
        <Sparkles size={32} fill="currentColor" />
      </motion.div>
      <motion.div
        initial={{ scale: 0, rotate: 30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.6, type: 'spring' }}
        className="absolute -bottom-2 -left-2 text-tertiary/60"
      >
        <Sparkles size={24} fill="currentColor" />
      </motion.div>
    </motion.div>
  )
}

function SingleWinner({
  student,
  currentClass,
  showStudentId,
  photoMode
}: {
  student: Student
  currentClass: ClassGroup
  showStudentId: boolean
  photoMode: boolean
}) {
  const liveStudent = currentClass.students.find((s) => s.id === student.id)
  const score = liveStudent?.score || 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 18 }}
      className="flex flex-col items-center gap-3 relative"
    >
      <div className="absolute -inset-4 bg-primary/5 rounded-[28px] blur-2xl" />
      {photoMode && (
        <div className="relative">
          {student.photo ? (
            <motion.img
              src={toFileUrl(student.photo)}
              alt={student.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-primary/60 elevation-2"
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-4 border-primary/20 elevation-2">
              <User className="w-12 h-12 text-primary/40" />
            </div>
          )}
        </div>
      )}
      <div className="text-center relative">
        <div className="text-5xl md:text-7xl font-black text-primary drop-shadow-sm">
          {student.name}
        </div>
        {showStudentId && student.studentId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-base text-on-surface-variant mt-1.5 font-mono bg-surface-container-high px-3 py-0.5 rounded-full inline-block"
          >
            {student.studentId}
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-3"
        >
          <ScoreAdjuster classId={currentClass.id} studentId={student.id} score={score} size="md" />
        </motion.div>
      </div>
    </motion.div>
  )
}

function MultiWinnerGrid({
  winners,
  currentClass,
  showStudentId,
  photoMode
}: {
  winners: Student[]
  currentClass: ClassGroup
  showStudentId: boolean
  photoMode: boolean
}) {
  return (
    <div
      className={cn(
        'grid gap-4 w-full max-w-lg mx-auto',
        winners.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
      )}
    >
      {winners.map((student, i) => {
        const liveStudent = currentClass.students.find((s) => s.id === student.id)
        const score = liveStudent?.score || 0

        return (
          <motion.div
            key={student.id + i}
            initial={{ opacity: 0, scale: 0.3, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              delay: 0.15 + 0.08 * i,
              type: 'spring',
              stiffness: 260,
              damping: 18
            }}
            className="flex flex-col items-center gap-2 p-3 bg-surface-container-high/60 rounded-2xl relative"
          >
            <div className="absolute -inset-1 bg-primary/5 rounded-2xl blur-xl" />
            {photoMode && (
              <div className="relative">
                {student.photo ? (
                  <img
                    src={toFileUrl(student.photo)}
                    alt={student.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary/40"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/20">
                    <User className="w-8 h-8 text-primary/40" />
                  </div>
                )}
              </div>
            )}
            <div className="text-center relative">
              <div className="text-2xl font-bold text-primary">{student.name}</div>
              {showStudentId && student.studentId && (
                <div className="text-xs text-on-surface-variant font-mono mt-0.5">
                  {student.studentId}
                </div>
              )}
              <div className="mt-2">
                <ScoreAdjuster
                  classId={currentClass.id}
                  studentId={student.id}
                  score={score}
                  size="sm"
                />
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
