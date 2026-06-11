import type { BirthInfo, ReportOutput } from '@/lib/report/types';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { DeepSeekReportProvider } from './deepseek';
import type { AIProviderConfig, AIReportProvider } from './types';
import { buildReportInput } from './prompts/report';

export function getAIProviderConfig(): AIProviderConfig {
  const provider = process.env.AI_PROVIDER || 'deepseek';
  if (provider !== 'deepseek') {
    throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
  }

  return {
    provider: 'deepseek',
    apiKey: process.env.DEEPSEEK_API_KEY,
    model: process.env.AI_MODEL || 'deepseek-chat',
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
  };
}

export function createAIReportProvider(config: AIProviderConfig = getAIProviderConfig()): AIReportProvider {
  if (config.provider === 'deepseek') {
    return new DeepSeekReportProvider({
      apiKey: config.apiKey,
      model: config.model,
      baseUrl: config.baseUrl,
    });
  }

  throw new Error(`Unsupported AI provider: ${config.provider}`);
}

export async function generateAIReport(
  birthInfo: BirthInfo,
  chart: ZiweiChart,
  provider: AIReportProvider = createAIReportProvider(),
): Promise<ReportOutput> {
  return provider.generateReport(buildReportInput(birthInfo, chart));
}

export type { AIReportProvider, ReportInput } from './types';
