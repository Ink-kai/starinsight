/**
 * 倪海厦 天纪 / 地纪 / 人纪 — 共享类型定义
 */

/** 三纪分类 */
export type SanJiCategory = 'tianji' | 'diji' | 'renji';

/** 课程/模块 */
export interface NiModule {
  id: string;
  category: SanJiCategory;
  /** 中文名 */
  name: string;
  /** 英文名 */
  nameEn: string;
  /** 简短副标题 */
  subtitle: string;
  /** 简要描述 */
  description: string;
  /** 详细介绍（多段） */
  details: string[];
  /** 学派归属 */
  school?: string;
  /** 课时信息 */
  lessons?: string;
  /** 参考书目 */
  references: string[];
  /** 核心概念/关键词 */
  keywords: string[];
  /** 图标字符 */
  icon: string;
  /** 状态 */
  status: 'active' | 'preview' | 'coming';
  /** 排序权重 */
  order: number;
  /** 路由 slug */
  slug: string;
  /** 子章节 */
  chapters: NiChapter[];
}

/** 章节 */
export interface NiChapter {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  /** 核心要点 */
  keyPoints: string[];
  /** 倪师语录 */
  quotes?: string[];
  /** 排序 */
  order: number;
}

/** 易经六十四卦 */
export interface Hexagram {
  number: number;
  name: string;
  /** 卦象描述 如「天泽履」 */
  composition: string;
  /** 上卦 */
  upper: string;
  /** 下卦 */
  lower: string;
  /** 卦辞要点 */
  meaning: string;
  /** 倪师讲解要点 */
  niInterpretation: string;
  /** 断事要诀 */
  divination: string;
}

/** 堪舆条目 */
export interface FengShuiEntry {
  id: string;
  title: string;
  category: 'yangzhai' | 'yinzhai' | 'theory';
  description: string;
  keyPoints: string[];
}

/** 人纪中医条目 */
export interface MedicalEntry {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  keyPoints: string[];
  relatedHerbs?: string[];
  relatedAcupoints?: string[];
}
