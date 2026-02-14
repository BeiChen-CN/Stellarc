import { describe, expect, it } from 'vitest'

import { detectSyncConflict } from './conflict'

describe('detectSyncConflict', () => {
  it('returns true when fingerprints differ and not forced', () => {
    expect(
      detectSyncConflict({
        localFingerprint: 'a',
        remoteFingerprint: 'b',
        force: false
      })
    ).toBe(true)
  })

  it('returns false when forced', () => {
    expect(
      detectSyncConflict({
        localFingerprint: 'a',
        remoteFingerprint: 'b',
        force: true
      })
    ).toBe(false)
  })

  it('returns false when fingerprints equal', () => {
    expect(
      detectSyncConflict({
        localFingerprint: 'same',
        remoteFingerprint: 'same',
        force: false
      })
    ).toBe(false)
  })
})
