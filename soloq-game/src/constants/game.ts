import type { Role, Rank } from '../types/game';

export const ROLE_ICONS: Record<Role, string> = {
  carry: '🏹',
  top: '🛡️',
  jungle: '🌿',
  mid: '🔮',
  support: '💚',
};

export const ROLE_NAMES: Record<Role, string> = {
  carry: 'ADC',
  top: 'Top',
  jungle: 'Jungler',
  mid: 'Mid Laner',
  support: 'Support',
};

export const ROLE_COLORS: Record<Role, { gradient: string; border: string; glow: string }> = {
  carry: { gradient: 'from-red-600 to-orange-500', border: 'border-red-500', glow: 'hover:shadow-red-500/25' },
  top: { gradient: 'from-blue-600 to-cyan-500', border: 'border-blue-500', glow: 'hover:shadow-blue-500/25' },
  jungle: { gradient: 'from-green-600 to-emerald-500', border: 'border-green-500', glow: 'hover:shadow-green-500/25' },
  mid: { gradient: 'from-purple-600 to-pink-500', border: 'border-purple-500', glow: 'hover:shadow-purple-500/25' },
  support: { gradient: 'from-yellow-500 to-amber-400', border: 'border-yellow-500', glow: 'hover:shadow-yellow-500/25' },
};

export const RANK_COLORS: Record<Rank, string> = {
  iron: '#5e5148',
  bronze: '#8c6239',
  silver: '#80989d',
  gold: '#cd8837',
  platinum: '#4e9996',
  emerald: '#009e60',
  diamond: '#576bce',
  master: '#9d48e8',
  grandmaster: '#e44040',
  challenger: '#f4e4b6',
};

export const STAT_COLORS = {
  kda: 'text-yellow-400',
  csPerMin: 'text-green-400',
  visionScore: 'text-blue-400',
  winRate: 'text-purple-400',
  wins: 'text-green-400',
  losses: 'text-red-400',
  gamesPlayed: 'text-white',
} as const;

export const STAT_LABELS: Record<string, string> = {
  kda: 'KDA',
  csPerMin: 'CS/Dk',
  visionScore: 'Vision',
  winRate: 'Kazanma Orani',
  wins: 'Galibiyet',
  losses: 'Maglubiyet',
  gamesPlayed: 'Toplam Mac',
  form: 'Form',
  fatigue: 'Yorgunluk',
};
