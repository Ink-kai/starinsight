import { NextResponse } from 'next/server';
import { getReport } from '@/lib/report/store';
import { verifyReportAccess } from '@/lib/report/access';
import { buildMarkdownExport } from '@/lib/report/markdown';
import { exportRateLimitRule, checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import type { ZiweiReport } from '@/lib/report/types';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimit = checkRateLimit(request, exportRateLimitRule());
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

  try {
    const { id } = await params;
    const report = await getReport(id);

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const token = new URL(request.url).searchParams.get('token');
    const accessResult = verifyReportAccess(report, token);

    if (!accessResult.ok) {
      return NextResponse.json(
        { error: accessResult.message },
        { status: accessResult.status },
      );
    }

    // Only paid reports can be exported
    if (report.status !== 'paid') {
      return NextResponse.json(
        { error: 'Only paid reports can be exported' },
        { status: 403 },
      );
    }

    const markdown = buildMarkdownExport(report);

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="ziwei-report-${report.id}.md"`,
      },
    });
  } catch (error) {
    console.error('[export] Failed to export report:', error);
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 },
    );
  }
}