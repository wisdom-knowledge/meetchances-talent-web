import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { submitInterviewSupportDemand, type SupportDemandPayload } from '@/features/interview/api'

const formSchema = z.object({
  problem: z.string().min(1, '请说明您的问题'),
  // 兼容当前 zod 版本：第二参数仅支持 { message | error }
  contact: z.enum(['phone', 'none'], { error: '请选择反馈方式' }),
  phone: z.string().optional(),
}).refine((data) => {
  if (data.contact === 'phone') {
    return Boolean(data.phone && data.phone.trim().length >= 6)
  }
  return true
}, { message: '请输入有效手机号', path: ['phone'] })

type FormValues = z.infer<typeof formSchema>

interface SupportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (values: FormValues) => void
}

export function SupportDialog({ open, onOpenChange, onSubmit }: SupportDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { problem: '', contact: 'phone', phone: '' },
  })

  const handleSubmit = async (values: FormValues) => {
    onSubmit?.(values)
    const payload: SupportDemandPayload = {
      detail: values.problem,
      need_contact: values.contact !== 'none',
      phone_number: values.contact === 'phone' ? values.phone : undefined,
    }
    await submitInterviewSupportDemand(payload)
    onOpenChange(false)
    form.reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-left'>
          <DialogTitle>寻求支持</DialogTitle>
          <DialogDescription>请描述您的问题并选择我们如何反馈给您。</DialogDescription>
        </DialogHeader>
        <div className='-mr-4 max-h-[60vh] w-full overflow-y-auto py-1 pr-4'>
          <Form {...form}>
            <form id='support-form' onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4 p-0.5'>
              <FormField
                control={form.control}
                name='problem'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>请说明您的问题</FormLabel>
                    <FormControl>
                      <Textarea placeholder='说明您的问题' className='min-h-28' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='contact'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>您希望我们怎么反馈您？</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className='grid grid-cols-1 gap-3 sm:grid-cols-2'
                      >
                        <label className='flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-accent'>
                          <RadioGroupItem value='phone' />
                          <span>手机号（微信沟通）</span>
                        </label>
                        <label className='flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-accent'>
                          <RadioGroupItem value='none' />
                          <span>不要联系我</span>
                        </label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('contact') === 'phone' && (
                <FormField
                  control={form.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>手机号</FormLabel>
                      <FormControl>
                        <Input placeholder='请输入手机号' inputMode='tel' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='support-form'>提交</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


