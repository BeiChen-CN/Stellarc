import { describe, expect, it } from 'vitest'

import { ONBOARDING_STEPS } from './OnboardingGuide'

describe('ONBOARDING_STEPS', () => {
  it('keeps the new user guide focused on three core steps', () => {
    expect(ONBOARDING_STEPS).toHaveLength(3)
    expect(ONBOARDING_STEPS.map((step) => step.title)).toEqual([
      '准备班级和学生',
      '开始随机点名',
      '按需调整和复盘'
    ])
  })
})
