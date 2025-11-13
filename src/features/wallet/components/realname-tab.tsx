import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

interface RealNameVerification {
  isVerified: boolean
  fullName?: string
  idNumber?: string
}

const realNameFormSchema = z.object({
  fullName: z.string().trim().min(2, '请输入正确的真实姓名').max(30, '真实姓名长度不能超过30个字符'),
  idNumber: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[0-9Xx]$/, '请输入有效的18位身份证号'),
})
type RealNameFormValues = z.infer<typeof realNameFormSchema>

interface Props {
  isLoading: boolean
  realName?: RealNameVerification
}

export default function RealNameTab({ isLoading, realName }: Props) {
  const queryClient = useQueryClient()

  const realNameForm = useForm<RealNameFormValues>({
    resolver: zodResolver(realNameFormSchema),
    defaultValues: { fullName: '', idNumber: '' },
  })

  const handleRealNameSubmit = async (values: RealNameFormValues) => {
    const normalizedFullName = values.fullName.trim()
    const normalizedId = values.idNumber.replace(/\s+/g, '').toUpperCase()

    await new Promise((resolve) => setTimeout(resolve, 800))

    queryClient.setQueryData(['wallet-dashboard'], (previous: any) => {
      if (!previous) return previous
      return {
        ...previous,
        realNameVerification: {
          isVerified: true,
          fullName: normalizedFullName,
          idNumber: normalizedId,
        },
      }
    })

    realNameForm.reset({ fullName: normalizedFullName, idNumber: normalizedId })
  }

  return (
    <Card className='border border-gray-200'>
      <CardContent className='space-y-6 p-6'>
        <div className='text-muted-foreground space-y-1 text-sm'>
          <p>实名认证为银行合规打款要求的必须流程，实名认证完成后无需再进行</p>
          <p>请确保您的实名信息与绑定的支付方式所使用的实名信息一致</p>
        </div>

        {isLoading ? (
          <p className='text-muted-foreground text-sm'>正在加载实名认证信息…</p>
        ) : realName?.isVerified ? (
          <div className='border-border space-y-3 rounded-lg border border-dashed p-4'>
            <div>
              <p className='text-muted-foreground text-sm'>真实姓名</p>
              <p className='text-foreground text-base font-medium'>{realName.fullName}</p>
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>身份证号</p>
              <p className='text-foreground font-mono text-base tracking-wide'>{realName.idNumber}</p>
            </div>
          </div>
        ) : (
          <Form {...realNameForm}>
            <form onSubmit={realNameForm.handleSubmit(handleRealNameSubmit)} className='space-y-4'>
              <FormField
                control={realNameForm.control}
                name='fullName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>真实姓名</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder='请输入真实姓名'
                        autoComplete='name'
                        maxLength={30}
                        disabled={realNameForm.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={realNameForm.control}
                name='idNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>身份证号</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder='请输入18位身份证号'
                        autoComplete='off'
                        inputMode='text'
                        maxLength={18}
                        disabled={realNameForm.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type='submit' className='w-full sm:w-auto' disabled={realNameForm.formState.isSubmitting}>
                {realNameForm.formState.isSubmitting ? '提交中…' : '提交'}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}


