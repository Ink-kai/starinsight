# StarInsight Production Audit Report

> 项目：AI 紫微命盘报告
> 审计时间：2026-06-09
> 更新：2026-06-09 (P0 问题已修复)
> 目标分支：main

---

## 1. 当前 REPORT_STORE 实现情况

### 1.1 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│ REPORT_STORE 架构状态 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  app/api/reports/route.ts                                      │
│         │                                                       │
│         ▼                                                       │
│  lib/report/store.ts │
│         │                                                       │
│    ┌────┴────┐                                                 │
│    │         │                                                 │
│    ▼         ▼                                                 │
│ JsonFile  Supabase ✅                                      │
│ Store ✅  Store ✅ │
│                                                                 │
│  REPORT_STORE 环境变量切换已支持                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 已修复问题

| 问题 | 状态 | 修复方式 |
|------|------|---------|
| `getReportStore()` 忽略 `REPORT_STORE` 环境变量 | ✅ 已修复 | 根据环境变量动态选择 |
| 无 `SupabaseReportStore` 实现 | ✅ 已添加 | 创建 `lib/report/supabase-store.ts` |
| `002_enable_reports_rls.sql` 未提交 | ✅ 已提交 | git 已追踪 |

### 1.3 store.ts 实现

```typescript
// lib/report/store.ts (已修复)
let cachedStore: ReportStore | undefined;

export function getReportStore(): ReportStore {
  if (cachedStore !== undefined) {
    return cachedStore;
  }

  const storeType = process.env.REPORT_STORE || 'json';

  if (storeType === 'supabase') {
    const { SupabaseReportStore } = require('./supabase-store');
    cachedStore = new SupabaseReportStore();
  } else {
    cachedStore = new JsonFileReportStore();
  }

  return cachedStore;
}
```

---

## 2. 当前 Supabase 接入情况

### 2.1 Migration状态

| 文件 | 状态 | 说明 |
|------|------|------|
| `001_create_reports.sql` | ✅ 已存在 | 创建 reports 表 |
| `002_enable_reports_rls.sql` | ✅ 已存在 | 启用 RLS |

### 2.2 reports 表结构

```sql
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
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS reports_access_token_idx ON public.reports (access_token);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON public.reports (created_at DESC);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports (status);
```

### 2.3 RLS 配置

```sql
-- supabase/migrations/002_enable_reports_rls.sql
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
-- 不创建 public read/write policy
```

---

## 3. 新增文件清单

| 文件 | 说明 |
|------|------|
| `lib/report/supabase-store.ts` | Supabase 存储实现 |
| `lib/report/markdown.ts` | Markdown 导出生成器 |
| `app/api/reports/[id]/export/route.ts` | Export API 路由 |
| `app/api/admin/reports/[id]/mark-paid/route.ts` | Admin mark-paid 路由 |

---

## 4. API 端点验证

| 端点 | 方法 | 预期响应 | 状态 |
|------|------|---------|------|
| `/api/reports` | POST | reportId, accessToken, reportUrl | ✅ |
| `/api/reports/[id]/export` | GET | Markdown (paid) | ✅ |
| `/api/admin/reports/[id]/mark-paid` | POST | status: paid | ✅ |

---

## 5. Build 与测试

| 检查项 | 结果 |
|--------|------|
| `npm run build` | ✅ 通过 |
| `npm run test:smoke` | ✅ 通过 |
| `npm run check:env` | ✅ 通过 |

---

## 6. 部署清单

### 6.1 环境变量配置

```bash
# Production (Vercel)
REPORT_STORE=supabase
SUPABASE_URL=https://hdsyupfbdgtawvcfrcgs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-key>
```

### 6.2 Supabase Dashboard 操作

1. 执行 `001_create_reports.sql` (如尚未执行)
2. 执行 `002_enable_reports_rls.sql` (如尚未执行)

---

## 7. 审计结论

| 类别 | 状态 |
|------|------|
| SupabaseStore 实现 | ✅ 完成 |
| 环境变量切换 | ✅ 完成 |
| Export API | ✅ 完成 |
| Admin mark-paid API | ✅ 完成 |
| RLS Migration | ✅ 完成 |
| Build 测试 | ✅ 通过 |

**MVP 上线状态**: ✅ **准备就绪**

---

*审计报告更新于 2026-06-09*