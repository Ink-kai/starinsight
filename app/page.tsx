import Link from 'next/link';

const VALUE_POINTS = [
  {
    title: '建立个人命盘档案',
    description: '用出生信息生成基础命盘，把它作为长期自我观察和决策记录的背景资料。',
  },
  {
    title: '记录关键决定',
    description: '未来可围绕职业、财富、关系、学习等重要问题记录当时的选择与理由。',
  },
  {
    title: '追踪行动结果',
    description: '不追求一次性预测，而是持续记录行动、结果与复盘，形成自己的经验线索。',
  },
];

const FLOW = ['填写出生信息', '生成命盘结构', '创建个人档案', '获得本季度行动建议'];
const ACTIONS = ['记录一个当前最重要的人生问题', '为这个问题写下三个可选方案', '在一个月后回顾实际行动与结果'];
const DISCLAIMER = '本产品仅供文化娱乐、自我观察和个人参考，不构成医学、法律、投资、婚恋或其他重大决策建议。请勿将本产品作为唯一决策依据。';
const ATTRIBUTION = '本产品排盘算法与部分数据基于 Renhuai123/ziwei-doushu 开源项目，遵循 MIT License。';

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
        <Link href="/" className="text-sm font-semibold tracking-[0.25em] text-amber-200 no-underline">StarInsight</Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-300 sm:flex">
          <a href="#value" className="transition hover:text-amber-200">价值</a>
          <a href="#flow" className="transition hover:text-amber-200">流程</a>
          <a href="#sample" className="transition hover:text-amber-200">示例档案</a>
          <a href="#disclaimer" className="transition hover:text-amber-200">免责声明</a>
        </nav>
      </header>

      <section className="relative z-10 mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-12 sm:px-8 md:grid-cols-[1.05fr_0.95fr] md:items-center md:pb-28 md:pt-20">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs tracking-[0.18em] text-amber-100">
            个人档案 · 决策记录 · 长期复盘
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            StarInsight
          </h1>
          <p className="mt-5 max-w-2xl text-2xl font-medium leading-9 text-amber-100 sm:text-3xl">
            你的个人命盘档案与决策追踪系统
          </p>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            记录关键决定，追踪行动结果，让每一次迷茫都留下可复盘的线索。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/profile/new"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 px-7 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_35px_rgba(251,191,36,0.25)] transition hover:scale-[1.02]"
            >
              创建我的命盘档案
            </Link>
            <a
              href="#sample"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm font-medium text-slate-100 transition hover:border-amber-200/50 hover:text-amber-100"
            >
              查看示例档案
            </a>
          </div>
          <p className="mt-5 text-xs leading-6 text-slate-500">
            StarInsight 不替你做决定，而是帮助你把问题、选择、行动和结果留在同一个长期档案里。
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur md:p-7">
          <div className="rounded-[1.5rem] border border-amber-200/20 bg-[#090b18] p-5">
            <p className="mb-4 text-xs tracking-[0.3em] text-amber-200/80">PROFILE PREVIEW</p>
            <h2 className="text-xl font-semibold text-white">个人档案初版</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              系统已记录你的出生信息与命盘结构。后续你可以围绕职业、财富、关系、学习等关键问题持续记录决策与复盘。
            </p>
            <div className="mt-5 space-y-3">
              {ACTIONS.map((item, index) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-2 text-xs font-semibold text-amber-200">行动 {index + 1}</div>
                  <p className="text-sm leading-6 text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="value" className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <SectionTitle
          eyebrow="Core Value"
          title="不是一次性解读，而是长期档案"
          description="命盘只是起点。真正有价值的是持续记录你在关键节点如何判断、如何行动，以及后来发生了什么。"
        />
        <div className="grid gap-4 md:grid-cols-3">
          {VALUE_POINTS.map(point => (
            <div key={point.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-6">
              <h3 className="text-lg font-semibold text-white">{point.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{point.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="flow" className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <SectionTitle eyebrow="Flow" title="四步创建你的个人档案" />
        <div className="grid gap-4 md:grid-cols-4">
          {FLOW.map((item, index) => (
            <div key={item} className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-amber-300 text-sm font-bold text-slate-950">{index + 1}</div>
              <p className="text-sm font-medium text-slate-100">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="sample" className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <SectionTitle eyebrow="Sample" title="示例档案卡片" description="MVP 阶段先建立基础档案和行动建议，决策记录与月度复盘会在下一阶段开放。" />
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-amber-200/15 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-200/80">Personal Archive</p>
          <h3 className="mt-4 text-2xl font-semibold text-white">个人命盘档案</h3>
          <p className="mt-4 text-sm leading-8 text-slate-300">
            这是你的个人命盘档案初版。系统已记录出生信息与命盘结构，后续将帮助你围绕关键问题持续记录决策与复盘。
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {ACTIONS.map(item => (
              <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm leading-6 text-slate-300">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section id="disclaimer" className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 text-sm leading-7 text-slate-300">
          <h2 className="mb-3 text-lg font-semibold text-white">免责声明与 Attribution</h2>
          <p>{DISCLAIMER}</p>
          <p className="mt-3">{ATTRIBUTION}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
            <Link href="/privacy" className="hover:text-amber-100">隐私政策</Link>
            <Link href="/terms" className="hover:text-amber-100">服务条款</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
