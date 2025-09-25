import { createFileRoute } from '@tanstack/react-router'
import MockInterviewPage from '@/features/mock-interview'

export const Route = createFileRoute('/_authenticated/mock-interview/')({
  validateSearch: (search: { page?: number; pageSize?: number; q?: string; category?: string }) => {
    return {
      page: typeof search?.page === 'number' && search.page > 0 ? search.page : 1,
      pageSize: typeof search?.pageSize === 'number' && search.pageSize > 0 ? search.pageSize : 12,
      q: typeof search?.q === 'string' ? search.q : '',
      category: typeof search?.category === 'string' ? search.category : undefined,
    }
  },
  component: () => <MockInterviewPage />,
})


