import type { AnimationSpeed, AnimationStyle, ColorTheme } from '../store/settingsStore'

/**
 * 外观选项的唯一元数据源。
 * AppearanceSection（完整列表）、OnboardingGuide（精选子集）、
 * App.tsx（主题 class 清理）都从这里取数，新增主题/动画只需改此文件。
 */

export interface ColorThemeMeta {
  id: ColorTheme
  label: string
  color: string
}

export const COLOR_THEMES: ColorThemeMeta[] = [
  { id: 'klein-blue', label: '克莱因蓝', color: 'hsl(223, 100%, 33%)' },
  { id: 'tiffany', label: '蒂芙尼蓝', color: 'hsl(174, 46%, 68%)' },
  { id: 'prussian', label: '普鲁士蓝', color: 'hsl(204, 100%, 16%)' },
  { id: 'titian', label: '提香红', color: 'hsl(23, 67%, 41%)' },
  { id: 'china-red', label: '中国红', color: 'hsl(0, 100%, 45%)' },
  { id: 'burgundy', label: '勃艮第红', color: 'hsl(346, 100%, 28%)' },
  { id: 'schonbrunn', label: '申布伦黄', color: 'hsl(43, 95%, 70%)' },
  { id: 'vandyke', label: '凡戴克棕', color: 'hsl(20, 56%, 36%)' },
  { id: 'marrs', label: '马尔斯绿', color: 'hsl(178, 98%, 26%)' },
  { id: 'turquoise', label: '只此青绿', color: 'hsl(174, 72%, 56%)' },
  { id: 'cloud', label: '云上舞白', color: 'hsl(30, 12%, 52%)' },
  { id: 'morandi', label: '莫兰迪绿', color: 'hsl(150, 15%, 60%)' },
  { id: 'hermes', label: '爱马仕橙', color: 'hsl(24, 95%, 48%)' },
  { id: 'blue', label: '经典蓝', color: 'hsl(221.2, 83.2%, 53.3%)' },
  { id: 'violet', label: '梦幻紫', color: 'hsl(262.1, 83.3%, 57.8%)' },
  { id: 'rose', label: '玫瑰红', color: 'hsl(346.8, 77.2%, 49.8%)' },
  { id: 'green', label: '翡翠绿', color: 'hsl(142.1, 76.2%, 36.3%)' },
  { id: 'orange', label: '活力橙', color: 'hsl(24.6, 95%, 53.1%)' },
  { id: 'amber', label: '琥珀金', color: 'hsl(43, 96%, 56%)' },
  { id: 'teal', label: '青碧色', color: 'hsl(172, 66%, 40%)' },
  { id: 'slate', label: '石墨灰', color: 'hsl(215, 16%, 47%)' },
  { id: 'corundum', label: '刚玉蓝', color: 'hsl(220, 22%, 40%)' },
  { id: 'kiwi', label: '猕猴桃绿', color: 'hsl(120, 35%, 52%)' },
  { id: 'spicy', label: '辛辣红', color: 'hsl(15, 55%, 40%)' },
  { id: 'bright-teal', label: '明水鸭色', color: 'hsl(180, 35%, 45%)' },
  { id: 'sakura', label: '樱花', color: 'hsl(340, 55%, 55%)' },
  { id: 'forest', label: '森林', color: 'hsl(100, 52%, 34%)' },
  { id: 'ocean', label: '海洋', color: 'hsl(180, 100%, 21%)' },
  { id: 'mocha', label: '摩卡', color: 'hsl(25, 42%, 40%)' }
]

const THEME_META_BY_ID = new Map(COLOR_THEMES.map((meta) => [meta.id, meta]))

export function getColorThemeMeta(id: ColorTheme): ColorThemeMeta {
  const meta = THEME_META_BY_ID.get(id)
  if (!meta) throw new Error(`Unknown color theme: ${id}`)
  return meta
}

export interface AnimationStyleMeta {
  id: AnimationStyle
  label: string
  /** 新手引导中的补充说明 */
  desc: string
}

export const ANIMATION_STYLES: AnimationStyleMeta[] = [
  { id: 'slot', label: '老虎机', desc: '滚轮式揭晓' },
  { id: 'scroll', label: '滚动', desc: '名单纵向滚动' },
  { id: 'flip', label: '翻转', desc: '卡片翻面揭晓' },
  { id: 'wheel', label: '转盘', desc: '旋转抽取感' },
  { id: 'bounce', label: '弹跳', desc: '轻快弹性反馈' },
  { id: 'typewriter', label: '打字机', desc: '逐字显示姓名' },
  { id: 'ripple', label: '涟漪', desc: '扩散式结果反馈' },
  { id: 'charByChar', label: '逐字', desc: '字符级揭晓' }
]

export interface AnimationSpeedMeta {
  id: AnimationSpeed
  label: string
  desc: string
}

export const ANIMATION_SPEEDS: AnimationSpeedMeta[] = [
  { id: 'elegant', label: '舒缓', desc: '适合慢节奏课堂' },
  { id: 'balanced', label: '均衡', desc: '默认节奏' },
  { id: 'fast', label: '快速', desc: '更利落的抽取' }
]

/**
 * 全部非默认主题对应的 root class（blue 为默认色，不挂 class）。
 * App.tsx 切换主题时用它批量移除旧 class，避免手抄清单漏项。
 */
export const NON_DEFAULT_THEME_CLASSES: string[] = COLOR_THEMES.filter(
  (meta) => meta.id !== 'blue'
).map((meta) => `theme-${meta.id}`)
