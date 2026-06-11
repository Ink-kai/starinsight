import { PROVINCES } from '@/lib/ziwei/cities';
import { calcTrueSolarBranch } from '@/lib/ziwei/share';
import type { BirthInfo as ProfileBirthInfo } from './types';
import type { BirthInfo as ZiweiBirthInfo } from '@/lib/ziwei/types';

export interface ParsedProfileBirthInfo {
  year: number;
  month: number;
  day: number;
  clockHour: number;
  clockMinute: number;
  longitude: number;
  matchedBirthPlace?: string;
}

export function findProfileBirthPlaceLongitude(birthPlace?: string): { longitude: number; label?: string } {
  const keyword = birthPlace?.trim();
  if (!keyword) return { longitude: 120 };

  for (const province of PROVINCES) {
    if (province.name.includes(keyword) || keyword.includes(province.name)) {
      const firstCity = province.cities[0];
      if (firstCity) return { longitude: firstCity.longitude, label: `${province.name}${firstCity.name}` };
    }

    for (const city of province.cities) {
      if (city.name.includes(keyword) || keyword.includes(city.name)) {
        return { longitude: city.longitude, label: `${province.name}${city.name}` };
      }
    }
  }

  return { longitude: 120 };
}

export function parseProfileBirthInfo(input: ProfileBirthInfo): ParsedProfileBirthInfo {
  const dateMatch = input.birthDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = input.birthTime.match(/^(\d{2}):(\d{2})$/);

  if (!dateMatch) throw new Error('出生日期格式不正确');
  if (!timeMatch) throw new Error('出生时间格式不正确');

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const clockHour = Number(timeMatch[1]);
  const clockMinute = Number(timeMatch[2]);

  const parsedDate = new Date(year, month - 1, day);
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    throw new Error('出生日期不存在');
  }

  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (parsedDate > todayDate) {
    throw new Error('出生日期不能晚于当前日期');
  }

  if (clockHour < 0 || clockHour > 23 || clockMinute < 0 || clockMinute > 59) {
    throw new Error('出生时间不存在');
  }

  const { longitude, label } = findProfileBirthPlaceLongitude(input.birthPlace);
  return {
    year,
    month,
    day,
    clockHour,
    clockMinute,
    longitude: input.useTrueSolarTime ? longitude : 120,
    matchedBirthPlace: label,
  };
}

export function profileBirthInfoToZiweiBirthInfo(input: ProfileBirthInfo): ZiweiBirthInfo {
  const parsed = parseProfileBirthInfo(input);
  let { year, month, day } = parsed;

  // 与现有 BirthForm/formToBirthInfo 保持一致：23:00-23:59 晚子时按次日排盘。
  if (parsed.clockHour === 23) {
    const next = new Date(year, month - 1, day + 1);
    year = next.getFullYear();
    month = next.getMonth() + 1;
    day = next.getDate();
  }

  return {
    year,
    month,
    day,
    hour: calcTrueSolarBranch(parsed.clockHour, parsed.clockMinute, parsed.longitude),
    gender: input.gender,
    name: input.nickname || undefined,
    city: input.birthPlace || undefined,
    longitude: input.useTrueSolarTime ? parsed.longitude : undefined,
  };
}
