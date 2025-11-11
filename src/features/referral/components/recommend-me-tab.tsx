import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getRecommendMeStatus, validateInviteCode, bindInviteCode, type InviteCodeInfo } from '@/features/referral/api'

interface Props {
  isActive: boolean
}

export default function RecommendMeTab({ isActive }: Props) {
  const queryClient = useQueryClient()
  const [inviteCode, setInviteCode] = useState('')
  const [codeInfo, setCodeInfo] = useState<InviteCodeInfo | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // 获取推荐我的状态
  const { data: recommendStatus, isLoading } = useQuery({
    queryKey: ['recommend-me-status'],
    queryFn: getRecommendMeStatus,
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
    } catch (error) {
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
      // 刷新推荐我的状态
      queryClient.invalidateQueries({ queryKey: ['recommend-me-status'] })
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

  if (isLoading) {
    return (
      <Card className='border border-gray-200'>
        <CardContent className='space-y-4 p-6'>
          <p className='text-muted-foreground text-sm'>正在加载…</p>
        </CardContent>
      </Card>
    )
  }

  // 情况1: 自己注册的
  if (recommendStatus?.status === 'self_registered') {
    return (
      <Card className='border border-gray-200'>
        <CardContent className='space-y-4 p-6'>
          <div className='text-center'>
            <p className='text-foreground text-base'>您已经不需要被内推啦</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 情况2: 已经有推荐人
  if (recommendStatus?.status === 'already_recommended') {
    return (
      <Card className='border border-gray-200'>
        <CardContent className='space-y-4 p-6'>
          <div className='text-center'>
            <p className='text-foreground text-base'>
              你的推荐人是：
              <span className='ml-2 font-semibold'>
                {recommendStatus.referrer_name}（{recommendStatus.referrer_phone}）
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 情况3: 未被推荐，需要输入邀请码
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
                邀请人：{codeInfo.name}（{codeInfo.phone}）
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

