import type { Role, MatchResult, PlayerStats, Rank } from '../types/game';
import rolesData from '../data/roles.json';
import eventsData from '../data/events.json';

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function rollDice(chance: number): boolean {
  return Math.random() < chance;
}

const RANK_DIFFICULTY: Record<Rank, number> = {
  iron: 1.2,
  bronze: 1.15,
  silver: 1.1,
  gold: 1.0,
  platinum: 0.95,
  emerald: 0.9,
  diamond: 0.85,
  master: 0.82,
  grandmaster: 0.8,
  challenger: 0.78,
};

type RoleEvents = typeof eventsData extends Record<string, infer T> ? T : never;

interface MatchEvent {
  id: string;
  minute: number;
  phase: string;
  title: string;
  description: string;
  choices: {
    id: string;
    text: string;
    outcome: {
      successChance: number;
      successEffect: Partial<PlayerStats>;
      failEffect: Partial<PlayerStats>;
    };
  }[];
}

export function simulateMatch(
  playerRole: Role,
  playerStats: PlayerStats,
  playerRank: Rank,
  playerForm: number,
  playerFatigue: number
): MatchResult {
  const roleData = rolesData.find((r) => r.id === playerRole);
  if (!roleData) throw new Error(`Invalid role: ${playerRole}`);

  const rolePower =
    (roleData.baseStats.damage + roleData.baseStats.tankiness + roleData.baseStats.utility) / 30;
  const playerSkill =
    playerStats.kda * 0.3 + playerStats.csPerMin * 0.2 + playerStats.visionScore * 0.05;

  const rankMult = RANK_DIFFICULTY[playerRank] ?? 1.0;
  const formBonus = playerForm > 70 ? 0.08 : playerForm < 30 ? -0.06 : 0;
  const fatiguePenalty = playerFatigue > 50 ? -0.1 : 0;

  const baseWinChance = Math.min(
    0.9,
    Math.max(0.1, (rolePower + playerSkill * 0.1 + randomInRange(-0.15, 0.15)) * rankMult + formBonus + fatiguePenalty)
  );

  const statsGained: Partial<PlayerStats> = {
    gamesPlayed: 1,
    wins: 0,
    losses: 0,
    kda: parseFloat(randomInRange(-0.3, 0.5).toFixed(2)),
    csPerMin: parseFloat(randomInRange(-0.2, 0.3).toFixed(2)),
    visionScore: parseFloat(randomInRange(-1, 2).toFixed(1)),
  };

  const roleEvents = (eventsData as Record<string, MatchEvent[]>)[playerRole] || [];

  const phases = ['early', 'early', 'mid_early', 'mid', 'late', 'late'] as const;
  const matchEvents: MatchEvent[] = [];

  for (const phase of phases) {
    const phaseEvents = roleEvents.filter((e) => e.phase === phase);
    if (phaseEvents.length > 0) {
      const randomIdx = Math.floor(Math.random() * phaseEvents.length);
      matchEvents.push({
        ...phaseEvents[randomIdx],
        minute: phaseEvents[randomIdx].minute + Math.floor(randomInRange(-1, 1)),
      });
    }
  }

  return { win: false, lpGained: 0, statsGained, events: matchEvents, baseWinChance };
}

export function calculateMatchResult(
  baseWinChance: number,
  eventResults: { success: boolean }[]
): { win: boolean; lpGained: number } {
  const successes = eventResults.filter((r) => r.success).length;
  const total = eventResults.length;
  const eventBonus = total > 0 ? (successes / total - 0.5) * 0.3 : 0;
  const finalChance = Math.min(0.95, Math.max(0.05, baseWinChance + eventBonus));
  const isWin = rollDice(finalChance);
  const lpGain = isWin ? Math.floor(randomInRange(15, 25)) : -Math.floor(randomInRange(10, 20));
  return { win: isWin, lpGained: lpGain };
}

export function applyEventChoice(
  choice: {
    id: string;
    text: string;
    outcome: {
      successChance: number;
      successEffect: Partial<PlayerStats>;
      failEffect: Partial<PlayerStats>;
    };
  }
): { success: boolean; effect: Partial<PlayerStats> } {
  const success = rollDice(choice.outcome.successChance);
  return {
    success,
    effect: success ? choice.outcome.successEffect : choice.outcome.failEffect,
  };
}
