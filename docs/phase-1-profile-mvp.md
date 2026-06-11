# StarInsight Phase 1 — Profile MVP

## 1. 本阶段实现范围

Phase 1 只实现「个人命盘档案」闭环：

1. 首页引导用户创建个人命盘档案。
2. 用户在 `/profile/new` 填写出生信息。
3. `POST /api/profiles` 校验输入并调用现有紫微排盘逻辑。
4. 系统创建并保存 `Profile`。
5. 用户跳转到 `/profile/[id]` 查看档案。
6. 刷新后仍可读取档案数据。

本阶段不开发 report、checkout、paid、mark-paid、export、production test、订单、支付、登录、订阅、Decision、ActionItem、Review。

## 2. 页面清单

- `/`：StarInsight 新方向首页，CTA 指向 `/profile/new`。
- `/profile/new`：创建个人命盘档案表单。
- `/profile/[id]`：个人命盘档案详情页。

## 3. API 清单

- `POST /api/profiles`
  - 创建 Profile。
  - 返回 `profileId` 与 `profileUrl`。
- `GET /api/profiles/[id]`
  - 返回 `{ profile }`。
  - 找不到返回 404。

## 4. 数据存储方式

当前采用本地 JSON 文件：

```txt
data/profiles.json
```

这是 MVP 临时存储方案，后续可迁移至 SQLite / PostgreSQL。该方案适合本地开发和 Phase 1 验证；如果部署到 Serverless 环境，不应依赖本地文件作为生产持久化存储。

## 5. AI fallback 说明

`lib/profile/summary.ts` 会在存在 `DEEPSEEK_API_KEY` 时尝试调用 DeepSeek OpenAI-compatible API 生成档案摘要。

如果没有 API Key、请求失败或 AI 返回结构不完整，系统使用 fallback：

- `profileSummary`：说明当前是个人命盘档案初版，后续可围绕关键问题持续记录决策与复盘。
- `decisionPattern`：说明当前先建立基础档案，后续根据决策记录识别长期模式。
- `quarterlyActions`：展示 3 条可执行行动建议。

AI 失败不会阻塞 Profile 创建。

## 6. 如何本地测试

```bash
npm run dev
```

手动验证：

1. 打开 `/`，确认 CTA 指向 `/profile/new`。
2. 打开 `/profile/new`，填写出生信息并提交。
3. 确认跳转到 `/profile/[id]`。
4. 刷新详情页，确认 Profile 不丢失。
5. 关闭 `DEEPSEEK_API_KEY` 时，确认 fallback 正常展示。

构建验证：

```bash
npm run build
```

## 7. 已知限制

- 当前存储是本地 JSON 文件，不适合作为 Serverless 生产持久化方案。
- Profile 详情页暂不要求完整复杂命盘 UI，只展示命宫、身宫、主星、五行局等核心信息。
- Decision、ActionItem、Review 仅作为后续阶段，不在本阶段实现。
- 当前没有账号系统，Profile URL 本阶段不做私密 token 控制。

## 8. 下一阶段建议

1. 引入 SQLite + Drizzle 或 Turso / PostgreSQL 存储。
2. 新增 Decision 记录。
3. 新增 ActionItem 状态追踪。
4. 新增 Review 复盘入口。
5. 为 Profile 增加私密 access token 或用户系统。
