# StarInsight 实施计划 v2：个人命盘档案 + 决策追踪系统 MVP

> 当前方向：StarInsight 不再继续作为一次性「AI 紫微命盘报告 / 导出 / 付费解锁」工具开发。新的 MVP 定位为「个人命盘档案 + 决策追踪系统」：记录用户的重要决定，追踪行动结果，形成长期人生档案。

## 1. 当前项目结构

### 1.1 页面

当前项目使用 Next.js App Router，主要页面如下：

- `/`：当前首页，仍以旧方向「AI 紫微命盘报告」为主，包含免费摘要、付费完整报告、Markdown 导出等旧产品文案。
- `/chart`：原有命盘页面，包含出生信息输入、命盘展示、星曜 / 宫位 / Insight 展示等能力。
- `/chart/new`：旧报告流的出生信息输入页，提交后创建 report 并跳转到 `/report/[id]`。
- `/report/[id]`：旧产品报告详情页，按 `free / paid / failed` 展示报告内容。
- `/checkout/[reportId]`：旧产品手动支付占位页。
- `/privacy`：隐私政策页，已围绕旧 AI 报告 MVP 文案调整过。
- `/terms`：服务条款页，已围绕旧 AI 报告 MVP 文案调整过。
- `/knowledge`、`/knowledge/[star]/[topic]`：星曜知识页。
- `/library`、`/library/[book]`、`/library/[book]/[chapter]`、`/library/search`：古籍 / 资料库页面。
- `/preview`：预览页。
- `/heming`：合名 / 合鸣相关页面。

### 1.2 API

当前 API 主要围绕旧报告流：

- `POST /api/generate`：接收排盘算法输入，调用 `generateChart` 生成命盘。
- `POST /api/reports`：旧产品创建 AI 报告，包含表单校验、排盘、AI 报告生成、report 存储与 access token 返回。
- `GET /api/reports/[id]/export`：旧产品 paid 报告 Markdown 导出。
- `POST /api/admin/reports/[id]/mark-paid`：旧产品手动支付确认 / 标记 paid。

### 1.3 数据模型

当前已存在的数据模型分为几类：

- 排盘算法模型：
  - `lib/ziwei/types.ts`
  - 包含 `BirthInfo`、`ZiweiChart`、`Palace`、`Star`、`DaXian` 等排盘相关类型。
- 旧报告模型：
  - `lib/report/types.ts`
  - 包含 `BirthInfo`、`ReportStatus`、`ReportOutput`、`ZiweiReport`、`CreateReportInput` 等旧产品类型。
- 旧报告存储：
  - `lib/report/store.ts`：JSON 本地文件 store 与 `ReportStore` 抽象。
  - `lib/report/supabase-store.ts`：Supabase REST 存储实现。
  - `supabase/migrations/001_create_reports.sql`：旧 reports 表 migration。
- 旧报告访问控制：
  - `lib/report/access.ts`：report access token 生成、URL 构建与校验。
- 旧报告导出：
  - `lib/report/markdown.ts`：paid 报告 Markdown 生成。

### 1.4 AI 模块

当前 AI 模块也主要服务旧报告产品：

- `lib/ai/types.ts`
  - 定义 `AIReportProvider`、`ReportInput`、`AIProviderConfig`、`AIReportError`。
- `lib/ai/provider.ts`
  - 读取 `AI_PROVIDER`、`AI_MODEL`、`DEEPSEEK_API_KEY` 等配置，创建 AI provider。
- `lib/ai/deepseek.ts`
  - DeepSeek OpenAI-compatible API 调用、JSON 解析、fallback 处理。
- `lib/ai/prompts/report.ts`
  - 旧报告 prompt，输出一次性的 `summary / highlights / sections / disclaimer`。

这些 AI Provider 基础设施可以保留，但 prompt、输入输出 schema 应改为「命盘档案摘要 + 决策建议 + 复盘问题」方向。

---

## 2. 哪些模块可以保留

### 2.1 排盘引擎

应保留并继续复用：

- `lib/ziwei/algorithm.ts`
- `lib/ziwei/types.ts`
- `lib/ziwei/constants.ts`
- `lib/ziwei/sihua.ts`
- `lib/ziwei/patterns.ts`
- `lib/ziwei/cities.ts`
- `lib/ziwei/db-analysis.ts`

原因：新产品仍需要基于用户出生信息创建「个人命盘档案」，命盘是长期档案的基础上下文，而不是一次性报告商品。

### 2.2 出生信息输入能力

可保留 / 改造：

- `components/BirthForm.tsx`
- `app/chart/page.tsx` 中已有出生信息与命盘展示能力。
- `app/chart/new/NewChartForm.tsx` 可作为新 `/profile/new` 表单的参考，但不应继续沿用 report 命名和旧跳转逻辑。
- `lib/report/birth.ts` 中的表单出生信息解析逻辑可迁移为更中性的 `lib/profile/birth.ts` 或 `lib/ziwei/input.ts`。

### 2.3 命盘展示组件

可保留并复用：

- `components/ChartBoard.tsx`
- `components/chart/ChartBoard.tsx`
- `components/PalaceCell.tsx`
- `components/ChartSummary.tsx`
- `components/InsightPanel.tsx` 或 `components/insight/InsightPanel.tsx` 中可复用的展示部分。

后续需要将展示重点从「报告消费」改为「个人档案首页中的命盘背景与决策上下文」。

### 2.4 AI Provider 基础设施

可保留但需要重命名和改造：

- `lib/ai/provider.ts`
- `lib/ai/deepseek.ts`
- `lib/ai/types.ts`

建议保留 provider 抽象、DeepSeek OpenAI-compatible 调用和 fallback 思路；废弃旧 `AIReportProvider` 命名，新增更通用的 `AIInsightProvider` 或 `DecisionInsightProvider`。

### 2.5 限流工具

可保留：

- `lib/rate-limit.ts`

新产品仍需要保护：

- 创建 profile
- 创建 decision
- 创建 review
- AI 建议生成

### 2.6 法务页面基础结构

可保留页面位置：

- `app/privacy/page.tsx`
- `app/terms/page.tsx`

但文案需要在新方向确认后改写，删除旧 report / paid / export 表述。

---

## 3. 哪些模块应该废弃

以下模块属于旧「一次性 AI 命盘报告 + 付费导出」方向，建议在新方向实施时停止继续开发，并逐步删除或迁移：

### 3.1 Report

应废弃：

- `app/report/[id]/page.tsx`
- `app/api/reports/route.ts`
- `lib/report/types.ts` 中的 `ZiweiReport`、`ReportOutput`、`ReportStatus`
- `lib/report/store.ts` 中围绕 reports 的 store 实现
- `lib/report/supabase-store.ts`
- `supabase/migrations/001_create_reports.sql`

替代方向：

- `Profile`：个人命盘档案。
- `Decision`：重要决定记录。
- `ActionItem`：行动项。
- `Review`：复盘记录。

### 3.2 Export

应废弃：

- `GET /api/reports/[id]/export`
- `lib/report/markdown.ts`
- paid 报告 Markdown 导出逻辑。

原因：新产品核心不是导出一次性报告，而是持续记录与追踪。导出可以作为未来数据可携带性功能，而不是 MVP 核心。

### 3.3 Paid / Checkout / Mark Paid

应废弃：

- `/checkout/[reportId]`
- `POST /api/admin/reports/[id]/mark-paid`
- `ReportStatus = free | paid | failed`
- `REPORT_PRICE`
- paid 内容边界相关逻辑。

原因：新 MVP 不做复杂支付，不以一次性报告售卖为核心。后续商业化更适合基于档案数量、决策追踪次数、月度复盘或订阅限制设计。

### 3.4 Production Test / Playwright 旧链路

应停止继续维护：

- `tests/production/`
- `npm run test:prod`

原因：这些测试覆盖的是旧 report / export / paid / mark-paid 链路。新方向确认后应重新设计测试：profile 创建、decision 创建、action item 更新、review 生成等。

### 3.5 旧 Report Prompt

应废弃或重写：

- `lib/ai/prompts/report.ts`

替代方向：

- `lib/ai/prompts/profile.ts`：生成个人档案摘要、长期观察主题。
- `lib/ai/prompts/decision.ts`：围绕单次决策生成澄清问题、行动建议、风险提醒。
- `lib/ai/prompts/review.ts`：根据行动结果生成复盘洞察。

---

## 4. 新增数据模型

建议先定义领域模型，再接数据库。以下类型为 MVP v2 建议稿：

```ts
export type Gender = 'male' | 'female';

export interface BirthInfo {
  nickname?: string;
  gender: Gender;
  birthDate: string;
  birthTime: string;
  birthPlace?: string;
  useTrueSolarTime: boolean;
}

export interface Profile {
  id: string;
  accessToken: string;
  birthInfo: BirthInfo;
  chartData: unknown;
  profileSummary: string;
  quarterlyThemes: string[];
  currentActionItems: ActionItem[];
  metadata?: {
    aiProvider?: string;
    aiModel?: string;
    chartVersion?: string;
    knowledgeVersion?: string;
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
}

export type DecisionStatus = 'draft' | 'active' | 'review_due' | 'reviewed' | 'archived';
export type DecisionDomain = 'career' | 'wealth' | 'relationship' | 'health' | 'family' | 'study' | 'other';
export type DecisionHorizon = 'one_week' | 'one_month' | 'three_months' | 'six_months' | 'one_year';

export interface Decision {
  id: string;
  profileId: string;
  title: string;
  domain: DecisionDomain;
  context: string;
  options: Array<{
    id: string;
    label: string;
    pros?: string[];
    cons?: string[];
  }>;
  chosenOptionId?: string;
  expectedOutcome?: string;
  decisionDate: string;
  reviewDueAt?: string;
  horizon: DecisionHorizon;
  status: DecisionStatus;
  aiReflection?: {
    summary: string;
    blindSpots: string[];
    suggestedQuestions: string[];
    recommendedActionItems: Omit<ActionItem, 'id' | 'decisionId' | 'createdAt' | 'updatedAt'>[];
  };
  createdAt: string;
  updatedAt: string;
}

export type ActionItemStatus = 'todo' | 'in_progress' | 'done' | 'skipped';

export interface ActionItem {
  id: string;
  profileId: string;
  decisionId?: string;
  title: string;
  description?: string;
  status: ActionItemStatus;
  dueAt?: string;
  completedAt?: string;
  evidence?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReviewMood = 'positive' | 'neutral' | 'negative' | 'mixed';

export interface Review {
  id: string;
  profileId: string;
  decisionId?: string;
  actionItemIds: string[];
  reviewDate: string;
  mood: ReviewMood;
  outcome: string;
  whatWorked: string;
  whatDidNotWork: string;
  nextAdjustment: string;
  aiSummary?: {
    patternsObserved: string[];
    decisionQualityNotes: string[];
    nextMonthFocus: string[];
  };
  createdAt: string;
  updatedAt: string;
}
```

设计说明：

- `Profile` 是用户的长期命盘档案，不等同于旧 `ZiweiReport`。
- `Decision` 记录一次重要决定的背景、选项、预期结果、回访时间。
- `ActionItem` 是可追踪的行动承诺，可来自 AI 建议，也可由用户手动修改。
- `Review` 是月度 / 决策到期复盘，用于形成长期人生档案。
- MVP 仍可使用 `accessToken` 做无账号私密链接访问，但后续可以平滑接入账号系统。

---

## 5. 新增页面

### 5.1 `/profile/new`

目标：创建个人命盘档案。

页面能力：

- 输入出生信息。
- 生成命盘。
- AI 生成基础档案摘要。
- AI 提取 3 条本季度行动建议。
- 用户确认 / 修改行动项。
- 创建 profile 后跳转 `/profile/[id]?token=...`。

### 5.2 `/profile/[id]`

目标：个人档案首页。

页面模块：

- 档案基础信息。
- 命盘摘要与关键主题。
- 当前季度行动项。
- 最近决策列表。
- 最近复盘列表。
- CTA：记录新决定。
- CTA：添加月度复盘。

### 5.3 `/profile/[id]/decisions/new`

目标：记录一个重要决定。

表单字段建议：

- 决策标题。
- 决策领域：事业 / 财务 / 感情 / 健康 / 家庭 / 学习 / 其他。
- 背景描述。
- 可选方案。
- 当前倾向。
- 预期结果。
- 回访时间。

提交后：

- AI 根据 profile 命盘上下文 + 决策背景生成澄清问题和行动建议。
- 用户确认行动项。
- 决策进入 `active` 状态。

### 5.4 `/profile/[id]/reviews/new`

目标：记录一次月度或决策复盘。

表单字段建议：

- 关联 decision，可选。
- 关联 action items，可选。
- 本次结果。
- 做得好的地方。
- 没做好的地方。
- 下一步调整。
- 情绪 / 体感状态。

提交后：

- AI 总结行为模式。
- 更新 profile 的近期主题和行动建议。

---

## 6. 新增 API

### 6.1 `POST /api/profiles`

职责：创建个人命盘档案。

输入：

```ts
{
  birthInfo: BirthInfo;
  confirmedActionItems?: Array<{ title: string; description?: string; dueAt?: string }>;
}
```

流程：

1. 校验出生信息。
2. 调用现有 `generateChart`。
3. 构造 profile AI 输入。
4. 生成 `profileSummary` 与 `quarterlyThemes`。
5. 保存 `Profile` 与初始 `ActionItem`。
6. 返回 `profileId`、`accessToken`、`profileUrl`。

### 6.2 `POST /api/decisions`

职责：在某个 profile 下创建决策。

输入：

```ts
{
  profileId: string;
  accessToken: string;
  title: string;
  domain: DecisionDomain;
  context: string;
  options: Array<{ label: string; pros?: string[]; cons?: string[] }>;
  chosenOptionId?: string;
  expectedOutcome?: string;
  horizon: DecisionHorizon;
  reviewDueAt?: string;
}
```

流程：

1. 校验 profile access token。
2. 读取 profile 与 chartData。
3. 创建 decision。
4. AI 生成澄清问题、盲点提醒与行动项建议。
5. 保存 decision 与可选 action items。
6. 返回 `decisionId`。

### 6.3 `POST /api/reviews`

职责：创建复盘记录。

输入：

```ts
{
  profileId: string;
  accessToken: string;
  decisionId?: string;
  actionItemIds?: string[];
  mood: ReviewMood;
  outcome: string;
  whatWorked: string;
  whatDidNotWork: string;
  nextAdjustment: string;
}
```

流程：

1. 校验 profile access token。
2. 读取 profile、相关 decision、action items。
3. 创建 review。
4. AI 总结模式与下一阶段建议。
5. 更新相关 decision / action item 状态。
6. 返回 `reviewId` 与更新后的 profile 摘要。

---

## 7. 数据库方案

### 推荐：SQLite + Drizzle

MVP v2 建议优先采用 SQLite + Drizzle，而不是继续扩展当前 JSON / Supabase reports 方案。

原因：

1. **领域关系变复杂**：新方向包含 `profiles`、`decisions`、`action_items`、`reviews`，天然是关系型模型。
2. **本地开发简单**：SQLite 不依赖云服务，适合独立开发快速迭代。
3. **迁移清晰**：Drizzle migration 可以明确追踪 schema 演进。
4. **部署可迁移**：后续可以从 SQLite 平滑迁移到 Turso、LibSQL、Postgres、Supabase Postgres 或 Neon。
5. **查询需求明确**：个人档案页需要按 profile 聚合 decisions、action items、reviews，关系型查询更自然。
6. **避免继续沉没旧 reports 表**：旧 `reports` schema 与新产品模型不匹配，不建议继续扩展。

### MVP v2 表建议

- `profiles`
  - `id`
  - `access_token`
  - `birth_info` JSON
  - `chart_data` JSON
  - `profile_summary`
  - `quarterly_themes` JSON
  - `metadata` JSON
  - `created_at`
  - `updated_at`

- `decisions`
  - `id`
  - `profile_id`
  - `title`
  - `domain`
  - `context`
  - `options` JSON
  - `chosen_option_id`
  - `expected_outcome`
  - `decision_date`
  - `review_due_at`
  - `horizon`
  - `status`
  - `ai_reflection` JSON
  - `created_at`
  - `updated_at`

- `action_items`
  - `id`
  - `profile_id`
  - `decision_id`
  - `title`
  - `description`
  - `status`
  - `due_at`
  - `completed_at`
  - `evidence`
  - `created_at`
  - `updated_at`

- `reviews`
  - `id`
  - `profile_id`
  - `decision_id`
  - `action_item_ids` JSON
  - `review_date`
  - `mood`
  - `outcome`
  - `what_worked`
  - `what_did_not_work`
  - `next_adjustment`
  - `ai_summary` JSON
  - `created_at`
  - `updated_at`

### 注意

如果继续部署在 Vercel Serverless，普通本地 SQLite 文件不适合作为生产持久化数据库。建议路径：

1. 本地开发：SQLite 文件。
2. Beta / 生产：Turso / LibSQL 或 Postgres。
3. Drizzle 作为统一 schema 和 migration 层。

---

## 8. 预计修改文件

> 以下是后续实施时预计修改 / 新增的文件路径。本计划文档阶段不开始编码。

### 8.1 新增领域模型与数据库

- `lib/profile/types.ts`
- `lib/profile/access.ts`
- `lib/profile/birth.ts`
- `lib/db/schema.ts`
- `lib/db/client.ts`
- `lib/db/repositories/profiles.ts`
- `lib/db/repositories/decisions.ts`
- `lib/db/repositories/action-items.ts`
- `lib/db/repositories/reviews.ts`
- `drizzle.config.ts`
- `drizzle/0001_create_profile_decision_tracking.sql`

### 8.2 新增 AI Prompt / Provider 适配

- `lib/ai/prompts/profile.ts`
- `lib/ai/prompts/decision.ts`
- `lib/ai/prompts/review.ts`
- `lib/ai/types.ts`：改造为通用 insight 类型，避免继续绑定 report。
- `lib/ai/provider.ts`：保留 provider 创建逻辑，新增 profile / decision / review 生成入口。

### 8.3 新增页面

- `app/profile/new/page.tsx`
- `app/profile/new/ProfileForm.tsx`
- `app/profile/[id]/page.tsx`
- `app/profile/[id]/decisions/new/page.tsx`
- `app/profile/[id]/decisions/new/DecisionForm.tsx`
- `app/profile/[id]/reviews/new/page.tsx`
- `app/profile/[id]/reviews/new/ReviewForm.tsx`

### 8.4 新增 API

- `app/api/profiles/route.ts`
- `app/api/decisions/route.ts`
- `app/api/reviews/route.ts`

### 8.5 首页与法务文案

- `app/page.tsx`：从「AI 紫微命盘报告」改为「个人命盘档案 + 决策追踪系统」。
- `app/privacy/page.tsx`：改写为 profile / decision / review 数据流。
- `app/terms/page.tsx`：改写为长期记录、AI 建议不保证准确、用户自行承担决策责任。
- `app/layout.tsx`：metadata 更新为 StarInsight 新定位。

### 8.6 废弃或删除旧方向文件

后续确认后可删除或归档：

- `app/report/[id]/page.tsx`
- `app/checkout/[reportId]/page.tsx`
- `app/api/reports/route.ts`
- `app/api/reports/[id]/export/route.ts`
- `app/api/admin/reports/[id]/mark-paid/route.ts`
- `lib/report/*`
- `tests/production/*`
- `scripts/smoke-test.mjs` 中旧 report/export/paid 测试部分
- `supabase/migrations/001_create_reports.sql`

### 8.7 配置与文档

- `package.json`：移除旧 `test:prod`，新增新方向 smoke test 命令。
- `.env.example`：移除旧 paid / report export 相关变量，新增数据库与 profile 限流变量。
- `README.md`：改写为 StarInsight v2 产品与部署说明。
- `docs/implementation-plan-v2.md`：本计划文档。

---

## 停止点

本文件只输出 StarInsight v2 实施计划，不开始编码，不修改业务逻辑，不删除旧文件。等待确认后再按新方向拆分 Commit 执行。
