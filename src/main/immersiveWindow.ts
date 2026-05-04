type ImmersiveWindowPhase = 'normal' | 'ball' | 'menu' | 'island' | 'expanded'

export interface WorkArea {
  x: number
  y: number
  width: number
  height: number
}

interface ImmersiveWindowBounds extends WorkArea {}

interface ImmersiveWindowPoint {
  x: number
  y: number
}

export interface ImmersiveWindowSnapshot {
  bounds: ImmersiveWindowBounds
  minimumSize: [number, number]
  maximized: boolean
  fullScreen: boolean
}

interface ImmersiveWindowLayout {
  bounds: ImmersiveWindowBounds
  alwaysOnTop: boolean
  resizable: boolean
  skipTaskbar: boolean
  minimumSize: [number, number]
}

export interface ImmersiveWindowPhaseOptions {
  anchor?: { x: number; y: number }
}

type AlwaysOnTopLevel =
  | 'normal'
  | 'floating'
  | 'torn-off-menu'
  | 'modal-panel'
  | 'main-menu'
  | 'status'
  | 'pop-up-menu'
  | 'screen-saver'
  | 'dock'

export interface ImmersiveWindowTarget {
  getBounds: () => ImmersiveWindowBounds
  setBounds: (bounds: ImmersiveWindowBounds) => void
  getMinimumSize: () => number[]
  setMinimumSize: (width: number, height: number) => void
  isMaximized: () => boolean
  maximize: () => void
  unmaximize: () => void
  isFullScreen: () => boolean
  setFullScreen: (flag: boolean) => void
  setAlwaysOnTop: (flag: boolean, level?: AlwaysOnTopLevel) => void
  setResizable: (flag: boolean) => void
  setSkipTaskbar: (flag: boolean) => void
}

const BALL_SIZE = 72
const BALL_MARGIN = 24
const MENU_WIDTH = 188
const MENU_HEIGHT = 136
const ISLAND_WIDTH = 460
const ISLAND_HEIGHT = 92
const ISLAND_TOP_MARGIN = 0
const FALLBACK_EXPANDED_WIDTH = 1024
const FALLBACK_EXPANDED_HEIGHT = 720

const PHASES = new Set<ImmersiveWindowPhase>([
  'normal',
  'ball',
  'menu',
  'island',
  'expanded'
])

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min
  return Math.min(max, Math.max(min, value))
}

function fitBounds(bounds: ImmersiveWindowBounds, workArea: WorkArea): ImmersiveWindowBounds {
  const maxX = workArea.x + workArea.width - bounds.width
  const maxY = workArea.y + workArea.height - bounds.height
  return {
    ...bounds,
    x: Math.round(clamp(bounds.x, workArea.x, maxX)),
    y: Math.round(clamp(bounds.y, workArea.y, maxY))
  }
}

function defaultBallAnchor(workArea: WorkArea): ImmersiveWindowPoint {
  return {
    x: workArea.x + workArea.width - BALL_SIZE - BALL_MARGIN,
    y: workArea.y + Math.round((workArea.height - BALL_SIZE) / 2)
  }
}

export function isImmersiveWindowPhase(value: unknown): value is ImmersiveWindowPhase {
  return typeof value === 'string' && PHASES.has(value as ImmersiveWindowPhase)
}

export function calculateImmersiveWindowLayout(
  phase: Exclude<ImmersiveWindowPhase, 'normal'>,
  workArea: WorkArea,
  options: {
    anchor?: ImmersiveWindowPoint
    restoreBounds?: ImmersiveWindowBounds
    restoreMinimumSize?: [number, number]
  } = {}
): ImmersiveWindowLayout {
  if (phase === 'expanded') {
    const fallbackBounds = fitBounds(
      {
        x: workArea.x + Math.round((workArea.width - FALLBACK_EXPANDED_WIDTH) / 2),
        y: workArea.y + Math.round((workArea.height - FALLBACK_EXPANDED_HEIGHT) / 2),
        width: Math.min(FALLBACK_EXPANDED_WIDTH, workArea.width),
        height: Math.min(FALLBACK_EXPANDED_HEIGHT, workArea.height)
      },
      workArea
    )
    return {
      bounds: options.restoreBounds ?? fallbackBounds,
      alwaysOnTop: true,
      resizable: true,
      skipTaskbar: false,
      minimumSize: options.restoreMinimumSize ?? [1024, 720]
    }
  }

  if (phase === 'island') {
    return {
      bounds: fitBounds(
        {
          x: workArea.x + Math.round((workArea.width - ISLAND_WIDTH) / 2),
          y: workArea.y + ISLAND_TOP_MARGIN,
          width: ISLAND_WIDTH,
          height: ISLAND_HEIGHT
        },
        workArea
      ),
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      minimumSize: [0, 0]
    }
  }

  const anchor = options.anchor ?? defaultBallAnchor(workArea)
  const ballBounds = fitBounds(
    {
      x: Math.round(anchor.x),
      y: Math.round(anchor.y),
      width: BALL_SIZE,
      height: BALL_SIZE
    },
    workArea
  )

  if (phase === 'ball') {
    return {
      bounds: ballBounds,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      minimumSize: [0, 0]
    }
  }

  return {
    bounds: fitBounds(
      {
        x: ballBounds.x + BALL_SIZE + BALL_MARGIN - MENU_WIDTH,
        y: ballBounds.y - Math.round((MENU_HEIGHT - BALL_SIZE) / 2),
        width: MENU_WIDTH,
        height: MENU_HEIGHT
      },
      workArea
    ),
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    minimumSize: [0, 0]
  }
}

function captureSnapshot(win: ImmersiveWindowTarget): ImmersiveWindowSnapshot {
  const minimumSize = win.getMinimumSize()
  return {
    bounds: win.getBounds(),
    minimumSize: [minimumSize[0] ?? 0, minimumSize[1] ?? 0],
    maximized: win.isMaximized(),
    fullScreen: win.isFullScreen()
  }
}

function applyLayout(win: ImmersiveWindowTarget, layout: ImmersiveWindowLayout): void {
  win.setMinimumSize(layout.minimumSize[0], layout.minimumSize[1])
  win.setResizable(layout.resizable)
  win.setAlwaysOnTop(layout.alwaysOnTop, layout.alwaysOnTop ? 'floating' : undefined)
  win.setSkipTaskbar(layout.skipTaskbar)
  win.setBounds(layout.bounds)
}

export function createImmersiveWindowController(win: ImmersiveWindowTarget): {
  getPhase: () => ImmersiveWindowPhase
  setPhase: (
    phase: ImmersiveWindowPhase,
    workArea: WorkArea,
    options?: ImmersiveWindowPhaseOptions
  ) => void
} {
  let phase: ImmersiveWindowPhase = 'normal'
  let snapshot: ImmersiveWindowSnapshot | null = null
  let ballAnchor: ImmersiveWindowPoint | null = null

  const restoreNormal = (): void => {
    if (!snapshot) {
      win.setAlwaysOnTop(false)
      win.setResizable(true)
      win.setSkipTaskbar(false)
      phase = 'normal'
      ballAnchor = null
      return
    }

    const restore = snapshot
    if (win.isFullScreen()) win.setFullScreen(false)
    if (win.isMaximized()) win.unmaximize()
    win.setMinimumSize(restore.minimumSize[0], restore.minimumSize[1])
    win.setResizable(true)
    win.setAlwaysOnTop(false)
    win.setSkipTaskbar(false)
    win.setBounds(restore.bounds)
    if (restore.fullScreen) {
      win.setFullScreen(true)
    } else if (restore.maximized) {
      win.maximize()
    }

    snapshot = null
    ballAnchor = null
    phase = 'normal'
  }

  const prepareImmersive = (): void => {
    if (!snapshot) snapshot = captureSnapshot(win)
    if (win.isFullScreen()) win.setFullScreen(false)
    if (win.isMaximized()) win.unmaximize()
  }

  return {
    getPhase: () => phase,
    setPhase: (nextPhase, workArea, options = {}) => {
      if (nextPhase === 'normal') {
        restoreNormal()
        return
      }

      prepareImmersive()

      if (options.anchor) {
        ballAnchor = options.anchor
      } else if (phase === 'ball') {
        const currentBounds = win.getBounds()
        ballAnchor = { x: currentBounds.x, y: currentBounds.y }
      }

      const layout = calculateImmersiveWindowLayout(nextPhase, workArea, {
        anchor: ballAnchor ?? undefined,
        restoreBounds: snapshot?.bounds,
        restoreMinimumSize: snapshot?.minimumSize
      })

      applyLayout(win, layout)

      if (nextPhase === 'expanded') {
        if (snapshot?.fullScreen) {
          win.setFullScreen(true)
        } else if (snapshot?.maximized) {
          win.maximize()
        }
      }

      phase = nextPhase
    }
  }
}
