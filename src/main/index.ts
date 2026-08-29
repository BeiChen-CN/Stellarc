import { app, shell, BrowserWindow, session, protocol, net } from 'electron'
import { join } from 'path'
import { pathToFileURL } from 'url'
import fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import log from 'electron-log'
import icon from '../../resources/icon.png?asset'
import { AppController } from './controllers/AppController'
import { FileController } from './controllers/FileController'
import { DialogController } from './controllers/DialogController'
import { WindowController } from './controllers/WindowController'
import { UpdateController } from './controllers/UpdateController'
import { SystemController } from './controllers/SystemController'
import { runDataMigrations } from './migrations'
import { runDataSelfCheck } from './health/selfCheck'

log.transports.file.level = 'info'
log.transports.console.level = is.dev ? 'debug' : 'warn'

function getDataPath(): string {
  const userDataPath = join(app.getPath('userData'), 'data')
  const legacyPath = join(process.cwd(), 'data')

  // Migrate from legacy cwd-based path if needed
  if (!fs.existsSync(userDataPath) && fs.existsSync(legacyPath)) {
    try {
      fs.cpSync(legacyPath, userDataPath, { recursive: true })
      log.info(`Migrated data from ${legacyPath} to ${userDataPath}`)
    } catch (err) {
      log.error('Data migration failed, falling back to legacy path:', err)
      return legacyPath
    }
  }

  return userDataPath
}

function createWindow(): BrowserWindow {
  // Set Content Security Policy (production only)
  if (!is.dev) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' file: local-file:; script-src 'self' file: 'unsafe-inline'; style-src 'self' file: 'unsafe-inline'; img-src 'self' file: local-file: data:; font-src 'self' file: data:; connect-src 'self' https:"
          ]
        }
      })
    })
  }

  // Create the browser window.
  const isMac = process.platform === 'darwin'

  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 720,
    transparent: true,
    backgroundColor: '#00000000',
    show: false,
    autoHideMenuBar: true,
    frame: isMac,
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // F11 to toggle fullscreen
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen())
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Register local-file protocol for loading local images in renderer
  protocol.handle('local-file', (request) => {
    const filePath = decodeURIComponent(request.url.replace('local-file://', ''))
    return net.fetch(pathToFileURL(filePath).href)
  })

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.spotlight.classroom')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize Controllers
  const dataPath = getDataPath()
  const migrationResult = runDataMigrations(dataPath, app.getVersion())
  if (migrationResult.skipped) {
    log.info('[Migration] data schema already up to date, skipped')
  }
  if (!migrationResult.success) {
    log.error(
      `[Migration] failed with ${migrationResult.errorCode}: ${migrationResult.errorMessage}`
    )
  }

  const selfCheckReport = runDataSelfCheck(dataPath, app.getVersion())
  if (selfCheckReport.summary.repaired > 0 || selfCheckReport.summary.error > 0) {
    log.warn(
      `[SelfCheck] repaired=${selfCheckReport.summary.repaired}, error=${selfCheckReport.summary.error}`
    )
  }

  new AppController(dataPath)
  new FileController(dataPath)
  new DialogController()
  new WindowController()
  new UpdateController()
  new SystemController(dataPath)

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
