import avatar01 from '@/assets/images/default-avatar/avatar-01.png'
import avatar02 from '@/assets/images/default-avatar/avatar-02.png'
import avatar03 from '@/assets/images/default-avatar/avatar-03.png'
import avatar04 from '@/assets/images/default-avatar/avatar-04.png'
import avatar05 from '@/assets/images/default-avatar/avatar-05.png'
import avatar06 from '@/assets/images/default-avatar/avatar-06.png'
import avatar07 from '@/assets/images/default-avatar/avatar-07.png'
import avatar08 from '@/assets/images/default-avatar/avatar-08.png'
import avatar09 from '@/assets/images/default-avatar/avatar-09.png'
import avatar10 from '@/assets/images/default-avatar/avatar-10.png'
import avatar11 from '@/assets/images/default-avatar/avatar-11.png'
import avatar12 from '@/assets/images/default-avatar/avatar-12.png'
import avatar13 from '@/assets/images/default-avatar/avatar-13.png'
import avatar14 from '@/assets/images/default-avatar/avatar-14.png'
import avatar15 from '@/assets/images/default-avatar/avatar-15.png'
import avatar16 from '@/assets/images/default-avatar/avatar-16.png'

const DEFAULT_AUTHING_AVATAR_URL = 'https://files.authing.co/authing-console/default-user-avatar.png'

const DEFAULT_AVATARS: string[] = [
  avatar01,
  avatar02,
  avatar03,
  avatar04,
  avatar05,
  avatar06,
  avatar07,
  avatar08,
  avatar09,
  avatar10,
  avatar11,
  avatar12,
  avatar13,
  avatar14,
  avatar15,
  avatar16,
]

export interface AvatarInput {
  userId?: number | null
  avatarUrl?: string | null
}

/**
 * 根据头像地址与用户 ID，返回实际用于展示的头像 URL。
 * - 当头像地址为 Authing 默认头像或为空时，使用 16 张内置默认头像之一
 * - 通过 userId 对 16 取模，选择稳定的默认头像
 */
export function getUserAvatarUrl({ userId, avatarUrl }: AvatarInput): string {
  const url = (avatarUrl || '').trim()
  const isDefaultAuthing = url === DEFAULT_AUTHING_AVATAR_URL

  if (!url || isDefaultAuthing) {
    const id = typeof userId === 'number' && userId >= 0 ? userId : 0
    const index = id % DEFAULT_AVATARS.length
    return DEFAULT_AVATARS[index]
  }

  return url
}

export { DEFAULT_AUTHING_AVATAR_URL }


