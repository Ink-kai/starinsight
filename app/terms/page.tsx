const PRODUCT_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'AI 紫微命盘报告';

export const metadata = {
  title: `服务条款 · ${PRODUCT_NAME}`,
  description: `${PRODUCT_NAME} 服务条款`,
};

const sectionStyle = { fontSize: 18, marginTop: 32, marginBottom: 12 };
const listStyle = { paddingLeft: 24 };

export default function TermsPage() {
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
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>服务条款</h1>
        <p style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 32 }}>最后更新：2026年6月</p>

        <p>
          欢迎使用 {PRODUCT_NAME}。使用本产品即表示你理解并同意以下条款。当前 MVP 提供出生信息输入、紫微命盘生成、AI 报告生成、免费摘要、手动付费占位、paid 完整报告展示和 Markdown 导出。
        </p>

        <h2 style={sectionStyle}>1. 服务性质</h2>
        <p>
          本产品将传统紫微斗数排盘算法与 AI 文本生成能力结合，输出面向普通用户的结构化命盘报告。
          报告内容仅供文化娱乐、自我观察和个人参考，不构成医学、法律、投资、婚恋、心理咨询或其他重大决策建议。
        </p>

        <h2 style={sectionStyle}>2. 用户责任</h2>
        <ul style={listStyle}>
          <li>你应自行确认输入的出生日期、出生时间、性别、出生地等信息是否准确；输入错误会影响报告结果。</li>
          <li>你不得将报告作为唯一或主要决策依据，应结合现实情况、专业意见和个人判断。</li>
          <li>你应妥善保管包含 access token 的私密报告链接；链接泄露可能导致他人访问报告。</li>
          <li>你不得滥用、攻击、批量调用、绕过限流或以其他方式干扰服务稳定性。</li>
          <li>你不得利用本产品生成违法、侵权、欺诈、骚扰或伤害他人的内容或行为。</li>
        </ul>

        <h2 style={sectionStyle}>3. AI 输出与命理分析限制</h2>
        <ul style={listStyle}>
          <li>AI 输出可能存在不准确、不完整、遗漏、重复、表达偏差或与传统命理解释不一致的情况。</li>
          <li>命理分析不保证任何结果，不应被理解为对未来、关系、健康、财富或事业的确定性判断。</li>
          <li>涉及健康、投资、法律、婚恋等事项时，请咨询具备资质的专业人士。</li>
          <li>我们可能在 AI Provider 不可用或请求失败时提供 fallback 报告，该内容可能更简略。</li>
        </ul>

        <h2 style={sectionStyle}>4. 付费与解锁</h2>
        <p>
          当前 MVP 不接入真实自动支付网关。付费为手动确认模式：用户进入 checkout 占位页，按页面说明完成付款和人工沟通；管理员确认后，通过受保护接口将报告状态标记为 paid。
          付费确认完成后，报告页会展示完整章节，并允许 Markdown 导出。
        </p>
        <p>
          后续如果接入 Stripe、微信支付或其他自动支付服务，价格、退款、订单状态和回调规则可能另行更新。
        </p>

        <h2 style={sectionStyle}>5. 报告访问与导出</h2>
        <ul style={listStyle}>
          <li>报告访问链接包含私密 token。没有正确 token 的请求将被拒绝。</li>
          <li>free 报告仅展示基础命盘信息、AI 摘要和核心洞察；paid 报告才展示完整章节。</li>
          <li>Markdown 导出仅对 paid 报告开放，并需要正确 access token。</li>
          <li>请勿公开分享包含个人出生信息或报告内容的私密链接，除非你自行承担相关风险。</li>
        </ul>

        <h2 style={sectionStyle}>6. 禁止滥用接口</h2>
        <p>你不得通过爬虫、脚本、批量注册、批量请求、暴力尝试 token、撞库 ADMIN_TOKEN、绕过限流等方式滥用本产品。我们保留限制访问、删除异常报告、暂停服务或采取进一步措施的权利。</p>

        <h2 style={sectionStyle}>7. 知识产权与 Attribution</h2>
        <p>
          本产品排盘算法与部分数据基于 Renhuai123/ziwei-doushu 开源项目，遵循 MIT License。页面和导出报告会保留 Attribution。
          除非另有说明，本产品新增页面、文案、提示词、报告组织方式和业务代码由本项目维护者提供。
        </p>

        <h2 style={sectionStyle}>8. 服务变更与可用性</h2>
        <p>
          本产品仍处于 MVP 阶段，功能、价格、AI Provider、存储方式、导出能力和部署环境可能调整。
          我们会尽力保持服务可用，但不承诺服务不中断或报告永久可访问。
        </p>

        <h2 style={sectionStyle}>9. 责任限制</h2>
        <p>
          在法律允许范围内，因使用或无法使用本产品、依赖报告内容、输入错误信息、泄露报告链接、第三方服务故障或 AI 输出偏差导致的损失，本产品不承担超出已支付费用范围的责任。
        </p>

        <h2 style={sectionStyle}>10. 联系方式与条款更新</h2>
        <p>
          如对服务条款、隐私、删除报告或 paid 状态确认有疑问，请通过产品页面公布的微信或邮箱联系我们。
          我们可能根据产品变化更新条款，继续使用即表示你接受更新后的条款。
        </p>

        <p style={{ marginTop: 48, fontSize: 12, color: 'var(--tx-3)' }}>
          <a href="/privacy" style={{ color: 'var(--ac)' }}>隐私政策</a> · <a href="/" style={{ color: 'var(--ac)' }}>返回首页</a>
        </p>
      </main>
    </>
  );
}
