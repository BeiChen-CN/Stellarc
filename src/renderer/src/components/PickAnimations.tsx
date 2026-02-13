import { motion, AnimatePresence } from 'framer-motion'
import { Student } from '../types'
import type { AnimationStyle } from '../store/settingsStore'

interface PickAnimationProps {
  students: Student[]
  candidateKey: number
  animationStyle: AnimationStyle
  phase: 'idle' | 'spinning' | 'slowing' | 'reveal'
}

function ScrollAnimation({ student, candidateKey }: { student: Student; candidateKey: number }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={student.id + candidateKey}
        initial={{ y: 60, opacity: 0, scale: 0.85 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -60, opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.18, ease: [0.22, 0.68, 0, 1.04] }}
        className="flex flex-col items-center"
      >
        <div className="text-4xl md:text-6xl font-bold text-center text-on-surface drop-shadow-sm">
          {student.name}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function FlipAnimation({ student, candidateKey }: { student: Student; candidateKey: number }) {
  return (
    <div style={{ perspective: 800 }}>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={student.id + candidateKey}
          initial={{ rotateX: 90, opacity: 0, scale: 0.8 }}
          animate={{ rotateX: 0, opacity: 1, scale: 1 }}
          exit={{ rotateX: -90, opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.28, ease: [0.22, 0.68, 0, 1.04] }}
          className="flex flex-col items-center"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="text-4xl md:text-6xl font-bold text-center text-on-surface drop-shadow-sm">
            {student.name}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function BounceAnimation({ student, candidateKey }: { student: Student; candidateKey: number }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={student.id + candidateKey}
        initial={{ y: -80, opacity: 0, scale: 0.3 }}
        animate={{
          y: [null, 8, -4, 0],
          opacity: 1,
          scale: [null, 1.08, 0.96, 1]
        }}
        exit={{ y: 80, opacity: 0, scale: 0.3 }}
        transition={{
          duration: 0.4,
          ease: [0.34, 1.56, 0.64, 1],
          y: { duration: 0.45, times: [0, 0.6, 0.8, 1] },
          scale: { duration: 0.45, times: [0, 0.6, 0.8, 1] }
        }}
        className="flex flex-col items-center"
      >
        <div className="text-4xl md:text-6xl font-bold text-center text-on-surface drop-shadow-sm">
          {student.name}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function TypewriterAnimation({
  student,
  candidateKey
}: {
  student: Student
  candidateKey: number
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-4xl md:text-6xl font-bold text-center text-on-surface font-mono flex items-center justify-center">
        {student.name.split('').map((char, ci) => (
          <motion.span
            key={student.id + candidateKey + ci}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ci * 0.05, duration: 0.04, ease: 'easeOut' }}
          >
            {char}
          </motion.span>
        ))}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
          className="text-primary ml-0.5"
        >
          |
        </motion.span>
      </div>
    </div>
  )
}

function CharByCharAnimation({
  student
}: {
  student: Student
  candidateKey: number
  phase: string
}) {
  const chars = student.name.split('')
  const CHAR_DELAY = 0.55

  return (
    <div className="flex flex-col items-center">
      <div className="text-4xl md:text-6xl font-bold text-center text-on-surface flex items-center justify-center">
        {chars.map((char, ci) => (
          <motion.span
            key={student.id + '-char-' + ci}
            initial={{ opacity: 0, scale: 0, y: 20, filter: 'blur(16px)' }}
            animate={{
              opacity: 1,
              scale: [0, 1.35, 0.95, 1],
              y: [20, -6, 2, 0],
              filter: 'blur(0px)'
            }}
            transition={{
              delay: ci * CHAR_DELAY,
              duration: 0.45,
              ease: [0.34, 1.56, 0.64, 1],
              scale: { duration: 0.5, times: [0, 0.5, 0.75, 1] },
              y: { duration: 0.5, times: [0, 0.5, 0.75, 1] }
            }}
          >
            {char}
          </motion.span>
        ))}
      </div>
    </div>
  )
}

function RippleAnimation({ student, candidateKey }: { student: Student; candidateKey: number }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={student.id + candidateKey}
        className="flex flex-col items-center relative"
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.2, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 0.68, 0, 1.04] }}
      >
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/40 pointer-events-none"
          initial={{ scale: 0.3, opacity: 1 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border border-primary/20 pointer-events-none"
          initial={{ scale: 0.3, opacity: 0.8 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.08 }}
        />
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/5 pointer-events-none"
          initial={{ scale: 0.3, opacity: 0.6 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.04 }}
        />
        <div className="text-4xl md:text-6xl font-bold text-center text-on-surface relative z-10 drop-shadow-sm">
          {student.name}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function SlotAnimation({
  student,
  candidateKey,
  phase
}: {
  student: Student
  candidateKey: number
  phase: string
}) {
  const isSlowing = phase === 'slowing'
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={student.id + candidateKey}
        initial={{ y: 40, opacity: 0, filter: 'blur(12px)', scale: 0.92 }}
        animate={{
          y: 0,
          opacity: 1,
          filter: isSlowing ? 'blur(0px)' : 'blur(3px)',
          scale: isSlowing ? 1 : 0.97
        }}
        exit={{ y: -40, opacity: 0, filter: 'blur(12px)', scale: 0.92 }}
        transition={{ duration: 0.14, ease: [0.22, 0.68, 0, 1.04] }}
        className="flex flex-col items-center"
      >
        <div className="text-4xl md:text-6xl font-bold text-center text-on-surface">
          {student.name}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

const animationComponents: Record<
  AnimationStyle,
  React.ComponentType<{ student: Student; candidateKey: number; phase: string }>
> = {
  scroll: ScrollAnimation,
  flip: FlipAnimation,
  bounce: BounceAnimation,
  typewriter: TypewriterAnimation,
  charByChar: CharByCharAnimation,
  ripple: RippleAnimation,
  slot: SlotAnimation,
  wheel: SlotAnimation // wheel is handled separately
}

export function PickAnimationRenderer({
  students,
  candidateKey,
  animationStyle,
  phase
}: PickAnimationProps) {
  const Component = animationComponents[animationStyle] || animationComponents.slot

  return (
    <>
      {students.map((student, i) => (
        <Component key={i} student={student} candidateKey={candidateKey} phase={phase} />
      ))}
    </>
  )
}
