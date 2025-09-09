import { IconBriefcase, IconId, IconHome } from '@tabler/icons-react'
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
      title: '',
      items: [
        {
          title: '主页',
          url: '/home',
          icon: IconHome,
        },
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
