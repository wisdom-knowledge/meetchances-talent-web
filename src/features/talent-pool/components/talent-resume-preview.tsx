import { useForm, type FieldPath, type Resolver, type SubmitHandler } from 'react-hook-form'
import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { resumeSchema, type ResumeFormValues } from '@/features/resume/data/schema'
import DynamicBasicForm from '@/features/resume/components/dynamic-basic-form'
import DynamicWorkExperience from '@/features/resume/components/dynamic-work-experience'
import ResumeSection from '@/features/resume/components/resume-section'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

type InviteContext = {
  headhunterName?: string
  jobTitle?: string
  salaryMin?: number
  salaryMax?: number
  link?: string
}

type Props = { values: ResumeFormValues; inviteContext?: InviteContext; readOnly?: boolean; onSave?: (values: ResumeFormValues) => void; initialFocusField?: string }

export default function TalentResumePreview({ values, inviteContext, readOnly = true, onSave, initialFocusField }: Props) {
  const resolver = zodResolver(resumeSchema) as unknown as Resolver<ResumeFormValues>
  const form = useForm<ResumeFormValues>({ resolver, defaultValues: values as ResumeFormValues, mode: 'onChange' })
  const user = useAuthStore((s) => s.auth.user)

  // 当外部传入的简历值变化时，重置表单，避免保留上一次的内容
  useEffect(() => {
    form.reset(values as ResumeFormValues)
  }, [values, form])

  // 若传入初始聚焦字段，则触发校验并尝试聚焦
  useEffect(() => {
    if (!initialFocusField) return
    const unsub = setTimeout(() => {
      form.trigger().then(() => {
        try {
          // 优先使用 setFocus
          form.setFocus(initialFocusField as FieldPath<ResumeFormValues>, { shouldSelect: true })
        } catch {
          // 兜底：滚动到包含该字段名的元素
          const el = document.querySelector(`[name$="${CSS.escape(initialFocusField)}"]`) as HTMLElement | null
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el?.focus?.()
        }
      })
    }, 50)
    return () => clearTimeout(unsub)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFocusField])

  const headhunterName = useMemo(() => {
    if (inviteContext?.headhunterName) return inviteContext.headhunterName
    if (user?.accountNo && user.accountNo.trim()) return user.accountNo
    if (user?.email) return user.email.split('@')[0]
    return '猎头'
  }, [inviteContext?.headhunterName, user?.accountNo, user?.email])

  const jobTitle = inviteContext?.jobTitle ?? '岗位'
  const salaryMin = inviteContext?.salaryMin
  const salaryMax = inviteContext?.salaryMax
  const link = inviteContext?.link ?? 'https://talent.meetchances.com/'

  const handleCopyInvite = async () => {
    const x = salaryMin != null ? String(salaryMin) : ''
    const y = salaryMax != null ? String(salaryMax) : ''
    const text = `${headhunterName}邀请你参加${jobTitle}面试！时薪${x}～${y}元。在桌面端打开链接 ${link} 参与吧！`
    try {
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
      // ignore
    }
  }

  return (
    <>
      <div className='space-y-10 faded-bottom h-full w-full overflow-y-auto scroll-smooth pr-4 pb-28 [overflow-anchor:none]'>
        <ResumeSection id='section-basic' title='基本信息'>
          <Form {...form}>
            <form className='w-full space-y-6'>
              <DynamicBasicForm readOnly={readOnly} />
            </form>
          </Form>
        </ResumeSection>

        <ResumeSection variant='plain' id='section-experience' title='经历'>
          <Form {...form}>
            <DynamicWorkExperience sectionKey='workExperience' readOnly={readOnly} />
            <DynamicWorkExperience sectionKey='projectExperience' readOnly={readOnly} />
            <DynamicWorkExperience sectionKey='education' readOnly={readOnly} />
          </Form>
        </ResumeSection>

        <ResumeSection id='section-interests' title='兴趣与技能'>
          <Form {...form}>
            <form className='w-full space-y-6'>
              <DynamicBasicForm sectionKey='interests' readOnly={readOnly} />
            </form>
          </Form>
        </ResumeSection>

        <ResumeSection variant='plain' title='自我评价'>
          <Form {...form}>
            <form className='w-full space-y-6'>
              <DynamicBasicForm sectionKey='self' readOnly={readOnly} />
            </form>
          </Form>
        </ResumeSection>
      </div>
      {/* 吸底操作区 */}
      <div className='sticky bottom-0 left-0 right-0 z-10 -mb-10 pt-3 pb-3 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        {readOnly ? (
          <div className='flex justify-start'>
            <button
              type='button'
              onClick={handleCopyInvite}
              className='inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm font-medium shadow hover:opacity-90 disabled:opacity-60'
            >
              复制邀请文案
            </button>
          </div>
        ) : (
          <div className='flex justify-start'>
            <button
              type='button'
              onClick={() => {
                const handler: SubmitHandler<ResumeFormValues> = (vals) => { onSave?.(vals) }
                form.handleSubmit(handler)()
              }}
              className='inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm font-medium shadow hover:opacity-90 disabled:opacity-60'
            >
              保存更新
            </button>
          </div>
        )}
      </div>
    </>
  )
}


