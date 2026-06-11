const PRODUCT_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'AI 紫微命盘报告';

export const metadata = {
  title: `隐私政策 · ${PRODUCT_NAME}`,
  description: `${PRODUCT_NAME} 隐私政策`,
};

const sectionStyle = { fontSize: 18, marginTop: 32, marginBottom: 12 };
const listStyle = { paddingLeft: 24 };

export default function PrivacyPage() {
  return (
    <>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-0)', borderBottom: '1px solid var(--bdr)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--tx-3)', textDecoration: 'none' }}>
          <span style={{ fontSize: '16px' }}>‹</span>
          <span>返回首页</span>
        </a>
        <div style={{ width: '1px', height: '20px', background: 'var(--bdr-med)' }} />
        <span style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em' }}>{PRODUCT_NAME}</span>
      </header>

      <main style={{ maxWidth: 820, margin: '0 auto', padding: '60px 24px 80px', color: 'var(--tx-1)', lineHeight: 1.8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>隐私政策</h1>
        <p style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 32 }}>最后更新：2026年6月</p>

        <p>
          本隐私政策适用于 {PRODUCT_NAME}。当前 MVP 不提供账号注册、手机号登录、短信验证码、会员体系或自动支付系统。
          我们仅围绕“输入出生信息、生成紫微命盘、生成 AI 报告、展示与导出报告、手动确认 paid 状态”处理必要数据。
        </p>

        <h2 style={sectionStyle}>1. 我们收集哪些数据</h2>
        <p>为生成和展示报告，我们可能收集或生成以下数据：</p>
        <ul style={listStyle}>
          <li><strong>出生信息</strong>：昵称（可选）、性别、出生日期、出生时间、出生地（可选）、是否使用真太阳时。</li>
          <li><strong>命盘数据</strong>：根据出生信息生成的紫微命盘 JSON、命宫、身宫、星曜、四化、大限等结构化数据。</li>
          <li><strong>AI 报告内容</strong>：AI 生成的摘要、三条核心洞察、完整报告章节、免责声明等文本。</li>
          <li><strong>报告访问数据</strong>：报告 ID、私密访问 token、报告状态（free / paid / failed）、创建和更新时间。</li>
          <li><strong>手动支付确认信息</strong>：当你选择解锁完整报告时，可能通过微信、邮箱或其他人工沟通方式向管理员提供付款凭证、昵称、私密报告链接或必要的联系信息。</li>
          <li><strong>基础技术信息</strong>：为安全和限流需要，服务端可能读取请求 IP、请求时间、接口路径和错误日志。</li>
        </ul>

        <h2 style={sectionStyle}>2. 我们如何使用数据</h2>
        <ul style={listStyle}>
          <li>用于校验出生日期、时间、性别等输入是否完整有效。</li>
          <li>用于调用排盘算法生成紫微命盘。</li>
          <li>用于构造 AI 报告输入，并生成中文结构化命盘报告。</li>
          <li>用于在报告页展示免费摘要、paid 完整报告和 Markdown 导出内容。</li>
          <li>用于人工核对付款并将报告状态从 free 标记为 paid。</li>
          <li>用于基础安全防护、接口限流、故障排查和服务稳定性改进。</li>
        </ul>

        <h2 style={sectionStyle}>3. 第三方服务</h2>
        <p>为提供 MVP 服务，我们可能使用以下第三方基础设施或 API：</p>
        <ul style={listStyle}>
          <li><strong>AI Provider</strong>：DeepSeek 或其他 OpenAI-compatible API。生成报告时，系统可能把出生信息、命盘结构和必要上下文发送给配置的 AI Provider。</li>
          <li><strong>部署服务</strong>：Vercel、Cloudflare Pages 或类似服务，用于托管网站和 API Route。</li>
          <li><strong>存储服务</strong>：本地 JSON 文件（仅本地开发）或 Supabase Postgres 等数据库，用于保存报告记录。</li>
          <li><strong>人工收款渠道</strong>：当前为手动支付占位流程，付款和沟通可能发生在微信、邮箱或其他你主动选择的沟通渠道。</li>
        </ul>
        <p>我们不会使用短信验证码服务，也不会基于当前 MVP 创建手机号账号、会员账号或自动支付订单记录。</p>

        <h2 style={sectionStyle}>4. 数据存储与保留</h2>
        <p>
          本地开发环境可能把报告保存为本地 JSON 文件；生产环境建议使用 Supabase Postgres 或其他外部数据库。
          报告数据会保存到支持报告访问、paid 状态确认和导出所需的时间。后续如接入正式订单或用户系统，会同步更新本政策。
        </p>

        <h2 style={sectionStyle}>5. 报告访问链接与安全</h2>
        <p>
          报告通过包含私密 access token 的链接访问。请妥善保管该链接；任何获得链接的人都可能访问对应报告。
          我们会尽量通过服务端 token 校验、接口限流和最小化展示来降低泄露风险，但无法保证互联网传输和第三方沟通渠道 100% 安全。
        </p>

        <h2 style={sectionStyle}>6. 数据删除</h2>
        <p>
          如果你希望删除某份报告数据，可以通过产品页面公布的联系方式提交请求，并提供可验证的报告 ID、私密访问链接或其他必要信息。
          我们会在合理时间内处理删除请求；如果相关数据因备份、日志、安全审计或法律义务需要保留，可能会延迟或限制删除。
        </p>

        <h2 style={sectionStyle}>7. Cookie 与本地存储</h2>
        <p>
          当前 MVP 不依赖账号登录 Cookie。浏览器可能仅保存你访问页面所需的常规缓存或未来的偏好设置。
          如后续增加登录、报告历史或支付系统，我们会在政策中补充说明。
        </p>

        <h2 style={sectionStyle}>8. 未成年人</h2>
        <p>
          本产品面向成年人提供文化娱乐和自我观察内容。未成年人应在监护人同意和指导下使用，不应将报告用于重大人生决策。
        </p>

        <h2 style={sectionStyle}>9. 免责声明</h2>
        <p>
          本产品及报告仅供文化娱乐、自我观察和个人参考，不构成医学、法律、投资、婚恋或其他重大决策建议。
          请勿将本产品输出作为唯一决策依据。
        </p>

        <h2 style={sectionStyle}>10. 政策更新与联系</h2>
        <p>
          我们可能根据功能变化、法律要求或部署方式更新本隐私政策。重大变化会尽量以页面提示或文档更新方式说明。
          如有隐私、删除或数据处理问题，请通过产品页面公布的微信或邮箱联系我们。
        </p>

        <p style={{ marginTop: 48, fontSize: 12, color: 'var(--tx-3)' }}>
          <a href="/terms" style={{ color: 'var(--ac)' }}>服务条款</a> · <a href="/" style={{ color: 'var(--ac)' }}>返回首页</a>
        </p>
      </main>
    </>
  );
}
