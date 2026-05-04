import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, PlayCircle, Settings, Users, X } from 'lucide-react'

import { cn } from '../lib/utils'

interface OnboardingGuideProps {
  open: boolean
  onClose: (complete: boolean) => void
}

export const ONBOARDING_STEPS = [
  {
    title: '准备班级和学生',
    description: '先到学生管理创建班级, 导入或手动添加学生名单。',
    bullets: ['确认当前班级有学生', '需要照片或学号时再补充资料'],
    icon: Users
  },
  {
    title: '开始随机点名',
    description: '回到随机点名页, 直接点击开始。默认规则已经可以用于课堂。',
    bullets: ['先用默认单人抽选', '需要投屏时再切换沉浸或投屏模式'],
    icon: PlayCircle
  },
  {
    title: '按需调整和复盘',
    description: '用一阵子后, 再按课堂习惯调整规则、外观和统计记录。',
    bullets: ['设置页只改你确实需要的选项', '课后在历史记录和统计里复盘'],
    icon: Settings
  }
] as const

export function OnboardingGuide({ open, onClose }: OnboardingGuideProps) {
  const [step, setStep] = useState(0)
  const current = ONBOARDING_STEPS[step]
  const progress = useMemo(
    () => Math.round(((step + 1) / ONBOARDING_STEPS.length) * 100),
    [step]
  )

  useEffect(() => {
    if (open) {
      setStep(0)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose(false)
      if (event.key === 'ArrowRight') {
        setStep((value) => Math.min(ONBOARDING_STEPS.length - 1, value + 1))
      }
      if (event.key === 'ArrowLeft') {
        setStep((value) => Math.max(0, value - 1))
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const Icon = current.icon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-lg rounded-3xl border border-outline-variant/40 bg-surface-container shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-4">
            <div>
              <div className="text-sm font-semibold text-on-surface">新手引导</div>
              <div className="mt-0.5 text-xs text-on-surface-variant">
                {step + 1} / {ONBOARDING_STEPS.length}
              </div>
            </div>
            <button
              onClick={() => onClose(false)}
              className="cursor-pointer rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high"
              title="稍后再看"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 pt-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-low">
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="p-5">
            <div className="mb-4 flex flex-wrap gap-1.5">
              {ONBOARDING_STEPS.map((item, index) => (
                <button
                  key={item.title}
                  onClick={() => setStep(index)}
                  className={cn(
                    'cursor-pointer rounded-full border px-2.5 py-1 text-[11px] transition-colors',
                    index === step
                      ? 'border-transparent bg-secondary-container text-secondary-container-foreground'
                      : 'border-outline-variant/40 bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                  )}
                >
                  {index + 1}. {item.title}
                </button>
              ))}
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-on-surface">{current.title}</h3>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                  {current.description}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-3">
              {current.bullets.map((item) => (
                <div key={item} className="flex items-start gap-2 text-xs text-on-surface-variant">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between gap-2">
              <button
                onClick={() => onClose(true)}
                className="cursor-pointer rounded-full border border-outline-variant/40 px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-high"
              >
                跳过并不再提示
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep((value) => Math.max(0, value - 1))}
                  disabled={step === 0}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-sm',
                    step === 0
                      ? 'cursor-not-allowed bg-surface-container-low text-on-surface-variant/50'
                      : 'cursor-pointer bg-surface-container-high text-on-surface'
                  )}
                >
                  上一步
                </button>
                {step < ONBOARDING_STEPS.length - 1 ? (
                  <button
                    onClick={() =>
                      setStep((value) => Math.min(ONBOARDING_STEPS.length - 1, value + 1))
                    }
                    className="cursor-pointer rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground"
                  >
                    下一步
                  </button>
                ) : (
                  <button
                    onClick={() => onClose(true)}
                    className="cursor-pointer rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground"
                  >
                    完成引导
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
