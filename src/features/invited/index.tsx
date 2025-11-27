import { Main } from '@/components/layout/main'
import InvitedForm from '@/features/invited/components/invited-form'

export default function InvitedPage() {

  // useEffect(() => {
  //   if (!user?.is_onboard) {
  //     router.history.back()
  //   }
  // }, [user])

  return (
    <Main className='flex h-full items-center justify-center py-8'>
      <InvitedForm />
    </Main>
  )
}
