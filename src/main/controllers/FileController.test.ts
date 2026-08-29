import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

const { ipcHandle } = vi.hoisted(() => ({ ipcHandle: vi.fn() }))

vi.mock('electron', () => ({
  ipcMain: { handle: ipcHandle },
  IpcMainInvokeEvent: class {}
}))

import { FileController } from './FileController'
import { authorizePath } from '../fileAuth'

/**
 * 契约测试：BaseController 承诺「handler 抛出的异常向渲染端透传 rejection」。
 * 此前错误被吞成 {success:false} 返回值，渲染端把失败当成功数据使用
 * （导出假成功、照片路径脏写）。这组测试锁死该契约。
 */

type Handler = (event: unknown, ...args: unknown[]) => Promise<unknown>

function handlers(): Map<string, Handler> {
  return new Map(ipcHandle.mock.calls.map(([channel, fn]) => [channel, fn as Handler]))
}

let tmpDir: string

beforeEach(() => {
  ipcHandle.mockClear()
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stellarc-file-ctl-'))
  new FileController(tmpDir)
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('FileController IPC 错误契约', () => {
  it('注册了预期的通道', () => {
    const channels = [...handlers().keys()]
    expect(channels).toEqual(
      expect.arrayContaining([
        'read-json',
        'write-json',
        'read-file',
        'read-text-file',
        'copy-photo',
        'extract-wallpaper-colors',
        'write-export-file'
      ])
    )
  })

  it('read-json：文件不存在返回 null（不抛错）', async () => {
    const result = await handlers().get('read-json')!(null, 'classes.json')
    expect(result).toBeNull()
  })

  it('read-json：JSON 损坏向上抛错，不再静默吞成 null', async () => {
    fs.writeFileSync(path.join(tmpDir, 'classes.json'), '{broken json', 'utf-8')
    await expect(handlers().get('read-json')!(null, 'classes.json')).rejects.toThrow()
  })

  it('write-json：保留已存在的 _meta 元数据', async () => {
    fs.writeFileSync(
      path.join(tmpDir, 'classes.json'),
      JSON.stringify({ classes: [], _meta: { schemaVersion: 2 } }),
      'utf-8'
    )
    await handlers().get('write-json')!(null, 'classes.json', { classes: [{ id: 'c1' }] })
    const written = JSON.parse(fs.readFileSync(path.join(tmpDir, 'classes.json'), 'utf-8'))
    expect(written._meta).toEqual({ schemaVersion: 2 })
    expect(written.classes).toEqual([{ id: 'c1' }])
  })

  it('read-file：未经对话框授权的路径抛错', async () => {
    await expect(
      handlers().get('read-file')!(null, path.join(tmpDir, 'secret.txt'))
    ).rejects.toThrow('Access denied')
  })

  it('read-file：授权路径正常读取', async () => {
    const file = path.join(tmpDir, 'roster.txt')
    fs.writeFileSync(file, '张三,李四', 'utf-8')
    authorizePath(file)
    const result = (await handlers().get('read-file')!(null, file)) as Buffer
    expect(result.toString()).toBe('张三,李四')
  })

  it('write-export-file：未授权路径抛错（渲染端据此提示导出失败）', async () => {
    await expect(
      handlers().get('write-export-file')!(null, path.join(tmpDir, 'x.csv'), 'data')
    ).rejects.toThrow('Access denied')
  })

  it('write-export-file：授权路径写入成功', async () => {
    const file = path.join(tmpDir, 'out.csv')
    authorizePath(file)
    await handlers().get('write-export-file')!(null, file, 'a,b')
    expect(fs.readFileSync(file, 'utf-8')).toBe('a,b')
  })

  it('copy-photo：未授权来源抛错；非法扩展名抛错', async () => {
    const source = path.join(tmpDir, 'evil.exe')
    fs.writeFileSync(source, 'MZ', 'utf-8')
    await expect(handlers().get('copy-photo')!(null, source, 's1')).rejects.toThrow()

    const image = path.join(tmpDir, 'photo.png')
    fs.writeFileSync(image, 'png', 'utf-8')
    await expect(handlers().get('copy-photo')!(null, image, 's1')).rejects.toThrow('Access denied')
  })

  it('参数校验失败抛出 Invalid parameters', async () => {
    await expect(handlers().get('read-json')!(null, '')).rejects.toThrow('Invalid parameters')
  })
})
