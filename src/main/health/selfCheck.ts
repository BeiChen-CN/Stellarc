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
  checks: SelfCheckItem[]
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

  const classesPath = path.join(dataPath, 'classes.json')
  const historyPath = path.join(dataPath, 'history.json')

  try {
    const classesJson = safeReadJson(classesPath) as {
      classes?: Array<{ id: string; students?: Array<{ id: string; photo?: string }> }>
      currentClassId?: string | null
      _meta?: unknown
    }
    const historyJson = safeReadJson(historyPath) as {
      records?: Array<{ id: string; pickedStudents?: Array<{ id: string }> }>
      _meta?: unknown
    }

    const classes = Array.isArray(classesJson?.classes) ? classesJson.classes : []
    const classIds = new Set(classes.map((c) => c.id))

    if (
      classes.length > 0 &&
      (!classesJson.currentClassId || !classIds.has(classesJson.currentClassId))
    ) {
      classesJson.currentClassId = classes[0].id
      writeJson(classesPath, classesJson)
      items.push({
        name: 'classes.currentClassId',
        status: 'repaired',
        message: 'currentClassId invalid, repaired to first class'
      })
    } else {
      items.push({ name: 'classes.currentClassId', status: 'ok', message: 'currentClassId valid' })
    }

    let missingPhotoRefs = 0
    classes.forEach((cls) => {
      ;(cls.students || []).forEach((student) => {
        if (!student.photo) return
        const fullPath = path.join(dataPath, student.photo)
        if (!fs.existsSync(fullPath)) {
          missingPhotoRefs++
        }
      })
    })
    items.push({
      name: 'classes.studentPhotos',
      status: missingPhotoRefs > 0 ? 'warning' : 'ok',
      message:
        missingPhotoRefs > 0
          ? `${missingPhotoRefs} photo references point to missing files`
          : 'all photo references exist'
    })

    const studentIds = new Set(
      classes.flatMap((cls) => (cls.students || []).map((student) => student.id))
    )
    const records = Array.isArray(historyJson?.records) ? historyJson.records : []
    let orphanHistoryRefs = 0
    records.forEach((record) => {
      ;(record.pickedStudents || []).forEach((student) => {
        if (!studentIds.has(student.id)) {
          orphanHistoryRefs++
        }
      })
    })
    items.push({
      name: 'history.studentReferences',
      status: orphanHistoryRefs > 0 ? 'warning' : 'ok',
      message:
        orphanHistoryRefs > 0
          ? `${orphanHistoryRefs} history references no longer exist in classes`
          : 'history references are consistent'
    })

    if (!classesJson._meta || !historyJson._meta) {
      items.push({
        name: 'versionedMeta',
        status: 'warning',
        message: 'one or more JSON files missing _meta version info'
      })
    } else {
      items.push({ name: 'versionedMeta', status: 'ok', message: '_meta exists' })
    }
  } catch (error) {
    items.push({
      name: 'businessConsistency',
      status: 'error',
      message: `business-level self-check failed: ${error instanceof Error ? error.message : String(error)}`
    })
  }

  const report: SelfCheckReport = {
    checkedAt: new Date().toISOString(),
    appVersion,
    items,
    checks: items,
    summary: summarize(items)
  }

  writeJson(path.join(dataPath, 'health-report.json'), report)
  return report
}
