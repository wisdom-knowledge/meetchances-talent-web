import { useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export interface SupportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (payload: {
    message: string
    contactMethod: 'phone' | 'none'
    phone?: string
  }) => void | Promise<void>
}

export default function SupportDialog({ open, onOpenChange, onSubmit }: SupportDialogProps) {
  const [message, setMessage] = useState('')
  const [contactMethod, setContactMethod] = useState<'phone' | 'none'>('phone')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await onSubmit?.({ message, contactMethod, phone: contactMethod === 'phone' ? phone : undefined })
      onOpenChange(false)
      reset()
    } finally {
      setIsSubmitting(false)
    }
  }

  const reset = () => {
    setMessage('')
    setContactMethod('phone')
    setPhone('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>请说明您的问题</DialogTitle>
        </DialogHeader>
        <div className='space-y-6'>
          <div>
            <Textarea
              placeholder='说明您的问题'
              className='min-h-32'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div>
            <div className='mb-2 text-base font-medium'>您希望我们怎么反馈您？</div>
            <RadioGroup
              value={contactMethod}
              onValueChange={(v) => setContactMethod(v as 'phone' | 'none')}
              className='space-y-3'
            >
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='phone' id='rg-phone' />
                <Label htmlFor='rg-phone'>手机号（微信沟通）</Label>
              </div>
              {contactMethod === 'phone' && (
                <div className='pl-6 pt-1'>
                  <Input
                    inputMode='tel'
                    placeholder='请输入手机号'
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className='max-w-xs'
                  />
                </div>
              )}
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='none' id='rg-none' />
                <Label htmlFor='rg-none'>不要联系我</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (contactMethod === 'phone' && phone.trim().length === 0)}
          >
            {isSubmitting ? '提交中…' : '提交'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


