# 飞书 Web Components 集成文档

## 概述

本文档说明如何实现飞书 Web Components 的服务端接口，用于在前端展示飞书文档（工作指南）。

## 前端需求

前端需要调用以下接口获取飞书应用鉴权信息：

**接口路径**：`GET /talent/feishu/app-auth`

**查询参数**（可选）：
- `doc_token`：文档 token（从飞书文档 URL 中提取）

**示例请求**：
```
GET /talent/feishu/app-auth?doc_token=VahBw74EwigOtekBzQhciVSpnle
```

**响应格式**：
```json
{
  "app_id": "cli_a8d939d8527fd01c",
  "app_access_token": "t-g1044ghJRUIJJ5ZPPZMOHKWZISL33E4QSS3abcef",
  "ticket": "生成的票据",
  "expires_in": 7200
}
```

## 服务端实现步骤

### 1. 获取 app_access_token

使用飞书应用的 `app_id` 和 `app_secret` 获取应用访问令牌。

**接口地址**：
```
POST https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal
```

**请求头**：
```
Content-Type: application/json
```

**请求体**：
```json
{
  "app_id": "cli_a8d939d8527fd01c",
  "app_secret": "Q1nS3hxmfe9lSKSp0UfOyFCganEZthLp"
}
```

**响应示例**：
```json
{
  "code": 0,
  "msg": "success",
  "app_access_token": "t-g1044ghJRUIJJ5ZPPZMOHKWZISL33E4QSS3abcef",
  "expire": 7200
}
```

**注意事项**：
- `app_access_token` 有效期为 2 小时
- 在有效期内重复请求，返回的 token 不会改变
- 当有效期小于 30 分钟时，再次请求会生成新的 token，但旧的仍然有效
- **建议后端缓存 `app_access_token`**，避免频繁请求

### 2. 生成 Ticket

使用 `app_access_token` 生成 ticket，用于 Web Components 鉴权。

**接口地址**：
```
POST https://open.feishu.cn/open-apis/v1/ticket/get
```

**请求头**：
```
Authorization: Bearer {app_access_token}
Content-Type: application/json
```

**请求体**（可选，如果需要文档级别的 ticket）：
```json
{
  "doc_token": "VahBw74EwigOtekBzQhciVSpnle"
}
```

**响应示例**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "ticket": "生成的票据字符串"
  }
}
```

**注意事项**：
- 如果前端传递了 `doc_token` 参数，建议在请求体中包含它（用于文档级别的权限控制）
- Ticket 的有效期通常与 `app_access_token` 相关
- Ticket 应该与 `app_access_token` 一起缓存

### 3. 实现接口

#### Python 示例代码

```python
import requests
import time
from typing import Optional, Dict
from datetime import datetime, timedelta

class FeishuAuthService:
    def __init__(self):
        self.app_id = 'cli_a8d939d8527fd01c'
        self.app_secret = 'Q1nS3hxmfe9lSKSp0UfOyFCganEZthLp'
        self.base_url = 'https://open.feishu.cn/open-apis'
        
        # 缓存 app_access_token
        self._app_access_token: Optional[str] = None
        self._app_access_token_expires_at: Optional[datetime] = None
        
        # 缓存 ticket
        self._ticket: Optional[str] = None
        self._ticket_expires_at: Optional[datetime] = None
    
    def _get_app_access_token(self) -> str:
        """
        获取 app_access_token（带缓存）
        """
        # 检查缓存是否有效（提前 5 分钟刷新）
        if (self._app_access_token and 
            self._app_access_token_expires_at and 
            datetime.now() < self._app_access_token_expires_at - timedelta(minutes=5)):
            return self._app_access_token
        
        # 请求新的 token
        url = f'{self.base_url}/auth/v3/app_access_token/internal'
        payload = {
            'app_id': self.app_id,
            'app_secret': self.app_secret
        }
        
        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        data = response.json()
        if data.get('code') != 0:
            raise Exception(f"获取 app_access_token 失败: {data.get('msg')}")
        
        # 更新缓存
        self._app_access_token = data['app_access_token']
        expire_seconds = data.get('expire', 7200)
        self._app_access_token_expires_at = datetime.now() + timedelta(seconds=expire_seconds)
        
        return self._app_access_token
    
    def _get_ticket(self, doc_token: Optional[str] = None) -> str:
        """
        获取 ticket（带缓存）
        """
        # 检查缓存是否有效
        if (self._ticket and 
            self._ticket_expires_at and 
            datetime.now() < self._ticket_expires_at - timedelta(minutes=5)):
            return self._ticket
        
        # 获取 app_access_token
        app_access_token = self._get_app_access_token()
        
        # 请求 ticket
        url = f'{self.base_url}/v1/ticket/get'
        headers = {
            'Authorization': f'Bearer {app_access_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {}
        if doc_token:
            payload['doc_token'] = doc_token
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        if data.get('code') != 0:
            raise Exception(f"获取 ticket 失败: {data.get('msg')}")
        
        # 更新缓存（ticket 有效期通常与 app_access_token 相同）
        self._ticket = data['data']['ticket']
        self._ticket_expires_at = self._app_access_token_expires_at
        
        return self._ticket
    
    def get_auth_info(self, doc_token: Optional[str] = None) -> Dict[str, any]:
        """
        获取完整的鉴权信息
        """
        app_access_token = self._get_app_access_token()
        ticket = self._get_ticket(doc_token)
        
        # 计算过期时间（秒）
        expires_in = int((self._app_access_token_expires_at - datetime.now()).total_seconds())
        
        return {
            'app_id': self.app_id,
            'app_access_token': app_access_token,
            'ticket': ticket,
            'expires_in': expires_in
        }


# 在路由中使用
feishu_auth_service = FeishuAuthService()

@app.get('/talent/feishu/app-auth')
def get_feishu_app_auth(doc_token: Optional[str] = None):
    """
    获取飞书应用鉴权信息
    """
    try:
        auth_info = feishu_auth_service.get_auth_info(doc_token)
        return auth_info
    except Exception as e:
        return {'error': str(e)}, 500
```

#### Node.js/TypeScript 示例代码

```typescript
import axios from 'axios';

interface AppAccessTokenResponse {
  code: number;
  msg: string;
  app_access_token: string;
  expire: number;
}

interface TicketResponse {
  code: number;
  msg: string;
  data: {
    ticket: string;
  };
}

interface AuthInfo {
  app_id: string;
  app_access_token: string;
  ticket: string;
  expires_in: number;
}

class FeishuAuthService {
  private appId = 'cli_a8d939d8527fd01c';
  private appSecret = 'Q1nS3hxmfe9lSKSp0UfOyFCganEZthLp';
  private baseUrl = 'https://open.feishu.cn/open-apis';
  
  private appAccessToken: string | null = null;
  private appAccessTokenExpiresAt: number | null = null;
  
  private ticket: string | null = null;
  private ticketExpiresAt: number | null = null;
  
  private async getAppAccessToken(): Promise<string> {
    // 检查缓存是否有效（提前 5 分钟刷新）
    const now = Date.now();
    if (
      this.appAccessToken &&
      this.appAccessTokenExpiresAt &&
      now < this.appAccessTokenExpiresAt - 5 * 60 * 1000
    ) {
      return this.appAccessToken;
    }
    
    // 请求新的 token
    const response = await axios.post<AppAccessTokenResponse>(
      `${this.baseUrl}/auth/v3/app_access_token/internal`,
      {
        app_id: this.appId,
        app_secret: this.appSecret,
      }
    );
    
    if (response.data.code !== 0) {
      throw new Error(`获取 app_access_token 失败: ${response.data.msg}`);
    }
    
    // 更新缓存
    this.appAccessToken = response.data.app_access_token;
    const expireSeconds = response.data.expire || 7200;
    this.appAccessTokenExpiresAt = now + expireSeconds * 1000;
    
    return this.appAccessToken;
  }
  
  private async getTicket(docToken?: string): Promise<string> {
    // 检查缓存是否有效
    const now = Date.now();
    if (
      this.ticket &&
      this.ticketExpiresAt &&
      now < this.ticketExpiresAt - 5 * 60 * 1000
    ) {
      return this.ticket;
    }
    
    // 获取 app_access_token
    const appAccessToken = await this.getAppAccessToken();
    
    // 请求 ticket
    const payload: { doc_token?: string } = {};
    if (docToken) {
      payload.doc_token = docToken;
    }
    
    const response = await axios.post<TicketResponse>(
      `${this.baseUrl}/v1/ticket/get`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${appAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.data.code !== 0) {
      throw new Error(`获取 ticket 失败: ${response.data.msg}`);
    }
    
    // 更新缓存
    this.ticket = response.data.data.ticket;
    this.ticketExpiresAt = this.appAccessTokenExpiresAt;
    
    return this.ticket;
  }
  
  async getAuthInfo(docToken?: string): Promise<AuthInfo> {
    const appAccessToken = await this.getAppAccessToken();
    const ticket = await this.getTicket(docToken);
    
    // 计算过期时间（秒）
    const expiresIn = this.appAccessTokenExpiresAt
      ? Math.floor((this.appAccessTokenExpiresAt - Date.now()) / 1000)
      : 7200;
    
    return {
      app_id: this.appId,
      app_access_token: appAccessToken,
      ticket,
      expires_in: expiresIn,
    };
  }
}

// 使用示例（Express）
const feishuAuthService = new FeishuAuthService();

app.get('/talent/feishu/app-auth', async (req, res) => {
  try {
    const { doc_token } = req.query;
    const authInfo = await feishuAuthService.getAuthInfo(
      doc_token as string | undefined
    );
    res.json(authInfo);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});
```

## 配置说明

### 飞书应用配置

```python
feishu_app_id: str = 'cli_a8d939d8527fd01c'
feishu_app_secret: str = 'Q1nS3hxmfe9lSKSp0UfOyFCganEZthLp'
```

### 其他配置（可选，用于其他功能）

```python
feishu_webhook_url: str = 'https://open.feishu.cn/open-apis/bot/v2/hook/720518c2-1e37-413d-ac22-f6c5cbd3be99'
talent_demand_app_token: str = 'XImxbDyZvaHOtYsB6PWcMBK4nOg'
talent_demand_table_id: str = 'tblmmBpnv8M6lAPH'
bitable_base_url: str = 'https://open.feishu.cn/open-apis'
```

## 错误处理

### 常见错误码

- `99991663`：app_access_token 无效或过期
- `99991664`：app_id 或 app_secret 错误
- `99991665`：请求频率过高

### 错误处理建议

1. **实现重试机制**：当 token 过期时自动刷新
2. **记录错误日志**：便于排查问题
3. **返回友好的错误信息**：前端可以显示错误提示

## 性能优化建议

1. **缓存 app_access_token**：避免频繁请求，减少 API 调用
2. **提前刷新 token**：在过期前 5 分钟刷新，避免请求时 token 已过期
3. **使用连接池**：复用 HTTP 连接，提高性能
4. **监控 token 使用情况**：记录 token 获取频率，优化缓存策略

## 安全注意事项

1. **保护 app_secret**：不要在前端代码中暴露
2. **使用 HTTPS**：所有 API 调用必须使用 HTTPS
3. **限制访问频率**：防止恶意请求
4. **验证请求来源**：确保请求来自合法的前端应用

## 测试

### 测试步骤

1. 调用接口获取鉴权信息
2. 验证返回的字段是否完整
3. 检查 token 是否有效（可以尝试调用其他飞书 API）
4. 测试缓存机制是否正常工作
5. 测试 token 过期后的自动刷新

### 测试用例

```bash
# 测试不带 doc_token
curl -X GET "http://localhost:8000/talent/feishu/app-auth"

# 测试带 doc_token
curl -X GET "http://localhost:8000/talent/feishu/app-auth?doc_token=VahBw74EwigOtekBzQhciVSpnle"
```

## 参考文档

- [飞书开放平台 - 应用鉴权](https://open.feishu.cn/document/ukTMukTMukTM/ukDNz4SO0MjL5QzM)
- [飞书开放平台 - 网页组件](https://open.larkoffice.com/document/common-capabilities/web-components/uYDO3YjL2gzN24iN3cjN/introduction)
- [飞书开放平台 - 获取应用访问令牌](https://open.feishu.cn/document/ukTMukTMukTM/ukDNz4SO0MjL5QzM)

## 更新日志

- 2024-12-XX：初始版本，支持飞书 Web Components 集成


