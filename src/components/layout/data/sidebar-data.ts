import { IconBriefcase, IconId } from '@tabler/icons-react'
// removed team switching assets
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: '',
    email: '',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [],
  navGroups: [
    {
      title: '通用',
      items: [
        {
          title: '职位列表',
          url: '/jobs',
          icon: IconBriefcase,
        },
        {
          title: '我的简历',
          url: '/resume',
          icon: IconId,
        },
      ],
    },
  ],
}
