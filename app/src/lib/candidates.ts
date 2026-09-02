// Demo 用的候选搭子池。真实产品里这些人来自服务端的实时请求池，
// 履约次数应该由链上 SBT 记录反查；这里是本地种子数据，用于演示撮合与决策信息展示。
export type Candidate = {
  id: string;
  nickname: string;
  gender: 'male' | 'female';
  verified: boolean;
  kept: number; // 守约次数
  missed: number; // 失约次数
  distanceKm: number;
  scenes: number[]; // 0 = 逛超市, 1 = 同城出行
  timeWindow: string;
  tags: string[];
};

export const CANDIDATES: Candidate[] = [
  {
    id: 'c1',
    nickname: '阿浪',
    gender: 'male',
    verified: true,
    kept: 23,
    missed: 0,
    distanceKm: 1.2,
    scenes: [0, 1],
    timeWindow: '18:00-22:00',
    tags: ['山姆常客', '接受拼单'],
  },
  {
    id: 'c2',
    nickname: '小林',
    gender: 'female',
    verified: true,
    kept: 9,
    missed: 1,
    distanceKm: 2.4,
    scenes: [0],
    timeWindow: '19:00-21:30',
    tags: ['只逛超市', '偏好同性搭子'],
  },
  {
    id: 'c3',
    nickname: '面面',
    gender: 'female',
    verified: true,
    kept: 14,
    missed: 0,
    distanceKm: 3.8,
    scenes: [0, 1],
    timeWindow: '17:30-20:00',
    tags: ['帮拎重物', '公共场所优先'],
  },
  {
    id: 'c4',
    nickname: '老陈',
    gender: 'male',
    verified: true,
    kept: 31,
    missed: 3,
    distanceKm: 6.1,
    scenes: [1],
    timeWindow: '全天',
    tags: ['机场拼车熟练', '常跑T3'],
  },
  {
    id: 'c5',
    nickname: '豆豆',
    gender: 'female',
    verified: false,
    kept: 2,
    missed: 0,
    distanceKm: 0.9,
    scenes: [0, 1],
    timeWindow: '20:00-23:00',
    tags: ['新用户'],
  },
  {
    id: 'c6',
    nickname: '阿KEN',
    gender: 'male',
    verified: true,
    kept: 5,
    missed: 4,
    distanceKm: 1.7,
    scenes: [0, 1],
    timeWindow: '18:30-21:00',
    tags: ['历史失约较多'],
  },
];
