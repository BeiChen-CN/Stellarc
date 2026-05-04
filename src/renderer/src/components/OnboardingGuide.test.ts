import { describe, expect, it } from 'vitest'

import { ONBOARDING_STEPS } from './OnboardingGuide'

describe('ONBOARDING_STEPS', () => {
  it('keeps the new user guide focused on three core steps', () => {
    expect(ONBOARDING_STEPS).toHaveLength(3)
    expect(ONBOARDING_STEPS.map((step) => step.title)).toEqual([
      '创建班级和导入学生名单',
      '选择设计风格和配色',
      '选择抽取动画'
    ])
  })
})
