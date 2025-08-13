import { IconBriefcase } from '@tabler/icons-react'
import { AudioWaveform, GalleryVerticalEnd } from 'lucide-react'
import AppLogo from '@/assets/app-logo'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Meetchances Talent',
      logo: AppLogo,
      plan: 'interview & apply job',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
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
