import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import en from './locales/en.json'

/** i18n 资源完整性：en.json 必须可解析、键唯一、值非空（中文即键，en 只补英文） */
describe('i18n locales/en.json', () => {
  it('是合法 JSON 且非空', () => {
    expect(typeof en).toBe('object')
    expect(Object.keys(en).length).toBeGreaterThan(300)
  })

  it('所有值都是非空英文（无残留中文键值同体）', () => {
    const bad = Object.entries(en as Record<string, string>)
      .filter(([, v]) => !v.trim() || /[\u4e00-\u9fff]/.test(v))
      .map(([k]) => k)
    expect(bad).toEqual([])
  })

  it('插值占位符两侧一致（{{x}} 出现于键则值也有）', () => {
    const bad = Object.entries(en as Record<string, string>)
      .filter(([k, v]) => {
        const inKey = k.match(/\{\{(\w+)\}\}/g) || []
        return inKey.some((ph) => !v.includes(ph))
      })
      .map(([k]) => k)
    expect(bad).toEqual([])
  })

  it('键集合与渲染层使用的 i18next.t 键一致（防漂移）', () => {
    const rendererRoot = path.resolve(__dirname, '..')
    const walk = (dir: string): string[] =>
      fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap((e) =>
          e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name)
        )
    const files = walk(rendererRoot).filter(
      (f) => /\.(ts|tsx)$/.test(f) && !f.includes('i18n') && !f.endsWith('.test.ts')
    )
    const used = new Set<string>()
    for (const f of files) {
      const s = fs.readFileSync(f, 'utf-8')
      for (const m of s.matchAll(/i18next\.t\('([^']+)'/g)) {
        if (/[\u4e00-\u9fff]/.test(m[1])) used.add(m[1])
      }
    }
    const missing = [...used].filter((k) => !(k in (en as Record<string, string>)))
    expect(missing).toEqual([])
  })
})
