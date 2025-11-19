import heliPng from './images/heli.png'
import { cn } from '@/lib/utils'

export function HeliIcon({ className }: { className?: string }) {
  return <img src={heliPng} alt="内推" className={cn('scale-125', className)} />
}

