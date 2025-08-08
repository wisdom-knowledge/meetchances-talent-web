import { createFileRoute } from '@tanstack/react-router'
import AnnotateReport from '@/features/annotate-report'

export const Route = createFileRoute('/_authenticated/annotate-report/')({
  component: AnnotateReport,
})


