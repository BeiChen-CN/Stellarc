import fs from 'fs'
import path from 'path'

export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

export function readJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    return null
  }

  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as T
}

export function writeJsonAtomic(filePath: string, value: unknown): void {
  const dir = path.dirname(filePath)
  ensureDir(dir)

  const tempPath = path.join(
    dir,
    `${path.basename(filePath)}.tmp.${Date.now()}.${Math.random().toString(16).slice(2)}`
  )
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2), 'utf-8')
  fs.renameSync(tempPath, filePath)
}

export function copyDirectory(sourcePath: string, targetPath: string): void {
  if (!fs.existsSync(sourcePath)) {
    ensureDir(targetPath)
    return
  }
  fs.cpSync(sourcePath, targetPath, { recursive: true })
}

export function clearDirectory(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true })
  }
}

export function createBackup(dataPath: string): string {
  const parentDir = path.dirname(dataPath)
  const backupsDir = path.join(parentDir, 'migration-backups')
  ensureDir(backupsDir)

  const backupPath = path.join(backupsDir, `data-${Date.now()}`)
  copyDirectory(dataPath, backupPath)
  return backupPath
}

export function rollbackFromBackup(dataPath: string, backupPath: string): void {
  clearDirectory(dataPath)
  copyDirectory(backupPath, dataPath)
}
