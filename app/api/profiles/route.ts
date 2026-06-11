import { NextResponse } from 'next/server';
import { generateChart } from '@/lib/ziwei/algorithm';
import { profileBirthInfoToZiweiBirthInfo } from '@/lib/profile/birth';
import { createProfile } from '@/lib/profile/store';
import { generateProfileInsight } from '@/lib/profile/summary';
import type { BirthInfo } from '@/lib/profile/types';

function normalizeBirthInfo(input: unknown): BirthInfo {
  if (!input || typeof input !== 'object') {
    throw new Error('出生信息不能为空');
  }

  const value = input as Partial<BirthInfo>;
  const gender = value.gender;
  const birthDate = typeof value.birthDate === 'string' ? value.birthDate.trim() : '';
  const birthTime = typeof value.birthTime === 'string' ? value.birthTime.trim() : '';

  if (gender !== 'male' && gender !== 'female') {
    throw new Error('请选择性别');
  }
  if (!birthDate) {
    throw new Error('出生日期不能为空');
  }
  if (!birthTime) {
    throw new Error('出生时间不能为空');
  }

  return {
    nickname: typeof value.nickname === 'string' && value.nickname.trim() ? value.nickname.trim() : undefined,
    gender,
    birthDate,
    birthTime,
    birthPlace: typeof value.birthPlace === 'string' && value.birthPlace.trim() ? value.birthPlace.trim() : undefined,
    useTrueSolarTime: Boolean(value.useTrueSolarTime),
  };
}

export async function POST(request: Request) {
  try {
    const birthInfo = normalizeBirthInfo(await request.json());
    const chartInput = profileBirthInfoToZiweiBirthInfo(birthInfo);
    const chart = generateChart(chartInput);
    const insight = await generateProfileInsight(birthInfo, chart);

    const profile = await createProfile({
      nickname: birthInfo.nickname,
      birthInfo,
      chartData: chart,
      profileSummary: insight.profileSummary,
      decisionPattern: insight.decisionPattern,
      strengths: insight.strengths,
      risks: insight.risks,
      quarterlyActions: insight.quarterlyActions.slice(0, 3),
    });

    return NextResponse.json({
      profileId: profile.id,
      profileUrl: `/profile/${profile.id}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建个人档案失败';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
