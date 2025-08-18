import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import TalentTable, { type TalentItem } from '@/features/talent-pool/components/talent-table'
import { IconBriefcase, IconWorldPin } from '@tabler/icons-react'

const mockTalents: TalentItem[] = [
  { id: 1, name: '刘先', isRegistered: true, talentStatus: '可邀请' },
  { id: 2, name: '王冲', isRegistered: true, talentStatus: '锁定中' },
  { id: 3, name: '曾资文', isRegistered: false, talentStatus: '可邀请' },
]

export default function JobRecommendPage() {
  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>

        {/* 职位信息头部（来自 jobs 详情顶部区域） */}
        <div className='flex items-start justify-between border-b border-border py-5'>
          <div className='min-w-0 flex-1'>
            <div className='mb-2 truncate text-2xl font-bold leading-tight text-foreground'>资深软件工程师</div>
            <div className='mb-2 flex items-center gap-4 text-primary'>
              <div className='flex items-center'>
                <IconBriefcase className='mr-1 h-4 w-4' />
                <span className='text-[14px]'>时薪制</span>
              </div>
              <div className='flex items-center'>
                <IconWorldPin className='mr-1 h-4 w-4' />
                <span className='text-[14px]'>远程</span>
              </div>
            </div>
          </div>
          <div className='hidden min-w-[140px] flex-col items-end md:flex'>
            <div className='mb-1 text-xl font-semibold text-foreground'>¥160~¥400</div>
            <div className='mb-3 text-xs text-muted-foreground'>每小时</div>
            <div className='flex gap-2'>
            <Button variant='default'>推荐人才</Button>
            <Button variant='outline' onClick={() => window.location.assign('/resume-upload')}>添加简历</Button>
          </div>
          </div>
        </div>

        <div className='mt-6'>
          <TalentTable data={mockTalents} />
        </div>
      </Main>
    </>
  )
}


