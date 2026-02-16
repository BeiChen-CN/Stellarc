import type { DesignStyle } from '../../store/settingsStore'

export const designStyles: { id: DesignStyle; label: string; desc: string; preview: string }[] = [
  {
    id: 'material-design-3',
    label: 'Material Design 3',
    desc: '圆润、色调表面、elevation 层级',
    preview: 'md3'
  },
  { id: 'flat', label: 'Flat Design', desc: '无阴影、锐利边框、扁平色块', preview: 'flat' },
  { id: 'minimalism', label: 'Minimalism', desc: '极简、大留白、细线条', preview: 'minimal' },
  {
    id: 'glassmorphism',
    label: 'Glassmorphism',
    desc: '毛玻璃、半透明、模糊背景',
    preview: 'glass'
  },
  { id: 'claymorphism', label: 'Claymorphism', desc: '陶土质感、柔和内外阴影', preview: 'clay' },
  { id: 'neumorphism', label: 'Neumorphism', desc: '新拟态、凸起/凹陷双阴影', preview: 'neu' },
  {
    id: 'skeuomorphism',
    label: 'Skeuomorphism',
    desc: '拟物化、真实纹理、立体光影',
    preview: 'skeu'
  },
  {
    id: 'microinteractions',
    label: 'Microinteractions',
    desc: '微交互、弹性动效、活力反馈',
    preview: 'micro'
  },
  { id: 'apple-hig', label: 'Apple HIG', desc: 'SF 圆角、毛玻璃层级、精致光影', preview: 'apple' },
  {
    id: 'neo-brutalism',
    label: 'Neo Brutalism',
    desc: '高对比粗边框、几何块面、偏移阴影',
    preview: 'brutal'
  },
  {
    id: 'editorial',
    label: 'Editorial',
    desc: '杂志感排版、细分隔线、低饱和质感',
    preview: 'editorial'
  },
  {
    id: 'cyber-grid',
    label: 'Cyber Grid',
    desc: '霓虹描边、网格光效、未来控制台氛围',
    preview: 'cyber'
  }
]
