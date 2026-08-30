import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { runDataMigrations } from './index'

/**
 * 迁移编排层测试：此前只有 settings.v2 单个迁移函数有测试，
 * 编排（备份/写入/回滚/跳过）完全没有覆盖。
 */

let tmpRoot: string
let dataPath: string

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'stellarc-mig-'))
  dataPath = path.join(tmpRoot, 'data')
  fs.mkdirSync(dataPath, { recursive: true })
})

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true })
})

function writeRaw(name: string, content: string): void {
  fs.writeFileSync(path.join(dataPath, name), content, 'utf-8')
}

function readRaw(name: string): string {
  return fs.readFileSync(path.join(dataPath, name), 'utf-8')
}

describe('runDataMigrations 编排', () => {
  it('v1 数据成功迁移到 v2：内容保留 + _meta 写入 + 备份目录生成', () => {
    writeRaw(
      'classes.json',
      JSON.stringify([{ id: 'c1', name: '一班', students: [{ id: 's1', name: '张三' }] }])
    )
    writeRaw(
      'history.json',
      JSON.stringify({
        records: [
          {
            id: 'h1',
            timestamp: '2026-01-01T00:00:00.000Z',
            classId: 'c1',
            className: '一班',
            pickedStudents: [{ id: 's1', name: '张三' }]
          }
        ]
      })
    )
    writeRaw(
      'settings.json',
      JSON.stringify({
        colorTheme: 'm3-ocean',
        semester: { name: '2026 春', startDate: '2026-02-01', endDate: '2026-07-01' }
      })
    )

    const result = runDataMigrations(dataPath, '2.0.0')

    expect(result.success).toBe(true)
    expect(result.skipped).toBeFalsy()
    expect(fs.existsSync(result.backupPath)).toBe(true)

    const classes = JSON.parse(readRaw('classes.json'))
    expect(classes._meta.schemaVersion).toBe(2)
    expect(classes.classes[0].name).toBe('一班')

    // 用户数据（含此前会被 schema 剥离的 semester）迁移后不丢失
    const settings = JSON.parse(readRaw('settings.json'))
    expect(settings._meta.schemaVersion).toBe(2)
    expect(settings.colorTheme).toBe('ocean')
    expect(settings.semester).toEqual({
      name: '2026 春',
      startDate: '2026-02-01',
      endDate: '2026-07-01'
    })
    expect(settings.colorThemesExpanded).toBe(true)

    const state = JSON.parse(readRaw('migration-state.json'))
    expect(state.status).toBe('success')
  })

  it('已全部是 v2 时跳过迁移', () => {
    const v2 = JSON.stringify({ _meta: { schemaVersion: 2 }, classes: [] })
    writeRaw('classes.json', v2)
    writeRaw('history.json', JSON.stringify({ _meta: { schemaVersion: 2 }, records: [] }))
    writeRaw('settings.json', JSON.stringify({ _meta: { schemaVersion: 2 } }))

    const result = runDataMigrations(dataPath, '2.0.0')

    expect(result.success).toBe(true)
    expect(result.skipped).toBe(true)
  })

  it('迁移抛错时回滚：文件内容与迁移前一致，状态标记 failed', () => {
    writeRaw('classes.json', JSON.stringify([{ id: 'c1', name: '一班' }]))
    writeRaw('history.json', JSON.stringify({ records: [] }))
    // 结构能通过 readJsonFile，但会让 settings 迁移失败的内容
    writeRaw(
      'settings.json',
      JSON.stringify({ colorTheme: 'm3-ocean', revealSettleMs: 'not-a-number' })
    )

    const result = runDataMigrations(dataPath, '2.0.0')

    expect(result.success).toBe(false)
    expect(result.errorCode).toBeTruthy()
    const state = JSON.parse(readRaw('migration-state.json'))
    expect(state.status).toBe('failed')
    // 回滚后 classes.json 恢复为迁移前的原始内容（无 _meta）
    const classes = JSON.parse(readRaw('classes.json'))
    expect(classes._meta).toBeUndefined()
    expect(classes[0].id).toBe('c1')
  })

  it('数据文件缺失时按空数据迁移成功', () => {
    const result = runDataMigrations(dataPath, '2.0.0')
    expect(result.success).toBe(true)
    expect(JSON.parse(readRaw('settings.json'))._meta.schemaVersion).toBe(2)
  })
})
