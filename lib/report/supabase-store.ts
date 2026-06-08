import { randomUUID } from 'crypto';
import type { CreateReportInput, ReportStatus, ZiweiReport } from './types';
import type { ReportStore } from './store';

type SupabaseReportRow = {
  id: string;
  access_token: string;
  birth_info: unknown;
  chart_data: unknown;
  ai_summary: string | null;
  ai_highlights: unknown;
  ai_full_report: unknown | null;
  status: ReportStatus;
  metadata: unknown | null;
  created_at: string;
  updated_at: string;
};

const REPORTS_TABLE = 'reports';

function requireServerEnv(name: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`REPORT_STORE=supabase requires ${name} to be configured on the server`);
  }
  return value;
}

function normalizeSupabaseUrl(url: string): string {
  return url.replace(/\/$/, '');
}

function assertSafeReportId(id: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error('Invalid report id');
  }
}

function toReport<TChartData = unknown>(row: SupabaseReportRow): ZiweiReport<TChartData> {
  return {
    id: row.id,
    birthInfo: row.birth_info as ZiweiReport<TChartData>['birthInfo'],
    chartData: row.chart_data as TChartData,
    aiSummary: row.ai_summary ?? '',
    aiHighlights: Array.isArray(row.ai_highlights) ? row.ai_highlights.filter(item => typeof item === 'string') : [],
    aiFullReport: row.ai_full_report as ZiweiReport<TChartData>['aiFullReport'],
    status: row.status,
    metadata: row.metadata as ZiweiReport<TChartData>['metadata'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow<TChartData>(input: CreateReportInput<TChartData>, now: string): SupabaseReportRow {
  return {
    id: randomUUID(),
    access_token: randomUUID(),
    birth_info: input.birthInfo,
    chart_data: input.chartData,
    ai_summary: input.aiSummary ?? '',
    ai_highlights: input.aiHighlights ?? [],
    ai_full_report: input.aiFullReport ?? null,
    status: input.status ?? 'free',
    metadata: input.metadata ?? null,
    created_at: now,
    updated_at: now,
  };
}

function toPatch(patch: Partial<Omit<ZiweiReport, 'id' | 'createdAt'>>, updatedAt: string): Partial<SupabaseReportRow> {
  const row: Partial<SupabaseReportRow> = {
    updated_at: updatedAt,
  };

  if ('birthInfo' in patch) row.birth_info = patch.birthInfo;
  if ('chartData' in patch) row.chart_data = patch.chartData;
  if ('aiSummary' in patch) row.ai_summary = patch.aiSummary ?? '';
  if ('aiHighlights' in patch) row.ai_highlights = patch.aiHighlights ?? [];
  if ('aiFullReport' in patch) row.ai_full_report = patch.aiFullReport ?? null;
  if ('status' in patch && patch.status) row.status = patch.status;
  if ('metadata' in patch) row.metadata = patch.metadata ?? null;

  return row;
}

export class SupabaseReportStore implements ReportStore {
  private readonly restUrl: string;
  private readonly serviceRoleKey: string;

  constructor(options: { url?: string; serviceRoleKey?: string } = {}) {
    const url = options.url ?? requireServerEnv('SUPABASE_URL');
    this.serviceRoleKey = options.serviceRoleKey ?? requireServerEnv('SUPABASE_SERVICE_ROLE_KEY');
    this.restUrl = `${normalizeSupabaseUrl(url)}/rest/v1/${REPORTS_TABLE}`;
  }

  async create<TChartData>(input: CreateReportInput<TChartData>): Promise<ZiweiReport<TChartData>> {
    const now = new Date().toISOString();
    const row = toRow(input, now);
    const rows = await this.request<SupabaseReportRow[]>('', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(row),
    });
    const created = rows[0];
    if (!created) {
      throw new Error('Supabase report insert returned no row');
    }
    return toReport<TChartData>(created);
  }

  async get(id: string): Promise<ZiweiReport | null> {
    assertSafeReportId(id);
    const rows = await this.request<SupabaseReportRow[]>(`?id=eq.${encodeURIComponent(id)}&limit=1`, {
      method: 'GET',
    });
    const row = rows[0];
    return row ? toReport(row) : null;
  }

  async updateStatus(id: string, status: ReportStatus): Promise<ZiweiReport> {
    return this.update(id, { status });
  }

  async update(id: string, patch: Partial<Omit<ZiweiReport, 'id' | 'createdAt'>>): Promise<ZiweiReport> {
    assertSafeReportId(id);
    const rows = await this.request<SupabaseReportRow[]>(`?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(toPatch(patch, new Date().toISOString())),
    });
    const updated = rows[0];
    if (!updated) {
      throw new Error(`Report not found: ${id}`);
    }
    return toReport(updated);
  }

  private async request<T>(query: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.restUrl}${query}`, {
      ...init,
      headers: {
        apikey: this.serviceRoleKey,
        Authorization: `Bearer ${this.serviceRoleKey}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase reports request failed (${response.status}): ${text || response.statusText}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }
}
