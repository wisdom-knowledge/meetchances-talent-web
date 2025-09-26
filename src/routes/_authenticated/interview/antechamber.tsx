import { createFileRoute } from '@tanstack/react-router'
import AntechamberPage from '@/features/interview/antechamber'

export const Route = createFileRoute('/_authenticated/interview/antechamber')({
  component: AntechamberPage,
  staticData: { hideSidebar: true },
})


