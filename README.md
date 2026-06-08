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
- MVP 本地 JSON 文件报告存储

---

## 本地启动

```bash
# 安装依赖
npm install

# 准备环境变量
cp .env.example .env.local
# 编辑 .env.local，至少设置 ADMIN_TOKEN；如需真实 AI 生成，设置 DEEPSEEK_API_KEY

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
| `REPORT_STORE_DIR` | 否 | 本地 JSON 报告存储目录；仅建议本地开发使用。 |

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
6. Build Command 使用：

```bash
npm run build
```

7. Output 使用 Vercel 对 Next.js 的默认设置，不需要手动填写 output directory。
8. 部署完成后测试：
   - 首页 `/`
   - 输入页 `/chart/new`
   - 创建报告 `POST /api/reports`
   - 报告页 `/report/{id}`
   - Checkout 页 `/checkout/{id}`
   - 管理员接口 `POST /api/admin/reports/{id}/mark-paid`
   - paid 报告 Markdown 导出 `/api/reports/{id}/export`

### Vercel 生产存储注意

当前 MVP 的本地 JSON 文件存储只适合本地开发。Vercel Serverless/Edge 环境不能依赖项目目录文件作为持久化数据库；即使写入成功，也可能在冷启动、实例切换或重新部署后丢失。

生产部署建议尽快替换为：

- Supabase Postgres
- Neon Postgres
- Upstash Redis
- Cloudflare D1

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
2. 不依赖本地 JSON 文件持久化。
3. 已把报告存储迁移到 Cloudflare D1、Supabase、Neon 或 Upstash 等外部服务。

---

## Serverless 存储限制

当前报告存储位于 `lib/report/store.ts`，默认写入本地 JSON 文件：

```txt
data/reports/{reportId}.json
```

这只适合：

- 本地开发
- 功能验证
- 临时 demo

不适合：

- Vercel 生产环境
- Cloudflare Pages 生产环境
- 多实例部署
- 需要长期保存用户报告的商业环境

生产环境请替换为外部持久化存储：

- **Supabase Postgres**：推荐，适合报告、订单、用户数据。
- **Neon Postgres**：适合 Serverless PostgreSQL。
- **Upstash Redis**：适合轻量 KV、短期缓存、状态标记。
- **Cloudflare D1**：适合 Cloudflare 生态内的 SQLite-like 持久化。

建议保留 `ReportStore` 接口，新增数据库实现替换当前 `JsonFileReportStore`。

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
- 当前报告存储为本地 JSON 文件，不适合生产环境或 Serverless 持久化。
- 当前 AI 输出 Prompt 和内容质量仍需继续调优，尤其是章节深度、术语解释和安全边界。
- `OPENAI_API_KEY` 为预留变量，当前代码默认仅支持 `AI_PROVIDER=deepseek`。
- Markdown 导出仅对 `paid` 报告开放，`free` / `failed` 报告会返回 403。
- Cloudflare Pages 可能需要额外 Next.js 适配；若 API Routes 或 Node.js runtime 不兼容，建议优先 Vercel。
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

- 将报告存储替换为 Supabase/Neon/Upstash/D1。
- 将 `POST /api/reports` 接入真实 AI 生成结果，而不是只保存初始摘要。
- 增加管理员后台或受保护工具页，替代手写 curl 标记 paid。
- 补充基础自动化测试：报告创建、mark-paid、Markdown export。

P2：

- 接入 Stripe、微信支付或其他真实支付网关。
- 增加用户系统与报告历史。
- 增加 PDF 导出。
- 增加 RAG 知识库与 Prompt 版本管理。
- 增加报告再生成与对比能力。
