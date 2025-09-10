import Lottie from 'lottie-react';
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
  const shouldRotate = !isSpeaking && !isThinking;

  // 根据状态选择动画数据
  const animationData = isThinking ? agentThinkingLottie : voiceLottie;
  const shouldPlay = isSpeaking || isThinking;

  return (
    <div ref={ref} className={cn('flex items-center justify-center', className)}>
      <div
        className={cn('h-60 w-60', {
          'animate-slow-spin': shouldRotate,
          'scale-125': isThinking,
        })}
      >
        <Lottie
          animationData={animationData}
          loop={shouldPlay}
          autoplay={shouldPlay}
          className="h-full w-full"
        />
      </div>
    </div>
  );
};
