import heliSvg from './images/heli.svg'
import { cn } from '@/lib/utils'

export function HeliIcon({ className }: { className?: string }) {
  return <img src={heliSvg} alt="内推" className={cn('scale-125', className)} />
}

