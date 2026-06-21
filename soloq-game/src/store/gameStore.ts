import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, Role, RankTier, MatchResult, MatchEvent, PlayerStats, ChampionSelectState, Champion, SummonerSpell, ChampionSelectPlayer, TeamOffer, TeamHistoryEntry } from '../types/game';
import { simulateMatch, calculateMatchResult } from '../utils/matchSimulation';
import { calculateLpGain, advanceRank, demoteRank } from '../utils/rankCalculation';
import { checkForTeamOffer, applyTeamBonuses } from '../utils/teamOffers';
import championsData from '../data/champions.json';
import summonerSpellsData from '../data/summonerSpells.json';

type Screen =
  | 'menu'
  | 'roleSelect'
  | 'championSelect'
  | 'game'
  | 'aiGame'
  | 'matchResult'
  | 'career'
  | 'training';

interface GameState {
  screen: Screen;
  player: Player | null;
  currentMatch: MatchResult | null;
  matchHistory: MatchResult[];
  currentEvent: MatchEvent | null;
  eventIndex: number;
  eventResults: { eventId: string; choiceId: string; success: boolean }[];
  trainingEnergy: number;
  lastTrainingReset: number;
  rankPromoted: boolean;
  championSelect: ChampionSelectState;
  teamOffer: TeamOffer | null;

  selectRole: (role: Role, name: string) => void;
  startChampionSelect: () => void;
  banChampion: (champion: Champion) => void;
  pickChampion: (champion: Champion) => void;
  setSummonerSpell: (slot: 0 | 1, spell: SummonerSpell) => void;
  toggleSummonerSelect: (slot: 0 | 1) => void;
  startMatchFromChampionSelect: () => void;
  startMatch: () => void;
  startAIMatch: () => void;
  resolveEvent: (choiceId: string, success: boolean, effect: Partial<PlayerStats>) => void;
  nextEvent: () => void;
  finishMatch: () => void;
  finishAIMatch: (isWin: boolean, statsGained: Partial<PlayerStats>) => void;
  applyTrainingBonus: (stat: keyof PlayerStats, amount: number) => void;
  useTrainingEnergy: () => boolean;
  acceptTeamOffer: () => void;
  rejectTeamOffer: () => void;
  returnToMenu: () => void;
  goToCareer: () => void;
  goToTraining: () => void;
}

const INITIAL_STATS: PlayerStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  winRate: 0,
  kda: 1.0,
  csPerMin: 6.0,
  visionScore: 15,
};

const INITIAL_RANK: RankTier = {
  rank: 'iron',
  division: 'IV',
  lp: 0,
  maxLp: 100,
};

function getDailyEnergy(): number {
  const now = Date.now();
  const today = new Date(now).setHours(0, 0, 0, 0);
  const saved = localStorage.getItem('soloq-training-energy');
  if (saved) {
    const data = JSON.parse(saved);
    if (data.date === today) return data.energy;
  }
  return 3;
}

function saveDailyEnergy(energy: number): void {
  const now = Date.now();
  const today = new Date(now).setHours(0, 0, 0, 0);
  localStorage.setItem(
    'soloq-training-energy',
    JSON.stringify({ date: today, energy })
  );
}

const allChampions: Champion[] = championsData as Champion[];
const allSpells: SummonerSpell[] = summonerSpellsData as SummonerSpell[];

interface BanPickTurn {
  phase: 'ban' | 'pick';
  team: 'blue' | 'red';
  playerIndex: number;
}

const BAN_ORDER: BanPickTurn[] = [
  { phase: 'ban', team: 'blue', playerIndex: 0 },
  { phase: 'ban', team: 'red', playerIndex: 0 },
  { phase: 'ban', team: 'red', playerIndex: 1 },
  { phase: 'ban', team: 'blue', playerIndex: 1 },
  { phase: 'ban', team: 'blue', playerIndex: 2 },
  { phase: 'ban', team: 'red', playerIndex: 2 },
  { phase: 'ban', team: 'red', playerIndex: 3 },
  { phase: 'ban', team: 'blue', playerIndex: 3 },
  { phase: 'ban', team: 'blue', playerIndex: 4 },
  { phase: 'ban', team: 'red', playerIndex: 4 },
];

const PICK_ORDER: BanPickTurn[] = [
  { phase: 'pick', team: 'blue', playerIndex: 0 },
  { phase: 'pick', team: 'red', playerIndex: 0 },
  { phase: 'pick', team: 'red', playerIndex: 1 },
  { phase: 'pick', team: 'blue', playerIndex: 1 },
  { phase: 'pick', team: 'blue', playerIndex: 2 },
  { phase: 'pick', team: 'red', playerIndex: 2 },
  { phase: 'pick', team: 'red', playerIndex: 3 },
  { phase: 'pick', team: 'blue', playerIndex: 3 },
  { phase: 'pick', team: 'blue', playerIndex: 4 },
  { phase: 'pick', team: 'red', playerIndex: 4 },
];

function getInitialChampionSelect(playerRole: Role, playerName?: string): ChampionSelectState {
  const botNames = ['xXxSlayerxXx', 'FakerFan_TR', 'KDAhunter', 'TurkKartali', 'RivenMain07', 'YasuoOneTr1ck', 'JungDiff99', 'PentakillKing', 'TurboInt00', 'Iron4Life'];
  const shuffledNames = [...botNames].sort(() => Math.random() - 0.5);

  const blueRoles: Role[] = ['mid', 'jungle', 'carry', 'support', 'top'];
  const redRoles: Role[] = ['carry', 'top', 'mid', 'jungle', 'support'];

  const playerIndex = blueRoles.indexOf(playerRole);
  const blueTeam: ChampionSelectPlayer[] = blueRoles.map((role, i) => ({
    name: i === playerIndex ? (playerName || 'Sen') : shuffledNames[i],
    role,
    isBot: i !== playerIndex,
    champion: null,
    summonerSpells: [null, null],
    bannedChampion: null,
  }));

  const redTeam: ChampionSelectPlayer[] = redRoles.map((role, i) => ({
    name: shuffledNames[i + 5],
    role,
    isBot: true,
    champion: null,
    summonerSpells: [null, null],
    bannedChampion: null,
  }));

  return {
    phase: 'ban',
    currentTurn: 0,
    blueTeam,
    redTeam,
    availableChampions: allChampions,
    bannedChampions: [],
    timeLeft: 30,
    playerBannedChampion: null,
    playerPickedChampion: null,
    playerSummoner1: null,
    playerSummoner2: null,
    showSummonerSelect: false,
    summonerSelectSlot: 0,
  };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      screen: 'menu',
      player: null,
      currentMatch: null,
      matchHistory: [],
      currentEvent: null,
      eventIndex: 0,
      eventResults: [],
      trainingEnergy: getDailyEnergy(),
      lastTrainingReset: Date.now(),
      rankPromoted: false,
      championSelect: getInitialChampionSelect('mid'),
      teamOffer: null,

      selectRole: (role, name) => {
        set({
          player: {
            id: crypto.randomUUID(),
            name,
            role,
            rank: { ...INITIAL_RANK },
            stats: { ...INITIAL_STATS },
            fatigue: 0,
            form: 50,
            sponsors: [],
            careerHistory: [],
            currentTeam: null,
            teamHistory: [],
          },
          screen: 'menu',
        });
      },

      startChampionSelect: () => {
        const { player } = get();
        if (!player) return;
        set({
          championSelect: getInitialChampionSelect(player.role, player.name),
          screen: 'championSelect',
        });
      },

      // FIX: artık currentTurn'ü ilerletiyor ve phase'i ('ban' -> 'pick' -> 'done') güncelliyor.
      banChampion: (champion) => {
        const { championSelect } = get();

        const newBanned = [...championSelect.bannedChampions, champion];
        const newAvailable = championSelect.availableChampions.filter(c => c.id !== champion.id);
        const newBlueTeam = [...championSelect.blueTeam];
        const newRedTeam = [...championSelect.redTeam];

        const currentTurnInfo = championSelect.currentTurn < BAN_ORDER.length ? BAN_ORDER[championSelect.currentTurn] : null;

        if (currentTurnInfo) {
          if (currentTurnInfo.team === 'blue') {
            newBlueTeam[currentTurnInfo.playerIndex] = { ...newBlueTeam[currentTurnInfo.playerIndex], bannedChampion: champion };
          } else {
            newRedTeam[currentTurnInfo.playerIndex] = { ...newRedTeam[currentTurnInfo.playerIndex], bannedChampion: champion };
          }
        }

        const nextTurn = championSelect.currentTurn + 1;
        const totalTurns = BAN_ORDER.length + PICK_ORDER.length;
        const nextPhase: 'ban' | 'pick' | 'done' =
          nextTurn < BAN_ORDER.length ? 'ban' : nextTurn < totalTurns ? 'pick' : 'done';

        set({
          championSelect: {
            ...championSelect,
            bannedChampions: newBanned,
            availableChampions: newAvailable,
            blueTeam: newBlueTeam,
            redTeam: newRedTeam,
            playerBannedChampion:
              championSelect.playerBannedChampion ||
              (currentTurnInfo?.team === 'blue' && !newBlueTeam[currentTurnInfo.playerIndex]?.isBot ? champion : null),
            currentTurn: nextTurn,
            phase: nextPhase,
          },
        });
      },

      // FIX: söz dizimi hatasına yol açan başıboş kod bloğu kaldırıldı, erken `return` yerine
      // tek bir set() çağrısı kullanıldı ve currentTurn/phase artık doğru ilerliyor.
      pickChampion: (champion) => {
        const { championSelect } = get();

        const newAvailable = championSelect.availableChampions.filter(c => c.id !== champion.id);
        const newBlueTeam = [...championSelect.blueTeam];
        const newRedTeam = [...championSelect.redTeam];

        const currentTurnInfo = championSelect.currentTurn >= BAN_ORDER.length
          ? PICK_ORDER[championSelect.currentTurn - BAN_ORDER.length]
          : null;

        let spells: [SummonerSpell, SummonerSpell] | null = null;
        let isPlayerPick = false;

        if (currentTurnInfo) {
          const flashSpell = allSpells.find(s => s.id === 'flash')!;
          const igniteSpell = allSpells.find(s => s.id === 'ignite')!;
          const healSpell = allSpells.find(s => s.id === 'heal')!;
          const smiteSpell = allSpells.find(s => s.id === 'smite')!;
          const tpSpell = allSpells.find(s => s.id === 'teleport')!;
          const exhaustSpell = allSpells.find(s => s.id === 'exhaust')!;

          const roleSpells: Record<string, [SummonerSpell, SummonerSpell]> = {
            carry: [flashSpell, healSpell],
            mid: [flashSpell, igniteSpell],
            jungle: [flashSpell, smiteSpell],
            support: [flashSpell, exhaustSpell],
            top: [flashSpell, tpSpell],
          };
          spells = roleSpells[champion.role] || [flashSpell, igniteSpell];

          const team = currentTurnInfo.team === 'blue' ? newBlueTeam : newRedTeam;
          const p = team[currentTurnInfo.playerIndex];
          if (p) {
            team[currentTurnInfo.playerIndex] = { ...p, champion, summonerSpells: spells };
            isPlayerPick = currentTurnInfo.team === 'blue' && !p.isBot;
          }
        }

        const nextTurn = championSelect.currentTurn + 1;
        const totalTurns = BAN_ORDER.length + PICK_ORDER.length;
        const nextPhase: 'ban' | 'pick' | 'done' =
          nextTurn < BAN_ORDER.length ? 'ban' : nextTurn < totalTurns ? 'pick' : 'done';

        set({
          championSelect: {
            ...championSelect,
            availableChampions: newAvailable,
            blueTeam: newBlueTeam,
            redTeam: newRedTeam,
            currentTurn: nextTurn,
            phase: nextPhase,
            ...(isPlayerPick && spells
              ? {
                  playerPickedChampion: champion,
                  playerSummoner1: spells[0],
                  playerSummoner2: spells[1],
                }
              : {}),
          },
        });
      },

      setSummonerSpell: (slot, spell) => {
        const { championSelect } = get();
        if (slot === 0) {
          set({ championSelect: { ...championSelect, playerSummoner1: spell, showSummonerSelect: false } });
        } else {
          set({ championSelect: { ...championSelect, playerSummoner2: spell, showSummonerSelect: false } });
        }
      },

      toggleSummonerSelect: (slot) => {
        const { championSelect } = get();
        set({ championSelect: { ...championSelect, showSummonerSelect: !championSelect.showSummonerSelect, summonerSelectSlot: slot } });
      },

      startMatchFromChampionSelect: () => {
        const { player, championSelect } = get();
        if (!player || !championSelect.playerPickedChampion) return;

        const match = simulateMatch(player.role, player.stats, player.rank.rank, player.form, player.fatigue);
        set({
          currentMatch: match,
          currentEvent: match.events[0] || null,
          eventIndex: 0,
          eventResults: [],
          screen: match.events.length > 0 ? 'game' : 'matchResult',
        });
      },

      startMatch: () => {
      const { player } = get();
      if (!player) {
         // Player yoksa role seçimine yönlendir
       set({ screen: 'roleSelect' });
       return;
       }
        set({
      championSelect: getInitialChampionSelect(player.role, player.name),
      screen: 'championSelect',
    });
},

      startAIMatch: () => {
        const { player } = get();
        if (!player) return;
        set({ screen: 'aiGame' });
      },

      resolveEvent: (choiceId, success, effect) => {
        const { currentMatch, eventIndex, eventResults } = get();
        if (!currentMatch) return;

        const event = currentMatch.events[eventIndex];
        if (!event) return;

        const newResults = [...eventResults, { eventId: event.id, choiceId, success }];

        if (currentMatch.statsGained) {
          const keys = Object.keys(effect) as (keyof PlayerStats)[];
          const updatedStats = { ...currentMatch.statsGained };
          for (const key of keys) {
            if (typeof effect[key] === 'number' && typeof updatedStats[key] === 'number') {
              (updatedStats as any)[key] =
                ((updatedStats[key] as number) || 0) + (effect[key] as number);
            }
          }
          set({
            currentMatch: { ...currentMatch, statsGained: updatedStats },
            eventResults: newResults,
          });
        }
      },

      nextEvent: () => {
        const { currentMatch, eventIndex } = get();
        if (!currentMatch) return;
        const nextIdx = eventIndex + 1;
        if (nextIdx < currentMatch.events.length) {
          set({ eventIndex: nextIdx, currentEvent: currentMatch.events[nextIdx] });
        } else {
          set({ currentEvent: null });
        }
      },

      finishMatch: () => {
        const { player, currentMatch, matchHistory, eventResults } = get();
        if (!player || !currentMatch) return;

        const prevRank = player.rank.rank;
        const prevDivision = player.rank.division;

        const baseWinChance = currentMatch.baseWinChance ?? 0.5;
        const resultsForCalc = eventResults.map((r) => ({ success: r.success }));
        const { win, lpGained } = calculateMatchResult(baseWinChance, resultsForCalc);

        const lpChange = calculateLpGain(win, player.rank.lp, player.rank.rank);
        let newLp = player.rank.lp + lpChange;

        const updatedRank = { ...player.rank, lp: newLp };

        let advanced = advanceRank(updatedRank);
        let finalRank = advanced || updatedRank;
        if (lpChange < 0) {
          const demoted = demoteRank({ ...finalRank, lp: newLp });
          if (demoted) finalRank = demoted;
        }

        const newStats = { ...player.stats };
        if (currentMatch.statsGained) {
          (Object.keys(currentMatch.statsGained) as (keyof PlayerStats)[]).forEach((key) => {
            const val = currentMatch.statsGained![key];
            if (typeof val === 'number' && typeof newStats[key] === 'number') {
              (newStats as any)[key] = ((newStats[key] as number) || 0) + val;
            }
          });
          newStats.gamesPlayed = player.stats.gamesPlayed + 1;
          newStats.wins = player.stats.wins + (win ? 1 : 0);
          newStats.losses = player.stats.losses + (win ? 0 : 1);
          newStats.winRate =
            newStats.gamesPlayed > 0 ? newStats.wins / newStats.gamesPlayed : 0;
        }

        const finalMatch: MatchResult = {
          ...currentMatch,
          win,
          lpGained: lpChange,
        };

        const updatedPlayer = {
          ...player,
          rank: finalRank,
          stats: newStats,
          form: Math.max(0, Math.min(100, player.form + (win ? 10 : -10))),
          fatigue: win ? Math.max(0, player.fatigue - 5) : Math.min(100, player.fatigue + 20),
        };

        const promoted = finalRank.rank !== prevRank || finalRank.division !== prevDivision;

        const updatedPlayerWithTeam = updatedPlayer.currentTeam
          ? {
              ...updatedPlayer,
              fatigue: updatedPlayer.currentTeam
                ? Math.max(0, updatedPlayer.fatigue - updatedPlayer.currentTeam.bonuses.fatigueReduction)
                : updatedPlayer.fatigue,
            }
          : updatedPlayer;

        const newOffer = checkForTeamOffer(updatedPlayerWithTeam);

        set({
          player: updatedPlayerWithTeam,
          matchHistory: [...matchHistory, finalMatch],
          currentMatch: null,
          currentEvent: null,
          eventIndex: 0,
          eventResults: [],
          screen: 'matchResult',
          rankPromoted: promoted && win,
          teamOffer: newOffer,
        });
      },

      finishAIMatch: (isWin, statsGained) => {
        const { player, matchHistory } = get();
        if (!player) return;

        const lpChange = calculateLpGain(isWin, player.rank.lp, player.rank.rank);
        let newLp = player.rank.lp + lpChange;

        const updatedRank = { ...player.rank, lp: newLp };

        let advanced = advanceRank(updatedRank);
        let finalRank = advanced || updatedRank;
        if (lpChange < 0) {
          const demoted = demoteRank({ ...finalRank, lp: newLp });
          if (demoted) finalRank = demoted;
        }

        const newStats = { ...player.stats };
        (Object.keys(statsGained) as (keyof PlayerStats)[]).forEach((key) => {
          const val = statsGained[key];
          if (typeof val === 'number' && typeof newStats[key] === 'number') {
            (newStats as any)[key] = ((newStats[key] as number) || 0) + val;
          }
        });
        newStats.gamesPlayed = player.stats.gamesPlayed + 1;
        newStats.wins = player.stats.wins + (isWin ? 1 : 0);
        newStats.losses = player.stats.losses + (isWin ? 0 : 1);
        newStats.winRate =
          newStats.gamesPlayed > 0 ? newStats.wins / newStats.gamesPlayed : 0;

        const aiMatchResult: MatchResult = {
          win: isWin,
          lpGained: lpChange,
          statsGained,
          events: [],
        };

        const updatedPlayer = {
          ...player,
          rank: finalRank,
          stats: newStats,
          form: Math.max(0, Math.min(100, player.form + (isWin ? 10 : -10))),
          fatigue: isWin ? Math.max(0, player.fatigue - 5) : Math.min(100, player.fatigue + 20),
        };

        const updatedPlayerWithTeam = updatedPlayer.currentTeam
          ? {
              ...updatedPlayer,
              fatigue: updatedPlayer.currentTeam
                ? Math.max(0, updatedPlayer.fatigue - updatedPlayer.currentTeam.bonuses.fatigueReduction)
                : updatedPlayer.fatigue,
            }
          : updatedPlayer;

        const newOffer = checkForTeamOffer(updatedPlayerWithTeam);

        set({
          player: updatedPlayerWithTeam,
          matchHistory: [...matchHistory, aiMatchResult],
          currentMatch: null,
          currentEvent: null,
          eventIndex: 0,
          eventResults: [],
          screen: 'matchResult',
          teamOffer: newOffer,
        });
      },

      applyTrainingBonus: (stat, amount) => {
        const { player } = get();
        if (!player) return;

        const STAT_CAPS: Record<string, number> = {
          kda: 5.0,
          csPerMin: 12.0,
          visionScore: 60,
        };
        const cap = STAT_CAPS[stat];
        const newVal = (player.stats[stat] as number) + amount;

        const newStats = { ...player.stats };
        (newStats[stat] as number) = cap !== undefined ? Math.min(cap, newVal) : newVal;

        set({ player: { ...player, stats: newStats } });
      },

      useTrainingEnergy: () => {
        const { trainingEnergy } = get();
        if (trainingEnergy <= 0) return false;
        const newEnergy = trainingEnergy - 1;
        saveDailyEnergy(newEnergy);
        set({ trainingEnergy: newEnergy });
        return true;
      },

      acceptTeamOffer: () => {
        const { player, teamOffer } = get();
        if (!player || !teamOffer) return;

        const newTeamHistory: TeamHistoryEntry = {
          team: teamOffer.team,
          startDate: new Date().toISOString(),
          endDate: null,
        };

        const updatedPlayer: Player = {
          ...player,
          currentTeam: teamOffer.team,
          teamHistory: [...(player.teamHistory || []), newTeamHistory],
          sponsors: [...player.sponsors, ...teamOffer.team.sponsors],
        };

        set({
          player: updatedPlayer,
          teamOffer: null,
        });
      },

      rejectTeamOffer: () => {
        set({ teamOffer: null });
      },

      returnToMenu: () => set({ screen: 'menu' }),
      goToCareer: () => set({ screen: 'career' }),
      goToTraining: () => set({ screen: 'training' }),
    }),
    {
      name: 'soloq-game-storage',
      partialize: (state) => ({
        player: state.player,
        matchHistory: state.matchHistory,
      }),
    }
  )
);