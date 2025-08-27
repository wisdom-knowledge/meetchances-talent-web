import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from '@tanstack/react-router'

export function useTalent() {
  const talent = useAuthStore((s) => s.auth.talent)
  const navigate = useNavigate()

  useEffect(() => {
    if (!talent) return
    if(talent.is_onboard) {
        navigate({ to: '/invited' })
    }
  }, [talent])

  return {}
}
