import { create } from 'zustand';
import {
  AudioPropertiesInfo,
  LocalAudioStats,
  NetworkQuality,
  RemoteAudioStats,
} from '@volcengine/rtc';
// import RtcClient from '@/lib/RtcClient';

export interface IUser {
  username?: string;
  userId?: string;
  publishAudio?: boolean;
  publishVideo?: boolean;
  publishScreen?: boolean;
  audioStats?: RemoteAudioStats;
  audioPropertiesInfo?: AudioPropertiesInfo;
}

export type LocalUser = Omit<IUser, 'audioStats'> & {
  loginToken?: string;
  audioStats?: LocalAudioStats;
};

export interface Msg {
  value: string;
  time: string;
  user: string;
  paragraph?: boolean;
  definite?: boolean;
  isInterrupted?: boolean;
}

export interface SceneConfig {
  id: string;
  icon?: string;
  name?: string;
  questions?: string[];
  botName: string;
  isVision: boolean;
  isScreenMode: boolean;
  isInterruptMode: boolean;
}

export interface RTCConfig {
  AppId: string;
  RoomId: string;
  UserId: string;
  Token: string;
}

export interface RtcConnectionInfo {
  token: string;
  room_id: string;
  user_id: string;
  server_url: string;
  expire_at: number;
  interview_id: number;
  room_name: string;
}

export interface RoomState {
  time: number;
  roomId?: string;
  localUser: LocalUser;
  remoteUsers: IUser[];
  autoPlayFailUser: string[];
  /**
   * @brief 是否已加房
   */
  isJoined: boolean;
  /**
   * @brief 选择的场景
   */
  scene: string;
  /**
   * @brief 场景下的配置
   */
  sceneConfigMap: Record<string, SceneConfig>;
  /**
   * @brief RTC 相关的配置
   */
  rtcConfigMap: Record<string, RTCConfig>;

  /**
   * @brief AI 通话是否启用
   */
  isAIGCEnable: boolean;


  /**
   * @brief 候选人是否在房间
   */
  isCandidateInRoom: boolean;
  /**
   * @brief AI 是否正在说话
   */
  isAITalking: boolean;
  /**
   * @brief AI 思考中
   */
  isAIThinking: boolean;
  /**
   * @brief 用户是否正在说话
   */
  isUserTalking: boolean;
  /**
   * @brief 是否 Agent 正要离开
   */
  isAgentLeaving: boolean;
  /**
   * @brief 网络质量
   */
  networkQuality: NetworkQuality;

  /**
   * @brief 对话记录
   */
  msgHistory: Msg[];

  /**
   * @brief 当前的对话
   */
  currentConversation: {
    [user: string]: {
      /**
       * @brief 实时对话内容
       */
      msg: string;
      /**
       * @brief 当前实时对话内容是否能被定义为 "问题"
       */
      definite: boolean;
    };
  };

  /**
   * @brief 是否显示字幕
   */
  isShowSubtitle: boolean;

  /**
   * @brief 是否全屏
   */
  isFullScreen: boolean;

  /**
   * @brief 自定义人设名称
   */
  customSceneName: string;

  /**
   * @brief RTC 连接信息（Volc）
   */
  rtcConnectionInfo?: RtcConnectionInfo;
}

const initialState: RoomState = {
  time: -1,
  scene: '',
  sceneConfigMap: {},
  rtcConfigMap: {},
  remoteUsers: [],
  localUser: {
    publishAudio: false,
    publishVideo: false,
    publishScreen: false,
  },
  autoPlayFailUser: [],
  isJoined: false,
  isAIGCEnable: false,
  isAIThinking: false,
  isAITalking: false,
  isUserTalking: false,
  isAgentLeaving: false,
  networkQuality: NetworkQuality.UNKNOWN,

  isCandidateInRoom: false,

  msgHistory: [],
  currentConversation: {},
  isShowSubtitle: true,
  isFullScreen: false,
  customSceneName: '',
  rtcConnectionInfo: undefined,
};

export interface RoomActions {
  localJoinRoom: (payload: { roomId: string; user: LocalUser }) => void;
  localLeaveRoom: () => void;
  remoteUserJoin: (payload: IUser) => void;
  remoteUserLeave: (payload: { userId: string }) => void;
  updateScene: (payload: string) => void;
  updateSceneConfig: (payload: Record<string, SceneConfig>) => void;
  updateRTCConfig: (payload: Record<string, RTCConfig>) => void;
  updateLocalUser: (payload: Partial<LocalUser>) => void;
  updateNetworkQuality: (payload: { networkQuality: NetworkQuality }) => void;
  updateRemoteUser: (payload: IUser | IUser[]) => void;
  updateRoomTime: (payload: { time: number }) => void;
  addAutoPlayFail: (payload: { userId: string }) => void;
  removeAutoPlayFail: (payload: { userId: string }) => void;
  clearAutoPlayFail: () => void;
  updateAIGCState: (payload: { isAIGCEnable: boolean }) => void;
  updateAITalkState: (payload: { isAITalking: boolean }) => void;
  updateAIThinkState: (payload: { isAIThinking: boolean }) => void;
  clearHistoryMsg: () => void;
  setHistoryMsg: (payload: { text: string; user: string; paragraph?: boolean; definite?: boolean }) => void;
  setInterruptMsg: () => void;
  clearCurrentMsg: () => void;
  updateShowSubtitle: (payload: { isShowSubtitle: boolean }) => void;
  updateFullScreen: (payload: { isFullScreen: boolean }) => void;
  updatecustomSceneName: (payload: { customSceneName: string }) => void;
  setRtcConnectionInfo: (payload?: RtcConnectionInfo) => void;
  setCandidateInRoom: (inRoom: boolean) => void;
  getCandidateInRoom: () => boolean;
  updateAgentLeavingState: (payload: { isAgentLeaving: boolean }) => void;
}

export const useRoomStore = create<RoomState & RoomActions>()((set, get) => ({
  ...initialState,
  localJoinRoom: ({ roomId, user }) =>
    set((state) => ({ ...state, roomId, localUser: { ...state.localUser, ...user }, isJoined: true })),
  localLeaveRoom: () =>
    set((state) => ({
      ...state,
      roomId: undefined,
      time: -1,
      localUser: { publishAudio: false, publishVideo: false, publishScreen: false },
      remoteUsers: [],
      isJoined: false,
      isAgentLeaving: false,
    })),
  remoteUserJoin: (payload) => set((state) => ({ ...state, remoteUsers: [...state.remoteUsers, payload] })),
  remoteUserLeave: ({ userId }) =>
    set((state) => ({ ...state, remoteUsers: state.remoteUsers.filter((u) => u.userId !== userId) })),
  updateScene: (payload) => set((state) => ({ ...state, scene: payload })),
  updateSceneConfig: (payload) => set((state) => ({ ...state, sceneConfigMap: payload })),
  updateRTCConfig: (payload) =>
    set((state) => ({ ...state, rtcConfigMap: payload })),
  updateLocalUser: (payload) => set((state) => ({ ...state, localUser: { ...state.localUser, ...(payload || {}) } })),
  updateNetworkQuality: ({ networkQuality }) => set((state) => ({ ...state, networkQuality })),
  updateRemoteUser: (payload) =>
    set((state) => {
      const list = Array.isArray(payload) ? payload : [payload]
      const byId = new Map(state.remoteUsers.map((u) => [u.userId, u]))
      for (const u of list) {
        byId.set(u.userId, { ...(byId.get(u.userId) || {} as IUser), ...u })
      }
      return { ...state, remoteUsers: Array.from(byId.values()) }
    }),
  updateRoomTime: ({ time }) => set((state) => ({ ...state, time })),
  addAutoPlayFail: ({ userId }) =>
    set((state) => ({
      ...state,
      autoPlayFailUser: state.autoPlayFailUser.includes(userId)
        ? state.autoPlayFailUser
        : [...state.autoPlayFailUser, userId],
    })),
  removeAutoPlayFail: ({ userId }) =>
    set((state) => ({ ...state, autoPlayFailUser: state.autoPlayFailUser.filter((id) => id !== userId) })),
  clearAutoPlayFail: () => set((state) => ({ ...state, autoPlayFailUser: [] })),
  updateAIGCState: ({ isAIGCEnable }) => set((state) => ({ ...state, isAIGCEnable })),
  updateAITalkState: ({ isAITalking }) => set((state) => ({ ...state, isAITalking, isAIThinking: false, isUserTalking: false })),
  updateAIThinkState: ({ isAIThinking }) => set((state) => ({ ...state, isAIThinking, isUserTalking: false })),
  clearHistoryMsg: () => set((state) => ({ ...state, msgHistory: [] })),
  setHistoryMsg: (payload) =>
    set((state) => {
      const { paragraph, definite } = payload
      const lastMsg = state.msgHistory[state.msgHistory.length - 1] || ({} as Msg)
      const fromBot = payload.user === state.sceneConfigMap[state.scene]?.botName
      const lastMsgCompleted = fromBot ? lastMsg.paragraph : lastMsg.definite
      if (state.msgHistory.length) {
        if (lastMsgCompleted) {
          return {
            ...state,
            msgHistory: [
              ...state.msgHistory,
              { value: payload.text, time: new Date().toString(), user: payload.user, definite, paragraph },
            ],
          }
        } else {
          lastMsg.value = payload.text
          lastMsg.time = new Date().toString()
          lastMsg.paragraph = paragraph
          lastMsg.definite = definite
          lastMsg.user = payload.user
          return { ...state, msgHistory: [...state.msgHistory.slice(0, -1), lastMsg] }
        }
      } else {
        return {
          ...state,
          msgHistory: [
            { value: payload.text, time: new Date().toString(), user: payload.user, paragraph: payload.paragraph ?? false },
          ],
        }
      }
    }),
  setInterruptMsg: () =>
    set((state) => {
      const arr = [...state.msgHistory]
      for (let id = arr.length - 1; id >= 0; id--) {
        const msg = arr[id]
        if (msg.value) {
          if (!msg.definite) arr[id] = { ...msg, isInterrupted: true }
          break
        }
      }
      return { ...state, isAITalking: false, msgHistory: arr }
    }),
  clearCurrentMsg: () => set((state) => ({ ...state, currentConversation: {}, msgHistory: [], isAITalking: false, isUserTalking: false })),
  updateShowSubtitle: ({ isShowSubtitle }) => set((state) => ({ ...state, isShowSubtitle })),
  updateFullScreen: ({ isFullScreen }) => set((state) => ({ ...state, isFullScreen })),
  updatecustomSceneName: ({ customSceneName }) => set((state) => ({ ...state, customSceneName })),
  setRtcConnectionInfo: (payload) => set((state) => ({ ...state, rtcConnectionInfo: payload })),
  setCandidateInRoom: (inRoom: boolean) => set((state) => ({ ...state, isCandidateInRoom: inRoom })),
  getCandidateInRoom: () => get().isCandidateInRoom,
  updateAgentLeavingState: ({ isAgentLeaving }) => set((state) => ({ ...state, isAgentLeaving })),
}))

export default useRoomStore;
