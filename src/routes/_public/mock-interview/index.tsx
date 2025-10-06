import { createFileRoute } from '@tanstack/react-router'
import MockInterviewTabsPage from '@/features/mock-interview/tabs-page'

type MockInterviewSearch = {
  page?: number
  pageSize?: number
  q?: string
  category?: string
  tab?: string
}
import { MOCK_INTERVIEW_TAB_VALUES } from '@/features/mock-interview/constants'

export const Route = createFileRoute('/_public/mock-interview/')({
  validateSearch: (search: MockInterviewSearch): MockInterviewSearch => {
    return {
      page: typeof search?.page === 'number' && search.page > 0 ? search.page : 1,
      pageSize: typeof search?.pageSize === 'number' && search.pageSize > 0 ? search.pageSize : 12,
      q: typeof search?.q === 'string' ? search.q : '',
      category: typeof search?.category === 'string' ? search.category : undefined,
      tab: typeof search?.tab === 'string' && MOCK_INTERVIEW_TAB_VALUES.includes(search.tab) ? search.tab : undefined,
    }
  },
  component: () => <MockInterviewTabsPage />,
})
