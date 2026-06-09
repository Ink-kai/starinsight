import type { ReportOutput, ZiweiReport } from './types';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { BRANCHES } from '@/lib/ziwei/constants';

export const REPORT_ATTRIBUTION = '本产品排盘算法与部分数据基于 Renhuai123/ziwei-doushu 开源项目，遵循 MIT License。来源：https://github.com/Renhuai123/ziwei-doushu';

const SECTION_LABELS: Array<{ key: keyof ReportOutput['sections']; title: string }> = [
  { key: 'overview', title: '命格总览' },
  { key: 'personality', title: '性格优势' },
  { key: 'career', title: '事业方向' },
  { key: 'wealth', title: '财运模式' },
  { key: 'relationship', title: '感情关系' },
  { key: 'health', title: '健康提醒' },
  { key: 'yearlyAdvice', title: '未来一年建议' },
  { key: 'actionPlan', title: '行动建议' },
];

function cleanMarkdownText(value: string): string {
  return value.replace(/\r\n/g, '\n').trim();
}

function formatBirthInfo(report: ZiweiReport): string {
  const birth = report.birthInfo;
  return [
    `- 报告 ID：${report.id}`,
    `- 昵称：${birth.nickname || '未填写'}`,
    `- 性别：${birth.gender === 'male' ? '男' : '女'}`,
    `- 出生日期：${birth.birthDate}`,
    `- 出生时间：${birth.birthTime}`,
    `- 出生地：${birth.birthPlace || '未填写'}`,
    `- 真太阳时：${birth.useTrueSolarTime ? '是' : '否'}`,
  ].join('\n');
}

function formatChartSummary(report: ZiweiReport): string {
  const chart = report.chartData as ZiweiChart;
  const currentDaXian = chart.daXians[chart.currentDaXianIndex];
  return [
    `- 命宫：${BRANCHES[chart.mingGongBranch] ?? chart.mingGongBranch}`,
    `- 身宫：${BRANCHES[chart.shenGongBranch] ?? chart.shenGongBranch}`,
    `- 五行局：${chart.wuxingJuName}`,
    `- 当前年龄：${chart.currentAge}`,
    `- 当前大限：${currentDaXian ? `${currentDaXian.startAge}–${currentDaXian.endAge}岁 · ${currentDaXian.palaceName}` : '未匹配'}`,
  ].join('\n');
}

export function generateReportMarkdown(report: ZiweiReport): string {
  if (report.status !== 'paid' || !report.aiFullReport) {
    throw new Error('Only paid reports can be exported');
  }

  const fullReport = report.aiFullReport;
  const sections = SECTION_LABELS.map(({ key, title }) => (
    `## ${title}\n\n${cleanMarkdownText(fullReport.sections[key])}`
  )).join('\n\n');

  return [
    '# AI紫微命盘报告',
    '',
    '## 出生信息',
    '',
    formatBirthInfo(report),
    '',
    '## 命盘摘要',
    '',
    formatChartSummary(report),
    '',
    '### AI 摘要',
    '',
    cleanMarkdownText(fullReport.summary || report.aiSummary),
    '',
    '### 三条核心洞察',
    '',
    ...(fullReport.highlights.length > 0 ? fullReport.highlights.slice(0, 3).map(item => `- ${cleanMarkdownText(item)}`) : report.aiHighlights.slice(0, 3).map(item => `- ${cleanMarkdownText(item)}`)),
    '',
    '# 完整分析',
    '',
    sections,
    '',
    '## 免责声明',
    '',
    cleanMarkdownText(fullReport.disclaimer),
    '',
    '## Attribution',
    '',
    REPORT_ATTRIBUTION,
    '',
  ].join('\n');
}

export function getMarkdownFileName(reportId: string): string {
  return `ziwei-report-${reportId}.md`;
}
