import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BRANCHES } from '@/lib/ziwei/constants';
import { getProfile } from '@/lib/profile/store';
import type { ZiweiChart } from '@/lib/ziwei/types';

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

function formatGender(gender: 'male' | 'female') {
  return gender === 'male' ? '男' : '女';
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getMajorStars(chart: ZiweiChart, palaceBranch: number) {
  const palace = chart.palaces.find(item => item.branch === palaceBranch);
  if (!palace) return { palaceName: '未知', stars: [] as string[] };
  return {
    palaceName: palace.name,
    stars: palace.stars.filter(star => star.type === 'major').map(star => star.name),
  };
}

function InfoItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-100">{value || '未填写'}</p>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-5 shadow-xl backdrop-blur md:p-7">
      <h2 className="mb-4 text-xl font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) {
    notFound();
  }

  const chart = profile.chartData as ZiweiChart;
  const mingGong = getMajorStars(chart, chart.mingGongBranch);
  const shenGong = getMajorStars(chart, chart.shenGongBranch);
  const palaces = chart.palaces ?? [];
  const quarterlyActions = profile.quarterlyActions?.slice(0, 3) ?? [];

  return (
    <main className="min-h-screen bg-[#050712] px-5 py-8 text-slate-100 sm:px-8">
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute left-[-120px] top-[-160px] h-[420px] w-[420px] rounded-full bg-purple-700/25 blur-3xl" />
        <div className="absolute bottom-[-180px] right-[-120px] h-[460px] w-[460px] rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-sm font-semibold tracking-[0.25em] text-amber-200 no-underline">StarInsight</Link>
          <Link href="/profile/new" className="text-sm text-slate-400 transition hover:text-amber-100">创建新的档案</Link>
        </header>

        <section className="mb-8 rounded-[2rem] border border-amber-200/15 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-6 md:p-8">
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-amber-300/80">Personal Archive</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">个人命盘档案</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            这是 {profile.nickname || '你'} 的个人档案初版。后续可以把关键决定、实际行动与复盘结果持续记录在这里，形成长期的人生观察线索。
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <SectionCard title="基础信息">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoItem label="昵称" value={profile.nickname || profile.birthInfo.nickname} />
                <InfoItem label="性别" value={formatGender(profile.birthInfo.gender)} />
                <InfoItem label="出生日期" value={profile.birthInfo.birthDate} />
                <InfoItem label="出生时间" value={profile.birthInfo.birthTime} />
                <InfoItem label="出生地" value={profile.birthInfo.birthPlace} />
                <InfoItem label="创建时间" value={formatDateTime(profile.createdAt)} />
              </div>
            </SectionCard>

            <SectionCard title="命盘结构">
              <div className="space-y-4 text-sm leading-7 text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs text-slate-500">命宫</p>
                  <p className="mt-2 text-base text-white">{BRANCHES[chart.mingGongBranch]} · {mingGong.palaceName}</p>
                  <p className="mt-1">主星：{mingGong.stars.length ? mingGong.stars.join('、') : '空宫或无主星'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs text-slate-500">身宫</p>
                  <p className="mt-2 text-base text-white">{BRANCHES[chart.shenGongBranch]} · {shenGong.palaceName}</p>
                  <p className="mt-1">主星：{shenGong.stars.length ? shenGong.stars.join('、') : '空宫或无主星'}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoItem label="五行局" value={chart.wuxingJuName} />
                  <InfoItem label="当前年龄参考" value={`${chart.currentAge} 岁`} />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard title="命盘摘要">
              <p className="text-sm leading-8 text-slate-200">{profile.profileSummary}</p>
            </SectionCard>

            <SectionCard title="决策倾向">
              <p className="text-sm leading-8 text-slate-200">
                {profile.decisionPattern || '当前阶段先建立基础档案。后续系统会根据你的决策记录与复盘内容，逐步识别你的长期决策模式。'}
              </p>
            </SectionCard>

            <SectionCard title="优势与风险观察">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-amber-100">可利用的优势</h3>
                  <ul className="space-y-2 text-sm leading-6 text-slate-300">
                    {(profile.strengths?.length ? profile.strengths : ['适合先建立稳定记录习惯']).map(item => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-amber-100">需要留意的风险</h3>
                  <ul className="space-y-2 text-sm leading-6 text-slate-300">
                    {(profile.risks?.length ? profile.risks : ['避免把命盘当作唯一决策依据']).map(item => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="本季度行动建议">
              <div className="space-y-3">
                {quarterlyActions.map((action, index) => (
                  <div key={action} className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-300 text-xs font-bold text-slate-950">{index + 1}</span>
                    <p className="text-sm leading-7 text-slate-200">{action}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="下一步">
              <div className="grid gap-3 sm:grid-cols-2">
                <button disabled className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-slate-500">新增决策 · 下一阶段开放</button>
                <button disabled className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-slate-500">月度复盘 · 下一阶段开放</button>
              </div>
            </SectionCard>
          </div>
        </div>

        <footer className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-xs leading-6 text-slate-500">
          <p>免责声明：本产品仅供文化娱乐、自我观察和个人参考，不构成医学、法律、投资、婚恋或其他重大决策建议。请勿将本产品作为唯一决策依据。</p>
          <p className="mt-2">Attribution：本产品排盘算法与部分数据基于 Renhuai123/ziwei-doushu 开源项目，遵循 MIT License。</p>
        </footer>
      </div>
    </main>
  );
}
