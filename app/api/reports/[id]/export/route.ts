import { NextResponse } from 'next/server';
import { getReportTokenFromUrl, verifyReportAccess } from '@/lib/report/access';
import { checkRateLimit, exportRateLimitRule, rateLimitResponse } from '@/lib/rate-limit';
import { getReport } from '@/lib/report/store';
import { generateReportMarkdown, getMarkdownFileName } from '@/lib/report/markdown';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rateLimit = checkRateLimit(request, exportRateLimitRule());
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const access = verifyReportAccess(report, getReportTokenFromUrl(request.url));
  if (!access.ok) {
    return NextResponse.json({ error: access.message }, { status: access.status });
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
