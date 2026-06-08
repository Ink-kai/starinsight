# Vercel 预发布部署检查与上线清单

本文档用于将当前项目部署到 **Vercel Preview**，并在上线前完成环境变量、构建、smoke test 与人工验收检查。当前主部署路径为 Vercel；**Cloudflare Pages 暂为备选方案，不作为当前主部署路径**。

## 部署范围

- 本清单只覆盖预发布 / Preview 部署检查，不新增业务功能。
- 预发布环境应尽量与生产环境一致，尤其是报告存储、AI Provider、计费价格与访问控制相关环境变量。
- Preview 部署通过后，再按同一清单复核 Production 环境变量和人工路径。

## Vercel 环境变量配置方式

1. 登录 Vercel，进入项目 Dashboard。
2. 打开 **Settings → Environment Variables**。
3. 为 **Preview** 环境逐项添加下方变量；如果 Production 也要上线，请在 Production 环境重复配置。
4. 变量保存后，重新触发一次 Preview Deployment，确保最新环境变量被构建和运行时读取。
5. 需要区分客户端与服务端变量：只有 `NEXT_PUBLIC_` 前缀变量会暴露给浏览器，其余变量必须只在服务端使用。

> 安全要求：`SUPABASE_SERVICE_ROLE_KEY` 是高权限服务端密钥，**不要把 service role key 暴露到客户端**，也不要创建 `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` 之类的变量名。该 key 只能配置在 Vercel 服务端环境变量中，并仅由服务端 Route Handler / Server Component 读取。

## 必填环境变量

| 变量 | Preview 要求 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_NAME` | 必填 | 客户端可见的应用名称。 |
| `NEXT_PUBLIC_SITE_URL` | 建议填写 | Preview 可先使用 Vercel preview URL；Production 改为正式域名。 |
| `AI_PROVIDER` | `deepseek` | 当前 AI 报告 Provider。 |
| `AI_MODEL` | 必填 | 例如 `deepseek-chat`，按当前模型策略配置。 |
| `DEEPSEEK_API_KEY` | 必填 | DeepSeek API Key，仅服务端使用。 |
| `ADMIN_TOKEN` | 必填且足够强 | 建议至少 32 位随机字符串，避免使用人类可猜测词。 |
| `REPORT_PRICE` | 必填 | 报告价格，使用正数。 |
| `REPORT_STORE` | `supabase` | 预发布 / 生产报告存储必须使用 Supabase。 |
| `SUPABASE_URL` | `REPORT_STORE=supabase` 时必填 | Supabase Project URL。 |
| `SUPABASE_SERVICE_ROLE_KEY` | `REPORT_STORE=supabase` 时必填 | Supabase service role key，只能服务端使用。 |
| `RATE_LIMIT_ENABLED` | 应为开启状态 | 上线前确认防刷限流已启用。 |

## 本地与 CI 检查命令

```bash
npm run check:env
npm run build
npm run test:smoke
```

`npm run check:env` 会检查以下关键变量是否存在：

- `NEXT_PUBLIC_APP_NAME`
- `AI_PROVIDER`
- `AI_MODEL`
- `DEEPSEEK_API_KEY`
- `ADMIN_TOKEN`
- `REPORT_PRICE`
- `REPORT_STORE`
- 当 `REPORT_STORE=supabase` 时，还会检查 `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY`

该脚本还会要求 `REPORT_STORE=supabase`，并要求 `ADMIN_TOKEN` 至少 32 个字符，以便提前发现不适合预发布 / 生产部署的配置。

## Vercel Preview 部署步骤

1. 在 Vercel 导入仓库并选择 Next.js 项目。
2. 确认构建命令为 `npm run build`。
3. 在 Vercel 的 Preview 环境添加所有必填环境变量。
4. 确认 Supabase migration 已在目标 Supabase 项目执行完成。
5. 触发 Preview Deployment。
6. 部署完成后，在 Vercel Deployment Logs 中确认 build 无错误。
7. 访问 Preview URL，按下方上线前 checklist 做人工验收。

## 上线前 checklist

### 环境与安全

- [ ] 环境变量是否完整。
- [ ] `REPORT_STORE` 是否为 `supabase`。
- [ ] Supabase migration 是否已执行。
- [ ] `DEEPSEEK_API_KEY` 是否存在，且未暴露到客户端。
- [ ] `ADMIN_TOKEN` 是否足够强，建议至少 32 位随机字符串。
- [ ] `RATE_LIMIT_ENABLED` 是否开启。
- [ ] 隐私政策 / 服务条款是否已更新。
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 是否只配置为服务端环境变量，且没有 `NEXT_PUBLIC_` 前缀。

### 自动化检查

- [ ] `npm run check:env` 是否通过。
- [ ] `npm run build` 是否通过。
- [ ] `npm run test:smoke` 是否通过。

### 人工路径验证

- [ ] 首页是否可正常访问和跳转。
- [ ] 输入页是否可填写出生信息并进入后续流程。
- [ ] 报告页是否可打开有效报告，并能正确处理不存在的报告 ID。
- [ ] checkout 是否完成手动验证；如果当前版本没有独立 checkout 路由，记录对应入口、按钮或占位状态。
- [ ] export 是否完成手动验证；如果当前版本没有独立 export 路由，记录导出按钮、分享卡片或占位状态。

## Cloudflare Pages 说明

项目保留 `build:cf` 和 `preview:cf` 脚本用于后续兼容性探索，但当前上线主路径是 Vercel。除非另有部署决策，预发布验收、环境变量配置和上线 checklist 都以 Vercel Preview 为准。
