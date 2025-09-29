import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { ProfileDropdown } from '@/components/profile-dropdown'
import MockInterviewList from '@/features/mock-interview/components/mock-interview-list'
import MockInterviewRecords from '@/features/mock-interview/components/mock-interview-records'

export default function MockInterviewTabsPage() {
  const [activeTab, setActiveTab] = useState('interview')

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='flex-1 flex flex-col min-h-0'>
          <div className='flex border-b border-border shrink-0'>
            <button
              onClick={() => setActiveTab('interview')}
              className={`px-4 py-2 text-lg font-medium border-b-2 transition-colors ${
                activeTab === 'interview'
                  ? 'border-[#4E02E4] text-[#4E02E4]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              模拟面试
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`px-4 py-2 text-lg font-medium border-b-2 transition-colors ${
                activeTab === 'records'
                  ? 'border-[#4E02E4] text-[#4E02E4]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              我的记录
            </button>
          </div>

          <TabsContent value='interview' className='flex-1 flex flex-col mt-5 min-h-0'>
            <MockInterviewList />
          </TabsContent>

          <TabsContent value='records' className='flex-1 flex flex-col mt-5 min-h-0'>
            <MockInterviewRecords />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
