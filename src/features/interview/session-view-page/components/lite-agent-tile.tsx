import Lottie, { type LottieRefCurrentProps } from 'lottie-react'
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import agentThinkingLottie from '@/lotties/agent-thinking.json'
import voiceLottie from '@/lotties/voice-lottie.json'
import { cn } from '@/lib/utils'
import { useRoomStore } from '@/stores/interview/room'
// APM 相关逻辑已上移至页面级调用

export default function LiteAgentTile({ className, ...props }: React.ComponentProps<'div'>) {
  const isAITalking = useRoomStore((s) => s.isAITalking)
  const isAIThinking = useRoomStore((s) => s.isAIThinking)
  const isSpeaking = Boolean(isAITalking)
  const isThinking = Boolean(isAIThinking)
  const isListening = !isSpeaking && !isThinking

  const voiceLottieRef = useRef<LottieRefCurrentProps>(null)
  const thinkingLottieRef = useRef<LottieRefCurrentProps>(null)
  const totalFrames = ((voiceLottie as unknown as { op?: number }).op ?? 100) | 0
  const listeningFrame = Math.floor(totalFrames * 0.6)

  // 组件仅负责渲染，不再承担上报逻辑

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


