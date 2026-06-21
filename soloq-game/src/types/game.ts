export type Role = 'carry' | 'top' | 'jungle' | 'support' | 'mid';

export type Rank = 
  | 'iron' | 'bronze' | 'silver' | 'gold' 
  | 'platinum' | 'emerald' | 'diamond' | 'master' 
  | 'grandmaster' | 'challenger';

export type RankDivision = 'IV' | 'III' | 'II' | 'I';

export interface RankTier {
  rank: Rank;
  division: RankDivision;
  lp: number;
  maxLp: number;
}

export interface Player {
  id: string;
  name: string;
  role: Role;
  rank: RankTier;
  stats: PlayerStats;
  fatigue: number;
  form: number;
  sponsors: string[];
  careerHistory: CareerEvent[];
  currentTeam: EsportTeam | null;
  teamHistory: TeamHistoryEntry[];
}

export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  kda: number;
  csPerMin: number;
  visionScore: number;
}

export interface CareerEvent {
  type: string;
  description: string;
  effect: Partial<PlayerStats>;
  date: string;
}

export interface MatchEvent {
  id: string;
  minute: number;
  title: string;
  description: string;
  choices: EventChoice[];
}

export interface EventChoice {
  id: string;
  text: string;
  outcome: {
    successChance: number;
    successEffect: Partial<PlayerStats>;
    failEffect: Partial<PlayerStats>;
  };
}

export interface MatchResult {
  win: boolean;
  lpGained: number;
  statsGained: Partial<PlayerStats>;
  events: MatchEvent[];
  baseWinChance?: number;
}

export interface RoleData {
  id: Role;
  name: string;
  nameTr: string;
  description: string;
  baseStats: {
    damage: number;
    tankiness: number;
    utility: number;
    difficulty: number;
  };
}

export interface ChampionAbility {
  name: string;
  description: string;
}

export interface Champion {
  id: string;
  name: string;
  role: Role;
  title: string;
  dragonName?: string;
  tags?: string[];
  stats: {
    attack: number;
    defense: number;
    magic: number;
    difficulty: number;
  };
  abilities: ChampionAbility[] | string[];
}

export interface SummonerSpell {
  id: string;
  name: string;
  icon: string;
  cooldown: number;
  description: string;
}

export interface ChampionSelectPlayer {
  name: string;
  role: Role;
  isBot: boolean;
  champion: Champion | null;
  summonerSpells: [SummonerSpell | null, SummonerSpell | null];
  bannedChampion: Champion | null;
}

export interface ChampionSelectState {
  phase: 'ban' | 'pick' | 'done';
  currentTurn: number;
  blueTeam: ChampionSelectPlayer[];
  redTeam: ChampionSelectPlayer[];
  availableChampions: Champion[];
  bannedChampions: Champion[];
  timeLeft: number;
  playerBannedChampion: Champion | null;
  playerPickedChampion: Champion | null;
  playerSummoner1: SummonerSpell | null;
  playerSummoner2: SummonerSpell | null;
  showSummonerSelect: boolean;
  summonerSelectSlot: 0 | 1;
}

export interface ChampionCombo {
  id: string;
  name: string;
  sequence: string;
  difficulty: number;
  damage: number;
  risk: 'low' | 'medium' | 'high';
}

export interface QuickTimeEvent {
  id: string;
  championName: string;
  title: string;
  description: string;
  timeLimit: number;
  choices: {
    id: string;
    text: string;
    combo: ChampionCombo;
  }[];
}

export interface QTEResult {
  eventId: string;
  comboId: string;
  success: boolean;
  sequence: string;
}

export interface EsportTeam {
  id: string;
  name: string;
  tag: string;
  league: string;
  region: string;
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  primaryColor: string;
  secondaryColor: string;
  logo: string;
  minRank: Rank;
  minWinRate: number;
  salary: number;
  bonuses: {
    formBonus: number;
    fatigueReduction: number;
    lpBonus: number;
  };
  sponsors: string[];
  description: string;
}

export interface TeamOffer {
  id: string;
  team: EsportTeam;
  timestamp: number;
  message: string;
  gameHoursLeft: number;
}

export interface TeamHistoryEntry {
  team: EsportTeam;
  startDate: string;
  endDate: string | null;
}
