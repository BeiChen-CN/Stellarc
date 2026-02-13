import { motion } from 'framer-motion'
import { LayoutGrid } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Student } from '../../types'

interface GroupResultsProps {
  groups: Student[][]
}

export function GroupResults({ groups }: GroupResultsProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
      <div className="flex items-center justify-center gap-2 mb-4">
        <LayoutGrid className="w-4 h-4 text-primary" />
        <span className="text-base font-semibold text-on-surface">分组结果</span>
      </div>
      <div
        className={cn(
          'grid gap-3 w-full',
          groups.length <= 2
            ? 'grid-cols-2'
            : groups.length <= 4
              ? 'grid-cols-2 lg:grid-cols-4'
              : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
        )}
      >
        {groups.map((group, gi) => (
          <motion.div
            key={gi}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.08, type: 'spring', stiffness: 200, damping: 20 }}
            className="bg-surface-container-high rounded-xl p-3 elevation-1"
          >
            <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-outline-variant/30">
              <span className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                {gi + 1}
              </span>
              <span className="text-xs font-semibold text-on-surface">第 {gi + 1} 组</span>
              <span className="text-[10px] text-on-surface-variant ml-auto">
                {group.length} 人
              </span>
            </div>
            <div className="space-y-0.5">
              {group.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md hover:bg-surface-container transition-colors"
                >
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
    </motion.div>
  )
}
