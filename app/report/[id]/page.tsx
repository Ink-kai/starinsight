import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getReport } from '@/lib/report/store';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { BRANCHES } from '@/lib/ziwei/constants';

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();

  const chart = report.chartData as ZiweiChart;

  return (
    <main className="min-h-screen bg-[#050712] px-5 py-10 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/chart/new" className="text-sm text-amber-200 underline-offset-4 hover:underline">
          ← 重新填写
        </Link>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-200/80">Free Report</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">命盘报告已创建</h1>
          <p className="mt-3 break-all text-sm text-slate-400">Report ID：{report.id}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="text-xs text-slate-500">出生信息</div>
              <div className="mt-2 text-sm leading-7 text-slate-200">
                <div>昵称：{report.birthInfo.nickname || '未填写'}</div>
                <div>性别：{report.birthInfo.gender === 'male' ? '男' : '女'}</div>
                <div>日期：{report.birthInfo.birthDate}</div>
                <div>时间：{report.birthInfo.birthTime}</div>
                <div>出生地：{report.birthInfo.birthPlace || '未填写'}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="text-xs text-slate-500">命盘基础</div>
              <div className="mt-2 text-sm leading-7 text-slate-200">
                <div>命宫：{BRANCHES[chart.mingGongBranch]}</div>
                <div>身宫：{BRANCHES[chart.shenGongBranch]}</div>
                <div>五行局：{chart.wuxingJuName}</div>
                <div>状态：{report.status}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200/20 bg-amber-200/[0.06] p-4">
            <h2 className="text-lg font-semibold text-white">免费摘要</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">{report.aiSummary}</p>
            <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-300">
              {report.aiHighlights.map(highlight => (
                <li key={highlight} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
