import { NextResponse } from 'next/server';
import { generateChart } from '@/lib/ziwei/algorithm';
import { createReport } from '@/lib/report/store';
import { parseReportBirthInfo, reportBirthInfoToZiweiBirthInfo } from '@/lib/report/birth';
import type { BirthInfo as ReportBirthInfo } from '@/lib/report/types';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { BRANCHES } from '@/lib/ziwei/constants';

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

function buildInitialSummary(chart: ZiweiChart): { summary: string; highlights: string[] } {
  const ming = chart.palaces.find(p => p.branch === chart.mingGongBranch);
  const shen = chart.palaces.find(p => p.branch === chart.shenGongBranch);
  const mingStars = ming?.stars.filter(star => star.type === 'major').map(star => star.name) ?? [];
  const currentDaXian = chart.daXians[chart.currentDaXianIndex];

  return {
    summary: `命宫在${BRANCHES[chart.mingGongBranch]}，身宫在${BRANCHES[chart.shenGongBranch]}，五行局为${chart.wuxingJuName}。完整 AI 摘要将在后续报告生成步骤中补充。`,
    highlights: [
      mingStars.length > 0 ? `命宫主星：${mingStars.join('、')}。` : '命宫为空宫，后续报告将结合对宫借星综合解读。',
      shen ? `身宫落在${shen.name}，可作为行动模式与后天重心的参考。` : '身宫信息已写入命盘结构。',
      currentDaXian ? `当前大限：${currentDaXian.startAge}–${currentDaXian.endAge}岁，落${currentDaXian.palaceName}。` : '当前大限信息将结合年龄进一步展示。',
    ],
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const birthInfo = validateBirthInfo(body);
    const ziweiBirthInfo = reportBirthInfoToZiweiBirthInfo(birthInfo);
    const chart = generateChart(ziweiBirthInfo);
    const initialReport = buildInitialSummary(chart);
    const parsed = parseReportBirthInfo(birthInfo);

    const report = await createReport<ZiweiChart>({
      birthInfo,
      chartData: chart,
      aiSummary: initialReport.summary,
      aiHighlights: initialReport.highlights,
      status: 'free',
      metadata: {
        source: 'chart-new-form',
        trueSolarLongitude: birthInfo.useTrueSolarTime ? parsed.longitude : undefined,
        matchedBirthPlace: parsed.matchedBirthPlace,
      },
    });

    return NextResponse.json({ reportId: report.id, id: report.id, status: report.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建报告失败';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
