import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getReport } from '@/lib/report/store';
import type { BirthInfo, ReportOutput, ReportStatus } from '@/lib/report/types';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { BRANCHES } from '@/lib/ziwei/constants';

const SECTION_LABELS: Array<{ key: keyof ReportOutput['sections']; title: string }> = [
  { key: 'overview', title: '命格总览' },
  { key: 'personality', title: '性格优势' },
  { key: 'career', title: '事业方向' },
  { key: 'wealth', title: '财运模式' },
  { key: 'relationship', title: '感情关系' },
  { key: 'health', title: '健康提醒' },
  { key: 'yearlyAdvice', title: '未来一年建议' },
  { key: 'actionPlan', title: '行动建议' },
];

type PublicReportView = {
  id: string;
  status: ReportStatus;
  birthInfo: BirthInfo;
  chartBasics: {
    mingGong: string;
    shenGong: string;
    wuxingJuName: string;
    currentAge: number;
    currentDaXian?: string;
  };
  aiSummary: string;
  aiHighlights: string[];
  fullReport?: ReportOutput;
};

function buildPublicReportView(report: Awaited<ReturnType<typeof getReport>>): PublicReportView | null {
  if (!report) return null;

  const chart = report.chartData as ZiweiChart;
  const currentDaXian = chart.daXians[chart.currentDaXianIndex];
  const base = {
    id: report.id,
    status: report.status,
    birthInfo: report.birthInfo,
    chartBasics: {
      mingGong: BRANCHES[chart.mingGongBranch] ?? String(chart.mingGongBranch),
      shenGong: BRANCHES[chart.shenGongBranch] ?? String(chart.shenGongBranch),
      wuxingJuName: chart.wuxingJuName,
      currentAge: chart.currentAge,
      currentDaXian: currentDaXian ? `${currentDaXian.startAge}–${currentDaXian.endAge}岁 · ${currentDaXian.palaceName}` : undefined,
    },
    aiSummary: report.aiSummary,
    aiHighlights: report.aiHighlights.slice(0, 3),
  } satisfies Omit<PublicReportView, 'fullReport'>;

  // 服务端内容边界：只有 paid 状态会把完整报告加入 view model。
  // free / failed 分支不会读取并下发 aiFullReport.sections。
  if (report.status === 'paid' && report.aiFullReport) {
    return { ...base, fullReport: report.aiFullReport };
  }

  return base;
}

function StatusBadge({ status }: { status: ReportStatus }) {
  const label = status === 'paid' ? '完整报告' : status === 'failed' ? '生成失败' : '免费报告';
  const color = status === 'paid' ? 'bg-emerald-300/15 text-emerald-100 border-emerald-200/20' : status === 'failed' ? 'bg-red-400/15 text-red-100 border-red-300/20' : 'bg-amber-300/15 text-amber-100 border-amber-200/20';
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${color}`}>{label}</span>;
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="mt-2 text-sm leading-7 text-slate-200">{children}</div>
    </div>
  );
}

function FreeSummary({ report }: { report: PublicReportView }) {
  return (
    <div className="rounded-2xl border border-amber-200/20 bg-amber-200/[0.06] p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-white">AI 摘要</h2>
      <p className="mt-3 text-sm leading-7 text-slate-300">{report.aiSummary || '摘要生成中，请稍后刷新。'}</p>
      <div className="mt-5">
        <h3 className="text-sm font-semibold text-amber-100">三条核心洞察</h3>
        <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-300">
          {report.aiHighlights.length > 0 ? report.aiHighlights.map(highlight => (
            <li key={highlight} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
              <span>{highlight}</span>
            </li>
          )) : (
            <li className="text-slate-400">暂无洞察内容。</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function PaidSections({ fullReport, reportId: fullReportId }: { fullReport: ReportOutput; reportId: string }) {
  return (
    <section className="mt-6 grid gap-4">
      <div className="rounded-2xl border border-emerald-200/20 bg-emerald-300/[0.06] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">完整报告已解锁</h2>
            <p className="mt-2 text-sm leading-7 text-slate-300">以下为完整 AI 命盘报告章节。</p>
          </div>
          <a href={`/api/reports/${fullReportId}/export`} className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950">
            下载 Markdown
          </a>
        </div>
      </div>
      {SECTION_LABELS.map(({ key, title }) => (
        <article key={key} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 sm:p-5">
          <h3 className="text-base font-semibold text-amber-100">{title}</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">{fullReport.sections[key]}</p>
        </article>
      ))}
      <p className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-xs leading-6 text-slate-400">
        {fullReport.disclaimer}
      </p>
    </section>
  );
}

function LockedPaidPrompt({ reportId }: { reportId: string }) {
  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-white">完整报告未解锁</h2>
      <p className="mt-2 text-sm leading-7 text-slate-300">
        当前为免费报告，仅展示命盘基础信息、AI 摘要和三条核心洞察。完整章节将在 paid 状态后由服务端展示。
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href={`/checkout/${reportId}`} className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 px-5 py-2 text-sm font-semibold text-slate-950">
          解锁完整报告
        </Link>
        <p className="break-all text-xs text-slate-500">Report ID：{reportId}</p>
      </div>
    </section>
  );
}

function FailedState() {
  return (
    <section className="mt-6 rounded-2xl border border-red-300/20 bg-red-500/[0.08] p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-red-100">报告生成失败</h2>
      <p className="mt-2 text-sm leading-7 text-slate-300">
        命盘或报告生成过程中出现错误。请返回重新填写，或稍后重试。当前页面不会展示完整报告内容。
      </p>
      <Link href="/chart/new" className="mt-4 inline-flex rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950">
        重新生成
      </Link>
    </section>
  );
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = buildPublicReportView(await getReport(id));
  if (!report) notFound();

  return (
    <main className="min-h-screen bg-[#050712] px-5 py-8 text-slate-100 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/chart/new" className="text-sm text-amber-200 underline-offset-4 hover:underline">
          ← 重新填写
        </Link>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 sm:mt-8 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-amber-200/80">Ziwei Report</p>
              <h1 className="mt-4 text-3xl font-semibold text-white">AI 紫微命盘报告</h1>
              <p className="mt-3 break-all text-sm text-slate-400">Report ID：{report.id}</p>
            </div>
            <StatusBadge status={report.status} />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <InfoCard title="出生信息">
              <div>昵称：{report.birthInfo.nickname || '未填写'}</div>
              <div>性别：{report.birthInfo.gender === 'male' ? '男' : '女'}</div>
              <div>日期：{report.birthInfo.birthDate}</div>
              <div>时间：{report.birthInfo.birthTime}</div>
              <div>出生地：{report.birthInfo.birthPlace || '未填写'}</div>
            </InfoCard>

            <InfoCard title="命盘基础信息">
              <div>命宫：{report.chartBasics.mingGong}</div>
              <div>身宫：{report.chartBasics.shenGong}</div>
              <div>五行局：{report.chartBasics.wuxingJuName}</div>
              <div>当前年龄：{report.chartBasics.currentAge}</div>
              <div>当前大限：{report.chartBasics.currentDaXian || '未匹配'}</div>
            </InfoCard>
          </div>

          {report.status === 'failed' ? <FailedState /> : <FreeSummary report={report} />}
          {report.status === 'paid' && report.fullReport ? <PaidSections fullReport={report.fullReport} reportId={report.id} /> : null}
          {report.status === 'free' ? <LockedPaidPrompt reportId={report.id} /> : null}
        </section>
      </div>
    </main>
  );
}
