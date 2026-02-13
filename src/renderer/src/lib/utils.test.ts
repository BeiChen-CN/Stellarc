import { describe, expect, it } from 'vitest'

import { toFileUrl } from './utils'

describe('toFileUrl', () => {
  it('converts windows absolute path', () => {
    expect(toFileUrl('C:\\Data Folder\\bg image.png')).toBe(
      'file://C:/Data%20Folder/bg%20image.png'
    )
  })

  it('preserves existing file url without re-encoding', () => {
    expect(toFileUrl('file://C:/Data Folder/bg image.png')).toBe(
      'file://C:/Data Folder/bg image.png'
    )
  })

  it('returns non-absolute raw input unchanged', () => {
    expect(toFileUrl('photos/avatar.jpg')).toBe('photos/avatar.jpg')
  })
})
