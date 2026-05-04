import { describe, expect, it } from 'vitest'

import {
  calculateImmersiveWindowLayout,
  createImmersiveWindowController,
  type ImmersiveWindowSnapshot,
  type ImmersiveWindowTarget,
  type WorkArea
} from './immersiveWindow'

const workArea: WorkArea = { x: 0, y: 0, width: 1920, height: 1080 }

function createFakeWindow(initial: {
  bounds: ImmersiveWindowSnapshot['bounds']
  minimumSize: [number, number]
  maximized?: boolean
  fullScreen?: boolean
}): ImmersiveWindowTarget & {
  calls: string[]
  state: {
    bounds: ImmersiveWindowSnapshot['bounds']
    minimumSize: [number, number]
    maximized: boolean
    fullScreen: boolean
    alwaysOnTop: boolean
    resizable: boolean
    skipTaskbar: boolean
  }
} {
  const state = {
    bounds: { ...initial.bounds },
    minimumSize: [...initial.minimumSize] as [number, number],
    maximized: initial.maximized ?? false,
    fullScreen: initial.fullScreen ?? false,
    alwaysOnTop: false,
    resizable: true,
    skipTaskbar: false
  }
  const calls: string[] = []

  return {
    calls,
    state,
    getBounds: () => ({ ...state.bounds }),
    setBounds: (bounds) => {
      state.bounds = { ...state.bounds, ...bounds }
      calls.push(`setBounds:${state.bounds.x},${state.bounds.y},${state.bounds.width},${state.bounds.height}`)
    },
    getMinimumSize: () => [...state.minimumSize],
    setMinimumSize: (width, height) => {
      state.minimumSize = [width, height]
      calls.push(`setMinimumSize:${width},${height}`)
    },
    isMaximized: () => state.maximized,
    maximize: () => {
      state.maximized = true
      calls.push('maximize')
    },
    unmaximize: () => {
      state.maximized = false
      calls.push('unmaximize')
    },
    isFullScreen: () => state.fullScreen,
    setFullScreen: (flag) => {
      state.fullScreen = flag
      calls.push(`setFullScreen:${flag}`)
    },
    setAlwaysOnTop: (flag) => {
      state.alwaysOnTop = flag
      calls.push(`setAlwaysOnTop:${flag}`)
    },
    setResizable: (flag) => {
      state.resizable = flag
      calls.push(`setResizable:${flag}`)
    },
    setSkipTaskbar: (flag) => {
      state.skipTaskbar = flag
      calls.push(`setSkipTaskbar:${flag}`)
    }
  }
}

describe('immersiveWindow', () => {
  it('positions the ball on the right edge and vertically centered', () => {
    const layout = calculateImmersiveWindowLayout('ball', workArea)

    expect(layout.bounds).toEqual({ x: 1824, y: 504, width: 72, height: 72 })
    expect(layout.alwaysOnTop).toBe(true)
    expect(layout.resizable).toBe(false)
    expect(layout.skipTaskbar).toBe(true)
  })

  it('positions the island at the top center of the work area', () => {
    const layout = calculateImmersiveWindowLayout('island', workArea)

    expect(layout.bounds).toEqual({ x: 730, y: 0, width: 460, height: 92 })
    expect(layout.alwaysOnTop).toBe(true)
    expect(layout.resizable).toBe(false)
    expect(layout.skipTaskbar).toBe(true)
  })

  it('keeps the action bubble cluster compact near the ball', () => {
    const layout = calculateImmersiveWindowLayout('menu', workArea)

    expect(layout.bounds).toEqual({ x: 1732, y: 472, width: 188, height: 136 })
    expect(layout.alwaysOnTop).toBe(true)
    expect(layout.resizable).toBe(false)
    expect(layout.skipTaskbar).toBe(true)
  })

  it('restores the original window state after leaving compact phases', () => {
    const win = createFakeWindow({
      bounds: { x: 100, y: 120, width: 1440, height: 960 },
      minimumSize: [1024, 720],
      maximized: true
    })
    const controller = createImmersiveWindowController(win)

    controller.setPhase('ball', workArea)
    controller.setPhase('menu', workArea)
    controller.setPhase('expanded', workArea)
    controller.setPhase('normal', workArea)

    expect(win.state.bounds).toEqual({ x: 100, y: 120, width: 1440, height: 960 })
    expect(win.state.minimumSize).toEqual([1024, 720])
    expect(win.state.alwaysOnTop).toBe(false)
    expect(win.state.resizable).toBe(true)
    expect(win.state.skipTaskbar).toBe(false)
    expect(win.state.maximized).toBe(true)
    expect(win.calls).toContain('unmaximize')
    expect(win.calls).toContain('maximize')
  })
})
