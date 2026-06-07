import Link from 'next/link';
import NewChartForm from './NewChartForm';

export const metadata = {
  title: '生成命盘报告 · AI 紫微命盘报告',
  description: '输入出生信息，生成紫微命盘与 AI 命盘报告。',
};

export default function NewChartPage() {
  return (
    <main className="min-h-screen bg-[#050712] px-5 py-10 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-amber-200 underline-offset-4 hover:underline">
          ← 返回首页
        </Link>
        <section className="mx-auto max-w-3xl pt-12 text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-amber-200/80">Start Report</p>
          <h1 className="text-3xl font-semibold text-white sm:text-5xl">生成我的命盘报告</h1>
          <p className="mt-6 text-sm leading-7 text-slate-300 sm:text-base">
            填写出生信息后，系统会先生成紫微命盘并创建一份免费报告记录。AI 完整解读将在后续步骤接入。
          </p>
        </section>
        <NewChartForm />
      </div>
    </main>
  );
}
