import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import type { CreateReportInput, ReportStatus, ZiweiReport } from './types';
import { generateReportAccessToken } from './access';

// Database row type (snake_case)
interface DbReport {
  id: string;
  access_token: string;
  birth_info: unknown;
  chart_data: unknown;
  ai_summary: string | null;
  ai_highlights: unknown[];
  ai_full_report: unknown | null;
  status: ReportStatus;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Convert DB row to ZiweiReport
function mapDbToReport<TChartData>(row: DbReport): ZiweiReport<TChartData> {
  return {
    id: row.id,
    accessToken: row.access_token,
    birthInfo: row.birth_info as ZiweiReport['birthInfo'],
    chartData: row.chart_data as TChartData,
    aiSummary: row.ai_summary ?? '',
    aiHighlights: row.ai_highlights as string[],
    aiFullReport: row.ai_full_report as ZiweiReport['aiFullReport'],
    status: row.status,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert ZiweiReport to DB insert format
function reportToDbInsert(report: ZiweiReport<unknown>): Omit<DbReport, 'created_at' | 'updated_at'> {
  return {
    id: report.id,
    access_token: report.accessToken ?? '',
    birth_info: report.birthInfo,
    chart_data: report.chartData,
    ai_summary: report.aiSummary || null,
    ai_highlights: report.aiHighlights,
    ai_full_report: report.aiFullReport ?? null,
    status: report.status,
    metadata: report.metadata ?? null,
  };
}

export class SupabaseReportStore {
  private supabase: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    }

    this.supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  async create<TChartData>(input: CreateReportInput<TChartData>): Promise<ZiweiReport<TChartData>> {
    const now = new Date().toISOString();
    const report: ZiweiReport<TChartData> = {
      id: randomUUID(),
      accessToken: input.accessToken ?? generateReportAccessToken(),
      birthInfo: input.birthInfo,
      chartData: input.chartData,
      aiSummary: input.aiSummary ?? '',
      aiHighlights: input.aiHighlights ?? [],
      aiFullReport: input.aiFullReport,
      status: input.status ?? 'free',
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
    };

    const dbRow = {
      ...reportToDbInsert(report),
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await this.supabase
      .from('reports')
      .insert(dbRow)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create report in Supabase: ${error.message}`);
    }

    return mapDbToReport<TChartData>(data);
  }

  async get(id: string): Promise<ZiweiReport | null> {
    const { data, error } = await this.supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // PostgREST code for "no rows returned"
        return null;
      }
      throw new Error(`Failed to get report: ${error.message}`);
    }

    return mapDbToReport(data);
  }

  async getByAccessToken(accessToken: string): Promise<ZiweiReport | null> {
    const { data, error } = await this.supabase
      .from('reports')
      .select('*')
      .eq('access_token', accessToken)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get report by access token: ${error.message}`);
    }

    return mapDbToReport(data);
  }

  async updateStatus(id: string, status: ReportStatus): Promise<ZiweiReport> {
    return this.update(id, { status });
  }

  async update(
    id: string,
    patch: Partial<Omit<ZiweiReport, 'id' | 'createdAt'>>,
  ): Promise<ZiweiReport> {
    const dbPatch: Record<string, unknown> = {};

    if (patch.accessToken !== undefined) dbPatch.access_token = patch.accessToken;
    if (patch.birthInfo !== undefined) dbPatch.birth_info = patch.birthInfo;
    if (patch.chartData !== undefined) dbPatch.chart_data = patch.chartData;
    if (patch.aiSummary !== undefined) dbPatch.ai_summary = patch.aiSummary;
    if (patch.aiHighlights !== undefined) dbPatch.ai_highlights = patch.aiHighlights;
    if (patch.aiFullReport !== undefined) dbPatch.ai_full_report = patch.aiFullReport;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.metadata !== undefined) dbPatch.metadata = patch.metadata;
    dbPatch.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('reports')
      .update(dbPatch)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update report: ${error.message}`);
    }

    return mapDbToReport(data);
  }
}