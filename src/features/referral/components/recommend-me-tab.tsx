import { useState, useCallback, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateInviteCode, bindInviteCode, type InviteCodeInfo } from '@/features/referral/api'
import { fetchTalentMe } from '@/lib/api'

interface Props {
  isActive: boolean
}

export default function RecommendMeTab({ isActive }: Props) {
  const queryClient = useQueryClient()
  const [inviteCode, setInviteCode] = useState('')
  const [codeInfo, setCodeInfo] = useState<InviteCodeInfo | null>(null)
  const [isValidating, setIsValidating] = useState(false)

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

  // 已经绑定过内推码
  if (currentUser?.referred_by_code) {
    return (
      <Card className='border border-gray-200'>
        <CardContent className='space-y-4 p-6'>
          <div className='text-center'>
            <p className='text-foreground text-base'>
              你的推荐人是：
              <span className='ml-2 font-semibold'>
                {currentUser.referrer_name || ''}
                {currentUser.referrer_username ? ` ${currentUser.referrer_username}` : ''}
              </span>
            </p>
            {currentUser.referrer_phone && (
              <p className='text-muted-foreground mt-2 text-sm'>
                手机号：{currentUser.referrer_phone}
              </p>
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
              <p className='text-xs text-destructive'>查不到该邀请码</p>
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
            {bindMutation.isPending ? '绑定中...' : '确认绑定内推码'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

