# AI 紫微命盘报告 MVP

AI 紫微命盘报告是基于 `Renhuai123/ziwei-doushu` 改造的商业化 MVP：用户输入出生信息后，系统生成紫微命盘，并输出一份面向普通用户的结构化 AI 命盘报告。

MVP 当前聚焦：

- 出生信息输入与紫微命盘生成。
- 免费报告摘要与三条核心洞察。
- paid 状态下展示完整报告章节。
- 手动支付占位与管理员标记 paid。
- paid 报告 Markdown 导出。
- 保留原项目 License 与 Attribution。

> 重要提示：命理内容仅供文化娱乐、自我观察和个人参考，不构成医学、法律、投资、婚姻或其他重大决策建议。

---

## 技术栈

- Next.js App Router
- TypeScript
- React
- Tailwind CSS / CSS Variables
- `iztro` + `lunar-javascript` 排盘
- DeepSeek OpenAI-compatible API（可配置）
- 报告存储支持本地 JSON（开发默认）与 Supabase Postgres（生产推荐）

---

## 本地启动

```bash
# 安装依赖
npm install

# 准备环境变量
cp .env.example .env.local
# 编辑 .env.local，至少设置 ADMIN_TOKEN；如需真实 AI 生成，设置 DEEPSEEK_API_KEY
# 本地开发默认 REPORT_STORE=json；生产部署建议 REPORT_STORE=supabase

# 启动开发服务器
npm run dev
```

访问：

- 首页：`http://localhost:3000/`
- 输入页：`http://localhost:3000/chart/new`
- 报告页：`http://localhost:3000/report/{reportId}`
- Checkout 占位页：`http://localhost:3000/checkout/{reportId}`

生产构建：

```bash
npm run build
npm run start
```

---

## 环境变量说明

`.env.example` 包含 MVP 所需变量：

| 变量 | 必填 | 说明 |
|---|---:|---|
| `NEXT_PUBLIC_APP_NAME` | 否 | 前端展示产品名，默认可用 `AI 紫微命盘报告`。 |
| `NEXT_PUBLIC_SITE_URL` | 否 | 站点 URL，本地默认为 `http://localhost:3000`。 |
| `AI_PROVIDER` | 否 | 当前支持 `deepseek`，默认 `deepseek`。 |
| `AI_MODEL` | 否 | 默认 `deepseek-chat`。 |
| `DEEPSEEK_API_KEY` | 否 | DeepSeek API Key；未配置时使用 fallback 报告。 |
| `OPENAI_API_KEY` | 否 | 预留变量，当前 MVP 尚未启用 OpenAI provider。 |
| `ADMIN_TOKEN` | 是 | 管理员手动标记 paid 的接口 token。 |
| `REPORT_PRICE` | 否 | Checkout 占位页展示价格。 |
| `NEXT_PUBLIC_ATTRIBUTION_TEXT` | 否 | 前端/导出可复用 Attribution 文案。 |
| `REPORT_STORE` | 否 | 报告存储实现：`json` 或 `supabase`；本地默认 `json`，生产推荐 `supabase`。 |
| `REPORT_STORE_DIR` | 否 | 本地 JSON 报告存储目录；仅建议本地开发使用。 |
| `SUPABASE_URL` | `REPORT_STORE=supabase` 时必填 | Supabase Project URL，仅服务端使用。 |
| `SUPABASE_SERVICE_ROLE_KEY` | `REPORT_STORE=supabase` 时必填 | Supabase service role key，仅服务端使用，严禁添加 `NEXT_PUBLIC_` 前缀。 |
| `RATE_LIMIT_ENABLED` | 否 | 是否启用基础限流，默认 `true`。 |
| `RATE_LIMIT_REPORTS_PER_HOUR` | 否 | `POST /api/reports` 同 IP 每小时最大次数，默认 `5`。 |
| `RATE_LIMIT_EXPORT_PER_HOUR` | 否 | `GET /api/reports/{id}/export` 同 IP 每小时最大次数，默认 `20`。 |
| `RATE_LIMIT_ADMIN_PER_10MIN` | 否 | `POST /api/admin/reports/{id}/mark-paid` 同 IP 每 10 分钟最大次数，默认 `10`。 |

---

## Vercel 部署（优先推荐）

Vercel 是当前 MVP 的首选 Serverless 部署方式。

### 步骤

1. 将代码推送到 GitHub 仓库。
2. 登录 [Vercel](https://vercel.com/) 并选择 **Add New Project**。
3. 连接 GitHub 仓库。
4. Framework Preset 选择 **Next.js**。
5. 设置环境变量：
   - `NEXT_PUBLIC_APP_NAME`
   - `NEXT_PUBLIC_SITE_URL`
   - `AI_PROVIDER`
   - `AI_MODEL`
   - `DEEPSEEK_API_KEY`
   - `OPENAI_API_KEY`
   - `ADMIN_TOKEN`
   - `REPORT_PRICE`
   - `NEXT_PUBLIC_ATTRIBUTION_TEXT`
   - `REPORT_STORE=supabase`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. 在 Supabase SQL Editor 执行 `supabase/migrations/001_create_reports.sql`。
7. Build Command 使用：

```bash
npm run build
```

8. Output 使用 Vercel 对 Next.js 的默认设置，不需要手动填写 output directory。
9. 部署完成后测试：
   - 首页 `/`
   - 输入页 `/chart/new`
   - 创建报告 `POST /api/reports`
   - 报告页 `/report/{id}`
   - Checkout 页 `/checkout/{id}`
   - 管理员接口 `POST /api/admin/reports/{id}/mark-paid`
   - paid 报告 Markdown 导出 `/api/reports/{id}/export`

### Vercel 生产存储注意

本地 JSON 文件存储只适合本地开发。Vercel Serverless/Edge 环境不能依赖项目目录文件作为持久化数据库；即使写入成功，也可能在冷启动、实例切换或重新部署后丢失。

生产部署推荐使用：

```env
REPORT_STORE=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` 只能配置在 Vercel 服务端环境变量中，不能暴露给浏览器，不能使用 `NEXT_PUBLIC_` 前缀。

---

## Cloudflare Pages 部署（备选）

Cloudflare Pages 可作为备选部署目标，但需要特别注意 Next.js App Router 与 API Routes 的适配。

### 注意事项

- 本项目使用 Next.js App Router，并包含多个 Route Handlers/API Routes：
  - `POST /api/reports`
  - `POST /api/admin/reports/[id]/mark-paid`
  - `GET /api/reports/[id]/export`
- Cloudflare Pages 对 Next.js 的支持取决于当前 adapter/runtime 能力。
- 如果直接部署失败，需要使用 Cloudflare 官方 Next.js 适配方案或 `@cloudflare/next-on-pages`。
- 如果 API Routes、Node.js runtime、文件系统写入或依赖包不兼容，建议优先使用 Vercel。

### 参考命令

仓库中保留了 Cloudflare 相关脚本：

```bash
npm run build:cf
npm run preview:cf
```

部署前请确认：

1. API Routes 能在 Cloudflare runtime 中正常工作。
2. 生产环境设置 `REPORT_STORE=supabase`，不要依赖本地 JSON 文件持久化。
3. `SUPABASE_SERVICE_ROLE_KEY` 仅作为服务端环境变量配置，不能暴露到客户端。

---

## 报告存储配置

报告存储位于 `lib/report/store.ts`，通过 `REPORT_STORE` 选择实现：

```env
# 本地开发默认值
REPORT_STORE=json

# 生产推荐值
REPORT_STORE=supabase
```

### 本地 JSON Store

`REPORT_STORE=json` 会写入本地文件：

```txt
data/reports/{reportId}.json
```

这只适合本地开发、功能验证和临时 demo，不适合 Vercel / Cloudflare Pages / 多实例生产环境。

### Supabase Postgres Store

`REPORT_STORE=supabase` 会通过 Supabase REST API 读写 `reports` 表。需要配置：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

建表方式：

1. 打开 Supabase Dashboard。
2. 进入 SQL Editor。
3. 执行 `supabase/migrations/001_create_reports.sql`。
4. 在 Vercel / Cloudflare Pages 环境变量中设置 `REPORT_STORE=supabase`。

如果 `REPORT_STORE=supabase` 但缺少 `SUPABASE_URL` 或 `SUPABASE_SERVICE_ROLE_KEY`，服务端会返回清晰错误：`REPORT_STORE=supabase requires ... to be configured on the server`。

> 安全提示：`SUPABASE_SERVICE_ROLE_KEY` 拥有高权限，只能用于服务端 Route Handlers，严禁写入客户端代码或添加 `NEXT_PUBLIC_` 前缀。

后续也可以继续保留 `ReportStore` 接口，新增 Neon Postgres、Upstash Redis 或 Cloudflare D1 实现。

---


## 基础限流 / 滥用防护

MVP 已对高风险接口增加内存限流：

| 接口 | 默认规则 | 风险目的 |
|---|---|---|
| `POST /api/reports` | 同 IP 每小时 5 次 | 降低 AI 成本被刷。 |
| `POST /api/admin/reports/{id}/mark-paid` | 同 IP 每 10 分钟 10 次 | 降低 admin token 被撞库风险。 |
| `GET /api/reports/{id}/export` | 同 IP 每小时 20 次 | 降低导出接口被滥用。 |

限流 IP 读取顺序：

1. `x-forwarded-for` 的第一个 IP。
2. `x-real-ip`。
3. 缺失时使用 `unknown`。

超限会返回 `429` JSON，并带上 `Retry-After`、`X-RateLimit-Limit`、`X-RateLimit-Remaining`、`X-RateLimit-Reset` 响应头。

可选环境变量：

```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REPORTS_PER_HOUR=5
RATE_LIMIT_EXPORT_PER_HOUR=20
RATE_LIMIT_ADMIN_PER_10MIN=10
```

> 已知限制：当前实现是进程内存限流。在 Vercel / Cloudflare Pages 等 Serverless 多实例环境下，它不是全局强一致；冷启动、实例扩缩容或多 region 都可能导致计数不共享。生产环境建议把同一接口替换为 Upstash Redis、Vercel KV 或其他集中式限流服务。

---


## 测试

上线前建议至少运行：

```bash
npm run test:smoke
npm run build
```

`npm run test:smoke` 会启动临时 Next.js dev server，并使用 `REPORT_STORE=json` 与临时目录覆盖核心链路：

- 创建报告正常输入返回 `reportId` 和 `accessToken`。
- 缺少性别 / 日期 / 时间返回 400。
- 无 `DEEPSEEK_API_KEY` 时 AI fallback 不会导致创建报告失败。
- AI Provider 返回非法 JSON 时会 fallback，并记录失败原因。
- free 报告不能导出，paid 报告可以导出 Markdown。
- 错误 `ADMIN_TOKEN` 不能 mark-paid，正确 `ADMIN_TOKEN` 可以 mark-paid。
- 错误 report token 不能查看报告内容或导出报告。

Smoke tests 不会调用真实 DeepSeek，也不依赖生产 Supabase；测试结束会清理临时 JSON 报告目录。

---

## 手动支付占位流程

当前 MVP 不接真实支付。流程为：

1. 用户创建免费报告。
2. 用户点击“解锁完整报告”进入 `/checkout/{reportId}`。
3. Checkout 页展示价格、收款说明、微信收款码占位。
4. 管理员确认收款后调用：

```bash
curl -X POST https://your-domain.com/api/admin/reports/{reportId}/mark-paid \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

5. 报告状态变为 `paid`，`/report/{reportId}` 立即展示完整报告章节。
6. paid 报告可访问 `/api/reports/{reportId}/export` 下载 Markdown。

---

## 已知问题

- 当前支付为手动占位，不包含真实支付网关、订单系统或自动回调。
- 本地开发默认使用 JSON 文件存储；生产请设置 `REPORT_STORE=supabase` 并先执行 Supabase migration。
- 当前 AI 输出 Prompt 和内容质量仍需继续调优，尤其是章节深度、术语解释和安全边界。
- `OPENAI_API_KEY` 为预留变量，当前代码默认仅支持 `AI_PROVIDER=deepseek`。
- Markdown 导出仅对 `paid` 报告开放，`free` / `failed` 报告会返回 403。
- Cloudflare Pages 可能需要额外 Next.js 适配；若 API Routes 或 Node.js runtime 不兼容，建议优先 Vercel。
- 当前限流为进程内存实现，在 Serverless 多实例下不是强一致；生产建议替换为 Upstash Redis / Vercel KV。
- 当前没有复杂用户系统、报告历史、自动支付、后台 CMS、RAG 知识库和 PDF 导出。

---

## Attribution

本产品排盘算法与部分数据基于 `Renhuai123/ziwei-doushu` 开源项目，遵循 MIT License。

- 上游仓库：https://github.com/Renhuai123/ziwei-doushu
- 原作者/数据来源标注请在产品页面、导出报告或 About 页面保留。

报告导出中的 Attribution 文案：

> 本产品排盘算法与部分数据基于 Renhuai123/ziwei-doushu 开源项目，遵循 MIT License。来源：https://github.com/Renhuai123/ziwei-doushu

---

## License

本仓库保留上游项目的 MIT License。请勿删除 `LICENSE` 文件。

代码与衍生项目使用时，请保留版权声明、MIT License 以及上游 Attribution。

---

## P1 / P2 建议

P1：

- 将内存限流替换为 Upstash Redis / Vercel KV 等集中式限流。
- 为 Supabase 报告表补充 Row Level Security 策略、备份策略和数据删除流程。
- 增加 Neon/Upstash/D1 等其他 `ReportStore` 实现。
- 增加管理员后台或受保护工具页，替代手写 curl 标记 paid。
- 扩展自动化测试覆盖 Supabase、限流和更多异常输入。

P2：

- 接入 Stripe、微信支付或其他真实支付网关。
- 增加用户系统与报告历史。
- 增加 PDF 导出。
- 增加 RAG 知识库与 Prompt 版本管理。
- 增加报告再生成与对比能力。
