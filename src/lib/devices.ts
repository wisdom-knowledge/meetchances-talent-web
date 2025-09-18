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

/**
 * 通过设备名称匹配找到默认设备的真实ID
 * @param kind 设备类型
 * @param devices 设备列表
 * @returns 具体的设备ID或null
 */
export async function resolveDefaultDeviceByName(
  _kind: SupportedMediaDeviceKind,
  devices: MediaDeviceInfo[]
): Promise<string | null> {
  try {
    // 找到标记为 "default" 的设备
    const defaultDevice = devices.find(device => device.deviceId === 'default')
    if (!defaultDevice) return null

    // 提取默认设备名称中的实际设备名（去掉 "默认 - " 前缀）
    const defaultLabel = defaultDevice.label
    const actualDeviceName = defaultLabel.replace(/^默认\s*-\s*/, '').trim()


    // 在设备列表中找到匹配的具体设备
    const matchedDevice = devices.find(device =>
      device.deviceId !== 'default' &&
      device.label === actualDeviceName
    )


    return matchedDevice?.deviceId || devices[0]?.deviceId || null
  } catch (_e) {
    return null
  }
}

/**
 * 设置音频元素的播放设备
 * @param audioElement HTML音频元素
 * @param deviceId 设备ID
 * @returns Promise<boolean> 是否设置成功
 */
export async function setAudioSinkId(audioElement: HTMLAudioElement, deviceId: string): Promise<boolean> {
  try {
    // 检查浏览器是否支持 setSinkId
    if (typeof audioElement.setSinkId !== 'function') {
      // eslint-disable-next-line no-console
      console.warn('setSinkId is not supported in this browser')
      return false
    }

    // 跳过默认设备或空设备ID
    if (!deviceId || deviceId === 'default' || deviceId === '') {
      return true
    }

    await audioElement.setSinkId(deviceId)
    return true
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to set audio sink ID:', error)
    return false
  }
}

/**
 * 获取当前实际使用的默认设备ID
 * 优先通过设备名称匹配，fallback到媒体流检测
 * @param kind 设备类型
 * @param devices 可用设备列表
 * @returns 具体的设备ID或null
 */
export async function resolveRealDeviceId(
  kind: SupportedMediaDeviceKind,
  devices?: MediaDeviceInfo[]
): Promise<string | null> {
  try {
    // 如果没有传入设备列表，先获取
    if (!devices || devices.length === 0) {
      // 先请求媒体权限
      try {
        let stream: MediaStream | null = null
        if (kind === 'audioinput') {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        } else if (kind === 'videoinput') {
          stream = await navigator.mediaDevices.getUserMedia({ video: true })
        }
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
        }
      } catch (_e) {
        // Ignore permission errors
      }

      const allDevices = await navigator.mediaDevices.enumerateDevices()
      devices = allDevices.filter(device => device.kind === kind)
    }


    // 方法1: 通过设备名称匹配
    const nameMatchedId = await resolveDefaultDeviceByName(kind, devices)
    if (nameMatchedId) {
      return nameMatchedId
    }

    // 方法2: 通过媒体流检测（fallback）
    try {
      let stream: MediaStream | null = null
      if (kind === 'audioinput') {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      } else if (kind === 'videoinput') {
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
      }

      if (stream) {
        const tracks = kind === 'audioinput' ? stream.getAudioTracks() : stream.getVideoTracks()
        if (tracks.length > 0) {
          const settings = tracks[0].getSettings()
          const actualDeviceId = settings.deviceId
          stream.getTracks().forEach(track => track.stop())

          if (actualDeviceId && actualDeviceId !== 'default') {
            return actualDeviceId
          }
        }
      }
    } catch (_e) {
      // Ignore stream errors
    }

    // 方法3: fallback 到第一个可用设备
    const firstRealDevice = devices.find(device => device.deviceId && device.deviceId !== 'default')
    const fallbackId = firstRealDevice?.deviceId || null
    return fallbackId
  } catch (_e) {
    return null
  }
}

/**
 * 智能保存设备偏好，如果是 'default' 则尝试保存具体的设备ID
 * @param kind 设备类型
 * @param deviceId 设备ID
 * @param devices 可用设备列表（可选）
 */
export async function setPreferredDeviceIdSmart(
  kind: SupportedMediaDeviceKind,
  deviceId: string | null | undefined,
  devices?: MediaDeviceInfo[]
) {
  if (!deviceId) {
    setPreferredDeviceId(kind, deviceId)
    return
  }

  // 如果是 'default'，尝试获取真实的设备ID
  if (deviceId === 'default') {
    const realId = await resolveRealDeviceId(kind, devices)
    const finalId = realId || deviceId
    setPreferredDeviceId(kind, finalId)
  } else {
    setPreferredDeviceId(kind, deviceId)
  }
}


