/**
 * Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. All Rights Reserved.
 * SPDX-license-identifier: BSD-3-Clause
 */

import {
  LocalAudioPropertiesInfo,
  RemoteAudioPropertiesInfo,
  LocalStreamStats,
  MediaType,
  onUserJoinedEvent,
  onUserLeaveEvent,
  RemoteStreamStats,
  StreamRemoveReason,
  StreamIndex,
  DeviceInfo,
  AutoPlayFailedEvent,
  PlayerEvent,
  NetworkQuality,
} from '@volcengine/rtc';
import { useRef } from 'react';
import { toast } from 'sonner'

import { useRoomStore, type IUser } from '@/stores/interview/room';
import RtcClient, { IEventListener } from './RtcClient';
import { reportRtcMessageReceived, userEvent, captureException } from '@/lib/apm'

import { useDeviceStore } from '@/stores/interview/device';
import { useMessageHandler } from '@/features/interview/session-view-page/lib/handler';
// logger is not required here after removing debug prints

const useRtcListeners = (): IEventListener => {
  const roomStore = useRoomStore();
  const deviceStore = useDeviceStore();
  const { parser } = useMessageHandler();
  const playStatus = useRef<{ [key: string]: { audio: boolean; video: boolean } }>({});


  const handleTrackEnded = async (event: { kind: string; isScreen: boolean }) => {
    const { kind, isScreen } = event;
    // 摄像头掉线（非屏幕共享）时提示
    if (!isScreen && kind === 'video') {
      toast.error('断开摄像头后，面试内容会丢失，请重新调试设备再面试', { position: 'top-center', duration: 5000 })
      userEvent('interview_camera_disconnected', '摄像头掉线', {})
    }
    /** 浏览器自带的屏幕共享关闭触发方式，通过 onTrackEnd 事件去关闭 */
    if (isScreen && kind === 'video') {
      await RtcClient.stopScreenCapture();
      await RtcClient.unpublishScreenStream(MediaType.VIDEO);
      roomStore.updateLocalUser({ publishScreen: false });
    }
  };

  const handleUserJoin = (e: onUserJoinedEvent) => {
    const extraInfo = JSON.parse(e.userInfo.extraInfo || '{}');
    const userId = extraInfo.user_id || e.userInfo.userId;
    const username = extraInfo.user_name || e.userInfo.userId;
    roomStore.remoteUserJoin({ userId, username });
  };

  const handleError = (e: { errorCode: string | number; errorMessage?: string }) => {
    const errorCode = String(e.errorCode)
    const errorMessage = e.errorMessage || 'Unknown RTC error'
    
    // APM 异常上报
    captureException(`RTC Error [${errorCode}]: ${errorMessage}`, {
      error_code: errorCode,
      error_message: errorMessage,
      page: 'session',
    })
    
    // 可选：根据错误代码显示用户友好的提示
    // toast.error(`网络错误: ${errorCode}`)
  };

  const handleUserLeave = async (e: onUserLeaveEvent) => {
    roomStore.remoteUserLeave({ userId: e.userInfo.userId });
    roomStore.removeAutoPlayFail({ userId: e.userInfo.userId });

    try { await RtcClient.stopAudioCapture() } catch { /* noop */ }
    try { await RtcClient.stopVideoCapture() } catch { /* noop */ }
    try { await RtcClient.leaveRoom() } catch { /* noop */ }

  };

  const handleUserPublishStream = (e: { userId: string; mediaType: MediaType }) => {
    const { userId, mediaType } = e;
    const payload: IUser = { userId };
    if (mediaType === MediaType.AUDIO) {
      /** 暂不需要 */
    }
    payload.publishAudio = true;
    roomStore.updateRemoteUser(payload);
  };

  const handleUserUnpublishStream = (e: {
    userId: string;
    mediaType: MediaType;
    reason: StreamRemoveReason;
  }) => {
    const { userId, mediaType } = e;

    const payload: IUser = { userId };
    if (mediaType === MediaType.AUDIO) {
      payload.publishAudio = false;
    }

    if (mediaType === MediaType.AUDIO_AND_VIDEO) {
      payload.publishAudio = false;
    }

    roomStore.updateRemoteUser(payload);
  };

  const handleRemoteStreamStats = (e: RemoteStreamStats) => {
    roomStore.updateRemoteUser({ userId: e.userId, audioStats: e.audioStats });
  };

  const handleLocalStreamStats = (e: LocalStreamStats) => {
    roomStore.updateLocalUser({ audioStats: e.audioStats });
  };

  const handleLocalAudioPropertiesReport = (e: LocalAudioPropertiesInfo[]) => {
    const localAudioInfo = e.find(
      (audioInfo) => audioInfo.streamIndex === StreamIndex.STREAM_INDEX_MAIN
    );
    if (localAudioInfo) {
      roomStore.updateLocalUser({ audioPropertiesInfo: localAudioInfo.audioPropertiesInfo });
    }
  };

  const handleRemoteAudioPropertiesReport = (e: RemoteAudioPropertiesInfo[]) => {
    const remoteAudioInfo = e
      .filter((audioInfo) => audioInfo.streamKey.streamIndex === StreamIndex.STREAM_INDEX_MAIN)
      .map((audioInfo) => ({
        userId: audioInfo.streamKey.userId,
        audioPropertiesInfo: audioInfo.audioPropertiesInfo,
      }));

    if (remoteAudioInfo.length) roomStore.updateRemoteUser(remoteAudioInfo);
  };

  const handleAudioDeviceStateChanged = async (device: DeviceInfo) => {
    const devices = await RtcClient.getDevices();

    if (device.mediaDeviceInfo.kind === 'audioinput') {
      let deviceId = device.mediaDeviceInfo.deviceId;
      if (device.deviceState === 'inactive') {
        deviceId = devices.audioInputs?.[0].deviceId || '';
      }
      RtcClient.switchDevice(MediaType.AUDIO, deviceId);
      deviceStore.setMicrophoneList(devices.audioInputs);
      deviceStore.updateSelectedDevice({ selectedMicrophone: deviceId });
    }
  };

  const handleAutoPlayFail = (event: AutoPlayFailedEvent) => {
    const { userId, kind } = event;
    let playUser = playStatus.current?.[userId] || {};
    playUser = { ...playUser, [kind]: false };
    playStatus.current[userId] = playUser;

    roomStore.addAutoPlayFail({ userId });
  };

  const addFailUser = (userId: string) => {
    roomStore.addAutoPlayFail({ userId });
  };

  const playerFail = (params: { type: 'audio' | 'video'; userId: string }) => {
    const { type, userId } = params;
    let playUser = playStatus.current?.[userId] || {};

    playUser = { ...playUser, [type]: false };

    const { audio, video } = playUser;

    if (audio === false || video === false) {
      addFailUser(userId);
    }

    return playUser;
  };

  const handlePlayerEvent = (event: PlayerEvent) => {
    const { userId, rawEvent, type } = event;
    let playUser = playStatus.current?.[userId] || {};

    if (!playStatus.current) return;

    if (rawEvent.type === 'playing') {
      playUser = { ...playUser, [type]: true };
      const { audio, video } = playUser;
      if (audio !== false && video !== false) {
        roomStore.removeAutoPlayFail({ userId });
      }
    } else if (rawEvent.type === 'pause') {
      playUser = playerFail({ type, userId });
    }

    playStatus.current[userId] = playUser;
  };

  const handleNetworkQuality = (
    uplinkNetworkQuality: NetworkQuality,
    downlinkNetworkQuality: NetworkQuality
  ) => {
    roomStore.updateNetworkQuality({
      networkQuality: Math.floor((uplinkNetworkQuality + downlinkNetworkQuality) / 2) as NetworkQuality,
    });
  };

  const handleRoomBinaryMessageReceived = (event: { userId: string; message: ArrayBuffer }) => {
    const { message } = event;
    parser(message);
  };

  const roomMessageReceived = (event: { userId: string; message: string }) => {
    const { userId, message } = event;
    // 上报自定义RTC消息事件
    reportRtcMessageReceived(String(userId), String(message))
    try {
      const obj = JSON.parse(message) as { type?: string; reason?: string };
      if (obj?.type === 'room_destroyed' && obj?.reason === 'session_end') {
        roomStore.updateAgentLeavingState({ isAgentLeaving: true });
      }
    } catch { /* ignore */ }
  };

  return {
    handleError,
    handleUserJoin,
    handleUserLeave,
    handleTrackEnded,
    handleUserPublishStream,
    handleUserUnpublishStream,
    handleRemoteStreamStats,
    handleLocalStreamStats,
    handleLocalAudioPropertiesReport,
    handleRemoteAudioPropertiesReport,
    handleAudioDeviceStateChanged,
    handleAutoPlayFail,
    handlePlayerEvent,
    handleRoomBinaryMessageReceived,
    handleNetworkQuality,
    roomMessageReceived,
  };
};

export default useRtcListeners;
