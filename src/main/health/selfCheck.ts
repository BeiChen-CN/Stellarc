import fs from 'fs'
import path from 'path'

interface SelfCheckItem {
  name: string
  status: 'ok' | 'repaired' | 'warning' | 'error'
  message: string
}

interface SelfCheckReport {
  checkedAt: string
  appVersion: string
  items: SelfCheckItem[]
  summary: {
    ok: number
    repaired: number
    warning: number
    error: number
  }
}

const defaultFiles: Record<string, unknown> = {
  'classes.json': { classes: [], currentClassId: null },
  'history.json': { records: [] },
  'settings.json': {}
}

function safeReadJson(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw)
}

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

function summarize(items: SelfCheckItem[]) {
  return {
    ok: items.filter((item) => item.status === 'ok').length,
    repaired: items.filter((item) => item.status === 'repaired').length,
    warning: items.filter((item) => item.status === 'warning').length,
    error: items.filter((item) => item.status === 'error').length
  }
}

export function runDataSelfCheck(dataPath: string, appVersion: string): SelfCheckReport {
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true })
  }

  const items: SelfCheckItem[] = []

  Object.entries(defaultFiles).forEach(([name, fallback]) => {
    const filePath = path.join(dataPath, name)

    if (!fs.existsSync(filePath)) {
      writeJson(filePath, fallback)
      items.push({ name, status: 'repaired', message: 'file missing, created with defaults' })
      return
    }

    try {
      const value = safeReadJson(filePath)
      if (!value || typeof value !== 'object') {
        writeJson(filePath, fallback)
        items.push({ name, status: 'repaired', message: 'invalid structure, reset to defaults' })
        return
      }

      items.push({ name, status: 'ok', message: 'healthy' })
    } catch {
      const backupPath = `${filePath}.corrupt.${Date.now()}.bak`
      fs.copyFileSync(filePath, backupPath)
      writeJson(filePath, fallback)
      items.push({
        name,
        status: 'repaired',
        message: `invalid json, backed up to ${path.basename(backupPath)} and reset`
      })
    }
  })

  const photosPath = path.join(dataPath, 'photos')
  if (!fs.existsSync(photosPath)) {
    fs.mkdirSync(photosPath, { recursive: true })
    items.push({ name: 'photos', status: 'repaired', message: 'photos directory recreated' })
  } else {
    items.push({ name: 'photos', status: 'ok', message: 'directory exists' })
  }

  const report: SelfCheckReport = {
    checkedAt: new Date().toISOString(),
    appVersion,
    items,
    summary: summarize(items)
  }

  writeJson(path.join(dataPath, 'health-report.json'), report)
  return report
}
