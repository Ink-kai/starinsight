# Phase 1 Profile MVP 验收记录

## 1. 验收结论

Phase 1 Profile MVP 的功能闭环已通过本地验收：

- 首页 CTA 指向 `/profile/new`。
- `/profile/new` 可以创建 Profile。
- 创建后返回 `/profile/{profileId}`。
- `/profile/[id]` 可读取并展示 Profile。
- 使用临时 JSON store 验证刷新 / 重新请求后数据仍存在。
- 无 `DEEPSEEK_API_KEY` 时 fallback 正常。
- `quarterlyActions` 稳定返回 3 条。
- `npm run build` 通过。

但 PR 自检发现一个重要问题：当前本地没有 `main` 分支引用，无法执行 `git diff main...HEAD`。基于最新提交自身的变更文件检查，最新提交中包含旧方向文件（report / checkout / paid / export / mark-paid / production test）。如果这些文件在实际 PR diff 中仍显示为新增或修改，则本 PR 不应直接作为「只包含 Phase 1 Profile MVP」合并，需要拆分或重建干净分支。

## 2. PR 自检：是否只包含 Profile MVP 相关内容

### 2.1 检查方法

执行过：

```bash
git status --short
git branch --show-current
git log --oneline --decorate -5
git branch --all --no-color
git diff --stat main...HEAD
git diff --name-only main...HEAD
git show --name-only --pretty=format:'%h %s' HEAD
git show --stat --oneline HEAD
```

结果：

- 当前实际分支为 `work`，不是预期的 `feat/profile-mvp`。
- 本地没有 `main` 分支引用，`main...HEAD` 无法解析。
- 最新提交 `2c7709b Introduce Profile MVP (StarInsight): pages, APIs, AI provider, stores and tests` 中包含 Profile MVP 文件，也包含旧方向文件。

### 2.2 本次 Profile MVP 相关文件

这些文件属于 Phase 1 Profile MVP 范围：

- `app/page.tsx`
- `app/layout.tsx`
- `app/profile/new/page.tsx`
- `app/profile/new/ProfileForm.tsx`
- `app/profile/[id]/page.tsx`
- `app/api/profiles/route.ts`
- `app/api/profiles/[id]/route.ts`
- `lib/profile/types.ts`
- `lib/profile/birth.ts`
- `lib/profile/store.ts`
- `lib/profile/summary.ts`
- `docs/phase-1-profile-mvp.md`
- `docs/phase-1-acceptance.md`

### 2.3 最新提交中出现的旧方向文件

以下文件属于旧方向，最新提交中显示为新增或修改：

- `app/api/admin/reports/[id]/mark-paid/route.ts`
- `app/api/reports/[id]/export/route.ts`
- `app/api/reports/route.ts`
- `app/checkout/[reportId]/page.tsx`
- `app/report/[id]/page.tsx`
- `lib/report/access.ts`
- `lib/report/birth.ts`
- `lib/report/markdown.ts`
- `lib/report/store.ts`
- `lib/report/supabase-store.ts`
- `lib/report/types.ts`
- `supabase/migrations/001_create_reports.sql`
- `tests/production/README.md`
- `tests/production/playwright.config.mjs`
- `tests/production/production.spec.mjs`
- `scripts/smoke-test.mjs` 中旧 report/export/paid 流程
- `package.json` 中的 `test:prod` / Playwright production test 相关配置

说明：

- 如果这些文件只是目标分支已有历史遗留，则本阶段可暂不处理。
- 如果它们出现在当前 Phase 1 PR diff 中，则不符合「本阶段只做 Profile」的验收要求。
- 建议合并前用远端最新 `main` 重新创建干净分支，只 cherry-pick / 复制 Profile MVP 相关文件，避免旧 report/checkout/export/paid/test suite 混入。

## 3. 逐项验收结果

| 编号 | 验收项 | 结果 | 说明 |
| --- | --- | --- | --- |
| 1 | 首页 CTA 是否指向 `/profile/new` | 通过 | 首页主 CTA 为「创建我的命盘档案」，链接到 `/profile/new`。 |
| 2 | `/profile/new` 是否可以创建 Profile | 通过 | 本地 dev server 下调用 `POST /api/profiles` 成功返回 `profileId` 与 `profileUrl`。 |
| 3 | 创建后是否跳转 `/profile/[id]` | 通过 | 前端表单使用 API 返回的 `profileUrl` 执行 `router.push(data.profileUrl)`；API 返回 `/profile/{profileId}`。 |
| 4 | 刷新 `/profile/[id]` 后数据是否仍存在 | 通过 | 使用临时 JSON store 创建后重新请求 `/api/profiles/{id}` 和 `/profile/{id}`，均可读取。 |
| 5 | 无 `DEEPSEEK_API_KEY` 时 fallback 是否正常 | 通过 | smoke 时显式清空 `DEEPSEEK_API_KEY`，返回 fallback `profileSummary` 与 `decisionPattern`。 |
| 6 | `quarterlyActions` 是否稳定返回 3 条 | 通过 | smoke 断言 `quarterlyActions.length === 3`。 |
| 7 | 移动端布局是否可用 | 基础通过 | 页面使用响应式 Tailwind grid、flex、`sm:` / `md:` / `lg:` 断点；未进行真实设备截图。 |
| 8 | Attribution 是否保留 | 通过 | 首页与 Profile 详情页均保留 Attribution。 |
| 9 | 免责声明是否保留 | 通过 | 首页与 Profile 详情页均保留免责声明。 |
| 10 | `npm run build` 是否通过 | 通过 | Next.js production build 成功。 |

## 4. 执行过的验收命令

### 4.1 Build

```bash
npm run build
```

结果：通过。

### 4.2 Profile API / 页面 smoke

使用临时 JSON store，避免写入仓库数据文件：

```bash
tmpfile=$(mktemp /tmp/starinsight-acceptance-profiles.XXXXXX.json)
PROFILE_STORE_FILE="$tmpfile" DEEPSEEK_API_KEY= npm run dev
```

创建 Profile：

```bash
curl -sS -X POST http://localhost:3000/api/profiles \
  -H 'Content-Type: application/json' \
  --data-binary '{"nickname":"Phase1Acceptance","gender":"male","birthDate":"1990-05-20","birthTime":"10:30","birthPlace":"上海","useTrueSolarTime":false}'
```

返回示例：

```json
{
  "profileId": "dd8471a8-444a-45b2-8d37-02ca215dd519",
  "profileUrl": "/profile/dd8471a8-444a-45b2-8d37-02ca215dd519"
}
```

读取 Profile：

```bash
curl -sS http://localhost:3000/api/profiles/dd8471a8-444a-45b2-8d37-02ca215dd519
```

页面检查：

```bash
curl -sS http://localhost:3000/profile/dd8471a8-444a-45b2-8d37-02ca215dd519
```

检查内容包含：

- `个人命盘档案`
- `本季度行动建议`
- `免责声明`
- `Attribution`

结果：通过。

## 5. Phase 2 准备建议

Phase 2 不建议继续沿用旧 report/export/paid/checkout/test suite 方向。建议优先：

1. 从干净 `main` 创建新的 Phase 2 分支，避免旧方向文件继续混入。
2. 引入 Profile access token，避免只凭 profile id 访问档案。
3. 将本地 JSON store 迁移到 SQLite + Drizzle，或选择 Turso / PostgreSQL 作为可部署持久化方案。
4. 新增 Decision 最小闭环：创建决策、关联 Profile、生成行动建议。
5. 新增面向 Profile / Decision 的 smoke test，替换旧 report/export/paid 测试。

## 6. 当前是否建议合并

功能层面：Phase 1 Profile MVP 可以进入下一步人工评审。

PR 纯净度层面：不建议在旧方向文件仍出现在 PR diff 中时直接合并。建议先确认实际 GitHub PR diff：

- 如果旧方向文件不在 PR diff 中：可以继续评审 Phase 1。
- 如果旧方向文件在 PR diff 中：应拆分 PR，只保留 Profile MVP 相关变更。
