import { Main } from '@/components/layout/main'
import InvitedForm from '@/features/invited/components/invited-form'

export default function InvitedPage() {

  // useEffect(() => {
  //   if (!user?.is_onboard) {
  //     router.history.back()
  //   }
  // }, [user])

  return (
    <Main className='flex-1 overflow-y-auto'>
      <InvitedForm />
    </Main>
  )
}
