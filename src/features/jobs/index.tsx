import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import JobsListContent from '@/features/jobs/components/jobs-list-content'

export default function JobsListPage() {
  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className='md:mx-16 py-0'>
        <JobsListContent />
      </Main>
    </>
  )
}

// const topNav = [
//   {
//     title: '职位列表',
//     href: '/jobs',
//     isActive: true,
//     disabled: false,
//   },
// ]
