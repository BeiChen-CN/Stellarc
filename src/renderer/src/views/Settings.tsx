import type { ReactElement } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { AppearanceSection } from './settings/AppearanceSection'
import { FairnessSection } from './settings/FairnessSection'
import { DataSection } from './settings/DataSection'
import { RuleTemplateCenterSection } from './settings/RuleTemplateCenterSection'

export function Settings(): ReactElement {
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
      <div className="max-w-2xl mx-auto py-6 px-5 space-y-8 pb-16">
        <div>
          <h2 className="text-3xl font-bold mb-2 text-on-surface">设置</h2>
          <p className="text-on-surface-variant text-sm">自定义您的应用体验与数据管理。</p>
        </div>

        <div className="space-y-8">
          <AppearanceSection onSelectBackground={handleSelectBackground} />
          <FairnessSection />
          <RuleTemplateCenterSection />
          <DataSection />
        </div>
      </div>
    </div>
  )
}
