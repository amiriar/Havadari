export type RankedTierConfig = {
  key: string;
  name: string;
  min: number;
  max: number | null;
  rewards: { fgc: number; gems?: number; chest?: string; badge?: boolean };
};

export const RANKED_SOFT_RESET_KEEP_RATIO = 0.5;

export const RANKED_TIERS: RankedTierConfig[] = [
  { key: 'bronze', name: 'برنز', min: 0, max: 999, rewards: { fgc: 500 } },
  { key: 'silver', name: 'نقره', min: 1000, max: 2499, rewards: { fgc: 1500 } },
  {
    key: 'gold',
    name: 'طلا',
    min: 2500,
    max: 4999,
    rewards: { fgc: 4000, gems: 50 },
  },
  {
    key: 'platinum',
    name: 'پلاتین',
    min: 5000,
    max: 7999,
    rewards: { fgc: 10000, gems: 150, chest: 'epic' },
  },
  {
    key: 'diamond',
    name: 'الماس',
    min: 8000,
    max: 11999,
    rewards: { fgc: 25000, gems: 300, chest: 'legendary' },
  },
  {
    key: 'legend',
    name: 'افسانه',
    min: 12000,
    max: null,
    rewards: { fgc: 60000, gems: 600, chest: 'mythic', badge: true },
  },
];
