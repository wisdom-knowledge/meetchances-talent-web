import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Resolver, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import { IconListDetails, IconStar, IconUser, IconWand, IconUpload, IconLoader2 } from '@tabler/icons-react'

// import { showSubmittedData } from '@/utils/show-submitted-data'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { resumeSchema, type ResumeFormValues } from './data/schema'
import { resumeMockData } from './data/mock'
import { options } from './data/config'
import { fetchTalentResumeDetail, patchTalentResumeDetail, uploadTalentResume } from '@/features/resume-upload/utils/api'
import { mapStructInfoToResumeFormValues, mapResumeFormValuesToStructInfo } from '@/features/resume/data/struct-mapper'
import type { StructInfo } from '@/features/resume-upload/types/struct-info'
import { toast } from 'sonner'
// import { options } from './data/config'
import SectionNav, { type SectionNavItem } from './components/section-nav'
import DynamicBasicForm from './components/dynamic-basic-form'
import DynamicWorkExperience from './components/dynamic-work-experience'
import ResumeSection from './components/resume-section'

export default function ResumePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  // 性别默认值为空，由用户选择或后端数据填充
  const defaultGender = undefined

  const form = useForm<ResumeFormValues>({
    resolver: zodResolver(resumeSchema) as unknown as Resolver<ResumeFormValues>,
    defaultValues: {
      name: '',
      phone: '',
      city: undefined,
      gender: defaultGender,
      email: '',
      origin: '',
      expectedSalary: '',
      hobbies: '',
      skills: '',
      workSkills: [],
      softSkills: '',
      selfEvaluation: '',
      workExperience: [],
      projectExperience: [],
      education: [
        {
          institution: '',
          major: '',
          degreeType: '',
          degreeStatus: '',
          city: undefined,
          startDate: '',
          endDate: '',
          achievements: undefined,
        },
      ],
      awards: [],
      publications: [],
      repositories: [],
      patents: [],
      socialMedia: [],
    },
    mode: 'onChange',
  })

  // 确保教育经历至少一条（本页面为可编辑场景，进入/回显/上传后统一兜底）
  function ensureEducation(values: ResumeFormValues): ResumeFormValues {
    const hasEdu = Array.isArray(values.education) && values.education.length > 0
    if (hasEdu) return values
    return {
      ...values,
      education: [
        {
          institution: '',
          major: '',
          degreeType: '',
          degreeStatus: '',
          city: undefined,
          startDate: '',
          endDate: '',
          achievements: undefined,
        },
      ],
    }
  }

  const [uploadingResume, setUploadingResume] = useState(false)

  // 从接口获取简历详情并回显
  const { data: resumeDetail } = useQuery({
    queryKey: ['talent', 'resume_detail'],
    queryFn: fetchTalentResumeDetail,
  })

  useEffect(() => {
    const si = (resumeDetail?.item?.backend?.struct_info ?? null) as StructInfo | null
    if (si) {
      const mapped = mapStructInfoToResumeFormValues(si)
      form.reset(ensureEducation({ ...form.getValues(), ...mapped }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeDetail?.item?.backend?.struct_info])

  // 开发调试：将 mock 数据映射为表单值
  function mapMockToFormValues(): ResumeFormValues {
    const rawGender = resumeMockData.structured_resume.basic_info.gender as (typeof options.gender)[number] | null
    const gender = options.gender.includes(rawGender as (typeof options.gender)[number])
      ? (rawGender as (typeof options.gender)[number])
      : undefined

    return {
      name: resumeMockData.structured_resume.basic_info.name ?? '',
      phone: resumeMockData.structured_resume.basic_info.phone ?? '',
      city: (resumeMockData.structured_resume.basic_info.city as string | null) ?? undefined,
      gender,
      email: resumeMockData.structured_resume.basic_info.email ?? '',
      origin: '',
      expectedSalary: '',
      hobbies: '',
      skills: '',
      workSkills: [],
      softSkills: (resumeMockData.structured_resume.self_assessment.soft_skills ?? []).join('、'),
      selfEvaluation: resumeMockData.structured_resume.self_assessment.summary ?? '',
      workExperience:
        (resumeMockData.structured_resume.experience.work_experience ?? []).map((w) => ({
          organization: w.organization ?? '',
          title: w.title ?? '',
          startDate: w.start_date ?? '',
          endDate: w.end_date ?? '',
          city: (w.city as string | null) ?? '',
          employmentType: (w.employment_type as string | null) ?? '',
          achievements: (w.achievements ?? []).join('\n'),
        })),
      projectExperience:
        (resumeMockData.structured_resume.experience.project_experience ?? []).map((p) => ({
          organization: p.organization ?? '',
          role: p.role ?? '',
          startDate: p.start_date ?? '',
          endDate: p.end_date ?? '',
          achievements: (p.achievements ?? []).join('\n'),
        })),
      education:
        (resumeMockData.structured_resume.experience.education ?? []).map((e) => ({
          institution: e.institution ?? '',
          major: e.major ?? '',
          degreeType: e.degree_type ?? '',
          degreeStatus: (e.degree_status as string | null) ?? '',
          city: (e.city as string | null) ?? '',
          startDate: e.start_date ?? '',
          endDate: e.end_date ?? '',
          achievements: e.achievements
            ? Array.isArray(e.achievements)
              ? e.achievements.join('\n')
              : String(e.achievements)
            : '',
        })),
    }
  }

  // experiences 由动态组件内部管理；此处不需要声明

  // 上传新简历并回显
  async function handleResumeFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingResume(true)
      const fd = new FormData()
      fd.append('file', file)
      const res = await uploadTalentResume(fd)
      const first = res.data?.[0]
      const si = (first?.backend?.struct_info ?? null) as StructInfo | null
      if (si) {
        const mapped = mapStructInfoToResumeFormValues(si)
        form.reset(ensureEducation({ ...form.getValues(), ...mapped }))
        toast.success('上传成功')
      } else {
        const msg = res.statusMsg || first?.error || '上传失败'
        toast.error(msg)
      }
    } finally {
      // 清空选择，便于下次重新选择同名文件
      e.target.value = ''
      setUploadingResume(false)
    }
  }

  async function onSubmit(values: unknown) {
    const struct = mapResumeFormValuesToStructInfo(values as ResumeFormValues)
    const res = await patchTalentResumeDetail(struct as unknown as StructInfo)
    if (res.success) {
      toast.success('保存成功')
    } else {
      toast.error('保存失败')
    }
  }

  // 仅开发环境暴露：一键填充 mock 数据，便于调试
  const isDev = import.meta.env.DEV
  function fillWithMock() {
    if (!isDev) return
    const mockValues = mapMockToFormValues()
    form.reset(mockValues)
  }

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
        </div>
      </Header>

      <Main fixed>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl mb-2'>我的简历</h1>
          <p className='text-muted-foreground'>完善你的基本信息与经历，便于精准匹配项目。</p>
        </div>
        <Separator className='my-4 lg:my-6' />

        <div className='flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <aside className='top-0 lg:sticky lg:w-1/5'>
            <SectionNav
              items={[
                { id: 'section-basic', title: '基本信息', icon: <IconUser size={18} /> },
                { id: 'section-experience', title: '经历', icon: <IconListDetails size={18} /> },
                { id: 'section-qualifications', title: '附加资质', icon: <IconStar size={18} /> },
                { id: 'section-interests', title: '兴趣与技能', icon: <IconWand size={18} /> },
                { id: 'section-self', title: '自我评价', icon: <IconWand size={18} /> },
              ] satisfies SectionNavItem[]}
            />
          </aside>

          <div className='flex w-full overflow-y-hidden p-1'>
            <div className='w-full pb-24'>
              {/* 上传按钮 */}
              <div className='w-full mb-6'>
                <div className='flex items-center justify-between'>
                  <div className='flex-1' />
                  <div className='flex items-center gap-2'>
                    <div className='flex gap-2'>
                      <input
                        ref={fileInputRef}
                        type='file'
                        className='hidden'
                        accept='.pdf,.doc,.docx,.md,.txt'
                        aria-label='上传简历文件'
                        title='上传简历文件'
                        onChange={handleResumeFileChange}
                      />
                      <Button
                        variant='outline'
                        onClick={() => !uploadingResume && fileInputRef.current?.click()}
                        className='h-10 px-4 py-2'
                        disabled={uploadingResume}
                      >
                        {uploadingResume ? (
                          <>
                            <IconLoader2 className='h-4 w-4 animate-spin' /> 正在上传…
                          </>
                        ) : (
                          <>
                            <IconUpload className='h-4 w-4' /> 上传新简历
                          </>
                        )}
                      </Button>
                      {isDev && (
                        <Button variant='outline' className='h-10 px-4 py-2' onClick={fillWithMock}>
                          用 Mock 数据填充
                        </Button>
                      )}
                      <Button className='h-10 px-4 py-2' onClick={form.handleSubmit(onSubmit)} disabled={uploadingResume}>
                        保存
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div ref={scrollContainerRef} className='space-y-10 faded-bottom h-full w-full overflow-y-auto scroll-smooth pr-4 pb-12 [overflow-anchor:none]'>
                {/* 基本信息 */}
                <ResumeSection id='section-basic' title='基本信息'>
                  <Form {...form}>
                    <form className='w-full space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
                      <DynamicBasicForm scrollContainerRef={scrollContainerRef} />
                    </form>
                  </Form>
                </ResumeSection>

                {/* 经历 */}
                <ResumeSection variant='plain' id='section-experience' title='经历'>
                  <Form {...form}>
                  {/* 工作经历（配置驱动） */}
                  <DynamicWorkExperience sectionKey='workExperience' scrollContainerRef={scrollContainerRef} />

                  {/* 项目经历（配置驱动） */}
                  <DynamicWorkExperience sectionKey='projectExperience' scrollContainerRef={scrollContainerRef} />

                  {/* 教育经历（配置驱动） */}
                  <DynamicWorkExperience sectionKey='education' scrollContainerRef={scrollContainerRef} />
                  </Form>
                </ResumeSection>

                {/* 附加资质（配置驱动） */}
                <ResumeSection variant='plain' id='section-qualifications' title='附加资质' className='space-y-10'>
                  <Form {...form}>
                    <DynamicWorkExperience sectionKey='awards' scrollContainerRef={scrollContainerRef} />
                    <DynamicWorkExperience sectionKey='publications' scrollContainerRef={scrollContainerRef} />
                    <DynamicWorkExperience sectionKey='repositories' scrollContainerRef={scrollContainerRef} />
                    <DynamicWorkExperience sectionKey='patents' scrollContainerRef={scrollContainerRef} />
                    <DynamicWorkExperience sectionKey='socialMedia' scrollContainerRef={scrollContainerRef} />
                  </Form>
                </ResumeSection>

                {/* 兴趣与技能（配置驱动） */}
                <ResumeSection id='section-interests' title='兴趣与技能'>
                  <Form {...form}>
                    <form className='w-full space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
                      <DynamicBasicForm sectionKey='interests' scrollContainerRef={scrollContainerRef} />
                      </form>
                    </Form>
                </ResumeSection>

                {/* 工作技能（配置驱动，可手动添加） */}
                <ResumeSection variant='plain' id='section-self' title='工作技能'>
                  <Form {...form}>
                    <form className='w-full space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
                      <DynamicWorkExperience sectionKey='workSkills' scrollContainerRef={scrollContainerRef} />
                      {/* 软技能标签（仍然配置化） */}
                      <DynamicBasicForm sectionKey='workSkills' scrollContainerRef={scrollContainerRef} />
                      </form>
                    </Form>
                </ResumeSection>

                {/* 自我评价（配置驱动） */}
                <ResumeSection variant='plain' title='自我评价'>
                  <Form {...form}>
                    <form className='w-full space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
                      <DynamicBasicForm sectionKey='self' />
                      </form>
                    </Form>
                </ResumeSection>
              </div>
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}


