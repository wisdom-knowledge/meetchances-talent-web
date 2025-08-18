import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { resumeSchema, type ResumeFormValues } from '@/features/resume/data/schema'
import DynamicBasicForm from '@/features/resume/components/dynamic-basic-form'
import DynamicWorkExperience from '@/features/resume/components/dynamic-work-experience'
import ResumeSection from '@/features/resume/components/resume-section'

type Props = { values: ResumeFormValues }

export default function TalentResumePreview({ values }: Props) {
  const form = useForm<ResumeFormValues>({ resolver: zodResolver(resumeSchema), defaultValues: values, mode: 'onChange' })

  return (
    <div className='space-y-10 faded-bottom h-full w-full overflow-y-auto scroll-smooth pr-4 pb-12 [overflow-anchor:none]'>
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
  )
}


