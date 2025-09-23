/**
 * Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. All Rights Reserved.
 * SPDX-license-identifier: BSD-3-Clause
 */

import VERTC, {
  MirrorType,
  StreamIndex,
  IRTCEngine,
  RoomProfileType,
  onUserJoinedEvent,
  onUserLeaveEvent,
  MediaType,
  LocalStreamStats,
  RemoteStreamStats,
  StreamRemoveReason,
  LocalAudioPropertiesInfo,
  RemoteAudioPropertiesInfo,
  AudioProfileType,
  DeviceInfo,
  AutoPlayFailedEvent,
  PlayerEvent,
  NetworkQuality,
  VideoRenderMode,
  ScreenEncoderConfig,
} from '@volcengine/rtc';
import { toast } from 'sonner';
// import { string2tlv } from '@/utils/rtc-utils';
// import { COMMAND, INTERRUPT_PRIORITY } from '@/utils/handler';
import { startVoiceChat, stopVoiceChat } from '../../api';

export interface IEventListener {
  handleError: (e: { errorCode: string | number }) => void;
  handleUserJoin: (e: onUserJoinedEvent) => void;
  handleUserLeave: (e: onUserLeaveEvent) => void;
  handleTrackEnded: (e: { kind: string; isScreen: boolean }) => void;
  handleUserPublishStream: (e: { userId: string; mediaType: MediaType }) => void;
  handleUserUnpublishStream: (e: {
    userId: string;
    mediaType: MediaType;
    reason: StreamRemoveReason;
  }) => void;
  handleRemoteStreamStats: (e: RemoteStreamStats) => void;
  handleLocalStreamStats: (e: LocalStreamStats) => void;
  handleLocalAudioPropertiesReport: (e: LocalAudioPropertiesInfo[]) => void;
  handleRemoteAudioPropertiesReport: (e: RemoteAudioPropertiesInfo[]) => void;
  handleAudioDeviceStateChanged: (e: DeviceInfo) => void;
  handleAutoPlayFail: (e: AutoPlayFailedEvent) => void;
  handlePlayerEvent: (e: PlayerEvent) => void;
  handleRoomBinaryMessageReceived: (e: { userId: string; message: ArrayBuffer }) => void;
  handleNetworkQuality: (
    uplinkNetworkQuality: NetworkQuality,
    downlinkNetworkQuality: NetworkQuality
  ) => void;
  roomMessageReceived: (e: { userId: string; message: string }) => void;
}

export interface BasicBody {
  app_id: string;
  room_id: string;
  user_id: string;
  token?: string;
}


/**
 * @brief RTC Core Client
 * @notes Refer to official website documentation to get more information about the API.
 */
export class RTCClient {
  engine!: IRTCEngine;

  basicInfo!: BasicBody;


  private _audioCaptureDevice?: string;

  private _videoCaptureDevice?: string;
  // 语音聊天是否启用
  audioBotEnabled = false;

  audioBotStartTime = 0;

  /**
   * 更新基础信息
   * @param basicInfo 
   */
  updateBasicInfo = (basicInfo: BasicBody) => {
    this.basicInfo = basicInfo;
  };

  /**
   * 创建引擎
   */
  createEngine = async () => {
    this.engine = VERTC.createEngine(this.basicInfo.app_id || '68c7802af2dba90172caaa3a');
    try {
      const { default: RTCAIAnsExtension } = await import('@volcengine/rtc/extension-ainr');
      const AIAnsExtension = new RTCAIAnsExtension();
      await this.engine.registerExtension(AIAnsExtension);
      AIAnsExtension.enable();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      // 调试信息：AI 降噪扩展不可用时忽略
      // 使用 logger 而非 console 避免违反 ESLint 规则
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      import('@/utils/logger').then((m) => m.default.debug(`AI 降噪不可用: ${message}`));
    }
  };

  /**
   * 添加事件监听器
   * @param handleError 
   * @param handleUserJoin 
   * @param handleUserLeave 
   * @param handleTrackEnded 
   * @param handleUserPublishStream 
   * @param handleUserUnpublishStream 
   * @param handleRemoteStreamStats 
   * @param handleLocalStreamStats 
   * @param handleLocalAudioPropertiesReport 
   * @param handleRemoteAudioPropertiesReport 
   * @param handleAudioDeviceStateChanged 
   * @param handleAutoPlayFail 
   * @param handlePlayerEvent 
   * @param handleRoomBinaryMessageReceived 
   * @param handleNetworkQuality 
   */
  addEventListeners = ({
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
  }: IEventListener) => {
    this.engine.on(VERTC.events.onError, handleError);
    this.engine.on(VERTC.events.onUserJoined, handleUserJoin);
    this.engine.on(VERTC.events.onUserLeave, handleUserLeave);
    this.engine.on(VERTC.events.onTrackEnded, handleTrackEnded);
    this.engine.on(VERTC.events.onUserPublishStream, handleUserPublishStream);
    this.engine.on(VERTC.events.onUserUnpublishStream, handleUserUnpublishStream);
    this.engine.on(VERTC.events.onRemoteStreamStats, handleRemoteStreamStats);
    this.engine.on(VERTC.events.onLocalStreamStats, handleLocalStreamStats);
    this.engine.on(VERTC.events.onAudioDeviceStateChanged, handleAudioDeviceStateChanged);
    this.engine.on(VERTC.events.onLocalAudioPropertiesReport, handleLocalAudioPropertiesReport);
    this.engine.on(VERTC.events.onRemoteAudioPropertiesReport, handleRemoteAudioPropertiesReport);
    this.engine.on(VERTC.events.onAutoplayFailed, handleAutoPlayFail);
    this.engine.on(VERTC.events.onPlayerEvent, handlePlayerEvent);
    this.engine.on(VERTC.events.onRoomBinaryMessageReceived, handleRoomBinaryMessageReceived);
    this.engine.on(VERTC.events.onNetworkQuality, handleNetworkQuality);
    this.engine.on(VERTC.events.onRoomMessageReceived, roomMessageReceived);
  };

  /**
   * 加入房间
   */
  joinRoom = () => {
    const { room_id, token, user_id } = this.basicInfo;
    return this.engine.joinRoom(
      token!,
      room_id,
      {
        userId: user_id,
        extraInfo: JSON.stringify({
          call_scene: 'RTC-AIGC',
          user_name: user_id,
          user_id: user_id,
        }),
      },
      {
        isAutoPublish: true,
        isAutoSubscribeAudio: true,
        isAutoSubscribeVideo: true,
        roomProfileType: RoomProfileType.chat,
      }
    );
  };

  /**
   * 离开房间
   */
  leaveRoom = () => {
    this.audioBotEnabled = false;
    this.engine.leaveRoom().catch();
    VERTC.destroyEngine(this.engine);
    this._audioCaptureDevice = undefined;
  };

  /**
   * 检查设备权限
   * @returns 
   */
  checkPermission(): Promise<{
    video: boolean;
    audio: boolean;
  }> {
    return VERTC.enableDevices({
      video: true,
      audio: true,
    });
  }

  /**
   * @brief 获取设备列表
   * @returns
   */
  async getDevices(props?: { video?: boolean; audio?: boolean }): Promise<{
    audioInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
  }> {
    const { video = false, audio = true } = props || {};
    let audioInputs: MediaDeviceInfo[] = [];
    let audioOutputs: MediaDeviceInfo[] = [];
    let videoInputs: MediaDeviceInfo[] = [];
    const { video: hasVideoPermission, audio: hasAudioPermission } = await VERTC.enableDevices({
      video,
      audio,
    });
    // 如果需要麦克风
    if (audio) {
      const inputs = await VERTC.enumerateAudioCaptureDevices();
      const outputs = await VERTC.enumerateAudioPlaybackDevices();
      audioInputs = inputs.filter((i) => i.deviceId && i.kind === 'audioinput');
      audioOutputs = outputs.filter((i) => i.deviceId && i.kind === 'audiooutput');
      this._audioCaptureDevice = audioInputs.filter((i) => i.deviceId)?.[0]?.deviceId;
      if (hasAudioPermission) {
        if (!audioInputs?.length) {
          toast.error('无麦克风设备，请先确认设备情况。', { position: 'top-center' });
        }
        if (!audioOutputs?.length) {
          toast.error('无扬声器设备，请先确认设备情况。', { position: 'top-center' });
        }
      } else {
        toast.error('暂无麦克风设备权限，请先确认设备权限授予情况。', { position: 'top-center' });
      }
    }
    // 如果需要摄像头
    if (video) {
      videoInputs = await VERTC.enumerateVideoCaptureDevices();
      videoInputs = videoInputs.filter((i) => i.deviceId && i.kind === 'videoinput');
      this._videoCaptureDevice = videoInputs?.[0]?.deviceId;
      if (hasVideoPermission) {
        if (!videoInputs?.length) {
          toast.error('无摄像头设备，请先确认设备情况。', { position: 'top-center' });
        }
      } else {
        toast.error('暂无摄像头设备权限，请先确认设备权限授予情况。', { position: 'top-center' });
      }
    }

    return {
      audioInputs,
      audioOutputs,
      videoInputs,
    };
  }

  /**
   * 开始视频采集
   * @param camera 
   */
  startVideoCapture = async (camera?: string) => {
    await this.engine.startVideoCapture(camera || this._videoCaptureDevice);
  };

  /**
   * 停止视频采集
   */
  stopVideoCapture = async () => {
    this.engine.setLocalVideoMirrorType(MirrorType.MIRROR_TYPE_RENDER);
    await this.engine.stopVideoCapture();
  };

  /**
   * 开始屏幕采集
   * @param enableAudio 
   */
  startScreenCapture = async (enableAudio = false) => {
    // 这个方法还支持其他的重要参数，详见文档
    // 比如：共享模式、是否允许共享系统音频
    await this.engine.startScreenCapture({
      enableAudio,
    });
  };

  /**
   * 停止屏幕采集
   */
  stopScreenCapture = async () => {
    await this.engine.stopScreenCapture();
  };

  /**
   * 开始音频采集
   * @param mic 
   */
  startAudioCapture = async (mic?: string) => {
    await this.engine.startAudioCapture(mic || this._audioCaptureDevice);
  };

  stopAudioCapture = async () => {
    await this.engine.stopAudioCapture();
  };

  /**
   * 发布媒体流
   * @param mediaType 
   */
  publishStream = (mediaType: MediaType) => {
    this.engine.publishStream(mediaType);
  };

  unpublishStream = (mediaType: MediaType) => {
    this.engine.unpublishStream(mediaType);
  };

  publishScreenStream = async (mediaType: MediaType) => {
    await this.engine.publishScreen(mediaType);
  };

  unpublishScreenStream = async (mediaType: MediaType) => {
    await this.engine.unpublishScreen(mediaType);
  };

  setScreenEncoderConfig = async (description: ScreenEncoderConfig) => {
    await this.engine.setScreenEncoderConfig(description);
  };

  /**
   * @brief 设置业务标识参数
   * @param businessId
   */
  setBusinessId = (businessId: string) => {
    this.engine.setBusinessId(businessId);
  };

  setAudioVolume = (volume: number) => {
    this.engine.setCaptureVolume(StreamIndex.STREAM_INDEX_MAIN, volume);
    this.engine.setCaptureVolume(StreamIndex.STREAM_INDEX_SCREEN, volume);
  };

  /**
   * @brief 设置音质档位
   */
  setAudioProfile = (profile: AudioProfileType) => {
    this.engine.setAudioProfile(profile);
  };

  /**
   * @brief 切换设备
   */
  switchDevice = (deviceType: MediaType, deviceId: string) => {
    if (deviceType === MediaType.AUDIO) {
      this._audioCaptureDevice = deviceId;
      this.engine.setAudioCaptureDevice(deviceId);
    }
    if (deviceType === MediaType.VIDEO) {
      this._videoCaptureDevice = deviceId;
      this.engine.setVideoCaptureDevice(deviceId);
    }
    if (deviceType === MediaType.AUDIO_AND_VIDEO) {
      this._audioCaptureDevice = deviceId;
      this._videoCaptureDevice = deviceId;
      this.engine.setVideoCaptureDevice(deviceId);
      this.engine.setAudioCaptureDevice(deviceId);
    }
  };

  /**
   * @brief 设置本地视频镜像类型
   * @param type 
   */
  setLocalVideoMirrorType = (type: MirrorType) => {
    return this.engine.setLocalVideoMirrorType(type);
  };

  /**
   * @brief 设置本地视频播放器
   * @param userId 
   * @param renderDom 
   * @param isScreenShare 
   * @param renderMode 
   */
  setLocalVideoPlayer = (
    userId: string,
    renderDom?: string | HTMLElement,
    isScreenShare = false,
    renderMode = VideoRenderMode.RENDER_MODE_FILL
  ) => {
    // TODO： 这里为什么需要根据isScreenShare 来设置不同的StreamIndex，后续需要继续调研
    return this.engine.setLocalVideoPlayer(
      isScreenShare ? StreamIndex.STREAM_INDEX_SCREEN : StreamIndex.STREAM_INDEX_MAIN,
      {
        renderDom,
        userId,
        renderMode,
      }
    );
  };

  /**
   * @brief 移除播放器
   */
  removeVideoPlayer = (userId: string, scope: StreamIndex | 'Both' = 'Both') => {
    let removeScreen = scope === StreamIndex.STREAM_INDEX_SCREEN;
    let removeCamera = scope === StreamIndex.STREAM_INDEX_MAIN;
    if (scope === 'Both') {
      removeCamera = true;
      removeScreen = true;
    }
    if (removeScreen) {
      this.engine.setLocalVideoPlayer(StreamIndex.STREAM_INDEX_SCREEN, { userId });
    }
    if (removeCamera) {
      this.engine.setLocalVideoPlayer(StreamIndex.STREAM_INDEX_MAIN, { userId });
    }
  };

  /**
   * @brief 启用 AIGC
   */
  startAgent = async (scene: string) => {
    if (this.audioBotEnabled) {
      await this.stopAgent(scene);
    }
    const roomId = this.basicInfo.room_id
    await startVoiceChat({room_id: roomId})

    this.audioBotEnabled = true;
    this.audioBotStartTime = Date.now();
  };

  /**
   * @brief 关闭 AIGC
   */
  stopAgent = async (room_name: string) => {
    if (this.audioBotEnabled || sessionStorage.getItem('audioBotEnabled')) {
      await stopVoiceChat({room_name: room_name})
      this.audioBotStartTime = 0;
      sessionStorage.removeItem('audioBotEnabled');
    }
    this.audioBotEnabled = false;
  };

  // /**
  //  * @brief 命令 AIGC
  //  */
  // commandAgent = ({
  //   command,
  //   agentName,
  //   interruptMode = INTERRUPT_PRIORITY.NONE,
  //   message = '',
  // }: {
  //   command: COMMAND;
  //   agentName: string;
  //   interruptMode?: INTERRUPT_PRIORITY;
  //   message?: string;
  // }) => {
  //   if (this.audioBotEnabled) {
  //     this.engine.sendUserBinaryMessage(
  //       agentName,
  //       string2tlv(
  //         JSON.stringify({
  //           Command: command,
  //           InterruptMode: interruptMode,
  //           Message: message,
  //         }),
  //         'ctrl'
  //       )
  //     );
  //     return;
  //   }
  //   console.warn('Interrupt failed, bot not enabled.');
  // };

  /**
   * @brief 更新 AIGC 配置
   */
  updateAgent = async (scene: string) => {
    if (this.audioBotEnabled) {
      await this.stopAgent(scene);
      await this.startAgent(scene);
    } else {
      await this.startAgent(scene);
    }
  };

  /**
   * @brief 获取当前 AI 是否启用
   */
  getAgentEnabled = () => {
    return this.audioBotEnabled;
  };
}

export default new RTCClient();
