import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { type AgentState, type TrackReference } from '@livekit/components-react';
import agentThinkingLottie from '@/lotties/agent-thinking.json';
import voiceLottie from '@/lotties/voice-lottie.json';
import { cn } from '@/lib/utils';

interface AgentAudioTileProps {
  state: AgentState;
  audioTrack: TrackReference;
  className?: string;
}

export const AgentTile = ({
  state,
  className,
  ref,
}: React.ComponentProps<'div'> & Omit<AgentAudioTileProps, 'audioTrack'>) => {
  const isSpeaking = state === 'speaking';
  const isThinking = state === 'thinking';
  const isListening = !isSpeaking && !isThinking;

  // 根据状态选择动画数据
  const animationData = isThinking ? agentThinkingLottie : voiceLottie;
  const shouldPlay = isSpeaking || isThinking;
  const lottieKey = isThinking ? 'thinking' : isSpeaking ? 'voice-speaking' : 'voice-listening';

  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const totalFrames = ((voiceLottie as unknown as { op?: number }).op ?? 100) | 0;
  const listeningFrame = Math.floor(totalFrames * 0.6);

  useEffect(() => {
    if (isListening) {
      lottieRef.current?.goToAndStop(listeningFrame, true);
      return;
    }

    // speaking/thinking 时确保播放
    lottieRef.current?.stop();
    lottieRef.current?.play();
  }, [isListening, listeningFrame]);

  return (
    <div ref={ref} className={cn('flex items-center justify-center', className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={lottieKey}
          className={cn('h-60 w-60', {
            'scale-125': isSpeaking,
          })}
          initial={{ opacity: 0, scale: isThinking ? 0.96 : isSpeaking ? 1.04 : 1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: isThinking ? 1.04 : isSpeaking ? 0.96 : 1 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          <Lottie
            lottieRef={lottieRef}
            animationData={animationData}
            loop={shouldPlay}
            autoplay={shouldPlay}
            className="h-full w-full"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
