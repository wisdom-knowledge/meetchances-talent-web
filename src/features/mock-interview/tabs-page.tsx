import { useNavigate, useSearch } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import MockInterviewList from '@/features/mock-interview/components/mock-interview-list'
import MockInterviewRecords from '@/features/mock-interview/components/mock-interview-records'
import { MockInterviewTab, DEFAULT_MOCK_INTERVIEW_TAB } from '@/features/mock-interview/constants'
import { ProfileDropdown } from '@/components/profile-dropdown'
// import { useRuntimeEnv } from '@/hooks/use-runtime-env'

export default function MockInterviewTabsPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/_public/mock-interview/' })
  // const env = useRuntimeEnv()
  
  // 从 URL 参数获取当前 tab，如果为空则使用默认值
  const activeTab = search.tab || DEFAULT_MOCK_INTERVIEW_TAB

  // 自定义标签组件
  const CustomBadge = ({ 
    text, 
    icon, 
    className = '' 
  }: { 
    text: string
    icon?: string
    className?: string
  }) => (
    <div className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${className}`}>
      {icon && <img src={icon} alt="" className="h-3 w-3" />}
      <span>{text}</span>
    </div>
  )

  // 当 tab 改变时，更新 URL 参数
  const handleTabChange = (tab: string) => {
    navigate({
      to: '/mock-interview',
      search: { 
        ...search, 
        tab: tab === DEFAULT_MOCK_INTERVIEW_TAB ? undefined : tab 
      },
      replace: true,
    }).catch(() => {
      // 忽略导航错误
    })
  }

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className='pt-0 md:mx-16 md:p-0'>
        <Tabs value={activeTab} onValueChange={handleTabChange} className='flex-1 flex flex-col min-h-0'>
            <div className='flex border-b border-border shrink-0'>
              <button
                onClick={() => handleTabChange(MockInterviewTab.INTERVIEW)}
                className={`px-4 py-2 text-lg font-medium border-b-2 transition-colors ${
                  activeTab === MockInterviewTab.INTERVIEW
                    ? 'border-[#4E02E4] text-[#4E02E4]'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>模拟面试</span>
                  <CustomBadge 
                    text="免费练习"
                    className="text-[#4E02E4] bg-[#EDE6FC]"
                  />
                </div>
              </button>
              <button
                onClick={() => handleTabChange(MockInterviewTab.RECORDS)}
                className={`px-4 py-2 text-lg font-medium border-b-2 transition-colors ${
                  activeTab === MockInterviewTab.RECORDS
                    ? 'border-[#4E02E4] text-[#4E02E4]'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                我的记录
              </button>
            </div>

          <TabsContent value={MockInterviewTab.INTERVIEW} className='flex-1 flex flex-col mt-5 min-h-0'>
            <MockInterviewList />
          </TabsContent>

          <TabsContent value={MockInterviewTab.RECORDS} className='flex-1 flex flex-col mt-5 min-h-0'>
            <MockInterviewRecords />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
