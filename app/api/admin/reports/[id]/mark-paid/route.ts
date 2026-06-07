import { NextResponse } from 'next/server';
import { buildFallbackReport } from '@/lib/ai/prompts/report';
import { getReport, updateReport } from '@/lib/report/store';
import type { ReportOutput } from '@/lib/report/types';

function getBearerToken(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice('Bearer '.length).trim();
  return request.headers.get('x-admin-token');
}

function buildUnlockReport(existingSummary: string, existingHighlights: string[], existingFullReport?: ReportOutput): ReportOutput {
  if (existingFullReport) return existingFullReport;
  const fallback = buildFallbackReport();
  return {
    ...fallback,
    summary: existingSummary || fallback.summary,
    highlights: existingHighlights.length >= 3 ? existingHighlights.slice(0, 3) : fallback.highlights,
  };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: 'ADMIN_TOKEN is not configured' }, { status: 503 });
  }

  const token = getBearerToken(request);
  if (token !== adminToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const report = await getReport(id);
  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  if (report.status === 'failed') {
    return NextResponse.json({ error: 'Failed reports cannot be marked paid' }, { status: 409 });
  }

  if (report.status === 'paid') {
    return NextResponse.json({ reportId: report.id, id: report.id, status: report.status, unchanged: true });
  }

  const updated = await updateReport(id, {
    status: 'paid',
    aiFullReport: buildUnlockReport(report.aiSummary, report.aiHighlights, report.aiFullReport),
    metadata: {
      ...report.metadata,
      paymentProvider: 'manual-placeholder',
      paidAt: new Date().toISOString(),
    },
  });

  return NextResponse.json({ reportId: updated.id, id: updated.id, status: updated.status });
}
