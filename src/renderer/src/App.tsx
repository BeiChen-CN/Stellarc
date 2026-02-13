import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from './components/Sidebar'
import { Home } from './views/Home'
import { Students } from './views/Students'
import { Settings } from './views/Settings'
import { History } from './views/History'
import { About } from './views/About'
import { Statistics } from './views/Statistics'
import { ToastContainer } from './components/Toast'
import { ConfirmDialog } from './components/ConfirmDialog'
import { TitleBar } from './components/TitleBar'
import { useClassesStore } from './store/classesStore'
import { useSettingsStore } from './store/settingsStore'
import type { DynamicColorPalette } from './store/settingsStore'
import { useHistoryStore } from './store/historyStore'
import { useStrategyStore } from './store/strategyStore'
import { useSpeedFactor } from './lib/useSpeedFactor'

function App() {
  const [currentView, setCurrentView] = useState<
    'home' | 'students' | 'history' | 'statistics' | 'settings' | 'about'
  >('home')
  const [appReady, setAppReady] = useState(false)
  const loadClasses = useClassesStore((state) => state.loadClasses)
  const loadSettings = useSettingsStore((state) => state.loadSettings)
  const loadHistory = useHistoryStore((state) => state.loadHistory)
  const loadPlugins = useStrategyStore((state) => state.loadPlugins)
  const sf = useSpeedFactor()
  const {
    theme,
    colorTheme,
    customColor,
    designStyle,
    shortcutKey,
    m3Mode,
    animationSpeed,
    dynamicColor,
    dynamicColorPalette,
    backgroundImage,
    extractAndApplyDynamicColor
  } = useSettingsStore()

  useEffect(() => {
    Promise.all([loadPlugins(), loadSettings(), loadClasses(), loadHistory()]).finally(() =>
      setAppReady(true)
    )
  }, [])

  // Register global shortcut when shortcutKey changes
  useEffect(() => {
    if (shortcutKey) {
      window.electronAPI.registerShortcut(shortcutKey, 'pick')
    } else {
      window.electronAPI.registerShortcut('', '')
    }
  }, [shortcutKey])

  // Apply theme mode + color theme
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }

    // Apply color theme
    const colorClasses = [
      'theme-violet',
      'theme-rose',
      'theme-green',
      'theme-orange',
      'theme-amber',
      'theme-teal',
      'theme-slate',
      'theme-cloud',
      'theme-corundum',
      'theme-kiwi',
      'theme-spicy',
      'theme-bright-teal',
      'theme-sakura',
      'theme-forest',
      'theme-ocean',
      'theme-mocha',
      'theme-klein-blue',
      'theme-tiffany',
      'theme-prussian',
      'theme-titian',
      'theme-china-red',
      'theme-burgundy',
      'theme-schonbrunn',
      'theme-vandyke',
      'theme-marrs',
      'theme-turquoise',
      'theme-morandi',
      'theme-hermes'
    ]
    root.classList.remove(...colorClasses)
    if (colorTheme && colorTheme !== 'blue') {
      root.classList.add(`theme-${colorTheme}`)
    }

    // Apply M3 mode
    if (m3Mode) {
      root.classList.add('m3-mode')
    } else {
      root.classList.remove('m3-mode')
    }
  }, [theme, colorTheme, m3Mode])

  // Apply custom color as CSS variable override
  useEffect(() => {
    const root = window.document.documentElement
    if (customColor) {
      // Parse hex to HSL
      const r = parseInt(customColor.slice(1, 3), 16) / 255
      const g = parseInt(customColor.slice(3, 5), 16) / 255
      const b = parseInt(customColor.slice(5, 7), 16) / 255
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const l = (max + min) / 2
      let h = 0
      let s = 0
      if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        else if (max === g) h = ((b - r) / d + 2) / 6
        else h = ((r - g) / d + 4) / 6
      }
      const hDeg = Math.round(h * 360)
      const sPct = Math.round(s * 100)
      const lPct = Math.round(l * 100)
      root.style.setProperty('--primary', `${hDeg} ${sPct}% ${lPct}%`)
      root.style.setProperty('--primary-foreground', `${hDeg} ${sPct}% ${lPct > 50 ? 10 : 98}%`)
      root.style.setProperty('--ring', `${hDeg} ${sPct}% ${lPct}%`)
    } else {
      root.style.removeProperty('--primary')
      root.style.removeProperty('--primary-foreground')
      root.style.removeProperty('--ring')
    }
  }, [customColor])

  // Apply global animation speed factor
  useEffect(() => {
    const root = window.document.documentElement
    const factor = animationSpeed === 'elegant' ? 1.5 : animationSpeed === 'fast' ? 0.5 : 1
    root.style.setProperty('--speed-factor', String(factor))
    root.classList.remove('speed-elegant', 'speed-fast')
    if (animationSpeed === 'elegant') root.classList.add('speed-elegant')
    else if (animationSpeed === 'fast') root.classList.add('speed-fast')
  }, [animationSpeed])

  // Apply design style
  useEffect(() => {
    const root = window.document.documentElement
    const styleClasses = [
      'style-flat',
      'style-minimal',
      'style-glass',
      'style-clay',
      'style-neu',
      'style-skeu',
      'style-micro',
      'style-apple'
    ]
    root.classList.remove(...styleClasses)

    const styleMap: Record<string, string> = {
      flat: 'style-flat',
      minimalism: 'style-minimal',
      glassmorphism: 'style-glass',
      claymorphism: 'style-clay',
      neumorphism: 'style-neu',
      skeuomorphism: 'style-skeu',
      microinteractions: 'style-micro',
      'apple-hig': 'style-apple'
    }
    if (designStyle && designStyle !== 'material-design-3' && styleMap[designStyle]) {
      root.classList.add(styleMap[designStyle])
    }
  }, [designStyle])

  // Extract dynamic colors on startup if enabled
  useEffect(() => {
    if (dynamicColor && backgroundImage) {
      extractAndApplyDynamicColor()
    }
  }, [dynamicColor, backgroundImage])

  // Generate and apply dynamic CSS variables from wallpaper palette
  const generateDynamicCSSVariables = useCallback(
    (palette: DynamicColorPalette, isDark: boolean, isM3: boolean): Record<string, string> => {
      const { hue: h, saturation: s, tertiaryHue: th } = palette
      const sat = Math.max(s, 40) // ensure enough saturation for primary
      const vars: Record<string, string> = {}

      if (isDark) {
        vars['--primary'] = `${h} ${Math.min(sat + 10, 100)}% 60%`
        vars['--primary-foreground'] = `${h} ${sat}% 11%`
        vars['--ring'] = `${h} ${Math.min(sat + 5, 100)}% 48%`
        vars['--accent'] = `${h} ${Math.round(sat * 0.5)}% 18%`
        vars['--accent-foreground'] = `${h} ${sat}% 98%`
        vars['--surface-tint'] = `${h} ${Math.min(sat + 10, 100)}% 60%`
        vars['--secondary-container'] = `${h} ${Math.round(sat * 0.5)}% 18%`
        vars['--secondary-container-foreground'] = `${h} ${sat}% 90%`
        vars['--tertiary'] = `${th} 50% 70%`
        vars['--tertiary-container'] = `${th} 25% 20%`
      } else {
        vars['--primary'] = `${h} ${sat}% 53%`
        vars['--primary-foreground'] = `${h} ${sat}% 98%`
        vars['--ring'] = `${h} ${sat}% 53%`
        vars['--accent'] = `${h} ${Math.round(sat * 0.6)}% 96%`
        vars['--accent-foreground'] = `${h} ${sat}% 11%`
        vars['--surface-tint'] = `${h} ${sat}% 53%`
        vars['--secondary-container'] = `${h} ${Math.round(sat * 0.6)}% 92%`
        vars['--secondary-container-foreground'] = `${h} ${sat}% 11%`
        vars['--tertiary'] = `${th} 60% 55%`
        vars['--tertiary-container'] = `${th} 40% 92%`
      }

      if (isM3) {
        if (isDark) {
          vars['--background'] = `${h} 20% 8%`
          vars['--foreground'] = `${h} 15% 92%`
          vars['--card'] = `${h} 18% 12%`
          vars['--card-foreground'] = `${h} 15% 92%`
          vars['--popover'] = `${h} 18% 12%`
          vars['--popover-foreground'] = `${h} 15% 92%`
          vars['--secondary'] = `${h} 15% 20%`
          vars['--secondary-foreground'] = `${h} 15% 88%`
          vars['--muted'] = `${h} 12% 18%`
          vars['--muted-foreground'] = `${h} 10% 62%`
          vars['--border'] = `${h} 12% 20%`
          vars['--input'] = `${h} 12% 20%`
          vars['--surface-container'] = `${h} 16% 12%`
          vars['--surface-container-high'] = `${h} 14% 16%`
          vars['--surface-container-low'] = `${h} 18% 9%`
          vars['--outline'] = `${h} 8% 38%`
          vars['--outline-variant'] = `${h} 10% 22%`
          vars['--on-surface'] = `${h} 15% 92%`
          vars['--on-surface-variant'] = `${h} 8% 65%`
        } else {
          vars['--background'] = `${h} 30% 98%`
          vars['--foreground'] = `${h} 15% 12%`
          vars['--card'] = `${h} 25% 96%`
          vars['--card-foreground'] = `${h} 15% 12%`
          vars['--popover'] = `${h} 25% 96%`
          vars['--popover-foreground'] = `${h} 15% 12%`
          vars['--secondary'] = `${h} 20% 90%`
          vars['--secondary-foreground'] = `${h} 15% 20%`
          vars['--muted'] = `${h} 18% 93%`
          vars['--muted-foreground'] = `${h} 10% 42%`
          vars['--border'] = `${h} 15% 88%`
          vars['--input'] = `${h} 15% 88%`
          vars['--surface-container'] = `${h} 22% 95%`
          vars['--surface-container-high'] = `${h} 18% 92%`
          vars['--surface-container-low'] = `${h} 26% 97%`
          vars['--outline'] = `${h} 10% 72%`
          vars['--outline-variant'] = `${h} 14% 86%`
          vars['--on-surface'] = `${h} 15% 12%`
          vars['--on-surface-variant'] = `${h} 8% 38%`
        }
      }

      return vars
    },
    []
  )

  // Apply or remove dynamic CSS variables
  useEffect(() => {
    const root = document.documentElement
    const DYNAMIC_VARS = [
      '--primary',
      '--primary-foreground',
      '--ring',
      '--accent',
      '--accent-foreground',
      '--surface-tint',
      '--secondary-container',
      '--secondary-container-foreground',
      '--tertiary',
      '--tertiary-container',
      '--background',
      '--foreground',
      '--card',
      '--card-foreground',
      '--popover',
      '--popover-foreground',
      '--secondary',
      '--secondary-foreground',
      '--muted',
      '--muted-foreground',
      '--border',
      '--input',
      '--surface-container',
      '--surface-container-high',
      '--surface-container-low',
      '--outline',
      '--outline-variant',
      '--on-surface',
      '--on-surface-variant'
    ]

    if (!dynamicColorPalette) {
      DYNAMIC_VARS.forEach((v) => root.style.removeProperty(v))
      return
    }

    const isDark = root.classList.contains('dark')
    const vars = generateDynamicCSSVariables(dynamicColorPalette, isDark, m3Mode)
    // Set generated vars, remove any that weren't generated this pass
    DYNAMIC_VARS.forEach((v) => {
      if (vars[v]) {
        root.style.setProperty(v, vars[v])
      } else {
        root.style.removeProperty(v)
      }
    })
  }, [dynamicColorPalette, theme, m3Mode, generateDynamicCSSVariables])

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home onNavigate={setCurrentView} />
      case 'students':
        return <Students />
      case 'history':
        return <History />
      case 'statistics':
        return <Statistics />
      case 'settings':
        return <Settings />
      case 'about':
        return <About />
      default:
        return <Home onNavigate={setCurrentView} />
    }
  }

  if (!appReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full"
          />
          <span className="text-sm text-on-surface-variant">加载中...</span>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground transition-colors duration-500">
      <TitleBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        <main className="flex-1 min-h-0 overflow-hidden bg-background relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 * sf, ease: 'easeOut' }}
              className="h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <ToastContainer />
      <ConfirmDialog />
    </div>
  )
}

export default App
