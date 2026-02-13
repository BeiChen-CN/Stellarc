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
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex flex-col items-center"
      >
        <div className="text-4xl md:text-6xl font-bold text-center text-on-surface">
          {student.name}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function FlipAnimation({ student, candidateKey }: { student: Student; candidateKey: number }) {
  return (
    <div style={{ perspective: 600 }}>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={student.id + candidateKey}
          initial={{ rotateX: 100, opacity: 0, scale: 0.9 }}
          animate={{ rotateX: 0, opacity: 1, scale: 1 }}
          exit={{ rotateX: -100, opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.24, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center"
        >
          <div className="text-4xl md:text-6xl font-bold text-center text-on-surface">
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
        initial={{ y: -60, opacity: 0, scale: 0.5 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex flex-col items-center"
      >
        <div className="text-4xl md:text-6xl font-bold text-center text-on-surface">
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: ci * 0.06, duration: 0.05 }}
          >
            {char}
          </motion.span>
        ))}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
          className="text-primary ml-0.5"
        >
          |
        </motion.span>
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
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.3, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/30 pointer-events-none"
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border border-primary/15 pointer-events-none"
          initial={{ scale: 0.5, opacity: 0.6 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
        />
        <div className="text-4xl md:text-6xl font-bold text-center text-on-surface relative z-10">
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
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={student.id + candidateKey}
        initial={{ y: 30, opacity: 0, filter: 'blur(10px)' }}
        animate={{
          y: 0,
          opacity: 1,
          filter: phase === 'slowing' ? 'blur(0px)' : 'blur(2px)'
        }}
        exit={{ y: -30, opacity: 0, filter: 'blur(10px)' }}
        transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
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
