import type { BirthInfo, ReportOutput } from '@/lib/report/types';
import { BRANCHES } from '@/lib/ziwei/constants';
import { detectPatterns, getMingGongSummary } from '@/lib/ziwei/patterns';
import type { Pattern } from '@/lib/ziwei/patterns';
import type { PalaceStarSummary, ReportInput } from '@/lib/ai/types';
import type { ZiweiChart } from '@/lib/ziwei/types';

export const REPORT_DISCLAIMER = '本报告仅供文化娱乐、自我观察和个人参考，不构成医学、法律、投资、婚姻或其他重大决策建议。请勿将本报告作为唯一决策依据。';

const SECTION_KEYS = [
  'overview',
  'personality',
  'career',
  'wealth',
  'relationship',
  'health',
  'yearlyAdvice',
  'actionPlan',
] as const;

export function buildFallbackReport(input?: Partial<ReportInput>): ReportOutput {
  const mingStars = input?.mingGongSummary?.stars?.length ? input.mingGongSummary.stars.join('、') : '命宫主星';
  const keywords = input?.mingGongSummary?.keywords?.length ? input.mingGongSummary.keywords.join('、') : '稳定观察、长期积累、审慎行动';

  return {
    summary: `这份命盘已完成基础排盘。命宫重点可先从「${mingStars}」与「${keywords}」观察；完整 AI 解读暂时不可用，请稍后重试。`,
    highlights: [
      '已生成命盘结构，可先查看命宫、身宫、主星与大限信息。',
      '建议把命盘解读作为自我观察工具，避免把任何结论绝对化。',
      '后续完整报告会补充事业、财运、感情与未来一年行动建议。',
    ],
    sections: {
      overview: '基础命盘已生成，完整命格总览将在 AI 服务可用后补充。',
      personality: '可先从命宫主星与三方四正观察性格倾向，避免用单一星曜下结论。',
      career: '事业方向需要结合官禄宫、财帛宫、迁移宫与当前大限综合判断。',
      wealth: '财运分析仅供个人规划参考，不构成投资建议。',
      relationship: '感情关系建议以沟通、尊重与现实互动为准，命盘只作辅助观察。',
      health: '健康相关内容仅作生活方式提醒，不构成医学诊断或治疗建议。',
      yearlyAdvice: '未来一年建议保持节奏稳定，优先处理确定性高的目标。',
      actionPlan: '记录当前最重要的三个目标，并为每个目标设置可执行的下一步。',
    },
    disclaimer: REPORT_DISCLAIMER,
  };
}

function summarizePalaceStars(chart: ZiweiChart): PalaceStarSummary[] {
  return chart.palaces.map(palace => ({
    palaceName: palace.name,
    branch: BRANCHES[palace.branch] ?? String(palace.branch),
    majorStars: palace.stars.filter(star => star.type === 'major').map(star => star.name),
    luckyStars: palace.stars.filter(star => star.type === 'lucky').map(star => star.name),
    shaStars: palace.stars.filter(star => star.type === 'sha').map(star => star.name),
    siHuaStars: palace.stars
      .filter(star => star.siHua)
      .map(star => ({ starName: star.name, siHua: star.siHua as string })),
  }));
}

function summarizeSiHua(mainStars: PalaceStarSummary[]): ReportInput['siHua'] {
  return mainStars.flatMap(palace =>
    palace.siHuaStars.map(star => ({
      palaceName: palace.palaceName,
      starName: star.starName,
      siHua: star.siHua,
    })),
  );
}

function summarizePatterns(patterns: Pattern[]): ReportInput['patterns'] {
  return patterns.slice(0, 8).map(pattern => ({
    name: pattern.name,
    level: pattern.level,
    description: pattern.description,
  }));
}

export function buildReportInput(birthInfo: BirthInfo, chart: ZiweiChart): ReportInput {
  const mainStars = summarizePalaceStars(chart);
  return {
    birthInfo,
    chart,
    mainStars,
    siHua: summarizeSiHua(mainStars),
    patterns: summarizePatterns(detectPatterns(chart)),
    mingGongSummary: getMingGongSummary(chart),
  };
}

export function buildReportPrompt(input: ReportInput): { system: string; user: string } {
  const compactChart = {
    birthInfo: input.birthInfo,
    chartBasics: {
      mingGongBranch: BRANCHES[input.chart.mingGongBranch],
      shenGongBranch: BRANCHES[input.chart.shenGongBranch],
      wuxingJuName: input.chart.wuxingJuName,
      currentAge: input.chart.currentAge,
      currentDaXian: input.chart.daXians[input.chart.currentDaXianIndex] ?? null,
    },
    mingGongSummary: input.mingGongSummary,
    mainStars: input.mainStars,
    siHua: input.siHua,
    patterns: input.patterns,
  };

  return {
    system: [
      '你是一名中文命盘报告写作助手，任务是把紫微斗数命盘结构转化为普通用户能读懂的自我观察报告。',
      '必须使用中文输出。',
      '不要做绝对化断言，不要恐吓用户，不鼓励迷信依赖。',
      '不要给医学诊断、治疗建议、投资指令、法律判断或婚恋重大决策指令。',
      '涉及健康只能写生活方式提醒；涉及财富只能写风险意识、预算、长期规划等通用建议。',
      '每个章节都要包含可执行建议。',
      '只能输出严格 JSON，不要使用 Markdown，不要包裹 ```json。',
    ].join('\n'),
    user: [
      '请根据以下命盘输入生成 AI 紫微命盘报告。',
      '',
      '输出 JSON schema 必须完全符合：',
      JSON.stringify({
        summary: 'string',
        highlights: ['string', 'string', 'string'],
        sections: Object.fromEntries(SECTION_KEYS.map(key => [key, 'string'])),
        disclaimer: REPORT_DISCLAIMER,
      }, null, 2),
      '',
      '写作要求：',
      '1. summary 控制在 120-180 个中文字符。',
      '2. highlights 必须正好 3 条，每条 30-60 个中文字符。',
      '3. sections 每章 120-220 个中文字符，语言清晰，少堆术语。',
      '4. 使用“倾向、适合、建议、需要留意”等措辞，避免“必然、一定、注定”。',
      `5. disclaimer 必须使用这句话：${REPORT_DISCLAIMER}`,
      '',
      '命盘输入 JSON：',
      JSON.stringify(compactChart, null, 2),
    ].join('\n'),
  };
}
