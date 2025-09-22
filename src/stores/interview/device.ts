import { create } from 'zustand';
import { DeviceType } from '@/types/device';

export const medias = [DeviceType.Microphone];

export const MediaName = {
  [DeviceType.Microphone]: 'microphone',
  [DeviceType.Camera]: 'camera',
} as const;

export interface DeviceState {
  audioInputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
  selectedCamera?: string;
  selectedMicrophone?: string;
  devicePermissions: {
    audio: boolean;
    video: boolean;
  };
  // actions
  updateMediaInputs: (payload: Partial<Pick<DeviceState, 'audioInputs' | 'videoInputs'>>) => void;
  updateSelectedDevice: (payload: Partial<Pick<DeviceState, 'selectedCamera' | 'selectedMicrophone'>>) => void;
  setMicrophoneList: (list: MediaDeviceInfo[]) => void;
  setDevicePermissions: (p: { audio: boolean; video: boolean }) => void;
}

export const useDeviceStore = create<DeviceState>()((set) => ({
  audioInputs: [],
  videoInputs: [],
  devicePermissions: { audio: true, video: true },

  updateMediaInputs: (payload) =>
    set((state) => ({ ...state, ...payload })),

  updateSelectedDevice: (payload) =>
    set((state) => ({ ...state, ...payload })),

  setMicrophoneList: (list) =>
    set((state) => ({ ...state, audioInputs: list })),

  setDevicePermissions: (p) =>
    set((state) => ({ ...state, devicePermissions: p })),
}));

export default useDeviceStore;
