import { create } from 'zustand'

import type { ActivityPreset } from './settingsStore'

export interface FlowStep {
  id: string
  title: string
  activityPreset: ActivityPreset
  notes?: string
}

export interface ClassroomFlow {
  id: string
  name: string
  steps: FlowStep[]
}

interface FlowState {
  flows: ClassroomFlow[]
  activeFlowId: string | null
  activeStepIndex: number
  setActiveFlow: (flowId: string | null) => void
  nextStep: () => FlowStep | null
  resetFlow: () => void
}

const defaultFlows: ClassroomFlow[] = [
  {
    id: 'quick-class',
    name: '快速课堂流程',
    steps: [
      { id: 'warmup', title: '热身点名', activityPreset: 'quick-pick' },
      { id: 'interaction', title: '深度互动', activityPreset: 'deep-focus' },
      { id: 'teamwork', title: '小组对抗', activityPreset: 'group-battle' }
    ]
  },
  {
    id: 'discussion-class',
    name: '讨论课堂流程',
    steps: [
      { id: 'starter', title: '开场点名', activityPreset: 'quick-pick' },
      { id: 'debate', title: '观点碰撞', activityPreset: 'group-battle' },
      { id: 'review', title: '总结互动', activityPreset: 'deep-focus' }
    ]
  }
]

export const useFlowStore = create<FlowState>((set, get) => ({
  flows: defaultFlows,
  activeFlowId: null,
  activeStepIndex: 0,

  setActiveFlow: (activeFlowId) => set({ activeFlowId, activeStepIndex: 0 }),

  nextStep: () => {
    const { activeFlowId, activeStepIndex, flows } = get()
    if (!activeFlowId) return null
    const flow = flows.find((item) => item.id === activeFlowId)
    if (!flow || flow.steps.length === 0) return null

    const step = flow.steps[activeStepIndex] ?? null
    if (!step) return null

    set({ activeStepIndex: Math.min(activeStepIndex + 1, flow.steps.length - 1) })
    return step
  },

  resetFlow: () => set({ activeStepIndex: 0 })
}))
