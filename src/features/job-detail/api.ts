import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface InviteInfoParams {
  token: string
}

type ApiInviteInfo = {
    headhunter_id?: number
    headhunter_name?: string
    job_id?: number
}

export async function fetchInviteInfo(params: InviteInfoParams): Promise<ApiInviteInfo> {
  const { token } = params
  const raw = await api.get(`/headhunter/invite_info/${token}`)
  return raw as ApiInviteInfo
}

export function useInviteInfoQuery(
  params: InviteInfoParams | null,
  options?: UseQueryOptions<ApiInviteInfo>
) {
  return useQuery({
    queryKey: ['inviteInfo', params],
    queryFn: () => fetchInviteInfo(params as InviteInfoParams),
    enabled: Boolean(params?.token),
    ...options,
  })
}