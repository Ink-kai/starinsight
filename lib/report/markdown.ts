import type { ZiweiReport } from './types';
import { BRANCHES } from '@/lib/ziwei/constants';

function escapeMarkdown(text: string | undefined): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/[#*_~`]/g, '\\$&');
}

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function buildMarkdownExport(report: ZiweiReport): string {
  const { birthInfo, chartData, aiSummary, aiHighlights, aiFullReport, status, createdAt } = report;

  const sections: string[] = [];

  // Header
  sections.push('# AI紫微命盘报告\n');
  sections.push(`> 生成时间：${formatDate(createdAt)}`);
  sections.push('> 报告状态：' + (status === 'paid' ? '✅ 完整版' : '🔒 预览版'));
  sections.push('\n---\n');

  // Basic Info
  sections.push('## 📋 基本信息\n');
  sections.push(`| 项目 | 内容 |`);
  sections.push('| --- | --- |');
  if (birthInfo.nickname) {
    sections.push(`| 昵称 | ${escapeMarkdown(birthInfo.nickname)} |`);
  }
  sections.push(`| 性别 | ${birthInfo.gender === 'male' ? '男' : '女'} |`);
  sections.push(`| 出生日期 | ${birthInfo.birthDate} |`);
  sections.push(`| 出生时间 | ${birthInfo.birthTime} |`);
  if (birthInfo.birthPlace) {
    sections.push(`| 出生地 | ${escapeMarkdown(birthInfo.birthPlace)} |`);
  }
  sections.push('\n');

  // AI Summary
  sections.push('## 📝 AI 命盘解读\n');
  if (aiSummary) {
    sections.push(aiSummary + '\n\n');
  }

  if (aiHighlights && aiHighlights.length > 0) {
    sections.push('### 🌟 核心洞察\n');
    aiHighlights.forEach((highlight, index) => {
      sections.push(`${index + 1}. ${escapeMarkdown(highlight)}\n`);
    });
    sections.push('\n');
  }

  // Full Report Sections
  if (aiFullReport && status === 'paid') {
    sections.push('---\n');
    sections.push('## 📖 完整报告\n');

    if (aiFullReport.sections) {
      const { overview, personality, career, wealth, relationship, health, yearlyAdvice, actionPlan } =
        aiFullReport.sections;

      if (overview) {
        sections.push('### 🏠 命格总览\n');
        sections.push(overview + '\n\n');
      }

      if (personality) {
        sections.push('### 💫 性格优势\n');
        sections.push(personality + '\n\n');
      }

      if (career) {
        sections.push('### 💼 事业方向\n');
        sections.push(career + '\n\n');
      }

      if (wealth) {
        sections.push('### 💰 财运模式\n');
        sections.push(wealth + '\n\n');
      }

      if (relationship) {
        sections.push('### ❤️ 感情关系\n');
        sections.push(relationship + '\n\n');
      }

      if (health) {
        sections.push('### 🏥 健康提醒\n');
        sections.push(health + '\n\n');
      }

      if (yearlyAdvice) {
        sections.push('### 📅 未来一年建议\n');
        sections.push(yearlyAdvice + '\n\n');
      }

      if (actionPlan) {
        sections.push('### 🎯 行动建议\n');
        sections.push(actionPlan + '\n\n');
      }
    }

    if (aiFullReport.disclaimer) {
      sections.push('---\n');
      sections.push('## ⚠️ 免责声明\n');
      sections.push(aiFullReport.disclaimer + '\n');
    }
  } else if (status !== 'paid') {
    sections.push('---\n');
    sections.push('## 🔒 完整报告\n');
    sections.push('> 完整报告仅对付费用户可见。\n');
    sections.push('> 请联系管理员获取完整报告。\n');
  }

  // Footer
  sections.push('\n---\n');
  sections.push('*本报告由 AI 紫微命盘报告系统自动生成*\n');
  sections.push('*排盘算法基于 Renhuai123/ziwei-doushu (MIT License)*\n');

  return sections.join('');
}
