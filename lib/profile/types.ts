import type { ZiweiChart } from '@/lib/ziwei/types';

export interface BirthInfo {
  nickname?: string;
  gender: 'male' | 'female';
  birthDate: string;
  birthTime: string;
  birthPlace?: string;
  useTrueSolarTime: boolean;
}

export interface Profile<TChartData = ZiweiChart | unknown> {
  id: string;
  nickname?: string;
  birthInfo: BirthInfo;
  chartData: TChartData;
  profileSummary: string;
  decisionPattern?: string;
  strengths?: string[];
  risks?: string[];
  quarterlyActions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProfileInsight {
  profileSummary: string;
  decisionPattern: string;
  strengths: string[];
  risks: string[];
  quarterlyActions: [string, string, string] | string[];
}

export interface CreateProfileInput<TChartData = ZiweiChart | unknown> {
  nickname?: string;
  birthInfo: BirthInfo;
  chartData: TChartData;
  profileSummary: string;
  decisionPattern?: string;
  strengths?: string[];
  risks?: string[];
  quarterlyActions?: string[];
}
