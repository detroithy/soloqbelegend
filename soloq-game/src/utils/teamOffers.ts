import type { Rank, PlayerStats, EsportTeam, TeamOffer, Player } from '../types/game';
import teamsData from '../data/teams.json';

const allTeams: EsportTeam[] = teamsData as EsportTeam[];

const RANK_ORDER: Rank[] = [
  'iron', 'bronze', 'silver', 'gold', 'platinum',
  'emerald', 'diamond', 'master', 'grandmaster', 'challenger',
];

function getRankIndex(rank: Rank): number {
  return RANK_ORDER.indexOf(rank);
}

function isEligibleForTeam(player: Player, team: EsportTeam): boolean {
  const playerRankIdx = getRankIndex(player.rank.rank);
  const teamMinRankIdx = getRankIndex(team.minRank);

  if (playerRankIdx < teamMinRankIdx) return false;
  if (player.stats.winRate < team.minWinRate) return false;
  if (player.stats.gamesPlayed < 10) return false;

  return true;
}

function getEligibleTeams(player: Player): EsportTeam[] {
  return allTeams.filter(team => isEligibleForTeam(player, team));
}

function getTeamTierForRank(rank: Rank): string[] {
  switch (rank) {
    case 'challenger': return ['S', 'A', 'B'];
    case 'grandmaster': return ['A', 'B', 'C'];
    case 'master': return ['B', 'C', 'D'];
    case 'diamond': return ['C', 'D'];
    case 'emerald': return ['C', 'D'];
    case 'platinum': return ['D'];
    default: return ['D'];
  }
}

function generateOfferMessage(team: EsportTeam, player: Player): string {
  const messages: Record<string, string[]> = {
    S: [
      `${team.name} seni dünya sahnesinde görmek istiyor!`,
      `Efsane ${team.name} kadrosuna katılmaya ne dersin?`,
      `${team.logo} ${team.name} kapısı açıldı! Büyük liglere hazır mısın?`,
    ],
    A: [
      `${team.name} performansından etkilendi. Profesyonel kadroya davet!`,
      `${team.logo} ${team.name} seni radarına aldı. Teklifimizi değerlendir.`,
      `Büyük liglerin kapısı açılıyor. ${team.name} teklif ediyor.`,
    ],
    B: [
      `${team.name} seninle ilgileniyor. Challengers League macerasına hazır mısın?`,
      `${team.logo} ${team.name} kadrosunu güçlendirmek istiyor. Ne dersin?`,
      `Profesyonel dünyaya ilk adımı at. ${team.name} teklif ediyor.`,
    ],
    C: [
      `${team.name} deneme kadrosuna katılık ister misin?`,
      `${team.logo} ${team.name} seni denemek istiyor. İyi bir fırsat!`,
      `Academy dünyasına adım at. ${team.name} kapısı açık.`,
    ],
    D: [
      `${team.name} seni deneme turnuvasına davet ediyor.`,
      `${team.logo} ${team.name} ilk profesyonel deneyimini sunuyor.`,
      `Kariyerine başla. ${team.name} seni bekliyor.`,
    ],
  };

  const tierMessages = messages[team.tier] || messages.D;
  return tierMessages[Math.floor(Math.random() * tierMessages.length)];
}

export function checkForTeamOffer(player: Player): TeamOffer | null {
  if (player.currentTeam) return null;

  const eligibleTeams = getEligibleTeams(player);
  if (eligibleTeams.length === 0) return null;

  const rankIdx = getRankIndex(player.rank.rank);
  let offerChance = 0;

  if (rankIdx >= 8) offerChance = 0.70;
  else if (rankIdx >= 7) offerChance = 0.50;
  else if (rankIdx >= 6) offerChance = 0.30;
  else if (rankIdx >= 5) offerChance = 0.20;
  else if (rankIdx >= 4) offerChance = 0.10;
  else offerChance = 0.05;

  if (player.form > 70) offerChance += 0.15;
  if (player.stats.winRate > 0.55) offerChance += 0.10;

  offerChance = Math.min(0.90, offerChance);

  if (Math.random() > offerChance) return null;

  const targetTiers = getTeamTierForRank(player.rank.rank);
  const targetTeams = eligibleTeams.filter(t => targetTiers.includes(t.tier));

  if (targetTeams.length === 0) return null;

  const shuffled = [...targetTeams].sort(() => Math.random() - 0.5);
  const selectedTeam = shuffled[0];

  const message = generateOfferMessage(selectedTeam, player);

  return {
    id: `offer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    team: selectedTeam,
    timestamp: Date.now(),
    message,
    gameHoursLeft: 24,
  };
}

export function calculateTeamSalary(team: EsportTeam, playerForm: number): number {
  const baseSalary = team.salary;
  const formMultiplier = 1 + (playerForm / 100);
  return Math.floor(baseSalary * formMultiplier);
}

export function calculateTeamBonuses(team: EsportTeam) {
  return {
    formBonus: team.bonuses.formBonus,
    fatigueReduction: team.bonuses.fatigueReduction,
    lpBonus: team.bonuses.lpBonus,
  };
}

export function applyTeamBonuses(
  team: EsportTeam,
  stats: { form: number; fatigue: number },
  matchResult: { win: boolean; lpGained: number }
): { form: number; fatigue: number; lpGained: number; salary: number } {
  const bonuses = calculateTeamBonuses(team);
  const salary = calculateTeamSalary(team, stats.form);

  let formChange = matchResult.win ? 10 : -5;
  formChange += bonuses.formBonus;

  let fatigueChange = matchResult.win ? -5 : 20;
  fatigueChange -= bonuses.fatigueReduction;

  let lpGained = matchResult.lpGained;
  if (matchResult.win) {
    lpGained += bonuses.lpBonus;
  }

  return {
    form: Math.max(0, Math.min(100, stats.form + formChange)),
    fatigue: Math.max(0, Math.min(100, stats.fatigue + fatigueChange)),
    lpGained,
    salary,
  };
}

export function getTeamById(teamId: string): EsportTeam | undefined {
  return allTeams.find(t => t.id === teamId);
}

export function getAllTeams(): EsportTeam[] {
  return allTeams;
}
