import { useState, useCallback, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { IconUser, IconPhone, IconCheck, IconRosette } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateInviteCode, bindInviteCode, type InviteCodeInfo } from '@/features/referral/api'
import { fetchTalentMe } from '@/lib/api'

interface Props {
  isActive: boolean
  initialInviteCode?: string
}

export default function RecommendMeTab({ isActive, initialInviteCode }: Props) {
  const queryClient = useQueryClient()
  const [inviteCode, setInviteCode] = useState(initialInviteCode || '')
  const [codeInfo, setCodeInfo] = useState<InviteCodeInfo | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // 当 initialInviteCode 变化时，更新 inviteCode
  useEffect(() => {
    if (initialInviteCode) {
      setInviteCode(initialInviteCode)
    }
  }, [initialInviteCode])

  // 获取当前用户信息
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['talent-me'],
    queryFn: fetchTalentMe,
    enabled: isActive,
  })

  // 验证邀请码（防抖处理）
  const validateCode = useCallback(async (code: string) => {
    if (!code.trim()) {
      setCodeInfo(null)
      return
    }

    setIsValidating(true)
    try {
      const info = await validateInviteCode(code.trim())
      setCodeInfo(info)
    } catch (_error) {
      setCodeInfo(null)
      // 静默处理错误，UI 会显示找不到的状态
    } finally {
      setIsValidating(false)
    }
  }, [])

  // 防抖处理输入
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inviteCode.trim()) {
        validateCode(inviteCode)
      } else {
        setCodeInfo(null)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [inviteCode, validateCode])

  // 绑定邀请码
  const bindMutation = useMutation({
    mutationFn: bindInviteCode,
    onSuccess: () => {
      toast.success('邀请码绑定成功')
      // 清空输入
      setInviteCode('')
      setCodeInfo(null)
      // 刷新用户信息以显示推荐人
      queryClient.invalidateQueries({ queryKey: ['talent-me'] })
    },
    onError: () => {
      toast.error('邀请码绑定失败，请稍后重试')
    },
  })

  const handleBind = () => {
    if (!inviteCode.trim()) {
      toast.error('请输入邀请码')
      return
    }
    if (!codeInfo) {
      toast.error('请输入有效的邀请码')
      return
    }
    bindMutation.mutate(inviteCode.trim())
  }

  // 加载中状态
  if (isLoadingUser) {
    return (
      <Card className='border border-gray-200'>
        <CardContent className='space-y-4 p-6'>
          <p className='text-muted-foreground text-sm'>正在加载…</p>
        </CardContent>
      </Card>
    )
  }

  // 不需要被内推的状态（can_be_referred 为 false）
  if (currentUser?.can_be_referred === false) {
    return (
      <Card className='overflow-hidden border border-[#E0E7FF] bg-gradient-to-br from-[#F5F3FF] via-white to-[#FAF5FF] shadow-sm'>
        <CardContent className='p-8'>
          {/* 中心图标和文字 */}
          <div className='flex flex-col items-center justify-center space-y-4 text-center'>
            {/* 顶部装饰图标 */}
            <div className='relative'>
              <div className='absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-[#4E02E4] to-[#8B5CF6] opacity-20 blur-xl'></div>
              <div className='relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#4E02E4] to-[#8B5CF6] shadow-lg'>
                <IconRosette className='h-10 w-10 text-white' strokeWidth={2} />
              </div>
            </div>

            {/* 主标题 */}
            <div className='space-y-2'>
              <h3 className='text-xl font-bold text-gray-900'>
                您已经不需要被内推啦
              </h3>
            </div>

            {/* 装饰性分隔线 */}
            <div className='flex w-full max-w-xs items-center gap-3 pt-2'>
              <div className='h-px flex-1 bg-gradient-to-r from-transparent via-[#4E02E4]/30 to-transparent'></div>
              <div className='flex gap-1'>
                <div className='h-1.5 w-1.5 rounded-full bg-[#4E02E4]/40'></div>
                <div className='h-1.5 w-1.5 rounded-full bg-[#8B5CF6]/60'></div>
                <div className='h-1.5 w-1.5 rounded-full bg-[#4E02E4]/40'></div>
              </div>
              <div className='h-px flex-1 bg-gradient-to-r from-transparent via-[#4E02E4]/30 to-transparent'></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 已经绑定过内推码
  if (currentUser?.referred_by_code) {
    return (
      <Card className='overflow-hidden border border-[#E0E7FF] bg-gradient-to-br from-[#F5F3FF] via-white to-[#FAF5FF] shadow-sm'>
        <CardContent className='p-5'>
          {/* 顶部标题区 */}
          <div className='mb-3 flex items-center justify-center gap-2'>
            <div className='flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-[#4E02E4] to-[#8B5CF6]'>
              <IconCheck className='h-4 w-4 text-white' />
            </div>
            <div>
              <p className='text-base font-semibold text-gray-900'>已绑定推荐人</p>
              <p className='text-xs text-muted-foreground'>您已成功绑定内推码</p>
            </div>
          </div>

          {/* 推荐人信息卡片 */}
          <div className='space-y-2.5 rounded-xl border border-white/60 bg-white/80 p-3.5 shadow-sm backdrop-blur-sm'>
            {currentUser.referred_by_username || currentUser.referred_by_phone ? (
              <div className='space-y-2.5'>
                {currentUser.referred_by_username && (
                  <div className='flex items-center gap-2.5 rounded-lg bg-gradient-to-r from-[#4E02E4]/5 to-transparent p-2.5 transition-all hover:from-[#4E02E4]/10'>
                    <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#4E02E4] to-[#8B5CF6]'>
                      <IconUser className='h-4 w-4 text-white' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs text-muted-foreground'>用户名</p>
                      <p className='truncate text-sm font-medium text-gray-900'>
                        {currentUser.referred_by_username}
                      </p>
                    </div>
                  </div>
                )}
                
                {currentUser.referred_by_phone && (
                  <div className='flex items-center gap-2.5 rounded-lg bg-gradient-to-r from-[#4E02E4]/5 to-transparent p-2.5 transition-all hover:from-[#4E02E4]/10'>
                    <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#4E02E4] to-[#8B5CF6]'>
                      <IconPhone className='h-4 w-4 text-white' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs text-muted-foreground'>手机号</p>
                      <p className='truncate text-sm font-medium text-gray-900'>
                        {currentUser.referred_by_phone}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className='rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-3 text-center'>
                <p className='text-sm text-muted-foreground'>推荐人信息暂未完善</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // 未绑定，显示输入框
  return (
    <Card className='border border-gray-200'>
      <CardContent className='space-y-6 p-6'>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='invite-code'>邀请码</Label>
            <Input
              id='invite-code'
              placeholder='输入邀请码'
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              disabled={bindMutation.isPending}
            />
            {isValidating && (
              <p className='text-muted-foreground text-xs'>验证中...</p>
            )}
            {!isValidating && inviteCode.trim() && !codeInfo && (
              <p className='text-xs text-destructive'>无效的邀请码，请联系你的推荐人获取正确的邀请码</p>
            )}
            {!isValidating && codeInfo && (
              <p className='text-xs text-emerald-600'>
                邀请人：{codeInfo.name}
                {codeInfo.referrer_username && ` ${codeInfo.referrer_username}`}
              </p>
            )}
          </div>
          <Button
            onClick={handleBind}
            disabled={!codeInfo || bindMutation.isPending || isValidating}
            className='w-full'
          >
            {bindMutation.isPending ? '绑定中...' : '确认绑定邀请码'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

