import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getReport } from '@/lib/report/store';

const PRODUCT_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'AI 紫微命盘报告';
const REPORT_PRICE = process.env.REPORT_PRICE || '49';

export const metadata = {
  title: `解锁完整报告 · ${PRODUCT_NAME}`,
  description: '手动支付占位页面，用于解锁完整 AI 紫微命盘报告。',
};

export default async function CheckoutPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const report = await getReport(reportId);
  if (!report) notFound();

  return (
    <main className="min-h-screen bg-[#050712] px-5 py-8 text-slate-100 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Link href={`/report/${reportId}`} className="text-sm text-amber-200 underline-offset-4 hover:underline">
          ← 返回报告
        </Link>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 sm:p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-amber-200/80">Checkout Placeholder</p>
            <h1 className="mt-4 text-3xl font-semibold text-white">解锁完整报告</h1>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              当前为 MVP 手动支付占位流程。付款后，请将报告 ID 发送给管理员，由管理员确认后手动标记为 paid。
            </p>

            <div className="mt-8 rounded-2xl border border-amber-200/20 bg-amber-200/[0.06] p-5">
              <div className="text-sm text-slate-400">产品名称</div>
              <div className="mt-2 text-xl font-semibold text-white">{PRODUCT_NAME} · 深度版完整报告</div>
              <div className="mt-5 text-sm text-slate-400">价格</div>
              <div className="mt-2 text-4xl font-semibold text-amber-100">¥{REPORT_PRICE}</div>
              <div className="mt-5 break-all text-xs leading-6 text-slate-500">Report ID：{reportId}</div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-5">
              <h2 className="text-lg font-semibold text-white">收款说明</h2>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-300">
                <li>使用微信扫码向占位收款码付款。</li>
                <li>付款备注填写报告 ID 或昵称。</li>
                <li>付款后联系管理员，管理员确认后手动解锁完整报告。</li>
              </ol>
              <p className="mt-4 text-xs leading-6 text-slate-500">
                后续可将本页替换为 Stripe、微信支付或其他支付网关回调，回调成功后调用同一份 paid 状态更新逻辑。
              </p>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 sm:p-8">
            <h2 className="text-lg font-semibold text-white">微信收款码占位</h2>
            <div className="mt-5 flex aspect-square items-center justify-center rounded-3xl border border-dashed border-amber-200/30 bg-slate-950/60 p-6 text-center">
              <div>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-200/10 text-3xl">￥</div>
                <p className="mt-5 text-sm leading-7 text-slate-300">请在部署时替换为真实微信收款码图片。</p>
              </div>
            </div>
            <Link href={`/report/${reportId}`} className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-slate-100 hover:border-amber-200/40">
              我已付款，返回报告页
            </Link>
          </aside>
        </section>
      </div>
    </main>
  );
}
