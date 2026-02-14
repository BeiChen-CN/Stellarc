import { describe, expect, it } from 'vitest'

import { toFileUrl } from './utils'

describe('toFileUrl', () => {
  it('converts windows absolute path', () => {
    expect(toFileUrl('C:\\Data Folder\\bg image.png')).toBe(
      'local-file://C%3A%2FData%20Folder%2Fbg%20image.png'
    )
  })

  it('preserves existing file url without re-encoding', () => {
    expect(toFileUrl('file://C:/Data Folder/bg image.png')).toBe(
      'file://C:/Data Folder/bg image.png'
    )
  })

  it('converts relative raw input to local-file scheme', () => {
    expect(toFileUrl('photos/avatar.jpg')).toBe('local-file://photos%2Favatar.jpg')
  })
})
