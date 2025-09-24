/**
 * Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. All Rights Reserved.
 * SPDX-license-identifier: BSD-3-Clause
 */

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import RtcClient from '@/features/interview/session-view-page/lib/RtcClient';
import useRtcListeners from '@/features/interview/session-view-page/lib/listenerHooks';
import { useRoomStore } from '@/stores/interview/room';
import { useDeviceStore } from '@/stores/interview/device';
import { userEvent } from '@/lib/apm'
import { postNodeAction, NodeActionTrigger } from '@/features/interview/api'
// logger removed; use toast for user-facing notices

export const ABORT_VISIBILITY_CHANGE = 'abortVisibilityChange';
export interface FormProps {
  username: string;
  roomId: string;
  publishAudio: boolean;
}

export const useScene = () => {
  const scene = useRoomStore((s) => s.scene)
  const sceneConfigMap = useRoomStore((s) => s.sceneConfigMap)
  return sceneConfigMap[scene] || {}
}

export const useRTC = () => {
  const scene = useRoomStore((s) => s.scene)
  const rtcConfigMap = useRoomStore((s) => s.rtcConfigMap)
  return rtcConfigMap[scene] || {}
}

export const useRtcConnectionInfo = () => {
  return useRoomStore((s) => s.rtcConnectionInfo)
}

export const useDeviceState = () => {
  const roomLocalUser = useRoomStore((s) => s.localUser)
  const roomActions = useRoomStore()
  const deviceActions = useDeviceStore()
  const localUser = roomLocalUser
  const isAudioPublished = localUser.publishAudio;
  const isVideoPublished = localUser.publishVideo;
  const isScreenPublished = localUser.publishScreen;
  const queryDevices = async (type: 'audio' | 'video') => {
    const mediaDevices = await RtcClient.getDevices({
      audio: true,
      video: true,
    });
    if (type === 'audio') {
      deviceActions.updateMediaInputs({ audioInputs: mediaDevices.audioInputs })
      deviceActions.updateSelectedDevice({ selectedMicrophone: mediaDevices.audioInputs[0]?.deviceId })
    } else {
      deviceActions.updateMediaInputs({ videoInputs: mediaDevices.videoInputs })
      deviceActions.updateSelectedDevice({ selectedCamera: mediaDevices.videoInputs[0]?.deviceId })
    }
    return mediaDevices;
  };

  const switchMic = async (controlPublish = true) => {
    const { MediaType } = await import('@volcengine/rtc');
    if (controlPublish) {
      await (!isAudioPublished
        ? RtcClient.publishStream(MediaType.AUDIO)
        : RtcClient.unpublishStream(MediaType.AUDIO));
    }
    void queryDevices('audio');
    await (!isAudioPublished ? RtcClient.startAudioCapture() : RtcClient.stopAudioCapture());
    roomActions.updateLocalUser({ publishAudio: !isAudioPublished })
  };

  const switchCamera = async (controlPublish = true) => {
    const { MediaType } = await import('@volcengine/rtc');
    if (controlPublish) {
      await (!isVideoPublished
        ? RtcClient.publishStream(MediaType.VIDEO)
        : RtcClient.unpublishStream(MediaType.VIDEO));
    }
    // void queryDevices('video');
    await (!isVideoPublished ? RtcClient.startVideoCapture() : RtcClient.stopVideoCapture());

    // RtcClient.publishStream(MediaType.AUDIO_AND_VIDEO)
    roomActions.updateLocalUser({ publishVideo: !isVideoPublished })
  };

  const switchScreenCapture = async (controlPublish = true) => {
    try {
      const { MediaType } = await import('@volcengine/rtc');
      if (!isScreenPublished) {
        sessionStorage.setItem(ABORT_VISIBILITY_CHANGE, 'true')
      } else {
        sessionStorage.removeItem(ABORT_VISIBILITY_CHANGE)
      }
      if (controlPublish) {
        await (!isScreenPublished
          ? RtcClient.publishScreenStream(MediaType.VIDEO)
          : RtcClient.unpublishScreenStream(MediaType.VIDEO));
      }
      await (!isScreenPublished ? RtcClient.startScreenCapture() : RtcClient.stopScreenCapture());
      roomActions.updateLocalUser({ publishScreen: !isScreenPublished })
    } catch {
      toast.error('未授权进行屏幕共享，请检查浏览器权限设置。', { position: 'top-center' })
    }
    sessionStorage.removeItem(ABORT_VISIBILITY_CHANGE);
    return false;
  };

  return {
    isAudioPublished,
    isVideoPublished,
    isScreenPublished,
    switchMic,
    switchCamera,
    switchScreenCapture,
  };
};

export const useGetDevicePermission = () => {
  const [permission, setPermission] = useState<{
    audio: boolean;
  }>();
  const deviceActions = useDeviceStore()

  useEffect(() => {
    (async () => {
      const permission = await RtcClient.checkPermission();
      deviceActions.setDevicePermissions(permission);
      setPermission(permission);
    })();
  }, [deviceActions]);
  return permission;
};

export const useJoin = (): [boolean, () => Promise<void | boolean>] => {
  const devicePermissions = useDeviceStore((s) => s.devicePermissions)
  const room = useRoomStore()
  const rtcInfo = useRoomStore((s) => s.rtcConnectionInfo)

  const { id } = useScene();
  const { switchMic } = useDeviceState();
  const [joining, setJoining] = useState(false);
  const listeners = useRtcListeners();

  const handleAIGCModeStart = async () => {
    if (room.isAIGCEnable) {
      await RtcClient.stopAgent(id);
      room.clearCurrentMsg();
      await RtcClient.startAgent(id);
    } else {
      await RtcClient.startAgent(id);
    }
    room.updateAIGCState({ isAIGCEnable: true });
  };

  async function disPatchJoin(): Promise<boolean | undefined> {
    if (joining) {
      return;
    }

    const isSupported = await RtcClient.isSupported();
    if (!isSupported) {
      toast.error('您的浏览器可能不支持 RTC 功能，请更换或升级后重试。', { position: 'top-center' })
      return;
    }

    setJoining(true);

    // 标记候选人进入房间
    useRoomStore.getState().setCandidateInRoom(true)
    // 0. 准备 RTC 基础信息（来自 roomStore.rtcConnectionInfo）
    if (!rtcInfo?.room_id || !rtcInfo?.user_id || !rtcInfo?.token) {
      toast.error('缺少会话连接信息，请返回上一步重试。', { position: 'top-center' })
      setJoining(false)
      return
    }
    RtcClient.updateBasicInfo({
      app_id: '68c7802af2dba90172caaa3a',
      room_id: rtcInfo.room_id,
      user_id: rtcInfo.user_id,
      token: rtcInfo.token,
    })


    /** 1. Create RTC Engine */
    await RtcClient.createEngine();

    /** 2.1 Set events callbacks */
    RtcClient.addEventListeners(listeners);

    /** 2.2 RTC starting to join room */
    await RtcClient.joinRoom();
    /** 3. Set users' devices info */
    const mediaDevices = await RtcClient.getDevices({
      audio: true,
      video: true,
    });

    room.localJoinRoom({
      roomId: RtcClient.basicInfo.room_id,
      user: { username: RtcClient.basicInfo.user_id, userId: RtcClient.basicInfo.user_id },
    })
    useDeviceStore.getState().updateSelectedDevice({
      selectedMicrophone: mediaDevices.audioInputs[0]?.deviceId,
      selectedCamera: mediaDevices.videoInputs[0]?.deviceId,
    })
    useDeviceStore.getState().updateMediaInputs(mediaDevices)

    setJoining(false);

    if (devicePermissions.audio) {
      try {
        await switchMic();
      } catch (_e) {
        toast.warning('麦克风权限不足，无法开启麦克风。', { position: 'top-center' })
      }
    }

    handleAIGCModeStart();
  }

  return [joining, disPatchJoin];
};

export const useLeave = () => {
  const roomId = useRoomStore((s) => s.rtcConnectionInfo?.room_id)
  const setCandidateInRoom = useRoomStore((s) => s.setCandidateInRoom)

  return async function () {
    await Promise.all([
      RtcClient.stopAudioCapture,
      RtcClient.stopScreenCapture,
      RtcClient.stopVideoCapture,
    ]);
    await RtcClient.stopAgent(roomId ?? '');
    await setCandidateInRoom(false)
    await RtcClient.leaveRoom();
    // 标记候选人离开房间
    
    const room = useRoomStore.getState()
    room.clearHistoryMsg()
    room.clearCurrentMsg()
    room.localLeaveRoom()
    room.updateAIGCState({ isAIGCEnable: false })
  };
};

/**
 * 处理面试结束的流程
 */
export const useInterviewFinish = () => {
  const isAITalking = useRoomStore((s) => s.isAITalking)
  const isAIThinking = useRoomStore((s) => s.isAIThinking)
  const isAgentLeaving = useRoomStore((s) => s.isAgentLeaving)
  const leave = useLeave()
  const triggeredRef = useRef(false)

  const beforeLeave = async () => {
    const params = new URLSearchParams(window.location.search)
    const roomStore = useRoomStore.getState()
    const interviewId = roomStore.rtcConnectionInfo?.interview_id
    if (interviewId != null) params.set('interview_id', String(interviewId))
    // 保留已存在的 job_id / job_apply_id / interview_node_id
    const jobId = params.get('job_id')
    if (jobId) params.set('job_id', jobId)
    const jobApplyId = params.get('job_apply_id')
    if (jobApplyId) params.set('job_apply_id', jobApplyId)
    const interviewNodeId = params.get('interview_node_id')

    // 上报并提交节点
    userEvent('interview_completed', '面试正常结束', {
      job_id: jobId ?? undefined,
      interview_id: interviewId ?? undefined,
      job_apply_id: jobApplyId ?? undefined,
    })
    if (interviewNodeId) {
      try {
        await postNodeAction({ node_id: interviewNodeId, trigger: NodeActionTrigger.Submit, result_data: {} })
      } catch { /* ignore */ }
    }
    // 跳转 finish（使用原生 replace 便于释放设备权限）
    setTimeout(() => {
      window.location.replace(`/finish?${params.toString()}`)
    }, 300)
  }

  useEffect(() => {
    // 当收到了 Agent 的离开事件，并且 Agent 没有说话和思考，则代表正常完成面试了
    if (!isAITalking && !isAIThinking && isAgentLeaving && !triggeredRef.current) {
      triggeredRef.current = true
      void beforeLeave()
      void leave()
    }
  }, [isAITalking, isAIThinking, isAgentLeaving, leave])
}
