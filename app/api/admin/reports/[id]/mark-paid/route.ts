import { NextResponse } from 'next/server';
import { getReport, updateReport } from '@/lib/report/store';
import { buildFallbackReport } from '@/lib/ai/prompts/report';
import { adminMarkPaidRateLimitRule, checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import type { ReportOutput } from '@/lib/report/types';

export const runtime = 'nodejs';

function getBearerToken(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    return auth.slice('Bearer '.length).trim();
  }
  return request.headers.get('x-admin-token');
}

function buildUnlockReport(
  existingSummary: string,
  existingHighlights: string[],
  existingFullReport?: ReportOutput,
): ReportOutput {
  if (existingFullReport) return existingFullReport;

  const fallback = buildFallbackReport();
  return {
    ...fallback,
    summary: existingSummary || fallback.summary,
    highlights:
      existingHighlights.length >= 3
        ? existingHighlights.slice(0, 3)
        : fallback.highlights,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimit = checkRateLimit(request, adminMarkPaidRateLimitRule());
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json(
      { error: 'ADMIN_TOKEN is not configured' },
      { status: 503 },
    );
  }

  const token = getBearerToken(request);
  if (token !== adminToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const report = await getReport(id);

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (report.status === 'failed') {
      return NextResponse.json(
        { error: 'Failed reports cannot be marked paid' },
        { status: 409 },
      );
    }

    if (report.status === 'paid') {
      return NextResponse.json({
        reportId: report.id,
        id: report.id,
        status: report.status,
        unchanged: true,
      });
    }

    const updated = await updateReport(id, {
      status: 'paid',
      aiFullReport: buildUnlockReport(
        report.aiSummary,
        report.aiHighlights,
        report.aiFullReport,
      ),
      metadata: {
        ...report.metadata,
        paymentProvider: 'manual-placeholder',
        paidAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      reportId: updated.id,
      id: updated.id,
      status: updated.status,
    });
  } catch (error) {
    console.error('[admin/mark-paid] Failed to mark report as paid:', error);
    return NextResponse.json(
      { error: 'Failed to mark report as paid' },
      { status: 500 },
    );
  }
}