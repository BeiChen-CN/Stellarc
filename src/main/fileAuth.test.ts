import { describe, expect, it } from 'vitest'
import { authorizePath, assertPathAuthorized } from './fileAuth'
import path from 'path'

/** 授权白名单 LRU 语义：容量上限 64，最久未使用的路径被淘汰 */

function pathAt(n: number): string {
  return path.join('C:', 'tmp', `f-${n}.csv`).replace(/\\/g, path.sep)
}

describe('fileAuth 授权白名单', () => {
  it('已授权路径放行，未授权路径拒绝', () => {
    const p = pathAt(1)
    expect(() => assertPathAuthorized(p)).toThrow('Access denied')
    authorizePath(p)
    expect(() => assertPathAuthorized(p)).not.toThrow()
  })

  it('路径经 normalize 后匹配（不同分隔符/点段视为同一路径）', () => {
    const base = pathAt(2)
    authorizePath(base)
    const dotted = path.join('C:', 'tmp', 'sub', '..', `f-2.csv`)
    expect(() => assertPathAuthorized(dotted)).not.toThrow()
  })

  it('重复授权同一路径会刷新其 LRU 新近度', () => {
    const keep = pathAt(3)
    authorizePath(keep)
    // 灌入 63 个使总量恰达容量上限（keep 最旧）
    for (let i = 10; i < 10 + 63; i++) authorizePath(pathAt(i))
    authorizePath(keep) // 刷新：keep 变为最新
    // 再灌入 63 个：被淘汰的是 refresh 前的 63 个旧路径，keep 应存活
    for (let i = 80; i < 80 + 63; i++) authorizePath(pathAt(i))
    expect(() => assertPathAuthorized(keep)).not.toThrow()
    expect(() => assertPathAuthorized(pathAt(10))).toThrow('Access denied')
  })

  it('超过容量上限后最旧路径被淘汰', () => {
    const first = pathAt(200)
    authorizePath(first)
    for (let i = 201; i < 201 + 64; i++) authorizePath(pathAt(i))
    expect(() => assertPathAuthorized(first)).toThrow('Access denied')
  })
})
