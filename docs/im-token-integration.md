# 火山 IM Token 集成说明

## 概述

火山 IM Token 在用户进入系统后立即获取，与 `/talent/me` 接口采用相同的调用时机和缓存策略。

## 接口规范

### 端点

```
GET /messages/im/token
```

### 响应格式

```json
{
  "status_code": 0,
  "status_msg": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expire_at": 1697894400
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| token | string | 火山 IM Token |
| expire_at | number | Token 过期时间（Unix 时间戳，秒） |

## 前端实现

### 1. API 层

```typescript
// src/lib/api.ts
export interface IMTokenResponse {
  token: string
  expire_at: number
}

export async function fetchIMToken(): Promise<IMTokenResponse> {
  return api.get('/messages/im/token') as unknown as Promise<IMTokenResponse>
}
```

### 2. 认证布局层

在 `authenticated-layout.tsx` 中，Token 获取与用户信息获取并行：

```typescript
// src/components/layout/authenticated-layout.tsx
export function AuthenticatedLayout() {
  // 获取用户信息
  const { data } = useQuery({
    queryKey: ['current-user'],
    queryFn: fetchTalentMe,
    staleTime: 5 * 60 * 1000,
  })

  // 获取 IM Token
  const { data: imTokenData } = useQuery({
    queryKey: ['im-token'],
    queryFn: fetchIMToken,
    staleTime: 20 * 60 * 1000, // 20 分钟缓存
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!data?.id, // 用户信息获取成功后才获取 token
  })

  // 初始化火山 IM
  useIMInit(imTokenData)
  
  // ...
}
```

### 3. IM 初始化 Hook

```typescript
// src/hooks/use-im-init.ts
export function useIMInit(imTokenData?: IMTokenResponse) {
  const authUser = useAuthStore((s) => s.auth.user)

  useEffect(() => {
    if (!authUser?.id || !imTokenData?.token) {
      return
    }

    const getToken = async (): Promise<string> => {
      return imTokenData.token
    }

    const userId = String(authUser.id)
    imManager.init(userId, getToken)
  }, [authUser?.id, imTokenData])
}
```

## 调用时机

```
用户登录
  ↓
进入系统
  ↓
AuthenticatedLayout 挂载
  ↓
并行调用:
  ├─ GET /talent/me        (用户信息)
  └─ GET /messages/im/token (IM Token)
       ↓
       等待用户信息获取成功 (enabled: !!data?.id)
       ↓
       初始化火山 IM
       ↓
       建立 IM 连接
```

## 缓存策略

### 前端缓存（TanStack Query）

```typescript
{
  queryKey: ['im-token'],
  staleTime: 20 * 60 * 1000,  // 20 分钟数据保持新鲜
  refetchOnWindowFocus: false, // 窗口聚焦不刷新
  retry: 1,                    // 失败重试 1 次
}
```

### 后端缓存（推荐使用 Redis）

```python
# 推荐配置
TOKEN_EXPIRE_TIME = 86400  # Token 有效期 24 小时
CACHE_EXPIRE_TIME = 82800  # Redis 缓存 23 小时

# 缓存 key
cache_key = f"im_token:{user_id}"
```

## 优势

1. **统一管理**: 与用户信息获取采用相同的模式
2. **自动缓存**: TanStack Query 自动处理缓存和过期
3. **性能优化**: 20 分钟内不重复请求
4. **依赖明确**: 只有用户信息获取成功后才获取 token
5. **类型安全**: TypeScript 类型定义完整

## Token 刷新机制

### 自动刷新场景

1. **缓存过期**: 20 分钟后重新请求
2. **Token 失效**: 火山 IM SDK 自动调用 token 函数
3. **用户重新登录**: AuthenticatedLayout 重新挂载

### 手动刷新

```typescript
import { useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()

// 手动刷新 token
queryClient.invalidateQueries({ queryKey: ['im-token'] })
```

## 错误处理

### 获取失败

```typescript
{
  retry: 1,  // 失败重试 1 次
  // 失败后不影响其他功能
  // IM 初始化会在 useIMInit 中静默失败
}
```

### 兜底方案

如果 token 获取失败：
1. IM 不会初始化
2. 未读消息数显示为 0
3. 不影响其他功能正常使用

如果未读数获取失败（`/messages/unread_count`）：
1. 返回 0
2. 不抛出错误，静默处理
3. 用户体验不受影响

如果消息列表获取失败（`/messages/`）：
1. 抛出错误，由调用方处理
2. UI 层会静默处理，显示空列表
3. 不影响其他功能正常使用

## 调试

### 查看 Token 信息

```typescript
// 在 DevTools Console 中
import { useQuery } from '@tanstack/react-query'

// 查看缓存的 token 数据
queryClient.getQueryData(['im-token'])
```

### 强制刷新 Token

```typescript
// 使缓存失效并重新获取
queryClient.invalidateQueries({ queryKey: ['im-token'] })

// 或直接调用
await fetchIMToken()
```

## 与 `/talent/me` 的对比

| 特性 | /talent/me | /messages/im/token |
|------|------------|-------------------|
| 调用时机 | 进入系统后立即 | 用户信息获取成功后 |
| 缓存时间 | 5 分钟 | 20 分钟 |
| 重试策略 | 失败不重试 | 失败重试 1 次 |
| 依赖条件 | 无 | 需要 user.id |
| 失败影响 | 退出登录 | 不影响其他功能 |

## 最佳实践

1. ✅ Token 在服务端缓存（Redis）
2. ✅ 前端使用 TanStack Query 管理
3. ✅ 设置合理的缓存时间（比 token 有效期短）
4. ✅ 失败时静默处理，不影响用户体验
5. ✅ 提供手动刷新机制
6. ✅ 记录详细日志便于排查问题

## APM 监控配置

### 排除火山 IM 请求

火山 IM SDK 使用轮询方式获取消息，会产生大量的 HTTP 请求。为了避免这些请求被 APM 监控和上报（产生噪音数据），我们在 APM 配置中排除了火山 IM 的所有请求。

**配置位置**: `src/lib/apm.ts`

```typescript
const IGNORED_FETCH_URLS: RegExp[] = [
  /^https?:\/\/imapi\.volcvideo\.com\/.*/, // 火山 IM API（包括轮询接口）
  /^https?:\/\/frontier.*\.ivolces\.com\/.*/, // 火山 IM WebSocket 连接
]
```

### 排除的请求

1. **火山 IM API**: `https://imapi.volcvideo.com/*`
   - 包括消息轮询接口 `/v1/message/get_by_user`
   - 其他 IM 相关的 HTTP 请求

2. **火山 IM WebSocket**: `wss://frontier*.ivolces.com/*`
   - IM 的 WebSocket 连接
   - 实时消息推送

### 优势

- ✅ 减少 APM 数据噪音
- ✅ 降低 APM 监控成本
- ✅ 保留业务关键接口的监控
- ✅ 不影响其他 API 的正常上报

## 相关文件

- `src/lib/api.ts` - API 接口定义
- `src/components/layout/authenticated-layout.tsx` - Token 获取和缓存
- `src/hooks/use-im-init.ts` - IM 初始化逻辑
- `src/lib/im.ts` - IM 管理器
- `src/lib/apm.ts` - APM 配置（包括 IM 请求排除规则）
- `docs/backend-api-spec.md` - 后端接口规范

