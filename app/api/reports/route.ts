import { NextResponse } from 'next/server';
import { generateChart } from '@/lib/ziwei/algorithm';
import { createAIReportProvider, generateAIReport } from '@/lib/ai/provider';
import { buildReportUrl } from '@/lib/report/access';
import { checkRateLimit, rateLimitResponse, reportsCreateRateLimitRule } from '@/lib/rate-limit';
import { createReport } from '@/lib/report/store';
import { parseReportBirthInfo, reportBirthInfoToZiweiBirthInfo } from '@/lib/report/birth';
import type { BirthInfo as ReportBirthInfo, ReportOutput } from '@/lib/report/types';
import type { ZiweiChart } from '@/lib/ziwei/types';

function validateBirthInfo(input: unknown): ReportBirthInfo {
  if (!input || typeof input !== 'object') {
    throw new Error('请求体不能为空');
  }

  const value = input as Partial<ReportBirthInfo>;
  const nickname = typeof value.nickname === 'string' ? value.nickname.trim() : undefined;
  const birthPlace = typeof value.birthPlace === 'string' ? value.birthPlace.trim() : undefined;

  if (value.gender !== 'male' && value.gender !== 'female') {
    throw new Error('请选择性别');
  }
  if (typeof value.birthDate !== 'string' || !value.birthDate) {
    throw new Error('请选择出生日期');
  }
  if (typeof value.birthTime !== 'string' || !value.birthTime) {
    throw new Error('请选择出生时间');
  }

  const normalized: ReportBirthInfo = {
    nickname: nickname || undefined,
    gender: value.gender,
    birthDate: value.birthDate,
    birthTime: value.birthTime,
    birthPlace: birthPlace || undefined,
    useTrueSolarTime: Boolean(value.useTrueSolarTime),
  };

  const parsed = parseReportBirthInfo(normalized);
  const birthDate = new Date(parsed.year, parsed.month - 1, parsed.day, 23, 59, 59, 999);
  if (birthDate.getTime() > Date.now()) {
    throw new Error('出生日期不能晚于当前日期');
  }

  return normalized;
}

function getAIProviderName(): string {
  return process.env.AI_PROVIDER || 'deepseek';
}

function getAIModelName(): string {
  return process.env.AI_MODEL || 'deepseek-chat';
}

async function generateReportWithFallback(
  birthInfo: ReportBirthInfo,
  chart: ZiweiChart,
): Promise<{ output: ReportOutput; failureReason?: string }> {
  try {
    const provider = createAIReportProvider();
    const output = await generateAIReport(birthInfo, chart, provider);
    return { output, failureReason: provider.lastFailureReason };
  } catch (error) {
    const failureReason = error instanceof Error ? error.message : 'AI 报告生成失败';
    console.error('[reports] AI report generation failed, using fallback output', error);

    // generateAIReport 正常情况下会由 provider 内部返回 fallback；这里保留外层兜底，
    // 避免 provider 配置异常或未知错误导致报告创建流程白屏。
    const { buildFallbackReport, buildReportInput } = await import('@/lib/ai/prompts/report');
    return {
      output: buildFallbackReport(buildReportInput(birthInfo, chart)),
      failureReason,
    };
  }
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, reportsCreateRateLimitRule());
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

  try {
    const body = await request.json();
    const birthInfo = validateBirthInfo(body);
    const ziweiBirthInfo = reportBirthInfoToZiweiBirthInfo(birthInfo);
    const chart = generateChart(ziweiBirthInfo);
    const aiReport = await generateReportWithFallback(birthInfo, chart);
    const parsed = parseReportBirthInfo(birthInfo);

    const report = await createReport<ZiweiChart>({
      birthInfo,
      chartData: chart,
      aiSummary: aiReport.output.summary,
      aiHighlights: aiReport.output.highlights.slice(0, 3),
      aiFullReport: aiReport.output,
      status: 'free',
      metadata: {
        source: 'chart-new-form',
        aiProvider: getAIProviderName(),
        aiModel: getAIModelName(),
        aiStatus: aiReport.failureReason ? 'fallback' : 'generated',
        aiFailureReason: aiReport.failureReason,
        trueSolarLongitude: birthInfo.useTrueSolarTime ? parsed.longitude : undefined,
        matchedBirthPlace: parsed.matchedBirthPlace,
      },
    });

    if (!report.accessToken) {
      throw new Error('报告访问 token 生成失败');
    }

    return NextResponse.json({
      reportId: report.id,
      id: report.id,
      accessToken: report.accessToken,
      reportUrl: buildReportUrl(report.id, report.accessToken),
      status: report.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建报告失败';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
