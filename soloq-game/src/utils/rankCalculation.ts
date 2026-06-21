import type { Rank, RankDivision, RankTier } from '../types/game';
import ranksData from '../data/ranks.json';

const RANK_ORDER: Rank[] = [
  'iron', 'bronze', 'silver', 'gold', 'platinum',
  'emerald', 'diamond', 'master', 'grandmaster', 'challenger',
];

const DIVISION_ORDER: RankDivision[] = ['IV', 'III', 'II', 'I'];

export function getRankIndex(rank: Rank, division: RankDivision): number {
  const rankIdx = RANK_ORDER.indexOf(rank);
  if (rankIdx === -1) return 0;
  if (rank === 'master' || rank === 'grandmaster' || rank === 'challenger') {
    return rankIdx * 100;
  }
  const divIdx = DIVISION_ORDER.indexOf(division);
  return rankIdx * 4 + (divIdx === -1 ? 0 : divIdx);
}

export function calculateLpGain(win: boolean, currentLp: number, rank: Rank): number {
  const baseGain = win ? 18 : -14;
  const highRankMultiplier = ['master', 'grandmaster', 'challenger'].includes(rank) ? 1.3 : 1;
  const lpBonus = currentLp > 80 ? (win ? 3 : -3) : 0;
  return Math.floor((baseGain + lpBonus) * highRankMultiplier);
}

export function advanceRank(currentRank: RankTier): RankTier | null {
  const { rank, division, lp } = currentRank;
  const maxLp = currentRank.maxLp;

  if (lp < maxLp) return null;

  if (rank === 'challenger') return null;

  const rankIdx = RANK_ORDER.indexOf(rank);
  if (rankIdx === -1) return null;

  if (rank === 'grandmaster') {
    return { rank: 'challenger', division: 'I', lp: 0, maxLp: 999 };
  }
  if (rank === 'master') {
    return { rank: 'grandmaster', division: 'I', lp: 0, maxLp: 100 };
  }

  const divIdx = DIVISION_ORDER.indexOf(division);
  if (divIdx === 0) {
    const nextRankIdx = rankIdx + 1;
    if (nextRankIdx >= RANK_ORDER.length) return null;
    const nextRank = RANK_ORDER[nextRankIdx];
    if (nextRank === 'master') {
      return { rank: nextRank, division: 'I', lp: lp - maxLp, maxLp: 100 };
    }
    return { rank: nextRank, division: 'I', lp: lp - maxLp, maxLp: 100 };
  }

  return {
    rank,
    division: DIVISION_ORDER[divIdx - 1],
    lp: lp - maxLp,
    maxLp,
  };
}

export function demoteRank(currentRank: RankTier): RankTier | null {
  const { rank, division, lp } = currentRank;

  if (lp >= 0) return null;
  if (rank === 'iron') return { rank: 'iron', division: 'I', lp: 0, maxLp: 100 };

  const rankIdx = RANK_ORDER.indexOf(rank);
  if (rankIdx === -1) return null;

  if (rank === 'master' || rank === 'grandmaster' || rank === 'challenger') {
    const prevRank = RANK_ORDER[rankIdx - 1];
    return { rank: prevRank, division: 'I', lp: 50, maxLp: 100 };
  }

  const divIdx = DIVISION_ORDER.indexOf(division);
  if (divIdx === DIVISION_ORDER.length - 1) {
    const prevRankIdx = rankIdx - 1;
    if (prevRankIdx < 0) return null;
    return { rank: RANK_ORDER[prevRankIdx], division: 'I', lp: 50, maxLp: 100 };
  }

  return {
    rank,
    division: DIVISION_ORDER[divIdx + 1],
    lp: 25,
    maxLp: currentRank.maxLp,
  };
}
