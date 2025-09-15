export type SupportedMediaDeviceKind = 'audioinput' | 'audiooutput' | 'videoinput'

const DEVICE_KEY_MAP: Record<SupportedMediaDeviceKind, string> = {
  audioinput: 'mc_pref_audioinput',
  audiooutput: 'mc_pref_audiooutput',
  videoinput: 'mc_pref_videoinput',
}

/**
 * 检查浏览器是否支持音频输出设备切换
 * @returns 是否支持 setSinkId API
 */
export function isAudioOutputSupported(): boolean {
  if (typeof window === 'undefined') return false

  // 检查 HTMLMediaElement 是否支持 setSinkId 方法
  const audio = document.createElement('audio')
  return typeof audio.setSinkId === 'function'
}

/**
 * 获取当前浏览器和平台的音频输出支持信息
 * @returns 包含支持信息和建议的对象
 */
export function getAudioOutputSupportInfo() {
  const isSupported = isAudioOutputSupported()
  const userAgent = navigator.userAgent.toLowerCase()

  let browserName = 'Unknown'
  let recommendation = ''

  if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    browserName = 'Chrome'
    recommendation = isSupported ? '' : '请确保使用 Chrome 66+ 版本并在 HTTPS 环境下访问'
  } else if (userAgent.includes('firefox')) {
    browserName = 'Firefox'
    recommendation = '音频输出设备切换在 Firefox 中支持有限，建议使用 Chrome'
  } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    browserName = 'Safari'
    recommendation = 'Safari 不支持音频输出设备切换，建议使用 Chrome 或 Edge'
  } else if (userAgent.includes('edg')) {
    browserName = 'Edge'
    recommendation = isSupported ? '' : '请确保使用 Edge 79+ 版本并在 HTTPS 环境下访问'
  }

  return {
    isSupported,
    browserName,
    recommendation,
    isMobile: /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  }
}

/**
 * 优化设备名称显示
 * @param device MediaDeviceInfo 对象
 * @returns 格式化后的设备名称
 */
export function formatDeviceName(device: MediaDeviceInfo): string {
  if (!device.label) {
    return device.deviceId === 'default' ? '系统默认' : device.deviceId
  }
  
  let name = device.label
  
  // 移除常见的冗余前缀
  name = name.replace(/^默认\s*-\s*/, '')
  name = name.replace(/^Default\s*-\s*/i, '')
  
  // 如果是默认设备，添加标识
  if (device.deviceId === 'default') {
    name = `${name} (默认)`
  }
  
  return name
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


    return matchedDevice?.deviceId || null
  } catch (_e) {
    return null
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


