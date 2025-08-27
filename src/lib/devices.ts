export type SupportedMediaDeviceKind = 'audioinput' | 'audiooutput' | 'videoinput'

const DEVICE_KEY_MAP: Record<SupportedMediaDeviceKind, string> = {
  audioinput: 'mc_pref_audioinput',
  audiooutput: 'mc_pref_audiooutput',
  videoinput: 'mc_pref_videoinput',
}

export function getPreferredDeviceId(kind: SupportedMediaDeviceKind): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(DEVICE_KEY_MAP[kind])
  } catch (_e) {
    return null
  }
}

export function setPreferredDeviceId(kind: SupportedMediaDeviceKind, deviceId: string | null | undefined) {
  if (typeof window === 'undefined') return
  try {
    const key = DEVICE_KEY_MAP[kind]
    if (!deviceId) {
      localStorage.removeItem(key)
      return
    }
    localStorage.setItem(key, deviceId)
  } catch (_e) {
    // ignore storage errors
  }
}


