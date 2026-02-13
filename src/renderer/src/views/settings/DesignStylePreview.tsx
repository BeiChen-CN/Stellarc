import { Check } from 'lucide-react'
import type { DesignStyle } from '../../store/settingsStore'

const designStyles: { id: DesignStyle; label: string; desc: string; preview: string }[] = [
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
  { id: 'apple-hig', label: 'Apple HIG', desc: 'SF 圆角、毛玻璃层级、精致光影', preview: 'apple' }
]

export { designStyles }

function DesignStylePreview({ type, isActive }: { type: string; isActive: boolean }) {
  const base = 'w-full h-12 rounded-lg flex items-center justify-center'
  switch (type) {
    case 'md3':
      return (
        <div className={`${base} bg-primary/10 relative overflow-hidden`}>
          <div className="w-6 h-6 rounded-full bg-primary/30" />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20" />
          {isActive && <Check className="w-3.5 h-3.5 text-primary absolute" />}
        </div>
      )
    case 'flat':
      return (
        <div
          className={`${base} bg-primary/15 border-2 border-primary/30`}
          style={{ borderRadius: 4 }}
        >
          <div className="w-5 h-5 bg-primary/40" style={{ borderRadius: 2 }} />
          {isActive && <Check className="w-3.5 h-3.5 text-primary absolute" />}
        </div>
      )
    case 'minimal':
      return (
        <div className={`${base} border border-on-surface-variant/20`} style={{ borderRadius: 2 }}>
          <div className="w-8 h-[1px] bg-on-surface-variant/30" />
          {isActive && <Check className="w-3.5 h-3.5 text-primary absolute" />}
        </div>
      )
    case 'glass':
      return (
        <div
          className={`${base} border border-primary/20`}
          style={{
            background:
              'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.02))',
            borderRadius: 12
          }}
        >
          <div className="w-5 h-5 rounded-full border border-primary/20 bg-primary/5" />
          {isActive && <Check className="w-3.5 h-3.5 text-primary absolute" />}
        </div>
      )
    case 'clay':
      return (
        <div
          className={`${base}`}
          style={{
            borderRadius: 16,
            boxShadow:
              '4px 4px 8px hsl(var(--foreground) / 0.06), -2px -2px 6px hsl(var(--background) / 0.7), inset 0 1px 0 hsl(var(--background) / 0.5)',
            background: 'hsl(var(--surface-container))'
          }}
        >
          <div className="w-5 h-5 rounded-full bg-primary/20" />
          {isActive && <Check className="w-3.5 h-3.5 text-primary absolute" />}
        </div>
      )
    case 'neu':
      return (
        <div
          className={`${base}`}
          style={{
            borderRadius: 12,
            boxShadow:
              '3px 3px 6px hsl(var(--foreground) / 0.07), -3px -3px 6px hsl(var(--background) / 0.9)',
            background: 'hsl(var(--background))'
          }}
        >
          <div
            className="w-5 h-5 rounded-lg"
            style={{
              boxShadow:
                'inset 2px 2px 4px hsl(var(--foreground) / 0.06), inset -2px -2px 4px hsl(var(--background) / 0.8)',
              background: 'hsl(var(--background))'
            }}
          />
          {isActive && <Check className="w-3.5 h-3.5 text-primary absolute" />}
        </div>
      )
    case 'skeu':
      return (
        <div
          className={`${base} relative overflow-hidden`}
          style={{
            borderRadius: 10,
            background:
              'linear-gradient(180deg, hsl(var(--surface-container-high)), hsl(var(--surface-container)))',
            boxShadow:
              '0 2px 6px hsl(var(--foreground) / 0.12), inset 0 1px 0 hsl(var(--background) / 0.6)'
          }}
        >
          <div
            className="w-6 h-6 rounded-md"
            style={{
              background:
                'linear-gradient(180deg, hsl(var(--primary) / 0.4), hsl(var(--primary) / 0.25))',
              boxShadow:
                '0 1px 3px hsl(var(--foreground) / 0.15), inset 0 1px 0 hsl(var(--background) / 0.3)'
            }}
          />
          {isActive && <Check className="w-3.5 h-3.5 text-primary absolute" />}
        </div>
      )
    case 'micro':
      return (
        <div
          className={`${base} bg-primary/8 relative overflow-hidden`}
          style={{ borderRadius: 14 }}
        >
          <div className="w-5 h-5 rounded-full bg-primary/25 animate-pulse" />
          <div
            className="absolute top-1 right-2 w-2 h-2 rounded-full bg-tertiary/30 animate-bounce"
            style={{ animationDelay: '0.2s' }}
          />
          {isActive && <Check className="w-3.5 h-3.5 text-primary absolute" />}
        </div>
      )
    case 'apple':
      return (
        <div
          className={`${base} relative overflow-hidden`}
          style={{
            borderRadius: 10,
            background:
              'linear-gradient(180deg, hsl(var(--background) / 0.9), hsl(var(--surface-container) / 0.7))',
            backdropFilter: 'blur(20px)',
            boxShadow:
              '0 0.5px 0 hsl(var(--foreground) / 0.06), 0 1px 3px hsl(var(--foreground) / 0.08)',
            border: '0.5px solid hsl(var(--foreground) / 0.06)'
          }}
        >
          <div className="w-5 h-5 rounded-[5px] bg-primary/30" />
          {isActive && <Check className="w-3.5 h-3.5 text-primary absolute" />}
        </div>
      )
    default:
      return <div className={base} />
  }
}

export { DesignStylePreview }
