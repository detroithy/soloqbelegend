import { useGameStore } from '../store/gameStore';
import type { Rank, RankDivision } from '../types/game';

const RANK_COLORS: Record<Rank, string> = {
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

interface RankBadgeProps {
  rank: Rank;
  division: RankDivision;
  lp: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function RankBadge({ rank, division, lp, size = 'md' }: RankBadgeProps) {
  const color = RANK_COLORS[rank] || '#666';
  const sizeClasses = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-14 h-14 text-sm',
    lg: 'w-20 h-20 text-lg',
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizeClasses[size]} rounded-lg flex flex-col items-center justify-center font-bold border-2 shadow-lg`}
        style={{ backgroundColor: color + '33', borderColor: color, color }}
      >
        <span className="leading-none">{rank.charAt(0).toUpperCase() + rank.slice(1)}</span>
        <span className="text-[0.6em] opacity-80">{division}</span>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs text-gray-400">{lp} LP</span>
        <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${lp}%`,
              backgroundColor: color,
            }}
          />
        </div>
      </div>
    </div>
  );
}
