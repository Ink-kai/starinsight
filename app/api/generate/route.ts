import { NextResponse } from 'next/server';
import { generateChart } from '@/lib/ziwei/algorithm';
import type { BirthInfo } from '@/lib/ziwei/types';

function isBirthInfo(input: unknown): input is BirthInfo {
  if (!input || typeof input !== 'object') return false;
  const value = input as Partial<BirthInfo>;
  return (
    Number.isInteger(value.year) &&
    Number.isInteger(value.month) &&
    Number.isInteger(value.day) &&
    Number.isInteger(value.hour) &&
    (value.gender === 'male' || value.gender === 'female')
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!isBirthInfo(body)) {
      return NextResponse.json({ error: '出生信息格式不正确' }, { status: 400 });
    }

    const chart = generateChart(body);
    return NextResponse.json(chart);
  } catch (error) {
    const message = error instanceof Error ? error.message : '命盘生成失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
