import { useState, type ReactElement } from 'react'
import { Check } from 'lucide-react'

import { cn } from '../../lib/utils'
import type { ImmersiveIslandStyle } from '../../store/settingsStore'
import {
  getImmersiveIslandVariant,
  ImmersiveIslandStyleThumbnail,
  IMMERSIVE_ISLAND_VARIANTS,
  type ImmersiveIslandRenderPhase
} from '../home/immersiveIslandVariants'

const previewCandidates = ['林小夏', '周明宇', '陈安然']
const previewWinner = ['周明宇']

function PreviewShell({
  state,
  children
}: {
  state: ImmersiveIslandRenderPhase
  children: ReactElement
}): ReactElement {
  return (
    <div
      data-testid={state === 'spinning' ? 'island-preview-spinning' : 'island-preview-reveal'}
      className="flex min-h-[112px] items-center justify-center rounded-[6px] border border-white/8 bg-[#090a0f] px-4"
    >
      {children}
    </div>
  )
}

export function ImmersiveIslandPreview(): ReactElement {
  const [selectedId, setSelectedId] = useState<ImmersiveIslandStyle>('classic')
  const selectedVariant = getImmersiveIslandVariant(selectedId)

  return (
    <div
      data-testid="immersive-island-preview"
      className="min-h-screen overflow-y-auto bg-[#0a0b10] px-5 py-6 text-white"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
              Immersive Island Lab
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal text-white md:text-3xl">
              灵动岛候选方案
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">
              每套都展示抽取中和揭晓两个状态。这里仍然只做预览, 正式样式在设置里选择。
            </p>
          </div>
          <div
            data-testid="selected-island-variant"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-2 text-sm text-white/78"
          >
            <Check className="h-4 w-4 text-white/80" />
            已选 {selectedVariant.title}
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-2">
          {IMMERSIVE_ISLAND_VARIANTS.map((variant) => {
            const selected = variant.id === selectedId
            const commonProps = {
              currentClassName: '高一 3 班',
              displayNames: previewCandidates,
              winnerNames: previewWinner,
              candidateKey: 1
            }

            return (
              <div
                key={variant.id}
                data-testid="island-variant-card"
                className={cn(
                  'rounded-[8px] border bg-white/[0.035] p-4 shadow-[0_18px_54px_rgba(0,0,0,0.25)] transition-colors',
                  selected ? 'border-white/30' : 'border-white/10'
                )}
              >
                <button
                  type="button"
                  data-testid={`island-variant-${variant.id}`}
                  onClick={() => setSelectedId(variant.id)}
                  className="flex w-full cursor-pointer items-start justify-between gap-4 text-left"
                >
                  <div className="flex items-start gap-3">
                    <ImmersiveIslandStyleThumbnail
                      style={variant.id}
                      testId={`island-variant-thumb-${variant.id}`}
                      className="h-12 w-[92px]"
                    />
                    <div>
                      <h2 className="text-base font-semibold text-white">{variant.title}</h2>
                      <p className="mt-1 text-xs leading-5 text-white/52">{variant.subtitle}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'grid h-6 w-6 shrink-0 place-items-center rounded-full border',
                      selected ? 'border-white bg-white text-black' : 'border-white/18'
                    )}
                  >
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </span>
                </button>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/38">
                      抽取中
                    </div>
                    <PreviewShell state="spinning">
                      {variant.render({ ...commonProps, phase: 'spinning', isSpinning: true })}
                    </PreviewShell>
                  </div>
                  <div>
                    <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/38">
                      揭晓
                    </div>
                    <PreviewShell state="reveal">
                      {variant.render({ ...commonProps, phase: 'reveal', isSpinning: false })}
                    </PreviewShell>
                  </div>
                </div>
              </div>
            )
          })}
        </section>
      </div>
    </div>
  )
}
