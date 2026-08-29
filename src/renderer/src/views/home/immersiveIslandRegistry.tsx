import type { ReactElement } from 'react'
import type { ImmersiveIslandStyle } from '../../store/settingsStore'
import type { ImmersiveIslandRenderProps } from './immersiveIslandVariants'
import {
  CapsuleSlotIsland,
  ClassicIsland,
  FocusBeamIsland,
  PulseBadgeIsland
} from './immersiveIslandVariants'

export interface ImmersiveIslandVariant {
  id: ImmersiveIslandStyle
  title: string
  subtitle: string
  render: (props: ImmersiveIslandRenderProps) => ReactElement
}

export const IMMERSIVE_ISLAND_VARIANTS: ImmersiveIslandVariant[] = [
  {
    id: 'classic',
    title: 'Classic Island',
    subtitle: '纯黑胶囊, 姓名纵向滚动, 揭晓时宽度呼吸。',
    render: (props) => <ClassicIsland {...props} />
  },
  {
    id: 'beam',
    title: 'Focus Beam',
    subtitle: '扫描光束快速扫过候选, 揭晓时停在姓名上。',
    render: (props) => <FocusBeamIsland {...props} />
  },
  {
    id: 'slot',
    title: 'Capsule Slot',
    subtitle: '胶囊老虎机滚轮, 抽奖感最强, 最终只留一个姓名。',
    render: (props) => <CapsuleSlotIsland {...props} />
  },
  {
    id: 'pulse',
    title: 'Pulse Badge',
    subtitle: '左侧脉冲徽章, 右侧结果条, 轻量且信息清楚。',
    render: (props) => <PulseBadgeIsland {...props} />
  }
]

export function getImmersiveIslandVariant(style: ImmersiveIslandStyle): ImmersiveIslandVariant {
  return (
    IMMERSIVE_ISLAND_VARIANTS.find((variant) => variant.id === style) ??
    IMMERSIVE_ISLAND_VARIANTS[0]
  )
}
