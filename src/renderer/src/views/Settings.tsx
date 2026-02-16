import { useState, type ReactElement } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Palette, Sparkles, Scale, BookTemplate, Database } from 'lucide-react'
import { cn } from '../lib/utils'
import { useSpeedFactor } from '../lib/useSpeedFactor'
import { useSettingsStore } from '../store/settingsStore'
import { AppearanceSection } from './settings/AppearanceSection'
import { FairnessSection } from './settings/FairnessSection'
import { DataSection } from './settings/DataSection'
import { RuleTemplateCenterSection } from './settings/RuleTemplateCenterSection'
import { FlowTemplateCenterSection } from './settings/FlowTemplateCenterSection'

type SettingsCategory = 'appearance' | 'experience' | 'fairness' | 'templates' | 'data'

const CATEGORY_ITEMS: Array<{ id: SettingsCategory; label: string; icon: typeof Palette }> = [
  { id: 'appearance', label: '外观', icon: Palette },
  { id: 'experience', label: '体验', icon: Sparkles },
  { id: 'fairness', label: '抽选与规则', icon: Scale },
  { id: 'templates', label: '规则模板', icon: BookTemplate },
  { id: 'data', label: '数据与系统', icon: Database }
]

export function Settings(): ReactElement {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('appearance')
  const sf = useSpeedFactor()
  const { setBackgroundImage } = useSettingsStore()

  const handleSelectBackground = async (): Promise<void> => {
    const filePath = await window.electronAPI.selectFile({
      title: '选择背景图片',
      filters: [{ name: '图片文件', extensions: ['jpg', 'png', 'jpeg', 'webp'] }]
    })
    if (filePath) {
      setBackgroundImage(filePath)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-5 space-y-5 sm:space-y-6 pb-12 sm:pb-16">
        <div>
          <h2 className="text-3xl font-bold mb-2 text-on-surface">设置</h2>
          <p className="text-on-surface-variant text-sm">
            按场景分组设置，减少干扰项，按需进入对应配置。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5 items-start">
          <aside className="bg-surface-container rounded-3xl p-3 lg:sticky lg:top-4">
            <div className="text-xs text-on-surface-variant px-2 py-1">设置分组</div>
            <div className="space-y-1.5 mt-1">
              {CATEGORY_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveCategory(item.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45',
                      activeCategory === item.id
                        ? 'bg-secondary-container text-secondary-container-foreground'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </aside>

          <main className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 * sf, ease: 'easeOut' }}
                className="space-y-6"
              >
                {activeCategory === 'appearance' && (
                  <AppearanceSection
                    variant="appearance"
                    onSelectBackground={handleSelectBackground}
                  />
                )}

                {activeCategory === 'experience' && (
                  <AppearanceSection
                    variant="experience"
                    onSelectBackground={handleSelectBackground}
                  />
                )}

                {activeCategory === 'fairness' && <FairnessSection />}

                {activeCategory === 'templates' && (
                  <>
                    <FlowTemplateCenterSection />
                    <RuleTemplateCenterSection />
                  </>
                )}

                {activeCategory === 'data' && <DataSection />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  )
}
