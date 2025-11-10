import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface PaymentMethod {
  id: string
  name: string
  isSelected: boolean
  isBound: boolean
  description?: string
}

interface Props {
  isLoading: boolean
  paymentMethods: PaymentMethod[]
  onOpenBind: () => void
}

export default function PaymentMethodsTab({ isLoading, paymentMethods, onOpenBind }: Props) {
  return (
    <Card className='border border-gray-200'>
      <CardContent className='space-y-6 p-6'>
        <p className='text-muted-foreground text-sm'>请确保您千识的注册手机号与支付方式绑定的手机号一致。</p>

        <div className='space-y-4'>
          {isLoading && <p className='text-muted-foreground text-sm'>正在加载支付方式…</p>}

          {!isLoading && paymentMethods.length === 0 && (
            <p className='text-muted-foreground text-sm'>暂无可用支付方式</p>
          )}

          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className='border-border flex flex-col gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between'
            >
              <div className='space-y-1'>
                <div className='flex items-center gap-3'>
                  <p className='text-base font-medium'>{method.name}</p>
                  {method.isSelected && <Badge variant='default'>默认</Badge>}
                  {method.isBound && <Badge variant='secondary'>已绑定</Badge>}
                </div>
                {method.description && <p className='text-muted-foreground text-sm'>{method.description}</p>}
              </div>

              {!method.isBound && (
                <Button size='sm' onClick={onOpenBind}>
                  绑定
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


