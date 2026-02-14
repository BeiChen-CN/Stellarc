import fs from 'fs'
import os from 'os'
import path from 'path'
import { describe, expect, it } from 'vitest'

import { runDataSelfCheck } from './selfCheck'

function createTempDataDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'stellarc-selfcheck-'))
}

describe('runDataSelfCheck', () => {
  it('creates missing core files and report', () => {
    const dataDir = createTempDataDir()
    const report = runDataSelfCheck(dataDir, '1.0.0')

    expect(report.summary.repaired).toBeGreaterThan(0)
    expect(fs.existsSync(path.join(dataDir, 'classes.json'))).toBe(true)
    expect(fs.existsSync(path.join(dataDir, 'history.json'))).toBe(true)
    expect(fs.existsSync(path.join(dataDir, 'settings.json'))).toBe(true)
    expect(fs.existsSync(path.join(dataDir, 'health-report.json'))).toBe(true)
  })

  it('repairs invalid currentClassId to first class', () => {
    const dataDir = createTempDataDir()
    fs.writeFileSync(
      path.join(dataDir, 'classes.json'),
      JSON.stringify({ classes: [{ id: 'c1', name: 'A', students: [] }], currentClassId: 'x' }),
      'utf-8'
    )
    fs.writeFileSync(path.join(dataDir, 'history.json'), JSON.stringify({ records: [] }), 'utf-8')
    fs.writeFileSync(path.join(dataDir, 'settings.json'), JSON.stringify({}), 'utf-8')

    runDataSelfCheck(dataDir, '1.0.0')
    const classes = JSON.parse(fs.readFileSync(path.join(dataDir, 'classes.json'), 'utf-8')) as {
      currentClassId: string
    }
    expect(classes.currentClassId).toBe('c1')
  })
})
