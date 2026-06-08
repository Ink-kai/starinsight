import type { ZiweiChart } from '@/lib/ziwei/types';

/**
 * 报告层出生信息。
 *
 * 这里故意不复用 lib/ziwei/types.ts 中的 BirthInfo：
 * - ziwei BirthInfo 是排盘算法输入，使用 year/month/day/hour 等结构化字段。
 * - report BirthInfo 面向产品表单和持久化，保留 PRD 中的 birthDate/birthTime/birthPlace。
 * 后续接数据库、订单、RAG 或审计日志时，报告层模型可以独立演进而不影响排盘核心。
 */
export interface BirthInfo {
  nickname?: string;
  gender: 'male' | 'female';
  birthDate: string;
  birthTime: string;
  birthPlace?: string;
  useTrueSolarTime: boolean;
}

export type ReportStatus = 'free' | 'paid' | 'failed';

export interface ReportSections {
  overview: string;
  personality: string;
  career: string;
  wealth: string;
  relationship: string;
  health: string;
  yearlyAdvice: string;
  actionPlan: string;
}

export interface ReportOutput {
  summary: string;
  highlights: [string, string, string] | string[];
  sections: ReportSections;
  disclaimer: string;
}

export interface ReportMetadata {
  /** 预留订单 ID，后续接支付系统时使用。 */
  orderId?: string;
  /** 预留 AI provider 名称，例如 deepseek/openai/mock。 */
  aiProvider?: string;
  /** 预留 AI model 名称。 */
  aiModel?: string;
  /** 预留 RAG/知识库版本，便于报告可追溯。 */
  knowledgeVersion?: string;
  /** 允许后续挂载非关键扩展字段，不影响核心 schema。 */
  [key: string]: unknown;
}

export interface ZiweiReport<TChartData = ZiweiChart | unknown> {
  id: string;
  accessToken?: string;
  birthInfo: BirthInfo;
  chartData: TChartData;
  aiSummary: string;
  aiHighlights: string[];
  aiFullReport?: ReportOutput;
  status: ReportStatus;
  metadata?: ReportMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportInput<TChartData = ZiweiChart | unknown> {
  accessToken?: string;
  birthInfo: BirthInfo;
  chartData: TChartData;
  aiSummary?: string;
  aiHighlights?: string[];
  aiFullReport?: ReportOutput;
  status?: ReportStatus;
  metadata?: ReportMetadata;
}
