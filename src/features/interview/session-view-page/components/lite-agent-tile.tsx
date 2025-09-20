import Lottie, { type LottieRefCurrentProps } from 'lottie-react'
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import agentThinkingLottie from '@/lotties/agent-thinking.json'
import voiceLottie from '@/lotties/voice-lottie.json'
import { cn } from '@/lib/utils'

export type LiteAgentState = 'listening' | 'thinking' | 'speaking'

interface LiteAgentTileProps extends React.ComponentProps<'div'> {
  state: LiteAgentState
}

export default function LiteAgentTile({ state, className, ...props }: LiteAgentTileProps) {
  const isSpeaking = state === 'speaking'
  const isThinking = state === 'thinking'
  const isListening = !isSpeaking && !isThinking

  const voiceLottieRef = useRef<LottieRefCurrentProps>(null)
  const thinkingLottieRef = useRef<LottieRefCurrentProps>(null)
  const totalFrames = ((voiceLottie as unknown as { op?: number }).op ?? 100) | 0
  const listeningFrame = Math.floor(totalFrames * 0.6)

  useEffect(() => {
    if (isListening) {
      voiceLottieRef.current?.stop()
      voiceLottieRef.current?.goToAndStop(listeningFrame, true)
      thinkingLottieRef.current?.stop()
      return
    }

    if (isThinking) {
      voiceLottieRef.current?.stop()
      thinkingLottieRef.current?.stop()
      thinkingLottieRef.current?.play()
      return
    }

    if (isSpeaking) {
      thinkingLottieRef.current?.stop()
      voiceLottieRef.current?.stop()
      voiceLottieRef.current?.play()
    }
  }, [isListening, isThinking, isSpeaking, listeningFrame])

  return (
    <div className={cn('flex items-center justify-center', className)} {...props}>
      <motion.div
        className={cn('relative h-60 w-60', { 'scale-125': isSpeaking })}
        initial={{ opacity: 0, scale: isThinking ? 0.86 : isSpeaking ? 1.04 : 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <motion.div
          className='absolute inset-0'
          initial={false}
          animate={{ opacity: isThinking ? 0 : 1, scale: isThinking ? 0.88 : 1 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <Lottie lottieRef={voiceLottieRef} animationData={voiceLottie} loop={isSpeaking} autoplay={false} className='h-full w-full' />
        </motion.div>
        <motion.div
          className='absolute inset-0'
          initial={false}
          animate={{ opacity: isThinking ? 1 : 0, scale: isThinking ? 1 : 1.02 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <Lottie lottieRef={thinkingLottieRef} animationData={agentThinkingLottie} loop autoplay={false} className='h-full w-full' />
        </motion.div>
      </motion.div>
    </div>
  )
}


