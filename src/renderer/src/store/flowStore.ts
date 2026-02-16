import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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
  setFlows: (flows: ClassroomFlow[]) => void
  resetDefaultFlows: () => void
  updateFlow: (flowId: string, patch: Partial<Pick<ClassroomFlow, 'name' | 'steps'>>) => void
  removeFlow: (flowId: string) => void
  duplicateFlow: (flowId: string) => void
  moveFlow: (flowId: string, direction: 'up' | 'down') => void
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

export const useFlowStore = create<FlowState>()(
  persist(
    (set, get) => ({
      flows: defaultFlows,
      activeFlowId: null,
      activeStepIndex: 0,

      setFlows: (flows) => {
        const normalized = flows.length > 0 ? flows : defaultFlows
        const { activeFlowId } = get()
        const stillExists = activeFlowId && normalized.some((flow) => flow.id === activeFlowId)
        set({
          flows: normalized,
          activeFlowId: stillExists ? activeFlowId : null,
          activeStepIndex: 0
        })
      },

      resetDefaultFlows: () =>
        set({
          flows: defaultFlows,
          activeFlowId: null,
          activeStepIndex: 0
        }),

      updateFlow: (flowId, patch) =>
        set((state) => ({
          flows: state.flows.map((flow) =>
            flow.id === flowId
              ? {
                  ...flow,
                  ...(patch.name !== undefined ? { name: patch.name } : {}),
                  ...(patch.steps !== undefined ? { steps: patch.steps } : {})
                }
              : flow
          )
        })),

      removeFlow: (flowId) =>
        set((state) => {
          const nextFlows = state.flows.filter((flow) => flow.id !== flowId)
          const nextActiveFlowId =
            state.activeFlowId === flowId
              ? nextFlows[0]?.id || null
              : state.activeFlowId && nextFlows.some((flow) => flow.id === state.activeFlowId)
                ? state.activeFlowId
                : null
          return {
            flows: nextFlows.length > 0 ? nextFlows : defaultFlows,
            activeFlowId: nextActiveFlowId,
            activeStepIndex: 0
          }
        }),

      duplicateFlow: (flowId) =>
        set((state) => {
          const target = state.flows.find((flow) => flow.id === flowId)
          if (!target) return state
          const clone: ClassroomFlow = {
            id: `flow-${crypto.randomUUID()}`,
            name: `${target.name}（副本）`,
            steps: target.steps.map((step) => ({
              ...step,
              id: `step-${crypto.randomUUID()}`
            }))
          }
          return {
            flows: [...state.flows, clone]
          }
        }),

      moveFlow: (flowId, direction) =>
        set((state) => {
          const index = state.flows.findIndex((flow) => flow.id === flowId)
          if (index < 0) return state
          const targetIndex = direction === 'up' ? index - 1 : index + 1
          if (targetIndex < 0 || targetIndex >= state.flows.length) return state
          const next = [...state.flows]
          const [item] = next.splice(index, 1)
          next.splice(targetIndex, 0, item)
          return { flows: next }
        }),

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
    }),
    {
      name: 'classroom-flow-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        flows: state.flows,
        activeFlowId: state.activeFlowId,
        activeStepIndex: state.activeStepIndex
      })
    }
  )
)
