import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
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
import { submitInterviewSupportDemand, uploadFile, type SupportDemandPayload } from '@/features/interview/api'

const formSchema = z.object({
  problem: z.string().min(1, '请说明您的问题'),
  // 兼容当前 zod 版本：第二参数仅支持 { message | error }
  contact: z.enum(['phone', 'none'], { error: '请选择反馈方式' }),
  phone: z.string().optional(),
  images: z.array(z.instanceof(File)).max(5, '最多只能上传5张图片').optional(),
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
  const [uploading, setUploading] = useState(false)
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { problem: '', contact: 'phone', phone: '', images: [] },
  })

  // 文件上传处理
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const currentImages = form.getValues('images') || []
    
    // 验证文件类型和数量
    const validFiles = files.filter(file => {
      const isValidType = file.type === 'image/jpeg' || file.type === 'image/png'
      return isValidType
    })
    
    const totalFiles = currentImages.length + validFiles.length
    if (totalFiles > 5) {
      form.setError('images', { message: '最多只能上传5张图片' })
      return
    }
    
    const newImages = [...currentImages, ...validFiles]
    form.setValue('images', newImages)
    form.clearErrors('images')
    
    // 清空 input 值，允许重复选择同一文件
    event.target.value = ''
  }, [form])

  const removeImage = useCallback((index: number) => {
    const currentImages = form.getValues('images') || []
    const newImages = currentImages.filter((_, i) => i !== index)
    form.setValue('images', newImages)
  }, [form])

  const handleSubmit = async (values: FormValues) => {
    setUploading(true)
    
    try {
      let imageUrls: string[] = []
      
      // 上传图片文件
      if (values.images && values.images.length > 0) {
        try {
          const uploadPromises = values.images.map(file => uploadFile(file))
          const uploadResults = await Promise.all(uploadPromises)
          imageUrls = uploadResults.map(result => result.data.file_url)
        } catch (uploadError) {
          toast.error('图片上传失败', {
            description: uploadError instanceof Error ? uploadError.message : '请稍后重试',
            position: 'top-right'
          })
          return // 直接返回，不继续执行后续提交逻辑
        }
      }
      
      const payload: SupportDemandPayload = {
        detail: values.problem,
        need_contact: values.contact !== 'none',
        phone_number: values.contact === 'phone' ? values.phone : undefined,
        images: imageUrls.length > 0 ? imageUrls : undefined,
      }
      
      await submitInterviewSupportDemand(payload)
      
      // 显示成功提示
      toast.success('提交成功', {
        position: 'top-right'
      })
      
      // 调用外部回调（如果存在）
      onSubmit?.(values)
      
      onOpenChange(false)
      form.reset()
    } catch (_error) {
      toast.error('提交失败', {
        description: '请稍后重试',
        position: 'top-right'
      })
    } finally {
      setUploading(false)
    }
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

              <FormField
                control={form.control}
                name='images'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>问题截图（可选）</FormLabel>
                    <FormControl>
                      <div className='space-y-3'>
                        {/* 文件上传区域 */}
                        <div className='flex items-center justify-center w-full'>
                          <label
                            htmlFor='image-upload'
                            className='flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors'
                          >
                            <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                              <svg
                                className='w-8 h-8 mb-4 text-gray-500'
                                aria-hidden='true'
                                xmlns='http://www.w3.org/2000/svg'
                                fill='none'
                                viewBox='0 0 20 16'
                              >
                                <path
                                  stroke='currentColor'
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth='2'
                                  d='M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2'
                                />
                              </svg>
                              <p className='mb-2 text-sm text-gray-500'>
                                <span className='font-semibold'>点击上传</span> 或拖拽图片到此处
                              </p>
                              <p className='text-xs text-gray-500'>支持 JPG、PNG 格式，最多5张</p>
                            </div>
                            <input
                              id='image-upload'
                              type='file'
                              className='hidden'
                              accept='image/jpeg,image/png'
                              multiple
                              onChange={handleFileChange}
                            />
                          </label>
                        </div>

                        {/* 图片预览区域 */}
                        {field.value && field.value.length > 0 && (
                          <div className='space-y-2'>
                            {field.value.map((file, index) => (
                              <div key={index} className='flex items-center justify-between p-3 border rounded-lg bg-gray-50'>
                                <div className='flex items-center space-x-3 flex-1 min-w-0'>
                                  <div className='w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0'>
                                    <svg
                                      className='w-4 h-4 text-blue-600'
                                      fill='none'
                                      stroke='currentColor'
                                      viewBox='0 0 24 24'
                                    >
                                      <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                                      />
                                    </svg>
                                  </div>
                                  <div className='flex-1 min-w-0'>
                                    <button
                                      type='button'
                                      onClick={() => {
                                        // 创建新窗口显示图片
                                        const imgUrl = URL.createObjectURL(file)
                                        const newWindow = window.open('', '_blank')
                                        if (newWindow) {
                                          newWindow.document.write(`
                                            <html>
                                              <head>
                                                <title>${file.name}</title>
                                                <style>
                                                  body { margin: 0; padding: 20px; background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                                                  img { max-width: 100%; max-height: 90vh; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                                                </style>
                                              </head>
                                              <body>
                                                <img src="${imgUrl}" alt="${file.name}" />
                                              </body>
                                            </html>
                                          `)
                                          newWindow.document.close()
                                        }
                                      }}
                                      className='text-sm text-blue-600 hover:text-blue-800 hover:underline truncate block w-full text-left'
                                      title={file.name}
                                    >
                                      {file.name}
                                    </button>
                                    <div className='text-xs text-gray-500'>
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type='button'
                                  onClick={() => removeImage(index)}
                                  className='ml-3 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors'
                                  title='删除图片'
                                >
                                  <svg
                                    className='w-4 h-4'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                  >
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                    />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='support-form' disabled={uploading}>
            {uploading ? '上传中...' : '提交'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


