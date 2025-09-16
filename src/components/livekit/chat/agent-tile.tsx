import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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

  const voiceLottieRef = useRef<LottieRefCurrentProps>(null);
  const thinkingLottieRef = useRef<LottieRefCurrentProps>(null);
  const totalFrames = ((voiceLottie as unknown as { op?: number }).op ?? 100) | 0;
  const listeningFrame = Math.floor(totalFrames * 0.6);

  useEffect(() => {
    if (isListening) {
      // 监听态：voice 动画立即定位到 60%
      voiceLottieRef.current?.stop();
      voiceLottieRef.current?.goToAndStop(listeningFrame, true);
      thinkingLottieRef.current?.stop();
      return;
    }

    if (isThinking) {
      // 思考态：播放 thinking，停止 voice
      voiceLottieRef.current?.stop();
      thinkingLottieRef.current?.stop();
      thinkingLottieRef.current?.play();
      return;
    }

    if (isSpeaking) {
      // 说话态：播放 voice，停止 thinking
      thinkingLottieRef.current?.stop();
      voiceLottieRef.current?.stop();
      voiceLottieRef.current?.play();
    }
  }, [isListening, isThinking, isSpeaking, listeningFrame]);

  return (
    <div ref={ref} className={cn('flex items-center justify-center', className)}>
      <motion.div
        className={cn('relative h-60 w-60', {
          'scale-125': isSpeaking,
        })}
        initial={{ opacity: 0, scale: isThinking ? 0.96 : isSpeaking ? 1.04 : 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {/* 常驻：voice 动画（listening/speaking） */}
        <div className={cn('absolute inset-0', { hidden: isThinking })}>
          <Lottie
            lottieRef={voiceLottieRef}
            animationData={voiceLottie}
            loop={isSpeaking}
            autoplay={false}
            className="h-full w-full"
          />
        </div>

        {/* 常驻：thinking 动画 */}
        <div className={cn('absolute inset-0', { hidden: !isThinking })}>
          <Lottie
            lottieRef={thinkingLottieRef}
            animationData={agentThinkingLottie}
            loop
            autoplay={false}
            className="h-full w-full"
          />
        </div>
      </motion.div>
    </div>
  );
};
