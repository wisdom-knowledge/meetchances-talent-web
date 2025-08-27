import { useForm } from 'react-hook-form'
import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { resumeSchema, type ResumeFormValues } from '@/features/resume/data/schema'
import DynamicBasicForm from '@/features/resume/components/dynamic-basic-form'
import DynamicWorkExperience from '@/features/resume/components/dynamic-work-experience'
import ResumeSection from '@/features/resume/components/resume-section'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import { generateInviteToken, InviteTokenType } from '@/features/jobs/api'
import { useRouterState } from '@tanstack/react-router'

type InviteContext = {
  headhunterName?: string
  jobTitle?: string
  salaryMin?: number
  salaryMax?: number
  link?: string
}

type Props = { values: ResumeFormValues; inviteContext?: InviteContext }

export default function TalentResumePreview({ values, inviteContext }: Props) {
  const form = useForm<ResumeFormValues>({ resolver: zodResolver(resumeSchema), defaultValues: values, mode: 'onChange' })
  const user = useAuthStore((s) => s.auth.user)
  const [isCopying, setIsCopying] = useState(false)

  // 当外部传入的简历值变化时，重置表单，避免保留上一次的内容
  useEffect(() => {
    form.reset(values)
  }, [values, form])

  const headhunterName = useMemo(() => {
    if (inviteContext?.headhunterName) return inviteContext.headhunterName
    if (user?.accountNo && user.accountNo.trim()) return user.accountNo
    if (user?.email) return user.email.split('@')[0]
    return '猎头'
  }, [inviteContext?.headhunterName, user?.accountNo, user?.email])

  const jobTitle = inviteContext?.jobTitle ?? '岗位'
  const salaryMin = inviteContext?.salaryMin
  const salaryMax = inviteContext?.salaryMax
  const link = inviteContext?.link ?? 'https://talent.meetchances.com/job-detail'

  const { location } = useRouterState()
  const search = location.search as Record<string, unknown>
  const jobId = useMemo(() => {
    const v = search?.job_id
    if (typeof v === 'string') return Number.isNaN(Number(v)) ? v : Number(v)
    if (typeof v === 'number') return v
    return null
  }, [search])

  const handleCopyInvite = async () => {
    if (!jobId) {
      toast.error('缺少职位ID，无法生成邀请令牌')
      return
    }
    if (!user?.id) {
      toast.error('未登录或缺少用户ID，无法生成邀请令牌')
      return
    }

    setIsCopying(true)
    try {
      const inviteToken = await generateInviteToken({
        job_id: jobId,
        headhunter_id: user.id,
        token_type: InviteTokenType.HeadhunterRecommend,
      })
      if (!inviteToken) {
        toast.error('生成邀请令牌失败')
        return
      }

      let finalLink = link
      try {
        const url = new URL(link)
        url.searchParams.set('invite_token', inviteToken)
        finalLink = url.toString()
      } catch {
        const sep = link.includes('?') ? '&' : '?'
        finalLink = `${link}${sep}invite_token=${encodeURIComponent(inviteToken)}`
      }

      const x = salaryMin != null ? String(salaryMin) : ''
      const y = salaryMax != null ? String(salaryMax) : ''
      const text = `${headhunterName}邀请你参加${jobTitle}面试！时薪${x}～${y}元。在桌面端打开链接 ${finalLink} 参与吧！`

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      toast.success('复制成功')
    } catch {
      toast.error('操作失败，请稍后重试')
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <>
      <div className='space-y-10 faded-bottom h-full w-full overflow-y-auto scroll-smooth pr-4 pb-28 [overflow-anchor:none]'>
        <ResumeSection id='section-basic' title='基本信息'>
          <Form {...form}>
            <form className='w-full space-y-6'>
              <DynamicBasicForm readOnly />
            </form>
          </Form>
        </ResumeSection>

        <ResumeSection variant='plain' id='section-experience' title='经历'>
          <Form {...form}>
            <DynamicWorkExperience sectionKey='workExperience' readOnly />
            <DynamicWorkExperience sectionKey='projectExperience' readOnly />
            <DynamicWorkExperience sectionKey='education' readOnly />
          </Form>
        </ResumeSection>

        <ResumeSection id='section-interests' title='兴趣与技能'>
          <Form {...form}>
            <form className='w-full space-y-6'>
              <DynamicBasicForm sectionKey='interests' readOnly />
            </form>
          </Form>
        </ResumeSection>

        <ResumeSection variant='plain' title='自我评价'>
          <Form {...form}>
            <form className='w-full space-y-6'>
              <DynamicBasicForm sectionKey='self' readOnly />
            </form>
          </Form>
        </ResumeSection>
      </div>
      {/* 吸底操作区 */}
      <div className='sticky bottom-0 left-0 right-0 z-10 -mb-10 pt-3 pb-3 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='flex justify-start'>
          <button
            type='button'
            onClick={handleCopyInvite}
            className='inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm font-medium shadow hover:opacity-90 disabled:opacity-60'
            disabled={isCopying}
          >
            {isCopying ? '复制中…' : '复制邀请文案'}
          </button>
        </div>
      </div>
    </>
  )
}


