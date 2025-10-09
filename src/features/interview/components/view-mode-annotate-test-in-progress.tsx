import { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { IconArrowRight } from '@tabler/icons-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { userEvent } from '@/lib/apm'
import { useJobApplyWorkflow, type JobApplyWorkflowNode } from '@/features/interview/api'

interface AnnotateTestPendingProps {
  onTaskSubmit: () => void
  jobApplyId?: number | null
  nodeData?: Record<string, unknown>
}

/**
 * 标注测试待完成视图
 * 引导用户前往 Xpert Studio 完成标注测试任务
 */
export function AnnotateTestInProgress({ nodeData, onTaskSubmit, jobApplyId }: AnnotateTestPendingProps) {
  const isMobile = useIsMobile()
  const [mobileTipOpen, setMobileTipOpen] = useState(false)
  const nodeConfig = nodeData?.node_config as { project_id?: number, batch_id?: number }
  const projectId = nodeConfig?.project_id
  const batchId = nodeConfig?.batch_id
  const domain = import.meta.env.VITE_XPERT_STUDIO_DOMAIN
  // https://studio-boe.xpertiise.com/projects/440/batch/960/tasklist
  const xpertStudioUrl = `${domain}/projects/${projectId}/batch/${batchId}/tasklist`

  // 通过 nodeData 反推出当前 job_apply_id 和当前 node_id 用于刷新
  const nodeId = useMemo(() => (nodeData?.id as number | undefined) ?? null, [nodeData])
  const { refetch: refetchProgress } = useJobApplyWorkflow(jobApplyId ?? null, Boolean(jobApplyId))

  const handleLinkClick: React.MouseEventHandler<HTMLAnchorElement> = useCallback(async (e) => {
    if (isMobile) {
      e.preventDefault()
      setMobileTipOpen(true)
      return
    }

    // 若 batchId 缺失，尝试重拉 workflow 再取 node_config
    if (!batchId || !projectId) {
      e.preventDefault()
      try {
        const res = await refetchProgress()
        const nodes = (res.data?.nodes ?? []) as JobApplyWorkflowNode[]
        const refreshed = nodes.find((n) => n.id === (nodeId as number)) as (JobApplyWorkflowNode & { node_config?: { project_id?: number; batch_id?: number } }) | undefined
        const refreshedCfg = refreshed?.node_config
        const pId = refreshedCfg?.project_id ?? projectId
        const bId = refreshedCfg?.batch_id ?? batchId
        if (pId && bId) {
          const url = `${domain}/projects/${pId}/batch/${bId}/tasklist`
          window.open(url, '_blank', 'noopener,noreferrer')
          return
        }
      } catch { /* ignore */ }

      // 二次仍无 batchId：上报并降级
      userEvent('annotate_batch_missing', '重拉后仍然缺少 batchId，降级跳转', {
        page: 'interview_prepare',
        job_apply_id: jobApplyId ?? undefined,
        node_id: nodeId ?? undefined,
      })
      const fallback = projectId ? `${domain}/projects/${projectId}/batch/` : `${domain}/projects/`
      window.open(fallback, '_blank', 'noopener,noreferrer')
      return
    }
  }, [isMobile, batchId, projectId, refetchProgress, nodeId, domain, jobApplyId])
  const handleSubmit = () => {
    // TODO: 实现提交审核逻辑
    toast.success('已提交审核')
    // TODO：调用接口查询试标任务状态的接口，如果任务状态为已完成，则调用 onTaskComplete 方法
    onTaskSubmit()
  }

  return (
    <div className='flex-1 flex items-center justify-center min-h-[60vh]'>
      <div className='flex flex-col items-center space-y-6 max-w-[520px] px-6'>
        {/* Logo 区域 */}
        <div className='flex items-center gap-6'>
          <div>
            <img
              src='https://dnu-cdn.xpertiise.com/design-assets/logo-no-padding.svg'
              alt='一面千识'
              className='h-[100px] w-auto object-contain'
            />
            <p className='text-sm py-2 text-center text-foreground leading-relaxed'>一面千识</p>
          </div>
          
          <IconArrowRight className='h-8 w-8 text-muted-foreground top-4' />
          <div>
            <img
              src='https://dnu-cdn.xpertiise.com/design-assets/logo-no-padding-blue.svg'
              alt='Xpert Studio'
              className='h-[100px] w-auto object-contain'
            />
            <p className='text-sm py-2 text-center text-foreground leading-relaxed'>Xpert Studio</p>
          </div>

        </div>

        {/* 说明文字 */}
        <div className='text-center space-y-4'>
          <p className='text-lg text-foreground leading-relaxed'>
            请点击链接前往{' '}
            <a
              href={xpertStudioUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary underline font-medium'
              onClick={handleLinkClick}
            >
              Xpert Studio
            </a>
            ，使用一面千识的注册手机号短信登陆后，完成项目下所有任务。确认完成后请点击下方按钮提交审核
          </p>
        </div>

        {/* 提交按钮 */}
        <Button
          onClick={handleSubmit}
          className='h-[44px] w-[200px] bg-[linear-gradient(90deg,#4E02E4_10%,#C994F7_100%)] text-white'
        >
          我已完成任务，提交审核
        </Button>

      </div>
      {/* 移动端提示弹窗 */}
      <Dialog open={mobileTipOpen} onOpenChange={setMobileTipOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>请通过电脑端打开链接</DialogTitle>
          </DialogHeader>
          <div className='text-sm text-muted-foreground'>
            为保证最佳体验与顺利完成任务，请在电脑端访问该链接。
          </div>
          <DialogFooter>
            <Button onClick={() => setMobileTipOpen(false)} className='w-full sm:w-auto'>
              我知道了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

