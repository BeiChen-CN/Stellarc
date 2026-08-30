import { IpcMainInvokeEvent } from 'electron'
import path from 'path'
import fs from 'fs'
import fsp from 'fs/promises'
import { z } from 'zod/v4'
import { Vibrant } from 'node-vibrant/node'
import log from 'electron-log'
import { BaseController } from './BaseController'
import { assertPathAuthorized } from '../fileAuth'
import { writeJsonAtomic } from '../migrations/io'

const filenameSchema = z.tuple([z.string().min(1)])
// IPC payload 为未类型化 JSON，故用 z.any()
const filenameDataSchema = z.tuple([z.string().min(1), z.any()])
const filePathSchema = z.tuple([z.string().min(1)])
const filePathContentSchema = z.tuple([z.string().min(1), z.string()])
const copyPhotoSchema = z.tuple([z.string().min(1), z.string().min(1)])

export class FileController extends BaseController {
  private dataPath: string
  private photosPath: string

  constructor(dataPath: string) {
    super()
    this.dataPath = dataPath
    this.photosPath = path.join(this.dataPath, 'photos')
    this.ensureDirectories()
  }

  private ensureDirectories() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true })
    }
    if (!fs.existsSync(this.photosPath)) {
      fs.mkdirSync(this.photosPath, { recursive: true })
    }
  }

  protected init(): void {
    this.handleValidated('read-json', filenameSchema, this.readJson)
    this.handleValidated('write-json', filenameDataSchema, this.writeJson)
    this.handleValidated('read-file', filePathSchema, this.readFile)
    this.handleValidated('read-text-file', filePathSchema, this.readTextFile)
    this.handleValidated('copy-photo', copyPhotoSchema, this.copyPhoto)
    this.handleValidated('extract-wallpaper-colors', filePathSchema, this.extractWallpaperColors)
    this.handleValidated('write-export-file', filePathContentSchema, this.writeExportFile)
  }

  private getSafePath(relativePath: string, baseDir: string = this.dataPath): string {
    const safeBase = path.resolve(baseDir)
    const requested = path.resolve(baseDir, relativePath)
    const rel = path.relative(safeBase, requested)
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new Error('Access denied: Invalid path')
    }
    return requested
  }

  private assertAuthorized(filePath: string): void {
    assertPathAuthorized(filePath)
  }

  /**
   * 读取数据文件。文件不存在返回 null；JSON 损坏或 IO 异常向上抛出，
   * 让渲染端感知（静默返回 null 会导致渲染端把损坏文件当作空数据覆盖重写）。
   */
  private async readJson(_event: IpcMainInvokeEvent, filename: string): Promise<unknown> {
    const filePath = this.getSafePath(filename)
    try {
      const data = await fsp.readFile(filePath, 'utf-8')
      return JSON.parse(data)
    } catch (e: unknown) {
      if (e instanceof Error && 'code' in e && e.code === 'ENOENT') return null
      log.error('Failed to read JSON:', e)
      throw e
    }
  }

  private async writeJson(
    _event: IpcMainInvokeEvent,
    filename: string,
    data: unknown
  ): Promise<boolean> {
    try {
      const filePath = this.getSafePath(filename)
      const versionedFiles = new Set(['classes.json', 'history.json', 'settings.json'])
      const targetName = path.basename(filename)

      let payload = data
      if (
        versionedFiles.has(targetName) &&
        data &&
        typeof data === 'object' &&
        !Array.isArray(data)
      ) {
        const existing = (await this.readJson(_event, filename)) as Record<string, unknown> | null
        if (
          existing &&
          typeof existing === 'object' &&
          existing._meta &&
          !(data as Record<string, unknown>)._meta
        ) {
          payload = { ...(data as Record<string, unknown>), _meta: existing._meta }
        }
      }

      // 原子写（临时文件 + rename）：断电/崩溃不再产生截断 JSON
      // （截断会被启动自检当作损坏文件重置为默认值，导致用户数据丢失）
      writeJsonAtomic(filePath, payload)
      return true
    } catch (error) {
      log.error('Failed to write JSON:', error)
      throw error
    }
  }

  private async readFile(_event: IpcMainInvokeEvent, filePath: string): Promise<Buffer> {
    this.assertAuthorized(filePath)
    return fsp.readFile(filePath)
  }

  private async readTextFile(_event: IpcMainInvokeEvent, filePath: string): Promise<string> {
    this.assertAuthorized(filePath)
    return fsp.readFile(filePath, 'utf-8')
  }

  private async copyPhoto(
    _event: IpcMainInvokeEvent,
    sourcePath: string,
    targetName: string
  ): Promise<string> {
    this.assertAuthorized(sourcePath)
    const ext = path.extname(sourcePath)
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
    if (!allowedExts.includes(ext.toLowerCase())) {
      throw new Error('Invalid file type')
    }
    const safeTargetName = path.basename(targetName)
    const targetFile = safeTargetName + ext
    const targetPath = path.join(this.photosPath, targetFile)
    await fsp.copyFile(sourcePath, targetPath)
    return 'photos/' + targetFile
  }

  private async extractWallpaperColors(
    _event: IpcMainInvokeEvent,
    imagePath: string
  ): Promise<{ hue: number; saturation: number; lightness: number; tertiaryHue: number } | null> {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
    const ext = path.extname(imagePath).toLowerCase()
    if (!allowedExts.includes(ext)) {
      throw new Error('Invalid file type for color extraction')
    }
    try {
      const palette = await Vibrant.from(imagePath).getPalette()
      const swatch = palette.Vibrant || palette.Muted || palette.DarkVibrant
      if (!swatch) return null
      const [h, s, l] = swatch.hsl
      const tertiarySwatch = palette.DarkMuted || palette.LightVibrant || palette.Muted
      const tertiaryHue = tertiarySwatch ? tertiarySwatch.hsl[0] * 360 : (h * 360 + 60) % 360
      return {
        hue: Math.round(h * 360 * 10) / 10,
        saturation: Math.round(s * 100 * 10) / 10,
        lightness: Math.round(l * 100 * 10) / 10,
        tertiaryHue: Math.round(tertiaryHue * 10) / 10
      }
    } catch (error) {
      log.error('Failed to extract wallpaper colors:', error)
      return null
    }
  }

  private async writeExportFile(
    _event: IpcMainInvokeEvent,
    filePath: string,
    content: string
  ): Promise<boolean> {
    this.assertAuthorized(filePath)
    await fsp.writeFile(filePath, content, 'utf-8')
    return true
  }
}
