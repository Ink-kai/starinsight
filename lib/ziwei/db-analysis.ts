export type TopicKey =
  | 'overview'
  | 'personality'
  | 'love'
  | 'career'
  | 'wealth'
  | 'health'
  | 'family'
  | 'children'
  | 'move'
  | 'friends'
  | 'home'
  | 'spirit'
  | 'parents';

export const TOPIC_LABEL: Record<TopicKey, string> = {
  overview: '命格总览',
  personality: '性格特质',
  love: '感情婚姻',
  career: '事业方向',
  wealth: '财运模式',
  health: '健康提醒',
  family: '兄弟家庭',
  children: '子女下属',
  move: '迁移外出',
  friends: '交友人脉',
  home: '田宅居所',
  spirit: '福德精神',
  parents: '父母长辈',
};

export const TOPIC_PALACE_NAME: Record<TopicKey, string> = {
  overview: '命宫',
  personality: '命宫',
  love: '夫妻宫',
  career: '官禄宫',
  wealth: '财帛宫',
  health: '疾厄宫',
  family: '兄弟宫',
  children: '子女宫',
  move: '迁移宫',
  friends: '交友宫',
  home: '田宅宫',
  spirit: '福德宫',
  parents: '父母宫',
};

type StarContent = Partial<Record<'mingGong' | 'personality' | 'xiongDi' | 'fuQi' | 'ziNv' | 'caiBo' | 'jiE' | 'qianYi' | 'jiaoYou' | 'guanLu' | 'tianZhai' | 'fuDe' | 'fuMu', string>>;

const makeBrief = (star: string): StarContent => ({
  mingGong: `${star}星入命，重在观察命宫、三方四正与四化组合。`,
  personality: `${star}星的性格表现需结合同宫星曜、庙旺陷与会照情况综合判断。`,
  fuQi: `${star}星相关的感情判断需结合夫妻宫及其三方四正。`,
  caiBo: `${star}星相关的财运判断需结合财帛宫、田宅宫与官禄宫。`,
  jiE: `${star}星相关的健康提示仅供文化参考，不构成医学建议。`,
  guanLu: `${star}星相关的事业方向需结合官禄宫主星、四化与当前大限。`,
});

export const STAR_DB: Record<string, StarContent> = Object.fromEntries(
  ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军']
    .map(star => [star, makeBrief(star)]),
) as Record<string, StarContent>;
