import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

const { ipcHandle, mockApp, mockShell } = vi.hoisted(() => ({
  ipcHandle: vi.fn(),
  mockApp: {
    setLoginItemSettings: vi.fn(),
    getLoginItemSettings: vi.fn(() => ({ openAtLogin: false }))
  },
  mockShell: { openExternal: vi.fn(async () => undefined) }
}))

vi.mock('electron', () => ({
  ipcMain: { handle: ipcHandle },
  app: mockApp,
  shell: mockShell
}))

import { SystemController } from './SystemController'

/**
 * 数据安全的最后防线：备份/恢复与回滚逻辑此前零测试。
 */

type Handler = (event: unknown, ...args: unknown[]) => Promise<unknown>

function handlers(): Map<string, Handler> {
  return new Map(ipcHandle.mock.calls.map(([channel, fn]) => [channel, fn as Handler]))
}

let tmpRoot: string
let dataPath: string

beforeEach(() => {
  ipcHandle.mockClear()
  mockShell.openExternal.mockClear()
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'stellarc-sys-ctl-'))
  dataPath = path.join(tmpRoot, 'data')
  fs.mkdirSync(dataPath, { recursive: true })
  fs.writeFileSync(
    path.join(dataPath, 'classes.json'),
    JSON.stringify({ classes: [{ id: 'c1', name: '一班', students: [] }] })
  )
  new SystemController(dataPath)
})

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true })
})

describe('SystemController 备份与恢复', () => {
  it('backup-data 在目标路径生成包含数据文件的 zip', async () => {
    const backupPath = path.join(tmpRoot, 'backup.zip')
    const ok = await handlers().get('backup-data')!(null, backupPath)

    expect(ok).toBe(true)
    expect(fs.existsSync(backupPath)).toBe(true)
    expect(fs.statSync(backupPath).size).toBeGreaterThan(0)
  })

  it('restore-data 用备份覆盖当前数据（含删除新增文件）', async () => {
    const backupPath = path.join(tmpRoot, 'backup.zip')
    await handlers().get('backup-data')!(null, backupPath)

    // 备份后修改现状：覆盖原文件 + 新增文件
    fs.writeFileSync(
      path.join(dataPath, 'classes.json'),
      JSON.stringify({ classes: [{ id: 'c2', name: '二班', students: [] }] })
    )
    fs.writeFileSync(path.join(dataPath, 'stray.json'), '{}')

    const ok = await handlers().get('restore-data')!(null, backupPath)

    expect(ok).toBe(true)
    const restored = JSON.parse(fs.readFileSync(path.join(dataPath, 'classes.json'), 'utf-8'))
    expect(restored.classes[0].id).toBe('c1')
    // 恢复以备份内容为准：备份之后新增的文件不应残留
    expect(fs.existsSync(path.join(dataPath, 'stray.json'))).toBe(false)
  })

  it('restore-data 失败时回滚：原数据完整保留', async () => {
    const before = fs.readFileSync(path.join(dataPath, 'classes.json'), 'utf-8')
    const brokenZip = path.join(tmpRoot, 'broken.zip')
    fs.writeFileSync(brokenZip, 'not a zip file')

    const ok = await handlers().get('restore-data')!(null, brokenZip)

    expect(ok).toBe(false)
    expect(fs.readFileSync(path.join(dataPath, 'classes.json'), 'utf-8')).toBe(before)
    // 临时目录已清理
    const leftovers = fs.readdirSync(tmpRoot).filter((name) => name.startsWith('temp_restore_'))
    expect(leftovers).toEqual([])
  })
})

describe('SystemController 开机自启动', () => {
  it('set-auto-launch 透传给 app.setLoginItemSettings', async () => {
    await handlers().get('set-auto-launch')!(null, true)
    expect(mockApp.setLoginItemSettings).toHaveBeenCalledWith(
      expect.objectContaining({ openAtLogin: true })
    )
  })

  it('get-auto-launch 读取当前状态', async () => {
    mockApp.getLoginItemSettings.mockReturnValueOnce({ openAtLogin: true })
    const result = await handlers().get('get-auto-launch')!(null)
    expect(result).toBe(true)
  })
})

describe('SystemController 外链白名单', () => {
  it('放行 http/https', async () => {
    await handlers().get('open-external')!(null, 'https://github.com/BeiChen-CN/Stellarc')
    expect(mockShell.openExternal).toHaveBeenCalledWith('https://github.com/BeiChen-CN/Stellarc')
  })

  it('拒绝 file: 等非 http(s) 协议', async () => {
    await expect(
      handlers().get('open-external')!(null, 'file:///C:/Windows/System32')
    ).rejects.toThrow()
    expect(mockShell.openExternal).not.toHaveBeenCalled()
  })
})
