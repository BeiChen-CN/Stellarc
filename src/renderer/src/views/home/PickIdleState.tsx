import { motion } from 'framer-motion'
import { GraduationCap, Users, Sparkles, Plus, ArrowRight, Keyboard } from 'lucide-react'
import type { ClassGroup } from '../../types'

interface PickIdleStateProps {
  classes: ClassGroup[]
  currentClass: ClassGroup | undefined
  onNavigate: (view: 'students') => void
  onCreateClass: () => void
}

export function PickIdleState({
  classes,
  currentClass,
  onNavigate,
  onCreateClass
}: PickIdleStateProps) {
  if (classes.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-primary/20"
        >
          <GraduationCap className="w-28 h-28 mx-auto" strokeWidth={1} />
        </motion.div>
        <div className="space-y-2">
          <div className="text-on-surface text-xl font-medium">欢迎使用 Stellarc</div>
          <div className="text-on-surface-variant text-sm">创建你的第一个班级，开始随机点名</div>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onCreateClass}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium elevation-1 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            快速创建班级
          </button>
          <button
            onClick={() => onNavigate('students')}
            className="flex items-center gap-2 px-5 py-2.5 border border-outline-variant text-on-surface rounded-full text-sm font-medium hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            学生管理
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    )
  }

  if (!currentClass) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-primary/20"
        >
          <Users className="w-28 h-28 mx-auto" strokeWidth={1} />
        </motion.div>
        <div className="text-on-surface-variant text-xl font-light">请在右上角选择班级</div>
      </motion.div>
    )
  }

  if (currentClass.students.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-primary/20"
        >
          <Users className="w-28 h-28 mx-auto" strokeWidth={1} />
        </motion.div>
        <div className="space-y-2">
          <div className="text-on-surface-variant text-xl font-light">当前班级还没有学生</div>
          <button
            onClick={() => onNavigate('students')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium elevation-1 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            添加学生
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
      <div className="flex flex-col items-center gap-1">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-primary/20"
        >
          <Sparkles className="w-20 h-20 mx-auto" strokeWidth={1} />
        </motion.div>
        <div className="text-on-surface text-lg font-medium">{currentClass.name}</div>
        <div className="flex items-center gap-4 text-sm text-on-surface-variant">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {currentClass.students.filter((s) => s.status === 'active').length} 人可抽选
          </span>
          <span className="text-outline-variant">/</span>
          <span>{currentClass.students.length} 人总计</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant/60 pt-2">
        <Keyboard className="w-3.5 h-3.5" />
        <span>按空格键或点击下方按钮开始抽选</span>
      </div>
    </motion.div>
  )
}
