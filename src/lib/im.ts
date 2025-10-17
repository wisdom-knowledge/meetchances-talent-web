import { BytedIM, IMEvent, im_proto } from '@volcengine/im-web-sdk'
import { fetchUnreadCount } from '@/lib/api'

// 火山 IM 配置
const APP_ID = Number(import.meta.env.VITE_IM_APP_ID) || 910026
const API_URL = 'https://imapi.volcvideo.com'
const FRONTIER_URL = 'wss://frontier-sinftob.ivolces.com/ws/v2'

/**
 * 火山 IM 管理类
 * 封装火山 IM SDK 的初始化、消息收发、未读数管理等功能
 */
class IMManager {
  private instance: BytedIM | null = null
  private initialized = false
  private initPromise: Promise<void> | null = null
  private messageListeners: Array<(message: unknown) => void> = []
  private unreadCountListeners: Array<(count: number) => void> = []

  /**
   * 初始化 IM 实例
   * @param userId 用户ID
   * @param token Token 获取函数
   */
  async init(userId: string, token: () => Promise<string>): Promise<void> {
    // 如果已经在初始化中，返回现有的 Promise
    if (this.initPromise) {
      return this.initPromise
    }

    // 如果已经初始化完成，直接返回
    if (this.initialized && this.instance) {
      return Promise.resolve()
    }

    this.initPromise = (async () => {
      try {
        // 创建实例
        this.instance = new BytedIM({
          appId: APP_ID,
          userId,
          deviceId: userId,
          apiUrl: API_URL,
          frontierUrl: FRONTIER_URL,
          authType: im_proto.AuthType.TOKEN_AUTH,
          debug: import.meta.env.DEV, // 开发环境启用调试
          disableInitPull: true,
          token,
        })

        // 订阅消息事件 - 火山IM只作为通知渠道
        this.instance.event.subscribe(IMEvent.MessageUpsert, (message) => {
          // 通知监听器，由监听器决定是否需要刷新未读数
          this.notifyMessageListeners(message)
        })

        // 发起初始化
        await this.instance.init()
        this.initialized = true

        // 初次获取未读数
        this.fetchAndUpdateUnreadCount()
      } catch (error) {
        // 初始化失败
        this.initPromise = null
        throw error
      }
    })()

    return this.initPromise
  }

  /**
   * 获取 IM 实例
   */
  getInstance(): BytedIM | null {
    return this.instance
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * 获取会话列表
   */
  getConversationList() {
    if (!this.instance) {
      return []
    }
    return this.instance.getConversationList()
  }

  /**
   * 从后端接口获取并更新未读数
   * 只有在有订阅者时才会调用 API
   */
  async fetchAndUpdateUnreadCount(): Promise<void> {
    // 如果没有订阅者，不调用 API
    if (this.unreadCountListeners.length === 0) {
      return
    }
    
    try {
      const count = await fetchUnreadCount()
      this.notifyUnreadCountListeners(count)
    } catch (_error) {
      // 静默处理错误
    }
  }


  /**
   * 订阅消息更新
   */
  onMessage(callback: (message: unknown) => void): () => void {
    this.messageListeners.push(callback)
    // 返回取消订阅函数
    return () => {
      this.messageListeners = this.messageListeners.filter((cb) => cb !== callback)
    }
  }

  /**
   * 订阅未读数变化
   */
  onUnreadCountChange(callback: (count: number) => void): () => void {
    this.unreadCountListeners.push(callback)
    // 立即获取一次未读数
    this.fetchAndUpdateUnreadCount()
    // 返回取消订阅函数
    return () => {
      this.unreadCountListeners = this.unreadCountListeners.filter((cb) => cb !== callback)
    }
  }

  /**
   * 通知所有消息监听器，并根据消息内容决定是否刷新未读数
   */
  private notifyMessageListeners(message: unknown): void {
    // 先通知所有监听器
    this.messageListeners.forEach((callback) => {
      try {
        callback(message)
      } catch (_error) {
        // 静默处理错误
      }
    })

    // 根据消息内容判断是否需要刷新未读数
    // 可以根据消息类型、内容等字段来判断
    const shouldUpdateUnreadCount = this.shouldRefreshUnreadCount(message)
    if (shouldUpdateUnreadCount) {
      this.fetchAndUpdateUnreadCount()
    }
  }

  /**
   * 判断是否需要刷新未读数
   * @param message 火山IM消息对象
   */
  private shouldRefreshUnreadCount(message: unknown): boolean {
    // 这里可以根据实际的消息结构来判断
    // 例如：检查消息类型、标志位等
    
    // 示例：如果消息包含特定标志
    if (message && typeof message === 'object') {
      const msg = message as Record<string, unknown>
      
      // 如果消息有 needRefreshUnread 标志
      if (msg.needRefreshUnread === true) {
        return true
      }
      
      // 如果消息类型是通知类型
      if (msg.type === 'notification' || msg.messageType === 'system') {
        return true
      }
    }
    
    // 默认：收到任何消息都刷新未读数
    return true
  }

  /**
   * 通知未读数变化
   */
  private notifyUnreadCountListeners(count: number): void {
    this.unreadCountListeners.forEach((callback) => {
      try {
        callback(count)
      } catch (_error) {
        // 静默处理错误
      }
    })
  }

  /**
   * 销毁 IM 实例
   */
  destroy(): void {
    if (this.instance) {
      // 清理事件监听
      this.messageListeners = []
      this.unreadCountListeners = []
      // 销毁实例
      this.instance = null
      this.initialized = false
      this.initPromise = null
    }
  }
}

// 导出单例
export const imManager = new IMManager()

