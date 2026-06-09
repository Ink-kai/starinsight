import { randomUUID } from 'crypto';
import { mkdir, readFile, rename, writeFile } from 'fs/promises';
import path from 'path';
import type { CreateReportInput, ReportStatus, ZiweiReport } from './types';
import { generateReportAccessToken } from './access';

const REPORTS_DIR = process.env.REPORT_STORE_DIR || path.join(process.cwd(), 'data', 'reports');
const REPORT_FILE_EXTENSION = '.json';

type StoredReport = ZiweiReport;

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

async function ensureReportsDir(): Promise<void> {
  await mkdir(REPORTS_DIR, { recursive: true });
}

async function writeJsonAtomic(filePath: string, data: StoredReport): Promise<void> {
  await ensureReportsDir();
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  await rename(tmpPath, filePath);
}

export class JsonFileReportStore implements ReportStore {
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

// Singleton instance cache for cold start optimization
let cachedStore: ReportStore | undefined;

export function getReportStore(): ReportStore {
  if (cachedStore !== undefined) {
    return cachedStore;
  }

  const storeType = process.env.REPORT_STORE || 'json';

  if (storeType === 'supabase') {
    // Lazy import to avoid circular dependency issues
    const { SupabaseReportStore } = require('./supabase-store');
    const instance = new SupabaseReportStore();
    cachedStore = instance;
    return instance;
  } else {
    const instance = new JsonFileReportStore();
    cachedStore = instance;
    return instance;
  }
}

// Export convenience functions that delegate to the configured store
export function createReport<TChartData>(input: CreateReportInput<TChartData>): Promise<ZiweiReport<TChartData>> {
  return getReportStore().create(input);
}

export function getReport(id: string): Promise<ZiweiReport | null> {
  return getReportStore().get(id);
}

export function updateReportStatus(id: string, status: ReportStatus): Promise<ZiweiReport> {
  return getReportStore().updateStatus(id, status);
}

export function updateReport(id: string, patch: Partial<Omit<ZiweiReport, 'id' | 'createdAt'>>): Promise<ZiweiReport> {
  return getReportStore().update(id, patch);
}

// Export SupabaseReportStore for direct use in admin operations
export { SupabaseReportStore } from './supabase-store';