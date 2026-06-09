# Vercel Production Deployment Guide

> StarInsight 项目 Vercel 生产环境部署与运维指南

## 1. Vercel 核心概念

### 1.1 部署类型

| 类型 | 说明 | 触发方式 |
|------|------|---------|
| **Production** | 生产环境，唯一正式 URL | Push 到 main 分支 / Merge PR |
| **Preview** | 预览环境，每个 PR 一个 URL | Push 到其他分支 |
| **Development** | 本地开发 | `vercel dev` / `npm run dev` |

### 1.2 Vercel Dashboard关键页面

```
Dashboard
├── Deployments # 部署历史
├── Analytics # 流量分析
├── Speed Insight # 性能监控
├── Function Logs       # 函数日志 ←重要
└── Settings
    ├── General # 构建命令、输出目录
    ├── Environment Variables # 环境变量
    ├── Domains # 域名配置
    └── Edge Config # Edge 配置
```

## 2. Environment Variables

### 2.1 环境变量作用域

| Scope | 说明 | 使用场景 |
|-------|------|---------|
| **Production** | 仅生产环境 | `https://starinsight.vercel.app` |
| **Preview** | 仅预览环境 | PR部署 URL |
| **Development** | 仅本地开发 | `vercel dev` |
| **All** | 所有环境 | 通用配置 |

### 2.2 StarInsight 环境变量配置

#### Production 环境变量（必需）

```bash
# 应用基础
NEXT_PUBLIC_APP_NAME=AI 紫微命盘报告
NEXT_PUBLIC_SITE_URL=https://starinsight.vercel.app

# AI 配置
AI_PROVIDER=deepseek
AI_MODEL=deepseek-chat
DEEPSEEK_API_KEY=sk-xxxxx  # 仅服务端

# 管理与安全
ADMIN_TOKEN=至少32位随机字符串
REPORT_PRICE=49

# 报告存储（生产必须 supabase）
REPORT_STORE=supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # 仅服务端

# 限流
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REPORTS_PER_HOUR=5
RATE_LIMIT_ADMIN_PER_10MIN=10
```

#### Development 环境变量（.env.local）

```bash
# 本地开发使用 json 存储
REPORT_STORE=json
AI_PROVIDER=deepseek
AI_MODEL=deepseek-chat
DEEPSEEK_API_KEY=sk-xxx # 本地测试 key
```

### 2.3 环境变量安全规则

```
✅ 正确做法
REPORT_STORE=supabase
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
ADMIN_TOKEN=xxx

❌ 错误做法（禁止）
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_ADMIN_TOKEN=xxx
```

## 3. Production Deployment

### 3.1 部署流程

```
┌─────────────────────────────────────────────────────────────────┐
│ Vercel Production部署流程                   │
├─────────────────────────────────────────────────────────────────┤
│ │
│ 1. Push 到 main 分支                                        │
│    git push origin main │
│    │                                                      │
│    ▼                                                      │
│ 2. Vercel 自动触发构建                                     │
│    - Clone仓库                                            │
│    - npm install │
│    - npm run build                                        │
│    - npm run postbuild                                    │
│    │                                                      │
│    ▼                                                      │
│ 3. 构建成功 → 自动部署到 Production                        │
│    -替换旧实例 │
│    - 更新 URL: https://starinsight.vercel.app              │
│    │                                                      │
│    ▼                                                      │
│ 4. 通知 (可选)                                             │
│    - Slack/Discord webhook │
│    - Email通知                                            │
│ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 构建命令

```bash
# vercel.json 配置
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### 3.3部署触发条件

| 触发方式 | 自动部署 | 说明 |
|---------|---------|------|
| Push to main | ✅ 是 | 合并 PR 或直接 push |
| PR Merge | ✅ 是 | GitHub PR合并 |
| Rollback | ✅ 是 | 从 Dashboard 回滚 |
| Manual Redeploy | ✅ 是 | 点击 Redeploy |

## 4. 如何确认线上运行的是哪个 Commit

### 4.1 方法一：Vercel Dashboard

```
Deployments → 选择 Production部署 → Commit SHA
```

### 4.2 方法二：Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 查看当前 Production 部署
vercel ls --prod

# 输出示例
> Production Deployments
> starinsight  https://starinsight.vercel.app  v100 [4d2a527]2h ago
```

### 4.3 方法三：API Response Header

```bash
#访问任意页面，检查响应头
curl -I https://starinsight.vercel.app

# 查找 X-Vercel-Deployment-Url 或其他标识
```

### 4.4 方法四：查看 Footer Commit（可选）

```typescript
// app/page.tsx footer
<footer>
  <p>Commit: {process.env.VERCEL_GIT_COMMIT_SHA}</p>
</footer>
```

## 5. Function Logs

### 5.1 查看方式

#### Dashboard 方式

```
Vercel Dashboard
└── Deployments
    └── 选择部署
        └── Functions
            └── 选择 Function (如 /api/reports/route.ts)
                └── Logs
```

#### Vercel CLI 方式

```bash
# 查看实时日志
vercel logs starinsight.vercel.app --follow

# 查看特定 Function 日志
vercel logs starinsight.vercel.app --since1h --filter "api/reports/*"

# 查看错误日志
vercel logs starinsight.vercel.app --only-errors
```

### 5.2 日志格式

```
[2024-06-0912:00:00] GET /api/reports 200145ms
[2024-06-09 12:00:01] POST /api/reports 400 23ms
[2024-06-09 12:00:02] Error: ENOENT: no such file or directory
    at JsonFileReportStore.create (/var/task/.next/server/chunks/...)
```

### 5.3 常见日志问题

| 问题 | 日志表现 | 解决方案 |
|------|---------|---------|
| ENOENT | 文件/目录不存在 | 检查 REPORT_STORE 配置 |
| 429 Rate Limited | 请求被限流 | 等待或调整限流规则 |
| 500 Error | 服务端错误 | 查看堆栈跟踪 |
| CORS | 跨域错误 | 检查 headers 配置 |

## 6. Runtime 环境

### 6.1 Serverless Runtime

Vercel 使用 **Node.js** Serverless Runtime：

```javascript
// 每次 API 请求创建新的 Node进程
// 冷启动：~200-500ms
// 热启动：~10-50ms
// 超时限制：10s (Hobby) / 60s (Pro)
```

### 6.2 Edge Runtime（可选）

```javascript
// Edge Runtime 使用 V8  isolates
// 位置：边缘节点，全球低延迟
// 限制：无文件系统，无原生模块
```

### 6.3 Next.js App Router 与 Serverless

```
┌─────────────────────────────────────────────────────────────────┐
│              Next.js App Router Serverless 架构 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  请求流程: │
│  Client → Vercel Edge → Next.js Serverless Function │
│                     │                   │                       │
│                     │                   ▼                       │
│                     │           Route Handler                   │
│                     │ (app/api/*)                    │
│                     │                   │                       │
│                     │                   ▼                       │
│                     │           环境变量                       │
│                     │           (process.env)                   │
│                     │                   │                       │
│                     │                   ▼                       │
│                     │           业务逻辑                       │
│                     │ (createReport 等)               │
│                     │                   │                       │
│                     │                   ▼                       │
│                     │           Supabase/File │
│                     │ │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 冷启动优化

```typescript
// lib/report/store.ts
// 使用全局变量缓存 store 实例，避免每次请求重新创建

let reportStore: ReportStore | null = null;

export function getReportStore(): ReportStore {
  if (!reportStore) {
    reportStore = process.env.REPORT_STORE === 'supabase'
      ? new SupabaseReportStore()
      : new JsonFileReportStore();
  }
  return reportStore;
}
```

## 7. API Route验证

### 7.1 本地测试 API

```bash
# 启动开发服务器
npm run dev

# 测试报告创建
curl -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -d '{"gender":"male","birthDate":"1990-01-01","birthTime":"08:30"}'
```

### 7.2 生产环境测试 API

```bash
# 测试报告创建
curl -X POST https://starinsight.vercel.app/api/reports \
  -H "Content-Type: application/json" \
  -d '{"gender":"male","birthDate":"1990-01-01","birthTime":"08:30"}'

# 检查响应状态
#200:成功
# 400: 请求错误
# 429: 限流
# 500: 服务端错误
```

### 7.3 API 路由清单

| 路由 | 方法 | 说明 | 验证状态 |
|------|------|------|---------|
| `/api/reports` | POST | 创建报告 | ✅ |
| `/api/reports` | GET | 读取报告列表 | ⚠️ |
| `/api/reports/[id]` | GET | 读取单个报告 | ⚠️ |
| `/api/generate` | POST | 生成报告(旧) | ✅ |
| `/api/reports/[id]/export` | GET | 导出 Markdown | ❌ 未部署 |
| `/api/admin/reports/[id]/mark-paid` | POST |标记付费 | ❌ 未部署 |

## 8. Production 验证清单

### 8.1 部署前检查

- [ ] `npm run check:env` 通过
- [ ] `npm run build` 通过
- [ ] `npm run test:smoke` 通过
- [ ] 环境变量已在 Vercel 配置完整
- [ ] Supabase Migration 已执行
- [ ] `REPORT_STORE=supabase` 配置正确

### 8.2 部署后验证

- [ ] 访问 `https://starinsight.vercel.app` 返回 200
- [ ] `/chart/new` 页面可访问
- [ ] `POST /api/reports` 返回包含 `reportId` 的 JSON
- [ ] `accessToken` 字段存在且长度 > 20
- [ ] Function Logs 无 500 错误

### 8.3 监控指标

| 指标 | 目标值 | 说明 |
|------|-------|------|
| Build Success Rate | 100% | 所有部署成功 |
| API Response Time | < 500ms | 95th percentile |
| Error Rate | < 1% | 5xx 错误占比 |
| Uptime | > 99.9% | 月度可用性 |

## 9. 故障排查

### 9.1 部署失败

```bash
# 查看构建日志
vercel logs starinsight.vercel.app --since 1h | grep -i error

# 常见原因:
# - 环境变量缺失
# - Build 命令失败
# - TypeScript 编译错误
```

### 9.2 API 返回 500

```bash
# 1. 查看 Function Logs
vercel logs starinsight.vercel.app --filter "api/reports"

# 2. 检查错误堆栈
# 常见错误:
# - ENOENT: REPORT_STORE 配置问题
# - Invalid API Key: Supabase 配置错误
# - Timeout: AI 服务响应慢
```

### 9.3 环境变量未生效

```bash
# 1.确认环境变量已保存
# Dashboard → Settings → Environment Variables

# 2. 重新触发部署
# Deployments → ... → Redeploy

# 3. 验证环境变量
vercel env pull # 拉取到本地 .env.local
```

## 10. Vercel + Supabase 集成架构

```
┌─────────────────────────────────────────────────────────────────┐
│ Vercel Production + Supabase 架构                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐                                           │
│  │  Vercel │                                           │
│  │  Production │                                           │
│  │  (starinsight) │                                           │
│  └────────┬────────┘                                           │
│           │                                                     │
│           │ HTTP Request │
│           ▼                                                     │
│  ┌─────────────────────────────────────────────┐               │
│  │  Route Handler (Serverless)                  │               │
│  │  - /api/reports/route.ts                     │               │
│  │  -读取环境变量                              │               │
│  │  - REPORT_STORE=supabase │               │
│  └────────┬───────────────────────────────────┘               │
│ │                                                     │
│           │ SUPABASE_SERVICE_ROLE_KEY (安全)                    │
│           ▼                                                     │
│  ┌─────────────────────────────────────────────┐               │
│  │  Supabase Postgres │               │
│  │  - public.reports 表 │               │
│  │  - RLS 已启用                               │               │
│  │  - Service Role Bypass RLS                  │               │
│  └─────────────────────────────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 11. 总结

### 关键检查点

1. **部署前**: 环境变量完整、Build 通过、Migration 已执行
2. **部署中**: Build Logs 无错误、Function正常启动
3. **部署后**: API 验证、日志检查、监控设置

### 快速验证命令

```bash
# 1. 检查环境变量
vercel env ls --prod

# 2. 查看最新部署
vercel ls --prod

# 3. 检查 Function 日志
vercel logs starinsight.vercel.app --since 1h

# 4. 测试 API
curl -X POST https://starinsight.vercel.app/api/reports \
  -H "Content-Type: application/json" \
  -d '{"gender":"male","birthDate":"1990-01-01","birthTime":"08:30"}'
```