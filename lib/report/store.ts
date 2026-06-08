import { randomBytes, randomUUID } from 'crypto';
import { mkdir, readFile, rename, writeFile } from 'fs/promises';
import path from 'path';
import type { CreateReportInput, ReportMetadata, ReportOutput, ReportStatus, ZiweiReport } from './types';

const REPORTS_DIR = process.env.REPORT_STORE_DIR || path.join(process.cwd(), 'data', 'reports');
const REPORT_FILE_EXTENSION = '.json';
const REPORT_STORE = process.env.REPORT_STORE || 'json';
const SUPABASE_REPORTS_TABLE = 'reports';

type StoredReport = ZiweiReport;
type ReportStoreKind = 'json' | 'supabase';

type SupabaseReportRow = {
  id: string;
  access_token: string;
  birth_info: ZiweiReport['birthInfo'];
  chart_data: unknown;
  ai_summary: string | null;
  ai_highlights: string[] | null;
  ai_full_report: ReportOutput | null;
  status: ReportStatus;
  metadata: ReportMetadata | null;
  created_at: string;
  updated_at: string;
};

export interface ReportStore {
  create<TChartData>(input: CreateReportInput<TChartData>): Promise<ZiweiReport<TChartData>>;
  get(id: string): Promise<ZiweiReport | null>;
  updateStatus(id: string, status: ReportStatus): Promise<ZiweiReport>;
  update(id: string, patch: Partial<Omit<ZiweiReport, 'id' | 'createdAt'>>): Promise<ZiweiReport>;
}

function assertSafeReportId(id: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error('Invalid report id');
  }
}

function getReportPath(id: string): string {
  assertSafeReportId(id);
  return path.join(REPORTS_DIR, `${id}${REPORT_FILE_EXTENSION}`);
}

function createAccessToken(): string {
  return randomBytes(24).toString('base64url');
}

function getReportStoreKind(): ReportStoreKind {
  if (REPORT_STORE === 'json' || REPORT_STORE === 'supabase') {
    return REPORT_STORE;
  }

  throw new Error(`Unsupported REPORT_STORE: ${REPORT_STORE}`);
}

async function ensureReportsDir(): Promise<void> {
  await mkdir(REPORTS_DIR, { recursive: true });
}

async function writeJsonAtomic(filePath: string, data: StoredReport): Promise<void> {
  await ensureReportsDir();
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  await rename(tmpPath, filePath);
}

function buildReport<TChartData>(input: CreateReportInput<TChartData>): ZiweiReport<TChartData> {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    accessToken: input.accessToken ?? createAccessToken(),
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
}

export class JsonFileReportStore implements ReportStore {
  async create<TChartData>(input: CreateReportInput<TChartData>): Promise<ZiweiReport<TChartData>> {
    const report = buildReport(input);
    await writeJsonAtomic(getReportPath(report.id), report as StoredReport);
    return report;
  }

  async get(id: string): Promise<ZiweiReport | null> {
    try {
      const raw = await readFile(getReportPath(id), 'utf8');
      return JSON.parse(raw) as ZiweiReport;
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async updateStatus(id: string, status: ReportStatus): Promise<ZiweiReport> {
    return this.update(id, { status });
  }

  async update(id: string, patch: Partial<Omit<ZiweiReport, 'id' | 'createdAt'>>): Promise<ZiweiReport> {
    const current = await this.get(id);
    if (!current) {
      throw new Error(`Report not found: ${id}`);
    }

    const updated: ZiweiReport = {
      ...current,
      ...patch,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await writeJsonAtomic(getReportPath(id), updated);
    return updated;
  }
}

function getSupabaseConfig(): { url: string; serviceRoleKey: string } {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when REPORT_STORE=supabase');
  }

  return { url: url.replace(/\/$/, ''), serviceRoleKey };
}

function toSupabaseRow(report: ZiweiReport): SupabaseReportRow {
  return {
    id: report.id,
    access_token: report.accessToken ?? createAccessToken(),
    birth_info: report.birthInfo,
    chart_data: report.chartData,
    ai_summary: report.aiSummary,
    ai_highlights: report.aiHighlights,
    ai_full_report: report.aiFullReport ?? null,
    status: report.status,
    metadata: report.metadata ?? null,
    created_at: report.createdAt,
    updated_at: report.updatedAt,
  };
}

function fromSupabaseRow<TChartData = unknown>(row: SupabaseReportRow): ZiweiReport<TChartData> {
  return {
    id: row.id,
    accessToken: row.access_token,
    birthInfo: row.birth_info,
    chartData: row.chart_data as TChartData,
    aiSummary: row.ai_summary ?? '',
    aiHighlights: row.ai_highlights ?? [],
    aiFullReport: row.ai_full_report ?? undefined,
    status: row.status,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSupabasePatch(patch: Partial<Omit<ZiweiReport, 'id' | 'createdAt'>>): Partial<SupabaseReportRow> {
  const row: Partial<SupabaseReportRow> = {};

  if ('accessToken' in patch) row.access_token = patch.accessToken as string;
  if ('birthInfo' in patch) row.birth_info = patch.birthInfo;
  if ('chartData' in patch) row.chart_data = patch.chartData;
  if ('aiSummary' in patch) row.ai_summary = patch.aiSummary;
  if ('aiHighlights' in patch) row.ai_highlights = patch.aiHighlights;
  if ('aiFullReport' in patch) row.ai_full_report = patch.aiFullReport ?? null;
  if ('status' in patch) row.status = patch.status;
  if ('metadata' in patch) row.metadata = patch.metadata ?? null;
  if ('updatedAt' in patch) row.updated_at = patch.updatedAt;

  return row;
}

export class SupabaseReportStore implements ReportStore {
  private readonly url: string;
  private readonly serviceRoleKey: string;

  constructor(config = getSupabaseConfig()) {
    this.url = config.url;
    this.serviceRoleKey = config.serviceRoleKey;
  }

  async create<TChartData>(input: CreateReportInput<TChartData>): Promise<ZiweiReport<TChartData>> {
    const report = buildReport(input);
    const rows = await this.request<SupabaseReportRow[]>('', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(toSupabaseRow(report)),
    });

    const row = rows[0];
    if (!row) {
      throw new Error('Supabase did not return the created report');
    }

    return fromSupabaseRow<TChartData>(row);
  }

  async get(id: string): Promise<ZiweiReport | null> {
    assertSafeReportId(id);
    const rows = await this.request<SupabaseReportRow[]>(`?id=eq.${encodeURIComponent(id)}&limit=1`, {
      method: 'GET',
    });

    return rows[0] ? fromSupabaseRow(rows[0]) : null;
  }

  async updateStatus(id: string, status: ReportStatus): Promise<ZiweiReport> {
    return this.update(id, { status });
  }

  async update(id: string, patch: Partial<Omit<ZiweiReport, 'id' | 'createdAt'>>): Promise<ZiweiReport> {
    assertSafeReportId(id);
    const rows = await this.request<SupabaseReportRow[]>(`?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        ...toSupabasePatch(patch),
        updated_at: new Date().toISOString(),
      }),
    });

    const row = rows[0];
    if (!row) {
      throw new Error(`Report not found: ${id}`);
    }

    return fromSupabaseRow(row);
  }

  private async request<T>(query: string, init: RequestInit): Promise<T> {
    const endpoint = `${this.url}/rest/v1/${SUPABASE_REPORTS_TABLE}${query}`;
    const headers = new Headers(init.headers);
    headers.set('apikey', this.serviceRoleKey);
    headers.set('Authorization', `Bearer ${this.serviceRoleKey}`);
    headers.set('Content-Type', 'application/json');

    const response = await fetch(endpoint, { ...init, headers, cache: 'no-store' });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Supabase reports request failed (${response.status}): ${message}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }
}

const defaultReportStore: ReportStore = getReportStoreKind() === 'supabase'
  ? new SupabaseReportStore()
  : new JsonFileReportStore();

export function createReport<TChartData>(input: CreateReportInput<TChartData>): Promise<ZiweiReport<TChartData>> {
  return defaultReportStore.create(input);
}

export function getReport(id: string): Promise<ZiweiReport | null> {
  return defaultReportStore.get(id);
}

export function updateReportStatus(id: string, status: ReportStatus): Promise<ZiweiReport> {
  return defaultReportStore.updateStatus(id, status);
}

export function updateReport(id: string, patch: Partial<Omit<ZiweiReport, 'id' | 'createdAt'>>): Promise<ZiweiReport> {
  return defaultReportStore.update(id, patch);
}

export function getReportStore(): ReportStore {
  return defaultReportStore;
}
