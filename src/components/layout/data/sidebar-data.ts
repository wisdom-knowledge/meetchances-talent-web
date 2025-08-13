import { IconBriefcase } from '@tabler/icons-react'
// removed team switching assets
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
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
      ],
    },
  ],
}
