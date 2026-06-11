import type { ProfileInsight } from './types';
import type { BirthInfo } from './types';
import type { ZiweiChart } from '@/lib/ziwei/types';

const DEFAULT_DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';
const DEFAULT_MODEL = 'deepseek-chat';

interface DeepSeekChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

export const FALLBACK_PROFILE_INSIGHT: ProfileInsight = {
  profileSummary: '这是你的个人命盘档案初版。系统已记录你的出生信息与命盘结构，后续你可以围绕职业、财富、关系、学习等关键问题持续记录决策与复盘。',
  decisionPattern: '当前阶段先建立基础档案。后续系统会根据你的决策记录与复盘内容，逐步识别你的长期决策模式。',
  strengths: ['适合先建立稳定记录习惯', '适合把模糊问题写成可观察的选择', '适合通过复盘逐步校准判断'],
  risks: ['避免把命盘当作唯一决策依据', '避免用一次性判断替代长期观察', '避免在情绪高峰时做重大决定'],
  quarterlyActions: [
    '记录一个当前最重要的人生问题',
    '为这个问题写下三个可选方案',
    '在一个月后回顾实际行动与结果',
  ],
};

function stripJsonFence(content: string): string {
  return content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
}

function coerceProfileInsight(input: unknown): ProfileInsight {
  if (!input || typeof input !== 'object') {
    throw new Error('AI profile insight must be an object');
  }

  const value = input as Partial<ProfileInsight>;
  const insight: ProfileInsight = {
    profileSummary: typeof value.profileSummary === 'string' ? value.profileSummary : '',
    decisionPattern: typeof value.decisionPattern === 'string' ? value.decisionPattern : '',
    strengths: Array.isArray(value.strengths) ? value.strengths.filter(item => typeof item === 'string').slice(0, 5) : [],
    risks: Array.isArray(value.risks) ? value.risks.filter(item => typeof item === 'string').slice(0, 5) : [],
    quarterlyActions: Array.isArray(value.quarterlyActions)
      ? value.quarterlyActions.filter(item => typeof item === 'string').slice(0, 3)
      : [],
  };

  if (!insight.profileSummary || !insight.decisionPattern || insight.quarterlyActions.length !== 3) {
    throw new Error('AI profile insight JSON schema is incomplete');
  }

  return insight;
}

function summarizeChart(chart: ZiweiChart) {
  const mingGong = chart.palaces.find(palace => palace.isMingGong);
  const shenGong = chart.palaces.find(palace => palace.isShenGong);
  const majorStars = chart.palaces.flatMap(palace =>
    palace.stars
      .filter(star => star.type === 'major')
      .map(star => ({ palace: palace.name, star: star.name, brightness: star.brightness })),
  );

  return {
    mingGong: mingGong ? {
      name: mingGong.name,
      majorStars: mingGong.stars.filter(star => star.type === 'major').map(star => star.name),
    } : null,
    shenGong: shenGong ? {
      name: shenGong.name,
      majorStars: shenGong.stars.filter(star => star.type === 'major').map(star => star.name),
    } : null,
    wuxingJuName: chart.wuxingJuName,
    currentAge: chart.currentAge,
    majorStars: majorStars.slice(0, 24),
  };
}

function buildProfilePrompt(birthInfo: BirthInfo, chart: ZiweiChart) {
  return {
    system: [
      '你是 StarInsight 的个人命盘档案助手。',
      '你的任务不是预测命运，而是把命盘结构转化为长期观察、决策记录和行动复盘的起点。',
      '必须使用中文输出，面向普通用户，少用术语。',
      '不要做绝对化断言，不要恐吓，不要给医学、法律、投资、婚恋等重大决策指令。',
      '请只输出 JSON，不要输出 markdown。',
    ].join('\n'),
    user: JSON.stringify({
      task: '生成个人命盘档案初版',
      outputSchema: {
        profileSummary: 'string',
        decisionPattern: 'string',
        strengths: ['string'],
        risks: ['string'],
        quarterlyActions: ['string', 'string', 'string'],
      },
      styleRules: [
        '重点是长期观察和行动建议，不是预测。',
        '使用“可能更适合”“建议观察”“可以尝试”“建议记录”“建议复盘”等表达。',
        'quarterlyActions 必须是 3 条可执行动作。',
      ],
      birthInfo,
      chart: summarizeChart(chart),
    }),
  };
}

export async function generateProfileInsight(birthInfo: BirthInfo, chart: ZiweiChart): Promise<ProfileInsight> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return FALLBACK_PROFILE_INSIGHT;
  }

  try {
    const prompt = buildProfilePrompt(birthInfo, chart);
    const baseUrl = (process.env.DEEPSEEK_BASE_URL || DEFAULT_DEEPSEEK_BASE_URL).replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || DEFAULT_MODEL,
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
        temperature: 0.35,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json() as DeepSeekChatResponse;
    if (!response.ok) {
      throw new Error(data.error?.message || `Profile AI request failed: ${response.status}`);
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Profile AI response missing content');
    }

    return coerceProfileInsight(JSON.parse(stripJsonFence(content)));
  } catch (error) {
    console.error('[profile] AI insight generation failed, using fallback.', error);
    return FALLBACK_PROFILE_INSIGHT;
  }
}
