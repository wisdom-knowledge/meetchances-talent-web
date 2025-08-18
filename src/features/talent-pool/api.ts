import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from '@/lib/api'
import type { TalentItem } from './components/talent-table'

// 枚举：与后端数值枚举对齐
export enum RegistrationStatus {
  UNREGISTERED = 0,
  REGISTERED = 10,
}

export enum TalentStatusCode {
  INVITABLE = 0,
  LOCKED = 10,
}

export enum JobMatchStatus {
  UNREGISTERED = 0,
  INCOMPLETE_INTERVIEW = 10,
  INTERVIEWED = 20,
}

export enum MatchScoreStatus {
  NOT_COMPUTED = 0,
  COMPUTING = 10,
  SUCCESS = 20,
}

// 运行时校验 Schema（基于你提供的示例返回）
const ResumeListItemSchema = z.object({
  name: z.string().min(1),
  registration_status: z.nativeEnum(RegistrationStatus),
  talent_status: z.nativeEnum(TalentStatusCode),
  job_match_status: z.nativeEnum(JobMatchStatus).optional(),
  match_score_status: z.nativeEnum(MatchScoreStatus).optional(),
})

const ResumeListResponseSchema = z.object({
  data: z.array(ResumeListItemSchema),
  count: z.number(),
})

export interface TalentPoolQueryParams {
  skip?: number
  limit?: number
}

export interface TalentPoolQueryResult {
  data: TalentItem[]
  total?: number
}

function mapToTalentItem(item: z.infer<typeof ResumeListItemSchema>, index: number): TalentItem {
  const isRegistered = item.registration_status === RegistrationStatus.REGISTERED
  const talentStatus = item.talent_status === TalentStatusCode.LOCKED ? '锁定中' : '可邀请'
  return {
    id: index + 1, // 后端暂未提供唯一 id，这里使用索引占位
    name: item.name,
    isRegistered,
    talentStatus,
  }
}

export async function fetchTalentPool(params: TalentPoolQueryParams = {}): Promise<TalentPoolQueryResult> {
  // 若后端支持分页，按需传参（例如 { skip, limit } 或 { page, size }）
  const raw = await api.get('/headhunter/resume_list')
  const parsed = ResumeListResponseSchema.safeParse(raw)

  if (!parsed.success) {
    return { data: [] }
  }

  const { data, count } = parsed.data
  return {
    data: data.map(mapToTalentItem),
    total: count,
  }
}

export function useTalentPoolQuery(
  params: TalentPoolQueryParams = {},
  options?: UseQueryOptions<TalentPoolQueryResult>
) {
  return useQuery({
    queryKey: ['talent-pool', params],
    queryFn: () => fetchTalentPool(params),
    ...options,
  })
}


