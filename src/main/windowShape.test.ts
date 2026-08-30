import { describe, expect, it } from 'vitest'
import { resolveWindowRegion } from './windowShape'

/** 窗口物理形状裁剪（球=圆、岛=胶囊、菜单=圆角矩形）的参数计算 */

describe('resolveWindowRegion', () => {
  it('ball：圆形区域贴球体（窗口 72 内缩 4px 的内切圆）', () => {
    const r = resolveWindowRegion('ball', { width: 72, height: 72 }, 1)
    expect(r).toEqual({
      left: 4,
      top: 4,
      right: 68,
      bottom: 68,
      ellipseW: 64,
      ellipseH: 64
    })
  })

  it('ball：DPI 缩放下按物理像素换算', () => {
    const r = resolveWindowRegion('ball', { width: 72, height: 72 }, 1.5)
    expect(r).toEqual({
      left: 6,
      top: 6,
      right: 102,
      bottom: 102,
      ellipseW: 96,
      ellipseH: 96
    })
  })

  it('island：胶囊形（椭圆短径 = 窗口高度）', () => {
    const r = resolveWindowRegion('island', { width: 460, height: 92 }, 1)
    expect(r).toEqual({ left: 0, top: 0, right: 460, bottom: 92, ellipseW: 92, ellipseH: 92 })
  })

  it('menu：24px 圆角矩形', () => {
    const r = resolveWindowRegion('menu', { width: 188, height: 136 }, 1)
    expect(r).toEqual({ left: 0, top: 0, right: 188, bottom: 136, ellipseW: 24, ellipseH: 24 })
  })

  it('normal/expanded 恢复矩形（null = 清除 region）', () => {
    expect(resolveWindowRegion('normal', { width: 1440, height: 960 }, 1)).toBeNull()
    expect(resolveWindowRegion('expanded', { width: 1024, height: 720 }, 1)).toBeNull()
  })
})
