import Link from 'next/link';

const PRODUCT_STEPS = [
  {
    title: '输入出生信息',
    description: '填写出生日期、时间、性别与出生地，系统会保留必要信息用于生成命盘。',
  },
  {
    title: '自动生成紫微命盘',
    description: '复用开源排盘算法生成十二宫、命宫、身宫、主星、辅星与大限结构。',
  },
  {
    title: 'AI 输出可读报告',
    description: '把复杂术语转译为普通用户能读懂的性格、事业、财运、感情建议。',
  },
  {
    title: '支持完整报告导出',
    description: 'MVP 将优先支持 Markdown 导出，便于收藏、复盘与个人记录。',
  },
];

const REPORT_SECTIONS = [
  '命格总览',
  '性格优势',
  '事业方向',
  '财运模式',
  '感情关系',
  '健康提醒',
  '未来一年建议',
  '行动建议',
];

const HIGHLIGHTS = [
  '命宫主星呈现出较强的自我驱动力，适合在清晰目标下持续积累。',
  '事业与财运需要结合官禄宫、财帛宫与迁移宫观察，避免只看单一星曜。',
  '未来一年建议把重心放在稳定节奏、减少冲动决策和建立长期计划上。',
];

const DISCLAIMER = '本产品仅供文化娱乐、自我观察和个人参考，不构成医学、法律、投资、婚姻或其他重大决策建议。请勿将本报告作为唯一决策依据。';
const ATTRIBUTION = '本产品排盘算法与部分数据基于 Renhuai123/ziwei-doushu 开源项目，遵循 MIT License。命理内容仅供文化娱乐与个人参考。';

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-amber-300/75">{eyebrow}</p>
      <h2 className="text-2xl font-semibold tracking-wide text-white sm:text-3xl">{title}</h2>
      {description && <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">{description}</p>}
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050712] text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute left-1/2 top-[-160px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-purple-700/30 blur-3xl" />
        <div className="absolute right-[-120px] top-1/3 h-[360px] w-[360px] rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-[-160px] left-[-120px] h-[420px] w-[420px] rounded-full bg-indigo-600/20 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="text-sm font-semibold tracking-[0.25em] text-amber-200 no-underline">
          AI 紫微命盘报告
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-300 sm:flex">
          <a href="#sample" className="transition hover:text-amber-200">示例报告</a>
          <a href="#pricing" className="transition hover:text-amber-200">价格</a>
          <a href="#disclaimer" className="transition hover:text-amber-200">免责声明</a>
        </nav>
      </header>

      <section className="relative z-10 mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-12 sm:px-8 md:grid-cols-[1.05fr_0.95fr] md:items-center md:pb-28 md:pt-20">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs tracking-[0.18em] text-amber-100">
            免费摘要 · 付费完整报告 · Markdown 导出规划中
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            AI 紫微命盘报告
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            用 AI 把复杂命盘转化为可阅读、可收藏的人生洞察。输入出生信息后，系统生成紫微命盘，并输出结构化的性格、事业、财运、感情与未来一年建议。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/chart/new"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 px-7 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_35px_rgba(251,191,36,0.25)] transition hover:scale-[1.02]"
            >
              立即生成我的命盘报告
            </Link>
            <a
              href="#sample"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm font-medium text-slate-100 transition hover:border-amber-200/50 hover:text-amber-100"
            >
              查看示例报告
            </a>
          </div>
          <p className="mt-5 text-xs leading-6 text-slate-500">
            无需先理解紫微斗数术语。MVP 先支持免费摘要与完整报告分层展示，不包含复杂社区、课程或登录体系。
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur md:p-7">
          <div className="rounded-[1.5rem] border border-amber-200/20 bg-[#090b18] p-5">
            <p className="mb-4 text-xs tracking-[0.3em] text-amber-200/80">REPORT PREVIEW</p>
            <h2 className="text-xl font-semibold text-white">你的免费摘要会包含</h2>
            <div className="mt-5 space-y-4">
              {HIGHLIGHTS.map((item, index) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-2 text-xs font-semibold text-amber-200">核心洞察 {index + 1}</div>
                  <p className="text-sm leading-7 text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/10 bg-white/[0.03] px-5 py-16 sm:px-8">
        <SectionTitle
          eyebrow="How it works"
          title="从排盘到报告，四步完成"
          description="MVP 保留原项目排盘能力，在其上新增面向普通用户的报告展示层。"
        />
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCT_STEPS.map((step, index) => (
            <div key={step.title} className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-purple-400/15 text-sm font-semibold text-amber-200">
                {index + 1}
              </div>
              <h3 className="text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="sample" className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-24">
        <SectionTitle
          eyebrow="Sample"
          title="示例报告：不是单纯排盘，而是可读建议"
          description="免费版展示基础命盘信息、命宫/身宫、AI 摘要与三条核心洞察；深度版展示完整章节。"
        />
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 sm:p-8">
            <div className="mb-5 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-amber-300/15 px-3 py-1 text-amber-100">免费摘要</span>
              <span className="rounded-full bg-purple-300/15 px-3 py-1 text-purple-100">AI 生成</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-slate-300">文化参考</span>
            </div>
            <h3 className="text-2xl font-semibold text-white">命格摘要示例</h3>
            <p className="mt-5 text-base leading-8 text-slate-300">
              这张命盘呈现出“先建立稳定结构，再通过专业能力打开局面”的倾向。你适合在清晰规则与长期目标中积累影响力；短期不宜频繁追逐外部机会，更适合把已有能力打磨成可复用的方法论。
            </p>
            <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-300">
              {HIGHLIGHTS.map(item => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <aside className="rounded-[2rem] border border-amber-200/20 bg-amber-200/[0.06] p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-white">完整报告包含</h3>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {REPORT_SECTIONS.map(section => (
                <div key={section} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
                  {section}
                </div>
              ))}
            </div>
            <Link href="/chart/new" className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-100">
              生成我的报告
            </Link>
          </aside>
        </div>
      </section>

      <section id="pricing" className="relative z-10 border-y border-white/10 bg-white/[0.03] px-5 py-16 sm:px-8">
        <SectionTitle eyebrow="Pricing" title="MVP 价格分层" description="先支持免费摘要 + 深度版完整报告；人工增强版仅展示，不进入自动化交付。" />
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-6">
            <p className="text-sm text-slate-400">免费版</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">¥0</h3>
            <p className="mt-4 text-sm leading-7 text-slate-300">命盘基础信息、命宫/身宫、简短 AI 摘要和 3 条核心洞察。</p>
          </div>
          <div className="rounded-[2rem] border border-amber-200/40 bg-amber-200/[0.08] p-6 shadow-[0_0_40px_rgba(251,191,36,0.12)]">
            <p className="text-sm text-amber-100">深度版</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">¥19.9 / ¥49</h3>
            <p className="mt-4 text-sm leading-7 text-slate-200">完整 AI 报告、章节化建议、命盘结构数据和 Markdown 导出能力。</p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-6 opacity-80">
            <p className="text-sm text-slate-400">人工增强版</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">即将开放</h3>
            <p className="mt-4 text-sm leading-7 text-slate-300">人工复核与补充建议暂不实现，仅作为后续商业化方向展示。</p>
          </div>
        </div>
      </section>

      <section id="disclaimer" className="relative z-10 mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white">免责声明</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">{DISCLAIMER}</p>
          <div className="mt-6 border-t border-white/10 pt-6">
            <h2 className="text-xl font-semibold text-white">Attribution</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">{ATTRIBUTION}</p>
            <a className="mt-3 inline-block text-sm text-amber-200 underline-offset-4 hover:underline" href="https://github.com/Renhuai123/ziwei-doushu" target="_blank" rel="noreferrer">
              Renhuai123/ziwei-doushu
            </a>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-5 py-8 text-center text-xs leading-6 text-slate-500 sm:px-8">
        <p>{ATTRIBUTION}</p>
        <p className="mt-2">© {new Date().getFullYear()} AI 紫微命盘报告</p>
      </footer>
    </main>
  );
}
