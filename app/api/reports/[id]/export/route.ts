import { NextResponse } from 'next/server';
import { getReport } from '@/lib/report/store';
import { generateReportMarkdown, getMarkdownFileName } from '@/lib/report/markdown';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  if (report.status !== 'paid' || !report.aiFullReport) {
    return NextResponse.json({ error: 'Only paid reports can be exported' }, { status: 403 });
  }

  const markdown = generateReportMarkdown(report);
  const filename = getMarkdownFileName(report.id);

  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Cache-Control': 'private, no-store',
    },
  });
}
