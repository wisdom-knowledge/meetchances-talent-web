# 火山 IM 未读消息数逻辑说明

## 设计思路

火山 IM 在本系统中**仅作为消息推送通知的渠道**，实际的未读消息数和已读状态管理都由后端接口控制。

## 核心流程

### 1. 初始化获取未读数

```
用户登录
  ↓
初始化火山 IM
  ↓
调用 GET /getNews 获取初始未读数
  ↓
显示未读徽章
```

### 2. 接收消息通知

```
后端向火山 IM 发送消息
  ↓
前端火山 IM SDK 收到消息
  ↓
触发 MessageUpsert 事件
  ↓
解析消息内容，判断是否需要刷新未读数
  ↓
如果需要：调用 GET /getNews 获取最新未读数
  ↓
更新未读徽章显示
```

### 3. 标记消息已读

```
用户点击查看消息
  ↓
调用 POST /messages/mark-read 标记已读
  ↓
接口返回成功
  ↓
调用 GET /getNews 刷新未读数
  ↓
更新未读徽章显示
```

## 接口定义

### 1. 获取未读消息数

**接口地址**: `GET /messages/unread_count`

**返回格式**:
```json
{
  "status_code": 0,
  "status_msg": "success",
  "data": {
    "unread_count": 5
  }
}
```

### 2. 标记消息已读

**接口地址**: `POST /messages/mark-read`

**请求参数**:
```json
{
  "message_ids": [1, 2, 3]
}
```

**返回格式**:
```json
{
  "status_code": 0,
  "status_msg": "success",
  "data": {
    "updated": 3
  }
}
```

**特点**:
- 支持批量标记
- `message_ids` 是消息 ID 数组
- 返回实际更新的消息数量

## 代码实现

### API 层 (src/lib/api.ts)

```typescript
/**
 * 获取未读消息数
 */
export async function fetchUnreadCount(): Promise<number> {
  const response = await api.get<{ unreadCount: number }>('/getNews')
  return (response as unknown as { unreadCount: number }).unreadCount
}

/**
 * 标记消息为已读
 */
export async function markMessageAsRead(messageId: string): Promise<void> {
  await api.post('/messages/mark-read', { message_id: messageId })
}
```

### IM 管理层 (src/lib/im.ts)

```typescript
class IMManager {
  async init(userId: string, token: () => Promise<string>): Promise<void> {
    // ... 创建 IM 实例

    // 订阅消息事件 - 仅作为通知渠道
    this.instance.event.subscribe(IMEvent.MessageUpsert, (message) => {
      // 通知监听器，并根据消息内容决定是否刷新未读数
      this.notifyMessageListeners(message)
    })

    // 初始化成功后，获取初始未读数
    this.fetchAndUpdateUnreadCount()
  }

  /**
   * 通知所有消息监听器，并根据消息内容决定是否刷新未读数
   */
  private notifyMessageListeners(message: unknown): void {
    // 先通知所有监听器
    this.messageListeners.forEach((callback) => callback(message))

    // 根据消息内容判断是否需要刷新未读数
    if (this.shouldRefreshUnreadCount(message)) {
      this.fetchAndUpdateUnreadCount()
    }
  }

  /**
   * 判断是否需要刷新未读数
   * @param message 火山IM消息对象
   */
  private shouldRefreshUnreadCount(message: unknown): boolean {
    if (message && typeof message === 'object') {
      const msg = message as Record<string, unknown>
      
      // 如果消息有 needRefreshUnread 标志
      if (msg.needRefreshUnread === true) return true
      
      // 如果消息类型是通知类型
      if (msg.type === 'notification' || msg.messageType === 'system') {
        return true
      }
    }
    
    // 默认：收到任何消息都刷新未读数
    return true
  }

  /**
   * 从后端接口获取并更新未读数
   */
  async fetchAndUpdateUnreadCount(): Promise<void> {
    const count = await fetchUnreadCount()
    this.notifyUnreadCountListeners(count)
  }
}
```

### 组件层 (src/components/notification-center.tsx)

```typescript
// 标记消息为已读
const markAsRead = async (messageId: string) => {
  // 1. 调用后端 API 标记已读
  await markMessageAsRead(messageId)
  
  // 2. 更新本地状态
  setMessages((prev) =>
    prev.map((msg) => (msg.id === messageId ? { ...msg, isRead: true } : msg))
  )
  
  // 3. 重新获取未读数
  const newUnreadCount = await fetchUnreadCount()
  setUnreadCount(newUnreadCount)
}
```

## 数据流向图

```
┌─────────────────────────────────────────────────────────────┐
│                         后端系统                              │
│                                                               │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐           │
│  │ 业务逻辑 │─────▶│ 消息数据 │◀────│ 火山IM   │           │
│  └──────────┘      └──────────┘      └──────────┘           │
│       │                  │                  │                 │
└───────┼──────────────────┼──────────────────┼─────────────────┘
        │                  │                  │
        │ 创建消息         │ 查询未读数      │ 推送通知
        │                  │                  │
        ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                         前端系统                              │
│                                                               │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐           │
│  │  UI层    │◀────│  API层   │      │ IM SDK   │           │
│  │(组件)    │      │(api.ts)  │      │(im.ts)   │           │
│  └──────────┘      └──────────┘      └──────────┘           │
│       │                  ▲                  │                 │
│       │                  │                  │                 │
│       │ 标记已读         │ 获取未读数      │ 收到通知        │
│       └──────────────────┴──────────────────┘                │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## 优势

1. **数据一致性**: 未读数由后端统一管理，不会出现前后端不一致的情况
2. **简化逻辑**: 火山 IM 只作为推送通道，不承担数据存储和状态管理
3. **易于扩展**: 未来可以轻松切换到其他推送服务（如 WebSocket、SSE 等）
4. **降低复杂度**: 不需要在火山 IM 和后端之间同步状态

## 消息过滤机制

### 判断逻辑

`shouldRefreshUnreadCount()` 方法根据消息内容判断是否需要刷新未读数：

1. **优先检查标志位**: `message.needRefreshUnread === true`
2. **检查消息类型**: `message.type === 'notification'` 或 `message.messageType === 'system'`
3. **默认行为**: 收到任何消息都刷新（可根据实际需求调整）

### 自定义过滤

后端可以在推送消息时添加字段来控制前端行为：

```json
{
  "needRefreshUnread": true,     // 是否需要刷新未读数
  "type": "notification",         // 消息类型
  "messageType": "system",        // 系统消息
  "content": "您有一条新的站内信"
}
```

## 注意事项

1. **智能刷新**: 根据消息内容判断是否需要刷新，减少不必要的 API 调用
2. **错误处理**: 接口调用失败时，前端应静默处理，不影响其他功能
3. **缓存策略**: 可以考虑短时间内缓存未读数，避免频繁请求
4. **推送延迟**: 火山 IM 推送可能有延迟，实际未读数以接口返回为准
5. **消息格式**: 后端推送的消息格式应该包含必要的元数据，方便前端判断

## 后续优化

1. ✅ **智能过滤**: 根据消息内容决定是否刷新（已实现）
2. **防抖处理**: 短时间内多次收到消息通知时，合并请求
3. **乐观更新**: 标记已读时，先更新UI，再调用接口
4. **长连接**: 考虑使用 WebSocket 替代轮询，实现真正的实时推送
5. **离线同步**: 用户离线期间的消息，上线后自动同步
6. **消息缓存**: 缓存消息内容，减少重复请求

## 相关文件

- `src/lib/im.ts` - IM 管理器
- `src/lib/api.ts` - API 接口定义
- `src/components/notification-center.tsx` - 通知中心组件
- `src/hooks/use-im-init.ts` - IM 初始化 Hook

