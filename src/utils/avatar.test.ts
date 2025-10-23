import { describe, it, expect } from 'vitest'
import { getUserAvatarUrl, DEFAULT_AUTHING_AVATAR_URL } from './avatar'

describe('getUserAvatarUrl', () => {
  it('returns placeholder when userId is undefined', () => {
    const url = getUserAvatarUrl({ userId: undefined, avatarUrl: null })
    expect(url).toBe('/avatars/shadcn.jpg')
  })

  it('returns placeholder when userId is null', () => {
    const url = getUserAvatarUrl({ userId: null, avatarUrl: '' })
    expect(url).toBe('/avatars/shadcn.jpg')
  })

  it('returns original avatarUrl when provided and not default authing', () => {
    const inputUrl = 'https://example.com/avatar.png'
    const url = getUserAvatarUrl({ userId: 1, avatarUrl: inputUrl })
    expect(url).toBe(inputUrl)
  })

  it('maps to one of 16 default images when avatarUrl is empty', () => {
    const url = getUserAvatarUrl({ userId: 5, avatarUrl: '' })
    expect(url).toMatch(/default-avatar\/avatar-(0[1-9]|1[0-6])\.png$/)
  })

  it('maps to same default image for same userId (stability check)', () => {
    const url1 = getUserAvatarUrl({ userId: 21, avatarUrl: '' })
    const url2 = getUserAvatarUrl({ userId: 21, avatarUrl: DEFAULT_AUTHING_AVATAR_URL })
    expect(url1).toEqual(url2)
  })

  it('uses modulo 16 mapping (e.g., userId 17 equals userId 1)', () => {
    const url1 = getUserAvatarUrl({ userId: 1, avatarUrl: '' })
    const url17 = getUserAvatarUrl({ userId: 17, avatarUrl: '' })
    expect(url1).toEqual(url17)
  })

  it('treats authing default avatar as empty and maps to default set', () => {
    const url = getUserAvatarUrl({ userId: 3, avatarUrl: DEFAULT_AUTHING_AVATAR_URL })
    expect(url).toMatch(/default-avatar\/avatar-(0[1-9]|1[0-6])\.png$/)
  })

  it('negative userId falls back to index 0 (avatar-01)', () => {
    const url = getUserAvatarUrl({ userId: -5 as unknown as number, avatarUrl: '' })
    expect(url.endsWith('default-avatar/avatar-01.png')).toBe(true)
  })
})


