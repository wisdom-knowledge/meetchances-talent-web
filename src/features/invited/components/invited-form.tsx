import { useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { join } from 'lodash'
import {
  AcquistionChannel,
  PartTimeHours,
  useAuthStore,
} from '@/stores/authStore'
import { fetchChangeTalnet } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MonthPicker } from '@/components/month-picker'

const step1Schema = z.object({
  birthMonth: z.string().min(1, '请选择出生年月'),
  city: z.string().min(1, '请输入常驻地'),
  weeklyHours: z.string().min(1, '请输入每周可兼职工作时长'),
  source: z.string().min(1, '请选择来源'),
})

const step2Schema = z.object({
  skill1: z.string().min(1, '请输入技能一'),
  skill2: z.string().min(1, '请输入技能二'),
  skill3: z.string().min(1, '请输入技能三'),
})

type Step1Values = z.infer<typeof step1Schema>
type Step2Values = z.infer<typeof step2Schema>

export default function InvitedForm() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.auth.setUser)

  const [step, setStep] = useState<1 | 2>(1)

  const formStep1 = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { birthMonth: '', city: '', weeklyHours: '', source: '' },
    mode: 'onTouched',
  })

  const formStep2 = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: { skill1: '', skill2: '', skill3: '' },
    mode: 'onTouched',
  })

  const jobId = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('job_id') ?? ''
  }, [])

  const inviteToken = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('inviteToken') ?? ''
  }, [])

  const handleNext = async () => {
    const ok = await formStep1.trigger()
    if (!ok) return
    setStep(2)
  }

  const handleSubmitAll = async () => {
    const ok = await formStep2.trigger()
    if (!ok) return
    const payload = { ...formStep1.getValues(), ...formStep2.getValues() }
    fetchChangeTalnet({
      birth_month: payload.birthMonth,
      location: payload.city,
      part_time_hours: Number(payload.weeklyHours),
      acquisition_channel: Number(payload.source),
      top_skills: join([payload.skill1, payload.skill2, payload.skill3], ','),
    }).then((res) => {
      setUser({
        id: res.id,
        email: res.email,
        full_name: res.full_name,
        is_active: res.is_active,
        is_superuser: res.is_superuser,
        is_onboard: res.is_onboard,
        accountNo: res.full_name || res.email.split('@')[0],
      })
      navigate({
        to: '/interview/prepare',
        search: { job_id: Number(jobId), inviteToken: inviteToken },
      })
    })
  }

  return (
    <div className='mx-auto w-full max-w-[644px]'>
      <div className='mb-[36px]'>
        {step === 1 && (
          <h1 className='text-2xl font-bold tracking-tight text-[var(--color-blue-600)] md:text-3xl'>
            欢迎加入一面千识
          </h1>
        )}
        {step === 2 && (
          <>
            <h1 className='text-2xl font-bold tracking-tight text-[var(--color-blue-600)] md:text-3xl'>
              请告诉我们您最擅长的三个技能
            </h1>
            <p className='text-[16px]'>
              简历有限，才华无限。帮助我们找到更能发挥您长处的项目。
            </p>
          </>
        )}
      </div>

      {step === 1 && (
        <Form {...formStep1}>
          <form className='space-y-6'>
            <FormField
              control={formStep1.control}
              name='birthMonth'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>出生年月*</FormLabel>
                  <FormControl>
                    <MonthPicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder='请选择出生年月'
                      className='bg-[rgba(78,2,228,0.1)] text-[var(--color-blue-600)]'
                    />
                  </FormControl>
                  <FormDescription>请确保您已成年</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formStep1.control}
              name='city'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>常驻地*</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='请选择常住地'
                      className='bg-[rgba(78,2,228,0.1)] text-[var(--color-blue-600)]'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formStep1.control}
              name='weeklyHours'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>每周可兼职工作时长*</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className='w-full bg-[rgba(78,2,228,0.1)] text-[var(--color-blue-600)]'>
                        <SelectValue placeholder='请选择每周可兼职工作时长' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PartTimeHours.HOURS_0_5.toString()}>
                          0-5小时
                        </SelectItem>
                        <SelectItem value={PartTimeHours.HOURS_5_20.toString()}>
                          5-20小时
                        </SelectItem>
                        <SelectItem
                          value={PartTimeHours.HOURS_20_40.toString()}
                        >
                          20-40小时
                        </SelectItem>
                        <SelectItem
                          value={PartTimeHours.HOURS_40_PLUS.toString()}
                        >
                          40小时以上
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    以便后续平台推荐符合您时间要求的项目
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formStep1.control}
              name='source'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>您是如何得知我们的？*</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className='w-full bg-[rgba(78,2,228,0.1)] text-[var(--color-blue-600)]'>
                        <SelectValue placeholder='请选择' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value={AcquistionChannel.REFERRAL.toString()}
                        >
                          他人推荐
                        </SelectItem>
                        <SelectItem
                          value={AcquistionChannel.SOCIAL_MEDIA.toString()}
                        >
                          社交媒体
                        </SelectItem>
                        <SelectItem
                          value={AcquistionChannel.JOB_PLATFORM.toString()}
                        >
                          招聘软件
                        </SelectItem>
                        <SelectItem value={AcquistionChannel.OTHER.toString()}>
                          其他
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-center pt-2'>
              <Button
                type='button'
                onClick={handleNext}
                className='h-11 w-[226px] px-6'
              >
                下一步
              </Button>
            </div>
          </form>
        </Form>
      )}

      {step === 2 && (
        <Form {...formStep2}>
          <form className='space-y-6'>
            <FormField
              control={formStep2.control}
              name='skill1'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>技能一*</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='请填写相关技能'
                      className='bg-[rgba(78,2,228,0.1)] text-[var(--color-blue-600)]'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={formStep2.control}
              name='skill2'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>技能二*</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='请填写相关技能'
                      className='bg-[rgba(78,2,228,0.1)] text-[var(--color-blue-600)]'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={formStep2.control}
              name='skill3'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>技能三*</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='请填写相关技能'
                      className='bg-[rgba(78,2,228,0.1)] text-[var(--color-blue-600)]'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-center gap-3 pt-2'>
              {/* <Button type='button' variant='outline' className='h-11 px-6' onClick={() => setStep(1)}>上一步</Button> */}
              <Button
                type='button'
                className='h-11 px-6'
                onClick={handleSubmitAll}
              >
                开始使用一面千识
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}
