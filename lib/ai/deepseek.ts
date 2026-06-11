import type { ReportOutput } from '@/lib/report/types';
import type { AIReportProvider, ReportInput } from './types';
import { AIReportError } from './types';
import { buildFallbackReport, buildReportPrompt, REPORT_DISCLAIMER } from './prompts/report';

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

export interface DeepSeekProviderOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

const DEFAULT_DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';
const DEFAULT_DEEPSEEK_MODEL = 'deepseek-chat';

function stripJsonFence(content: string): string {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

function coerceReportOutput(value: unknown): ReportOutput {
  if (!value || typeof value !== 'object') {
    throw new AIReportError('AI response is not an object');
  }

  const report = value as Partial<ReportOutput>;
  const sections = report.sections;
  if (!sections || typeof sections !== 'object') {
    throw new AIReportError('AI response missing sections');
  }

  const output: ReportOutput = {
    summary: typeof report.summary === 'string' ? report.summary : '',
    highlights: Array.isArray(report.highlights) ? report.highlights.filter(item => typeof item === 'string').slice(0, 3) : [],
    sections: {
      overview: typeof sections.overview === 'string' ? sections.overview : '',
      personality: typeof sections.personality === 'string' ? sections.personality : '',
      career: typeof sections.career === 'string' ? sections.career : '',
      wealth: typeof sections.wealth === 'string' ? sections.wealth : '',
      relationship: typeof sections.relationship === 'string' ? sections.relationship : '',
      health: typeof sections.health === 'string' ? sections.health : '',
      yearlyAdvice: typeof sections.yearlyAdvice === 'string' ? sections.yearlyAdvice : '',
      actionPlan: typeof sections.actionPlan === 'string' ? sections.actionPlan : '',
    },
    disclaimer: typeof report.disclaimer === 'string' ? report.disclaimer : REPORT_DISCLAIMER,
  };

  if (!output.summary || output.highlights.length !== 3 || Object.values(output.sections).some(section => !section)) {
    throw new AIReportError('AI response JSON schema is incomplete');
  }

  output.disclaimer = REPORT_DISCLAIMER;
  return output;
}

export function parseReportOutput(content: string): ReportOutput {
  return coerceReportOutput(JSON.parse(stripJsonFence(content)));
}

export class DeepSeekReportProvider implements AIReportProvider {
  lastFailureReason?: string;

  private readonly apiKey?: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(options: DeepSeekProviderOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.DEEPSEEK_API_KEY;
    this.model = options.model ?? process.env.AI_MODEL ?? DEFAULT_DEEPSEEK_MODEL;
    this.baseUrl = (options.baseUrl ?? process.env.DEEPSEEK_BASE_URL ?? DEFAULT_DEEPSEEK_BASE_URL).replace(/\/$/, '');
  }

  async generateReport(input: ReportInput): Promise<ReportOutput> {
    this.lastFailureReason = undefined;

    if (!this.apiKey) {
      this.lastFailureReason = 'DEEPSEEK_API_KEY 未配置，已使用 fallback 报告';
      return buildFallbackReport(input);
    }

    try {
      const prompt = buildReportPrompt(input);
      const messages: DeepSeekMessage[] = [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ];

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.4,
          response_format: { type: 'json_object' },
        }),
      });

      const data = await response.json() as DeepSeekChatResponse;
      if (!response.ok) {
        throw new AIReportError(data.error?.message || `DeepSeek request failed: ${response.status}`);
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new AIReportError('DeepSeek response missing content');
      }

      return parseReportOutput(content);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'DeepSeek 生成失败';
      this.lastFailureReason = message;
      console.error('[ai-report] DeepSeek generation failed, using fallback report.', error);
      return buildFallbackReport(input);
    }
  }
}
