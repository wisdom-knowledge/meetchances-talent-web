import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Separator } from '@/components/ui/separator'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { IconListDetails, IconPlus, IconStar, IconUser, IconWand, IconUpload } from '@tabler/icons-react'

import { showSubmittedData } from '@/utils/show-submitted-data'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { resumeSchema, type ResumeFormValues } from './data/schema'
import { resumeMockData } from './data/mock'
import { options } from './data/config'
import SectionNav, { type SectionNavItem } from './components/section-nav'
import ResumeSection from './components/resume-section'

const CITY_OPTIONS = options.city

export default function ResumePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const rawGender = resumeMockData.structured_resume.basic_info.gender
  const defaultGender = options.gender.includes(
    rawGender as (typeof options.gender)[number]
  )
    ? (rawGender as (typeof options.gender)[number])
    : undefined

  const form = useForm<ResumeFormValues>({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      name: resumeMockData.structured_resume.basic_info.name ?? '',
      phone: resumeMockData.structured_resume.basic_info.phone ?? '',
      city: resumeMockData.structured_resume.basic_info.city ?? undefined,
      gender: defaultGender,
      email: resumeMockData.structured_resume.basic_info.email ?? '',
      origin: '',
      expectedSalary: '',
      hobbies: '',
      skills: '',
      workSkillName: '',
      workSkillLevel: undefined,
      softSkills: (resumeMockData.structured_resume.self_assessment.soft_skills ?? []).join('、'),
      selfEvaluation: resumeMockData.structured_resume.self_assessment.summary ?? '',
    },
    mode: 'onChange',
  })

  function onSubmit(values: ResumeFormValues) {
    showSubmittedData(values)
  }

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>我的简历</h1>
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
                        onChange={() => {
                          /* no-op for now */
                        }}
                      />
                      <Button
                        variant='outline'
                        onClick={() => fileInputRef.current?.click()}
                        className='h-10 px-4 py-2'
                      >
                        <IconUpload className='h-4 w-4' />
                        上传新简历
                      </Button>
                      <Button className='h-10 px-4 py-2' onClick={form.handleSubmit(onSubmit)}>
                        保存
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className='space-y-10 faded-bottom h-full w-full overflow-y-auto scroll-smooth pr-4 pb-12'>
                {/* 基本信息 */}
                <ResumeSection id='section-basic' title='基本信息'>
                  <Form {...form}>
                    <form className='w-full space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-start'>
                          <FormField
                            control={form.control}
                            name='name'
                            render={({ field }) => (
                              <FormItem className='w-full space-y-2'>
                                <FormLabel>姓名</FormLabel>
                                <FormControl>
                                  <Input placeholder='请输入姓名' disabled value={field.value ?? ''} readOnly />
                                </FormControl>
                                <div className='flex items-center gap-1'>
                                  <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='h-3 w-3 text-muted-foreground'>
                                    <path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'></path>
                                    <path d='m9 11 3 3L22 4'></path>
                                  </svg>
                                  <span className='text-xs text-muted-foreground'>已实名认证，不可修改</span>
                                </div>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name='gender'
                            render={({ field }) => (
                              <FormItem className='w-full space-y-2'>
                                <FormLabel>性别</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className='w-full h-9'>
                                      <SelectValue placeholder='请选择性别' />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value='男'>男</SelectItem>
                                    <SelectItem value='女'>女</SelectItem>
                                    <SelectItem value='其他'>其他</SelectItem>
                                    <SelectItem value='不愿透露'>不愿透露</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-start'>
                          <FormField
                            control={form.control}
                            name='phone'
                            render={({ field }) => (
                              <FormItem className='w-full space-y-2'>
                                <FormLabel>电话</FormLabel>
                                <FormControl>
                                  <Input placeholder='请输入电话号码' disabled value={field.value ?? ''} readOnly />
                                </FormControl>
                                <div className='flex items-center gap-1'>
                                  <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='h-3 w-3 text-muted-foreground'>
                                    <path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'></path>
                                    <path d='m9 11 3 3L22 4'></path>
                                  </svg>
                                  <span className='text-xs text-muted-foreground'>已验证，不可修改</span>
                                </div>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name='email'
                            render={({ field }) => (
                              <FormItem className='w-full space-y-2'>
                                <FormLabel>邮箱</FormLabel>
                                <FormControl>
                                  <Input type='email' placeholder='请输入邮箱地址' {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-start'>
                          <FormField
                            control={form.control}
                            name='city'
                            render={({ field }) => (
                              <FormItem className='w-full space-y-2'>
                                <FormLabel>所在城市</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className='w-full h-9'>
                                      <SelectValue placeholder='请选择所在城市' />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {CITY_OPTIONS.map((c) => (
                                      <SelectItem key={c} value={c}>
                                        {c}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name='origin'
                            render={({ field }) => (
                              <FormItem className='w-full space-y-2'>
                                <FormLabel>籍贯</FormLabel>
                                <FormControl>
                                  <Input placeholder='请输入籍贯' {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-start'>
                          <FormField
                            control={form.control}
                            name='expectedSalary'
                            render={({ field }) => (
                              <FormItem className='w-full space-y-2'>
                                <FormLabel>期望薪资/月</FormLabel>
                                <FormControl>
                                  <Input placeholder='例如：30000; 3万; 20k-40k' {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className='w-full space-y-2'></div>
                        </div>
                      </form>
                    </Form>
                </ResumeSection>

                {/* 经历 */}
                <ResumeSection variant='plain' id='section-experience' title='经历'>
                  {/* 工作经历 */}
                  <div className='mb-10'>
                    <div className='mb-6 flex items-center justify-between'>
                      <h3 className='text-lg leading-none'>工作经历</h3>
                      <Button variant='outline' className='h-9 rounded-md px-3'>
                        <IconPlus className='h-4 w-4' /> 添加工作经历
                      </Button>
                    </div>
                    <div className='space-y-6'>
                      <div className='border border-block-layout-border bg-block-layout text-block-layout-foreground p-6 shadow-xs rounded-lg'>
                        <div className='text-center py-10 text-gray-500'>
                          <span className='text-xs text-muted-foreground leading-none'>
                            暂无工作经历，点击上方按钮添加
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 项目经历 */}
                  <div className='mb-10'>
                    <div className='mb-6 flex items-center justify-between'>
                      <h3 className='text-lg leading-none'>项目经历</h3>
                      <Button variant='outline' className='h-9 rounded-md px-3'>
                        <IconPlus className='h-4 w-4' /> 添加项目经历
                      </Button>
                    </div>
                    <div className='space-y-6'>
                      <div className='border border-block-layout-border bg-block-layout text-block-layout-foreground p-6 shadow-xs rounded-lg'>
                        <div className='text-center py-10 text-gray-500'>
                          <span className='text-xs text-muted-foreground leading-none'>
                            暂无项目经历，点击上方按钮添加
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 教育经历 */}
                  <div className='mb-10'>
                    <div className='mb-6 flex items-center justify-between'>
                      <h3 className='text-lg leading-none'>教育经历</h3>
                      <Button variant='outline' className='h-9 rounded-md px-3'>
                        <IconPlus className='h-4 w-4' /> 添加教育经历
                      </Button>
                    </div>
                    <div className='space-y-6'>
                      <div className='border border-block-layout-border bg-block-layout text-block-layout-foreground p-6 shadow-xs rounded-lg'>
                        <div className='text-center py-10 text-gray-500'>
                          <span className='text-xs text-muted-foreground leading-none'>
                            暂无教育经历，点击上方按钮添加
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ResumeSection>

                {/* 附加资质 */}
                <ResumeSection variant='plain' id='section-qualifications' title='附加资质' className='space-y-10'>
                    {/* 奖励 */}
                    <div className='mb-10'>
                      <div className='mb-6 flex items-center justify-between'>
                        <h3 className='text-lg leading-none'>奖励</h3>
                        <Button variant='outline' className='h-9 rounded-md px-3'>
                          <IconPlus className='h-4 w-4' /> 添加奖励
                        </Button>
                      </div>
                      <div className='space-y-6'>
                        <div className='border border-block-layout-border bg-block-layout text-block-layout-foreground p-6 shadow-xs rounded-lg'>
                          <div className='text-center py-10 text-gray-500'>
                            <span className='text-xs text-muted-foreground leading-none'>
                              暂无奖励记录，点击上方按钮添加
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 论文发表 */}
                    <div className='mb-10'>
                      <div className='mb-6 flex items-center justify-between'>
                        <h3 className='text-lg leading-none'>论文发表</h3>
                        <Button variant='outline' className='h-9 rounded-md px-3'>
                          <IconPlus className='h-4 w-4' /> 添加论文发表
                        </Button>
                      </div>
                      <div className='space-y-6'>
                        <div className='border border-block-layout-border bg-block-layout text-block-layout-foreground p-6 shadow-xs rounded-lg'>
                          <div className='text-center py-10 text-gray-500'>
                            <span className='text-xs text-muted-foreground leading-none'>
                              暂无论文发表记录，点击上方按钮添加
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 代码仓库 */}
                    <div className='mb-10'>
                      <div className='mb-6 flex items-center justify-between'>
                        <h3 className='text-lg leading-none'>代码仓库</h3>
                        <Button variant='outline' className='h-9 rounded-md px-3'>
                          <IconPlus className='h-4 w-4' /> 添加代码仓库
                        </Button>
                      </div>
                      <div className='space-y-6'>
                        <div className='border border-block-layout-border bg-block-layout text-block-layout-foreground p-6 shadow-xs rounded-lg'>
                          <div className='text-center py-10 text-gray-500'>
                            <span className='text-xs text-muted-foreground leading-none'>
                              暂无代码仓库记录，点击上方按钮添加
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 专利 */}
                    <div className='mb-10'>
                      <div className='mb-6 flex items-center justify-between'>
                        <h3 className='text-lg leading-none'>专利</h3>
                        <Button variant='outline' className='h-9 rounded-md px-3'>
                          <IconPlus className='h-4 w-4' /> 添加专利
                        </Button>
                      </div>
                      <div className='space-y-6'>
                        <div className='border border-block-layout-border bg-block-layout text-block-layout-foreground p-6 shadow-xs rounded-lg'>
                          <div className='text-center py-10 text-gray-500'>
                            <span className='text-xs text-muted-foreground leading-none'>
                              暂无专利记录，点击上方按钮添加
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 社交媒体 */}
                    <div className='mb-10'>
                      <div className='mb-6 flex items-center justify-between'>
                        <h3 className='text-lg leading-none'>社交媒体</h3>
                        <Button variant='outline' className='h-9 rounded-md px-3'>
                          <IconPlus className='h-4 w-4' /> 添加社交媒体
                        </Button>
                      </div>
                      <div className='space-y-6'>
                        <div className='border border-block-layout-border bg-block-layout text-block-layout-foreground p-6 shadow-xs rounded-lg'>
                          <div className='text-center py-10 text-gray-500'>
                            <span className='text-xs text-muted-foreground leading-none'>
                              暂无社交媒体记录，点击上方按钮添加
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                </ResumeSection>

                {/* 兴趣与技能 */}
                <ResumeSection id='section-interests' title='兴趣与技能'>
                  <Form {...form}>
                    <form className='w-full space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
                        <div className='grid grid-cols-1 gap-6'>
                          <FormField
                            control={form.control}
                            name='hobbies'
                            render={({ field }) => (
                              <FormItem className='w-full space-y-2'>
                                <FormLabel>兴趣爱好</FormLabel>
                                <div className='flex min-h-9 w-full flex-wrap gap-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors placeholder:text-muted-foreground focus-within:ring-1 focus-within:ring-ring'>
                                  <input
                                    type='text'
                                    placeholder='例如：阅读、旅行、摄影、编程...'
                                    className='flex-1 min-w-0 border-0 bg-transparent outline-none placeholder:text-muted-foreground'
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                  />
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name='skills'
                            render={({ field }) => (
                              <FormItem className='w-full space-y-2'>
                                <FormLabel>技能</FormLabel>
                                <div className='flex min-h-9 w-full flex-wrap gap-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors placeholder:text-muted-foreground focus-within:ring-1 focus-within:ring-ring'>
                                  <input
                                    type='text'
                                    placeholder='例如：JavaScript、Python、UI设计...'
                                    className='flex-1 min-w-0 border-0 bg-transparent outline-none placeholder:text-muted-foreground'
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                  />
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </form>
                    </Form>
                </ResumeSection>

                {/* 工作技能 */}
                <ResumeSection id='section-self' title='工作技能'>
                  <Form {...form}>
                    <form className='w-full space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <FormField
                            control={form.control}
                            name='workSkillName'
                            render={({ field }) => (
                              <FormItem className='w-full space-y-2'>
                                <FormLabel>技能名称</FormLabel>
                                <FormControl>
                                  <Input placeholder='例如：前端开发' {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        {/* <FormField
                            control={form.control}
                            name='workSkillLevel'
                            render={({ field }) => (
                              <FormItem className='w-full space-y-2'>
                                <FormLabel>熟练程度</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className='w-full h-9'>
                                      <SelectValue placeholder='请选择熟练程度' />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value='初级'>初级</SelectItem>
                                    <SelectItem value='中级'>中级</SelectItem>
                                    <SelectItem value='高级'>高级</SelectItem>
                                    <SelectItem value='专家'>专家</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          /> */}
                        </div>

                        <div className='grid grid-cols-1 gap-4'>
                          <FormField
                            control={form.control}
                            name='softSkills'
                            render={({ field }) => (
                              <FormItem className='w-full space-y-2'>
                                <FormLabel>软技能</FormLabel>
                                <div className='flex min-h-9 w-full flex-wrap gap-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors placeholder:text-muted-foreground focus-within:ring-1 focus-within:ring-ring'>
                                  <input
                                    type='text'
                                    placeholder='例如：团队协作、沟通能力、项目管理...'
                                    className='flex-1 min-w-0 border-0 bg-transparent outline-none placeholder:text-muted-foreground'
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                  />
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </form>
                    </Form>
                </ResumeSection>

                {/* 自我评价 */}
                <ResumeSection variant='plain' title='自我评价'>
                  <Form {...form}>
                    <form className='w-full space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField
                          control={form.control}
                          name='selfEvaluation'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea rows={6} placeholder='请输入自我评价...' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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


