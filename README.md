
## 千识专家端前端项目

基于 Shadcn Admin 的 fork 并深度定制，面向千识招聘C端用户的操作平台。

### 访问地址

- 线上环境: [talent.meetchances.com](https://talent.meetchances.com/)
- 测试环境: [talent-boe.meetchances.com](https://talent-boe.meetchances.com)

### 快速开始（本地开发）

先决条件：

- Node.js 22.x（推荐与 CI 一致）
- pnpm 9.x

启动步骤：

```bash
pnpm install
cp env.local.example .env.local # 如首次配置，参考下方“环境变量清单”
pnpm dev
```

常用脚本：

```bash
pnpm dev        # 本地开发，默认端口 5173
pnpm build      # 生产构建（输出到 dist/）
pnpm preview    # 预览 dist 构建产物
pnpm lint       # 代码检查
```

### 技术选型

- React 19 + TypeScript 5.8
- Vite 7 + SWC
- 路由：TanStack Router（文件系统路由）
- UI：Shadcn/ui（Radix UI + Tailwind CSS 4.1）
- 状态：TanStack Query（服务端）+ Zustand（客户端）
- 表单：React Hook Form + Zod
- 身份验证：Clerk
- 规范：ESLint + Prettier + TypeScript ESLint

### 目录结构（简要）

```
src/
├── components/          # 共享组件
├── features/            # 业务模块
├── routes/              # 文件系统路由（受保护路由在 _authenticated/）
├── lib/                 # 工具、API 封装
└── utils/               # 业务工具函数
```

### 构建与部署

- 本地构建：`pnpm build`，产物位于 `dist/`。
- CI/CD：基于 GitHub Actions（见 `.github/workflows/deploy.yml`）。
  - `test` 分支：部署到测试环境。
  - `main` 分支：部署到生产环境。
  - 采用 GitHub Environments 注入构建期 `VITE_*` 变量与部署 Secrets；在 `production` 与 `test` 环境分别维护同名 Secrets。

部署所需的环境级 Secrets（GitHub 仓库 -> Settings -> Environments -> 选择 `production`/`test` -> Secrets）：

- `OSS_BUCKET`：对应环境的 Bucket 名称
- `OSS_ENDPOINT`：示例 `oss-cn-beijing.aliyuncs.com`
- `OSS_ACCESS_KEY_ID`
- `OSS_ACCESS_KEY_SECRET`
- 可选 `OSS_PATH_PREFIX`：上传到 Bucket 内的路径前缀（为空则上传到桶根目录）

工作流会根据分支选择目标环境（`main`→`production`，`test`→`test`），并使用该环境下的 `OSS_BUCKET` 与其他 Secrets 将 `dist/` 上传到对应桶（可选地带上 `OSS_PATH_PREFIX/` 前缀）。

### 环境变量清单（前端）

前端打包可见的变量必须以 `VITE_` 前缀命名。请在本地的 `.env.local`（不提交到仓库）或 CI 的构建环境中注入这些变量。

- `VITE_API_BASE_URL`：后端 API 基地址（例如：`https://service-dev.meetchances.com/api/v1`）。
- `VITE_AUTH_LOGIN_URL`：统一登录地址（用于未授权时跳转）。
- `VITE_AUTH_LOGOUT_URL`：统一登出地址（用于退出登录跳转）。
- `VITE_CLERK_PUBLISHABLE_KEY`：Clerk 的 Publishable Key（前端可见）。

示例（本地 `.env.local`）：

```env
# API
VITE_API_BASE_URL=https://service-dev.meetchances.com/api/v1

# Auth (示例占位，请按实际网关地址填写)
VITE_AUTH_LOGIN_URL=https://accounts.example.com/login
VITE_AUTH_LOGOUT_URL=https://accounts.example.com/logout

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

建议：在 CI 中使用 GitHub Environments 的 Secrets 注入上述 `VITE_` 变量（仅限需要在前端使用的公开配置），而不在仓库提交 `.env.*` 文件。

### 环境变量清单（CI/CD 专用，不会打包进前端）

以下凭证通过环境级 Secrets 提供，只用于部署到 OSS：

- `OSS_BUCKET`
- `OSS_ENDPOINT`（示例：`oss-cn-beijing.aliyuncs.com`）
- `OSS_ACCESS_KEY_ID`
- `OSS_ACCESS_KEY_SECRET`
- 可选 `OSS_PATH_PREFIX`（上传到 Bucket 内的路径前缀；为空则上传到桶根目录）

### 开发规范与约定（重要）

- 组件使用函数式写法，文件名 `kebab-case`，组件名 `PascalCase`。
- 样式必须使用 Tailwind CSS；类名合并使用 `cn()`。
- 路由文件名决定 URL；受保护路由位于 `src/routes/_authenticated/`。
- 服务端数据获取统一使用 TanStack Query；避免在组件中直接处理副作用。
- 表单使用 React Hook Form + Zod；schema 放在对应 `features/*/data/schema.ts`。
- 代码规范：禁止 `console.log`；未使用变量以 `_` 开头；严格遵循 Hooks 规则。
- 提交规范：Conventional Commits；提交前自动 ESLint + Prettier。

### 面向接手同学的提示

- 新增页面请遵循“页面骨架起手规范”：顶部 `Header fixed`，主体 `Main fixed`，标题区 + `Separator`，保持与现有页面一致的布局。
- 新增路由：在 `src/routes/` 创建路由文件，受保护页面置于 `_authenticated/`；如需侧边栏菜单，更新 `src/components/layout/data/sidebar-data.ts`。
- 图标优先使用 Tabler Icons；颜色与间距保持与现有组件一致。
- 线上地址与测试地址：

- 线上：[talent.meetchances.com](https://talent.meetchances.com/)
- 测试：[talent-boe.meetchances.com](https://talent-boe.meetchances.com)

---

MIT License
