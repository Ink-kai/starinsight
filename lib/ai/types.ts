import type { BirthInfo, ReportOutput } from '@/lib/report/types';
import type { Pattern } from '@/lib/ziwei/patterns';
import type { ZiweiChart } from '@/lib/ziwei/types';

export interface PalaceStarSummary {
  palaceName: string;
  branch: string;
  majorStars: string[];
  luckyStars: string[];
  shaStars: string[];
  siHuaStars: Array<{ starName: string; siHua: string }>;
}

export interface ReportInput {
  birthInfo: BirthInfo;
  chart: ZiweiChart;
  mainStars: PalaceStarSummary[];
  siHua: Array<{ palaceName: string; starName: string; siHua: string }>;
  patterns: Pick<Pattern, 'name' | 'level' | 'description'>[];
  mingGongSummary: {
    stars: string[];
    keywords: string[];
    nature: string;
  };
}

export interface AIReportProvider {
  generateReport(input: ReportInput): Promise<ReportOutput>;
}

export interface AIProviderConfig {
  provider: 'deepseek';
  apiKey?: string;
  model: string;
  baseUrl: string;
}

export class AIReportError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'AIReportError';
  }
}
