import Link from 'next/link';
import ProfileForm from './ProfileForm';

export default function NewProfilePage() {
  return (
    <main className="min-h-screen bg-[#050712] px-5 py-8 text-slate-100 sm:px-8">
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-purple-700/30 blur-3xl" />
        <div className="absolute bottom-[-180px] right-[-120px] h-[420px] w-[420px] rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        <header className="mb-10 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold tracking-[0.25em] text-amber-200 no-underline">StarInsight</Link>
          <Link href="/" className="text-sm text-slate-400 transition hover:text-amber-100">返回首页</Link>
        </header>

        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
            <p className="mb-4 text-xs uppercase tracking-[0.35em] text-amber-300/80">Profile MVP</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">创建我的命盘档案</h1>
            <p className="mt-5 text-sm leading-7 text-slate-300 sm:text-base">
              这不是一次性报告，而是你的长期观察档案。系统会先记录出生信息并生成命盘结构，再给出可复盘的个人档案摘要与本季度行动建议。
            </p>
            <div className="mt-6 space-y-3 text-sm text-slate-300">
              {['生成基础命盘', '建立个人档案', '得到 3 条本季度行动建议'].map(item => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                  <span className="h-2 w-2 rounded-full bg-amber-300" />
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs leading-6 text-slate-500">
              免责声明：内容仅供文化娱乐、自我观察和个人参考，不构成医学、法律、投资、婚恋等重大决策建议。
            </p>
          </div>

          <ProfileForm />
        </section>
      </div>
    </main>
  );
}
