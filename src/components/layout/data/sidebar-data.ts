import { IconBriefcase, IconId, IconHome, IconMicrophone, IconWallet } from '@tabler/icons-react'
import { IconListDetails } from '@tabler/icons-react'
// removed team switching assets
import { type SidebarData } from '../types'
// import { HeliIcon } from '@/assets/heli-icon'

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
          title: '模拟面试',
          url: '/mock-interview',
          icon: IconMicrophone,
          customBadge: {
            text: '免费练习',
            className: 'text-[#4E02E4] bg-[#EDE6FC]'
          },
        },
        {
          title: '我的简历',
          url: '/resume',
          icon: IconId,
        },
        // {
        //   title: '内推',
        //   url: '/referral',
        //   icon: HeliIcon,
        // },
        {
          title: '钱包',
          url: '/wallet',
          icon: IconWallet,
        },
        {
          title: '流程学习',
          url: '/study',
          icon: IconListDetails,
        },
      ],
    },
  ],
}

// 调用talentme接口失败后无需跳转的特殊处理页面
export const noTalentMeRoutes = ['/job-detail', '/jobs']
