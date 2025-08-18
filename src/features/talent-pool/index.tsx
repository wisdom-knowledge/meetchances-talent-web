import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import TalentTable, { type TalentItem } from './components/talent-table'

const mockData: TalentItem[] = [
  { id: 1, name: '刘先', isRegistered: true, talentStatus: '可邀请' },
  { id: 2, name: '王冲', isRegistered: true, talentStatus: '锁定中' },
  { id: 3, name: '曾资文', isRegistered: false, talentStatus: '可邀请' },
  { id: 4, name: '耿盟', isRegistered: false, talentStatus: '可邀请' },
]

export default function TalentPoolPage() {
  const total = mockData.length
  const invitable = mockData.filter((i) => i.talentStatus === '可邀请').length

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='flex items-start justify-between'>
          <div className='space-y-0.5'>
            <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>我的人才库</h1>
            <p className='text-muted-foreground'>{total}人在库，{invitable}人可邀请</p>
          </div>
          <Button onClick={() => window.location.assign('/resume-upload')}>批量上传</Button>
        </div>
        <Separator className='my-4 lg:my-6' />

        <TalentTable data={mockData} />
      </Main>
    </>
  )
}


