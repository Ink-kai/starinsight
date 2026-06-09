# Supabase Production Architecture

> StarInsight 项目 Supabase 生产环境架构指南

## 1. 核心概念

### 1.1 Supabase 是什么

Supabase 是 Firebase 的开源替代方案，提供：
- **PostgreSQL** -关系型数据库
- **Auth** - 用户认证系统
- **Storage** - 文件存储
- **Realtime** - 实时订阅
- **Edge Functions** - 服务端函数
- **REST API** - 自动生成的 CRUD API

### 1.2 Project Settings

在 Supabase Dashboard → Settings → General 中配置：

| 设置项 | 说明 |
|--------|------|
| Project Name | 项目标识名称 |
| Project UID | 全局唯一标识符，用于 API 连接 |
| Region | 服务器区域，影响延迟 |
| Plan | 免费/Pro/Team，决定配额 |

### 1.3 API Keys

Supabase 提供两种 API Key：

#### Anonymous (anon) Key
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

- **用途**: 客户端代码使用
- **暴露风险**: 低，可安全暴露到客户端
- **权限**: 受 RLS 策略限制

#### Service Role (service_role) Key
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

- **用途**: 服务端代码使用（Next.js Route Handlers）
- **暴露风险**: 高，**禁止**添加到 NEXT_PUBLIC_ 前缀
- **权限**: **绕过所有 RLS 策略**，拥有完整数据库权限

⚠️ **安全警示**: Service Role Key 等同于数据库 root 权限，泄露后可完全控制数据库。

## 2. Row Level Security (RLS)

### 2.1 什么是 RLS

Row Level Security 是 PostgreSQL 的行级安全策略，允许在数据库层面控制用户对特定行的访问权限。

### 2.2 为什么生产环境必须开启 RLS

**无 RLS 时的问题**:
```
❌ 任何获取到 anon key 的人可以：
   - 读取所有报告数据
   - 修改任意报告状态
   - 删除报告记录
   - 访问其他用户的私密命盘
```

**开启 RLS 后**:
```
✅ 即使 anon key 泄露，攻击者也只能：
   - 访问自己创建的报告（通过 user_id 关联）
   - 无法读取或修改他人的报告

✅ Service Role Key 仅在服务端使用
   - 客户端永远不接触 service_role key
```

### 2.3 RLS 策略设计

#### 基本原则

1. **Public Read (受限)**: 只有报告创建者或持有有效 accessToken 的人可读
2. **Public Write (禁止)**: 客户端不能直接写入，必须通过服务端 API
3. **Service Role Bypass**: 服务端使用 service_role key绕过 RLS 进行管理操作

#### reports 表 RLS 策略示例

```sql
-- 启用 RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 策略1：报告创建者可以读取自己的报告
CREATE POLICY "Users can read own reports"
ON public.reports FOR SELECT
USING (auth.uid() = creator_user_id);

-- 策略2：持有正确 accessToken 的人可以读取报告
CREATE POLICY "Token holders can read reports"
ON public.reports FOR SELECT
USING (access_token = current_setting('app.access_token', true));
```

### 2.4 Service Role Key 如何绕过 RLS

```
┌─────────────────────────────────────────────────────────────────┐
│                     Service Role Key 权限 │
├─────────────────────────────────────────────────────────────────┤
│ │
│   Client (anon key)          Server (service_role key)         │
│         │                            │                          │
│         ▼                            ▼                          │
│  ┌─────────┐               ┌─────────────┐                   │
│   │ RLS    │               │  BYPASS RLS │ ← 完全绕过        │
│   │  检查 │               │             │    所有行级策略     │
│   └────┬────┘               └─────────────┘                   │
│        │                            │                          │
│        ▼                            ▼                          │
│   只有匹配策略的 所有数据都可以 │
│   行才返回读取/写入 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**设计意图**:
- 客户端通过 `anon key` + `RLS 策略` 访问数据（受限）
- 服务端通过 `service_role key` + `业务逻辑` 访问数据（完全控制）

## 3. SQL Editor 与 Database Migration

### 3.1 SQL Editor

Supabase SQL Editor 位置: Dashboard → SQL Editor

可执行：
- DDL 语句 (CREATE, ALTER, DROP)
- DML 语句 (INSERT, UPDATE, DELETE)
- 存储过程和函数
- RLS 策略管理

### 3.2 Migration 工作流

#### 本地 Migration目录结构

```
supabase/
└── migrations/
    ├── 001_create_reports.sql   # 创建表结构
    └── 002_enable_reports_rls.sql  # 启用 RLS
```

#### Migration 文件命名规范

```
<序号>_<简短描述>.sql
YYYYMMDD_<简短描述>.sql
```

#### 本地开发流程

```bash
# 1. 安装 Supabase CLI
npm install -g supabase

# 2. 链接本地项目到 Supabase 项目
supabase link --project-ref<project-ref>

# 3. 创建 Migration
supabase migration new create_reports

# 4. 编辑 Migration 文件
# supabase/migrations/xxx_create_reports.sql

# 5. Push 到远程（执行 Migration）
supabase db push

# 6. 重置本地数据库（可选）
supabase db reset
```

### 3.3 StarInsight Migration 示例

#### 001_create_reports.sql

```sql
-- Reports table for AI 紫微命盘报告 MVP.
-- Run this in the Supabase SQL editor or via `supabase db push`

CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  birth_info JSONB NOT NULL,
  chart_data JSONB NOT NULL,
  ai_summary TEXT,
  ai_highlights JSONB NOT NULL DEFAULT '[]'::JSONB,
  ai_full_report JSONB,
  status TEXT NOT NULL CHECK (status IN ('free', 'paid', 'failed')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS reports_access_token_idx ON public.reports (access_token);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON public.reports (created_at DESC);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports (status);
```

#### 002_enable_reports_rls.sql

```sql
-- Enable Row Level Security on reports table
-- Application uses SUPABASE_SERVICE_ROLE_KEY on the server side to bypass RLS
-- Do NOT create public read/write policies

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
```

## 4. REST API

### 4.1 自动生成 API

Supabase 自动为每个表生成 REST API：

```
https://<project-ref>.supabase.co/rest/v1/<table-name>
```

### 4.2 API 端点

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | /rest/v1/reports | 读取报告列表 |
| GET | /rest/v1/reports?id=eq.xxx | 按 ID 读取单个报告 |
| POST | /rest/v1/reports | 创建报告 |
| PATCH | /rest/v1/reports | 更新报告 |
| DELETE | /rest/v1/reports | 删除报告 |

### 4.3 带 RLS 的 API 调用

```javascript
// 使用 anon key（受 RLS 限制）
const { data, error } = await supabase
  .from('reports')
  .select('*')
  .eq('id', reportId);

// 使用 service_role key（绕过 RLS，仅限服务端）
const { data, error } = await supabase
  .from('reports')
  .select('*')
  .eq('id', reportId)
  .single();
```

## 5. Next.js Route Handler 集成

### 5.1 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Route Handler                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  app/api/reports/route.ts                                      │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────┐               │
│  │  SUPABASE_SERVICE_ROLE_KEY (服务端环境变量)  │               │
│  │  -永不暴露到客户端 │               │
│  │  - 永不添加到 NEXT_PUBLIC_ 前缀              │               │
│  └─────────────────────────────────────────────┘               │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────┐               │
│  │  Supabase Admin Client (bypass RLS) │               │
│  │  - 用于创建/更新报告 │               │
│  │  - 用于 admin 管理接口 │               │
│  └─────────────────────────────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 安全实现示例

```typescript
// lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js';

// 仅服务端使用的方法 -传入 service_role key
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false, // 服务端不需要
      autoRefreshToken: false,
    },
  });
}

// API Route 中使用
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createSupabaseAdminClient();
  // 使用 supabase 进行数据库操作，绕过 RLS
  const { data, error } = await supabase
    .from('reports')
    .insert({ ... })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
```

### 5.3 客户端使用（受 RLS 限制）

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

//客户端使用的 client - 仅传入 anon key
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}
```

## 6. REPORT_STORE=supabase 架构设计

### 6.1 架构目标

```
┌─────────────────────────────────────────────────────────────────┐
│ REPORT_STORE=supabase 架构                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────────┐     ┌───────────────┐  │
│  │  Client     │────▶│  Route Handler  │────▶│  Supabase    │  │
│  │  Request    │     │  (Server)       │     │  Postgres │  │
│  └─────────────┘     └─────────────────┘     └───────────────┘  │
│                            │                     │ │
│                            │                     │            │
│                            ▼                     │            │
│                    ┌─────────────────┐           │            │
│                    │ SERVICE_ROLE│◀──────────┘            │
│                    │ KEY (Bypass RLS)│ │
│                    └─────────────────┘                          │
│                                                                 │
│  环境变量:                                                      │
│  - SUPABASE_URL=https://xxx.supabase.co                        │
│  - SUPABASE_SERVICE_ROLE_KEY=xxx (仅服务端)                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 环境变量配置

#### 服务端环境变量（Vercel Production）

```bash
# Vercel Dashboard → Environment Variables
REPORT_STORE=supabase                    # 切换到 Supabase 存储
SUPABASE_URL=https://xxx.supabase.co     # Project URL
SUPABASE_SERVICE_ROLE_KEY=xxx           # Service Role Key（安全）
```

#### 客户端环境变量（可选）

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co  # 如需客户端直接访问
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx # 如需客户端直接访问
```

### 6.3 存储抽象层设计

```typescript
// lib/report/store.ts

export interface ReportStore {
  create<TChartData>(input: CreateReportInput<TChartData>): Promise<ZiweiReport<TChartData>>;
  get(id: string): Promise<ZiweiReport | null>;
  updateStatus(id: string, status: ReportStatus): Promise<ZiweiReport>;
  update(id: string, patch: Partial<Omit<ZiweiReport, 'id' | 'createdAt'>>): Promise<ZiweiReport>;
}

// 根据环境变量选择存储实现
export function getReportStore(): ReportStore {
  const storeType = process.env.REPORT_STORE || 'json';

  switch (storeType) {
    case 'supabase':
      return new SupabaseReportStore();
    case 'json':
    default:
      return new JsonFileReportStore();
  }
}
```

### 6.4 Supabase Store 实现要点

```typescript
// lib/report/supabase-store.ts

export class SupabaseReportStore implements ReportStore {
  private supabase: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.supabase = createClient(url, key);
  }

  async create<TChartData>(input: CreateReportInput<TChartData>): Promise<ZiweiReport<TChartData>> {
    const now = new Date().toISOString();
    const report = {
      id: randomUUID(),
      access_token: generateReportAccessToken(),
      birth_info: input.birthInfo,
      chart_data: input.chartData,
      ai_summary: input.aiSummary ?? '',
      ai_highlights: input.aiHighlights ?? [],
      ai_full_report: input.aiFullReport,
      status: input.status ?? 'free',
      metadata: input.metadata,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await this.supabase
      .from('reports')
      .insert(report)
      .select()
      .single();

    if (error) throw new Error(`Failed to create report: ${error.message}`);

    return this.mapToReport(data);
  }

  // ... 其他方法实现
}
```

## 7. Production Security Best Practices

### 7.1 环境变量安全

| 变量 | 客户端可见 | 示例值 |
|------|-----------|--------|
| NEXT_PUBLIC_* | ✅ 是 | `NEXT_PUBLIC_APP_NAME` |
| SUPABASE_SERVICE_ROLE_KEY | ❌ 否 | 完整 key 值 |
| DEEPSEEK_API_KEY | ❌ 否 | 完整 key 值 |
| ADMIN_TOKEN | ❌ 否 | 至少 32 字符 |

### 7.2 Vercel 环境变量配置

```
# Environment Variables in Vercel Dashboard

# Production
REPORT_STORE=supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Preview (可选)
REPORT_STORE=json
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Development (.env.local)
REPORT_STORE=json
```

### 7.3 RLS 验证检查清单

生产部署前验证：

- [ ] `supabase/migrations/002_enable_reports_rls.sql` 已执行
- [ ] 无公开读写策略（如 `public.reports FOR ALL`）
- [ ] Service Role Key 仅在服务端使用
- [ ] 无 `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` 变量
- [ ] 客户端代码使用 `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 7.4 监控与告警

建议监控：

```sql
-- 检查异常访问模式
SELECT
  COUNT(*) as access_count,
  DATE_TRUNC('hour', created_at) as hour
FROM public.reports
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
HAVING COUNT(*) > 100;
```

## 8. 故障排查

### 8.1 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| `RLS violation` | 客户端操作触发 RLS | 使用服务端 API |
| `Invalid API key` | Key 配置错误 | 检查环境变量 |
| `Relation does not exist` | 表未创建 | 执行 Migration |
| `Permission denied` | 权限不足 | 检查 RLS 策略 |

### 8.2 调试方法

```bash
# 1. 检查 RLS 状态
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'reports';

# 2. 查看所有策略
SELECT policyname, cmd, qual FROM pg_policy WHERE polrelid = 'reports'::regclass;

# 3. 测试 anon key 访问
curl -X GET "https://xxx.supabase.co/rest/v1/reports" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>"
```

## 9. 总结

### 关键设计原则

1. **分层访问**:客户端使用 anon key + RLS，服务端使用 service_role key
2. **零信任**: 即使 anon key 泄露也不会导致数据泄露
3. **最小权限**: RLS 策略限制到行级别
4. **环境隔离**: 开发用 json，生产用 supabase

### StarInsight 实现要点

- [ ] 使用 `REPORT_STORE=supabase` 切换存储
- [ ] 服务端仅使用 `SUPABASE_SERVICE_ROLE_KEY`
- [ ] 客户端代码不接触 service_role key
- [ ] RLS 已启用（`002_enable_reports_rls.sql`）
- [ ] Migration 文件已执行