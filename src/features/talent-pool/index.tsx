import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import TalentTable from './components/talent-table'
import { useTalentPoolQuery } from './api'

export default function TalentPoolPage() {
  const { data } = useTalentPoolQuery()
  const list = data?.data ?? []
  const total = data?.total ?? list.length
  const invitable = list.filter((i) => i.talentStatus === '可邀请').length

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

        <TalentTable data={list} />
      </Main>
    </>
  )
}


