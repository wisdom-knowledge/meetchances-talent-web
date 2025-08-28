import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'
import { Main } from '@/components/layout/main'
import InvitedForm from '@/features/invited/components/invited-form'

export default function InvitedPage() {
  const user = useAuthStore((s) => s.auth.user)
  const router = useRouter()

  useEffect(() => {
    if (user?.is_onboard) {
      router.history.back()
    }
  }, [router.history, user])

  return (
    <Main className='flex h-full items-center justify-center'>
      <InvitedForm />
    </Main>
  )
}
