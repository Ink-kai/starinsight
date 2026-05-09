/**
 * 倪海厦 天纪 / 地纪 / 人纪 — 统一导出
 *
 * 倪海厦（1954-2012），美国汉唐中医学院创办人，
 * 当代少见的「命、相、卜、山、医」五术兼备之旷世奇人。
 *
 * 三纪体系：
 *   天纪 —— 上知天文（紫微斗数、易经、堪舆、推命、面相、测字）
 *   地纪 —— 下知地理（国家地理志、风水与国运）
 *   人纪 —— 中知人事（针灸、黄帝内经、神农本草经、伤寒论、金匮要略）
 */

export * from './types';
export { TIANJI_MODULES, HEXAGRAMS, FENGSHUI_ENTRIES, TIANJI_STATS } from './tianji';
export { RENJI_MODULES, RENJI_STATS } from './renji';
export { DIJI_MODULES, DIJI_STATS } from './diji';

/** 倪海厦简介 */
export const NI_HAIXIA_BIO = {
  name: '倪海厦',
  nameVariant: '倪海夏',
  birth: 1954,
  death: 2012,
  title: '美国汉唐中医学院创办人',
  titles: [
    '命、相、卜、山、医 五术兼备',
    '美国汉唐中医学院创办人',
    '经方中医大师',
    '天纪、人纪教学体系创立者',
  ],
  corePhilosophy: [
    '大道至简——不搞飞星派的复杂化法',
    '命宫为本，三方为用',
    '人事努力+地理调整 > 先天命运（2/3 > 1/3）',
    '中医是物理医学，从物理角度分析人体',
    '不希望中华文化失传，所以教了许多学生',
  ],
  sanJi: {
    tianji: {
      name: '天纪',
      meaning: '上知天文',
      content: '紫微斗数、易经、堪舆学、推命学、面相学、测字术',
      recordYear: 1994,
      episodes: 24,
      hoursPerEpisode: 2,
    },
    renji: {
      name: '人纪',
      meaning: '中知人事',
      content: '针灸大成、黄帝内经、神农本草经、伤寒论、金匮要略',
      completionYear: '2004-2005',
      totalLessons: '150+集',
    },
    diji: {
      name: '地纪',
      meaning: '下知地理',
      content: '国家地理志（未完成）',
      status: '倪师未竟之业',
      note: '原计划60岁后著述，2012年辞世',
    },
  },
};

/** 三纪导航 */
export const SANJI_CATEGORIES = [
  { key: 'tianji' as const, name: '天纪', nameEn: 'Tian Ji', icon: '⊙', meaning: '上知天文', color: '#d4a843', href: '/tianji' },
  { key: 'diji' as const, name: '地纪', nameEn: 'Di Ji', icon: '⊞', meaning: '下知地理', color: '#6b8a5e', href: '/diji' },
  { key: 'renji' as const, name: '人纪', nameEn: 'Ren Ji', icon: '⊕', meaning: '中知人事', color: '#8b6b9e', href: '/renji' },
] as const;
