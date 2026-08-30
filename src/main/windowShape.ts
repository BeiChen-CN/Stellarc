import { screen, type BrowserWindow } from 'electron'
import type { ImmersiveWindowPhase } from '../shared/types'

/**
 * Win32 窗口区域硬裁剪：把沉浸小窗物理裁剪为圆形/胶囊形态。
 *
 * 背景：transparent 窗口在部分 Windows 11 24H2+ 机器上被 DWM 强制绘制
 * 系统底板——窗口空白区域显示为灰白方块画布，且不受 transparent /
 * backgroundMaterial / 硬件加速开关等任何手段控制。窗口 region 是
 * DWM 层的硬裁剪，不依赖透明合成：即使底板存在，也只会看到圆形底。
 * 在透明正常的机器上，region 之外同样完全不可见，两者不冲突。
 */

interface RegionRect {
  left: number
  top: number
  right: number
  bottom: number
  ellipseW: number
  ellipseH: number
}

/** 计算 phase 对应的裁剪区域（物理像素）；null 表示恢复矩形窗口 */
export function resolveWindowRegion(
  phase: ImmersiveWindowPhase,
  boundsDip: { width: number; height: number },
  scale: number
): RegionRect | null {
  const w = Math.round(boundsDip.width * scale)
  const h = Math.round(boundsDip.height * scale)

  if (phase === 'ball') {
    // 圆形贴球体：窗口 72 含 4px 内边距，球直径 = 宽 - 8
    const inset = Math.round(4 * scale)
    return {
      left: inset,
      top: inset,
      right: w - inset,
      bottom: h - inset,
      ellipseW: w - inset * 2,
      ellipseH: h - inset * 2
    }
  }

  if (phase === 'island') {
    // 胶囊形
    return { left: 0, top: 0, right: w, bottom: h, ellipseW: h, ellipseH: h }
  }

  if (phase === 'menu') {
    // 圆角矩形，匹配菜单按钮的圆角设计
    const radius = Math.round(24 * scale)
    return { left: 0, top: 0, right: w, bottom: h, ellipseW: radius, ellipseH: radius }
  }

  return null
}

type KoffiFunc = (...args: unknown[]) => unknown

let createRoundRectRgn: KoffiFunc | null = null
let setWindowRgn: KoffiFunc | null = null
let loadFailed = false

function ensureUser32(): boolean {
  if (process.platform !== 'win32') return false
  if (createRoundRectRgn && setWindowRgn) return true
  if (loadFailed) return false
  try {
    // 延迟 require：非 Windows 平台与打包环境均不受影响
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const koffi = require('koffi') as {
      load: (name: string) => { func: (sig: string, ret: string, params: string[]) => KoffiFunc }
    }
    const user32 = koffi.load('user32.dll')
    // x64 Windows 只有统一调用约定，无需 stdcall 标注
    createRoundRectRgn = user32.func('CreateRoundRectRgn', 'intptr', [
      'long',
      'long',
      'long',
      'long',
      'long',
      'long'
    ])
    setWindowRgn = user32.func('SetWindowRgn', 'int', ['intptr', 'intptr', 'int'])
    return true
  } catch {
    loadFailed = true
    return false
  }
}

/** 按沉浸 phase 裁剪窗口形状；normal/expanded 恢复矩形。失败时静默保持原状 */
export function applyWindowShape(win: BrowserWindow, phase: ImmersiveWindowPhase): void {
  if (!ensureUser32()) return
  try {
    const hwndBuf = win.getNativeWindowHandle()
    if (!hwndBuf || hwndBuf.length < 8) return
    const hwnd = hwndBuf.readBigInt64LE(0)

    const region = resolveWindowRegion(phase, win.getBounds(), screen.getDisplayMatching(win.getBounds()).scaleFactor || 1)
    if (!region) {
      ;(setWindowRgn as KoffiFunc)(hwnd, 0, 1)
      return
    }

    const rgn = (createRoundRectRgn as KoffiFunc)(
      region.left,
      region.top,
      region.right,
      region.bottom,
      region.ellipseW,
      region.ellipseH
    )
    if (rgn) {
      ;(setWindowRgn as KoffiFunc)(hwnd, rgn, 1)
    }
  } catch {
    // 原生调用失败不阻塞沉浸流程，窗口保持未裁剪形态
  }
}
