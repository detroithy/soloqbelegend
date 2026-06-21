import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Champion, SummonerSpell, ChampionSelectPlayer } from '../types/game';
import championsData from '../data/champions.json';
import summonerSpellsData from '../data/summonerSpells.json';
import { getChampionIconUrl } from '../utils/championIcons';

const allChampions: Champion[] = championsData as Champion[];
const allSpells: SummonerSpell[] = summonerSpellsData as SummonerSpell[];

const ROLE_FILTERS = [
  { id: 'all', label: 'Tumu', icon: '🎯' },
  { id: 'carry', label: 'ADC', icon: '🏹' },
  { id: 'top', label: 'Top', icon: '🛡️' },
  { id: 'jungle', label: 'Jungle', icon: '🌿' },
  { id: 'mid', label: 'Mid', icon: '🔮' },
  { id: 'support', label: 'Support', icon: '💚' },
];

type Phase = 'ban' | 'pick' | 'done';

interface TurnInfo {
  phase: Phase;
  team: 'blue' | 'red';
  playerIndex: number;
}

const BAN_ORDER: TurnInfo[] = [
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

const PICK_ORDER: TurnInfo[] = [
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

const ALL_TURNS = [...BAN_ORDER, ...PICK_ORDER];

export default function ChampionSelect() {
  const store = useGameStore();
  const { championSelect, banChampion, pickChampion, setSummonerSpell, toggleSummonerSelect, startMatchFromChampionSelect, returnToMenu } = store;

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [hoveredChamp, setHoveredChamp] = useState<Champion | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [turnIdx, setTurnIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { blueTeam, redTeam, availableChampions, bannedChampions, playerPickedChampion, playerSummoner1, playerSummoner2, showSummonerSelect, summonerSelectSlot } = championSelect;

  const currentTurn: TurnInfo | null = turnIdx < ALL_TURNS.length ? ALL_TURNS[turnIdx] : null;
  const phase: Phase = !currentTurn ? 'done' : currentTurn.phase;
  const isPlayerTurn = currentTurn !== null && currentTurn.team === 'blue' && !blueTeam[currentTurn.playerIndex]?.isBot;

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const advanceTurn = () => {
    clearTimer();
    setTurnIdx(prev => prev + 1);
  };

  function handleBanChampion(champion: Champion) {
    if (!currentTurn || !isPlayerTurn) return;
    clearTimer();
    banChampion(champion);
    setTimeout(advanceTurn, 400);
  }

  function handlePickChampion(champion: Champion) {
    if (!currentTurn || !isPlayerTurn) return;
    clearTimer();
    pickChampion(champion);
    setTimeout(advanceTurn, 400);
  }

  function startNpcTurn(turn: TurnInfo) {
    clearTimer();
    const duration = 1;
    setTimeLeft(duration);
    let remaining = duration;

    timerRef.current = setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearTimer();
        const state = useGameStore.getState();
        const cs = state.championSelect;
        const bt = turn.team === 'blue' ? cs.blueTeam : cs.redTeam;
        const bot = bt[turn.playerIndex];
        const avail = cs.availableChampions;

        if (!bot) { advanceTurn(); return; }

        if (turn.phase === 'ban') {
          if (bot.bannedChampion) { advanceTurn(); return; }
          const roleChamps = avail.filter((c: Champion) => c.role === bot.role);
          const pool = roleChamps.length > 0 ? roleChamps : avail;
          if (pool.length > 0) state.banChampion(pool[Math.floor(Math.random() * pool.length)]);
        } else {
          if (bot.champion) { advanceTurn(); return; }
          const roleChamps = avail.filter((c: Champion) => c.role === bot.role);
          const pool = roleChamps.length > 0 ? roleChamps : avail;
          if (pool.length > 0) state.pickChampion(pool[Math.floor(Math.random() * pool.length)]);
        }
        advanceTurn();
      }
    }, 1000);
  }

  function startPlayerTurn(turn: TurnInfo) {
    clearTimer();
    setTimeLeft(30);
    let remaining = 30;

    timerRef.current = setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearTimer();
        const state = useGameStore.getState();
        const cs = state.championSelect;
        const avail = cs.availableChampions;

        if (turn.phase === 'ban') {
          const pool = avail;
          if (pool.length > 0) state.banChampion(pool[Math.floor(Math.random() * pool.length)]);
        } else {
          const pool = avail;
          if (pool.length > 0) state.pickChampion(pool[Math.floor(Math.random() * pool.length)]);
        }
        advanceTurn();
      }
    }, 1000);
  }

  useEffect(() => {
    if (!currentTurn) return;

    const team = currentTurn.team === 'blue' ? blueTeam : redTeam;
    const player = team[currentTurn.playerIndex];

    if (currentTurn.phase === 'ban' && player?.bannedChampion) {
      setTimeout(advanceTurn, 300);
      return;
    }
    if (currentTurn.phase === 'pick' && player?.champion) {
      setTimeout(advanceTurn, 300);
      return;
    }

    const isNpc = currentTurn.team === 'red' || player?.isBot;

    if (isNpc) {
      startNpcTurn(currentTurn);
    } else {
      startPlayerTurn(currentTurn);
    }

    return () => clearTimer();
  }, [turnIdx]);

  useEffect(() => {
    if (phase === 'done' && playerPickedChampion) {
      const t = setTimeout(() => startMatchFromChampionSelect(), 2000);
      return () => clearTimeout(t);
    }
  }, [phase, playerPickedChampion]);

  const filteredChampions = availableChampions.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || c.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  function renderTeam(team: ChampionSelectPlayer[], teamColor: 'blue' | 'red') {
    const label = teamColor === 'blue' ? 'MAVI TAKIM' : 'KIRMIZI TAKIM';
    const labelColor = teamColor === 'blue' ? 'text-blue-400' : 'text-red-400';
    const bgColor = teamColor === 'blue' ? 'bg-blue-900/20' : 'bg-red-900/20';
    const borderColor = teamColor === 'blue' ? 'border-blue-800/30' : 'border-red-800/30';

    return (
      <div className={`w-52 ${bgColor} ${teamColor === 'blue' ? 'border-r' : 'border-l'} ${borderColor} p-2 flex flex-col gap-1.5 shrink-0`}>
        <div className={`text-center ${labelColor} font-rajdhani font-bold text-xs mb-1`}>{label}</div>
        {team.map((p, i) => {
          const isActive = currentTurn && currentTurn.team === teamColor && currentTurn.playerIndex === i;
          return (
            <div
              key={i}
              className={`flex items-center gap-1.5 p-1.5 rounded border ${
                isActive ? 'border-yellow-400 animate-pulse' : 'border-transparent'
              } ${p.isBot ? (teamColor === 'blue' ? 'bg-blue-900/30' : 'bg-red-900/30') : (teamColor === 'blue' ? 'bg-blue-800/50' : 'bg-red-800/50')}`}
            >
              <div className={`w-9 h-9 rounded flex items-center justify-center text-base ${
                p.champion ? (teamColor === 'blue' ? 'bg-blue-800/80' : 'bg-red-800/80') : 'bg-gray-700/50'
              }`}>
                {p.champion ? (
                  <img 
                    src={getChampionIconUrl(p.champion.name, p.champion.dragonName)} 
                    alt={p.champion.name}
                    className="w-8 h-8 rounded"
                  />
                ) : (p.bannedChampion ? '🚫' : '')}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[10px] font-medium truncate ${p.isBot ? 'text-gray-400' : (teamColor === 'blue' ? 'text-blue-300' : 'text-red-300')}`}>
                  {p.name}
                </div>
                <div className="text-[9px] text-gray-500">{p.role.toUpperCase()}</div>
              </div>
              {p.bannedChampion && <span className="text-red-500 text-[10px]">🚫</span>}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      <button
        onClick={() => { clearTimer(); returnToMenu(); }}
        className="absolute top-3 left-3 px-2 py-1 bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white rounded text-xs transition-all z-10"
      >
        ← Menu
      </button>

      <div className="flex-1 flex overflow-hidden">
        {renderTeam(blueTeam, 'blue')}

        <div className="flex-1 flex flex-col min-w-0">
          <div className="bg-gray-800/80 border-b border-gray-700 px-3 py-2 flex items-center justify-center gap-3">
            <div className={`px-3 py-1 rounded font-rajdhani font-bold text-xs ${
              phase === 'ban' ? 'bg-red-900/50 text-red-400' : phase === 'pick' ? 'bg-blue-900/50 text-blue-400' : 'bg-green-900/50 text-green-400'
            }`}>
              {phase === 'ban' ? '🚫 BANLAMA' : phase === 'pick' ? '✅ SECIM' : '🏆 HAZIR'}
            </div>
            <div className={`text-xl font-rajdhani font-bold ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-gray-300'}`}>
              {timeLeft}s
            </div>
            <div className="text-[10px] text-gray-500 max-w-xs truncate">
              {!currentTurn ? 'Mac basliyor...' : isPlayerTurn ? (phase === 'ban' ? 'Yasakla!' : 'Sec!') : 'Rakip secim yapiyor...'}
            </div>
          </div>

          {bannedChampions.length > 0 && (
            <div className="bg-gray-800/50 border-b border-gray-700 px-2 py-1">
              <div className="text-center text-[9px] text-gray-600 mb-0.5">Yasaklanan ({bannedChampions.length}/10)</div>
              <div className="flex justify-center gap-1 flex-wrap">
                {bannedChampions.map((c) => (
                  <div key={c.id} className="w-7 h-7 rounded bg-red-900/50 border border-red-700/50 flex items-center justify-center text-xs opacity-50">
                    <img src={getChampionIconUrl(c.name, c.dragonName)} alt={c.name} className="w-6 h-6 rounded" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 p-3 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Sampiyon ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-gray-800/80 border border-gray-600 rounded px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-0.5">
                  {ROLE_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setRoleFilter(f.id)}
                      className={`px-1.5 py-1 rounded text-[10px] font-medium transition-all ${
                        roleFilter === f.id ? 'bg-blue-600 text-white' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                      }`}
                    >
                      {f.icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[9px] text-gray-600 mb-1 text-center">Kalan: {availableChampions.length} sampiyon</div>

              <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-1 max-h-48 overflow-y-auto pr-1">
                {filteredChampions.map((champion) => (
                  <button
                    key={champion.id}
                    onClick={() => currentTurn?.phase === 'ban' ? handleBanChampion(champion) : handlePickChampion(champion)}
                    onMouseEnter={() => setHoveredChamp(champion)}
                    onMouseLeave={() => setHoveredChamp(null)}
                    disabled={!isPlayerTurn || !currentTurn}
                    className={`w-full aspect-square rounded flex items-center justify-center text-lg transition-all ${
                      isPlayerTurn && currentTurn ? 'hover:scale-110 hover:ring-2 hover:ring-white cursor-pointer' : 'opacity-40 cursor-not-allowed'
                    }`}
                    title={champion.name}
                  >
                    <img src={getChampionIconUrl(champion.name, champion.dragonName)} alt={champion.name} className="w-full h-full object-cover rounded" />
                  </button>
                ))}
              </div>

              {hoveredChamp && (
                <div className="mt-2 bg-gray-800/80 border border-gray-600 rounded p-2 flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-gray-700/80 flex items-center justify-center overflow-hidden">
                    <img src={getChampionIconUrl(hoveredChamp.name, hoveredChamp.dragonName)} alt={hoveredChamp.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-rajdhani font-bold text-sm">{hoveredChamp.name}</div>
                    <div className="text-gray-400 text-[10px]">{hoveredChamp.title}</div>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[10px] text-red-400">ATK:{hoveredChamp.stats.attack}</span>
                      <span className="text-[10px] text-blue-400">DEF:{hoveredChamp.stats.defense}</span>
                      <span className="text-[10px] text-purple-400">AP:{hoveredChamp.stats.magic}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-gray-500">Zorluk</div>
                    <div className="w-14 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500" style={{ width: `${hoveredChamp.stats.difficulty}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {playerPickedChampion && (
                <div className="mt-2 bg-blue-900/30 border border-blue-700/50 rounded p-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded bg-blue-800/80 flex items-center justify-center overflow-hidden">
                      <img src={getChampionIconUrl(playerPickedChampion.name, playerPickedChampion.dragonName)} alt={playerPickedChampion.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="text-blue-300 font-rajdhani font-bold text-sm">{playerPickedChampion.name}</div>
                      <div className="text-gray-400 text-[10px]">{playerPickedChampion.title}</div>
                    </div>
                  </div>

                  <div className="mt-2 flex gap-2 items-center">
                    <button
                      onClick={() => toggleSummonerSelect(0)}
                      className={`w-10 h-10 rounded border-2 flex items-center justify-center text-xl ${
                        showSummonerSelect && summonerSelectSlot === 0 ? 'border-yellow-500 bg-yellow-900/30' : 'border-gray-600 bg-gray-800/80 hover:border-gray-500'
                      }`}
                    >
                      {playerSummoner1 ? playerSummoner1.icon : '❓'}
                    </button>
                    <button
                      onClick={() => toggleSummonerSelect(1)}
                      className={`w-10 h-10 rounded border-2 flex items-center justify-center text-xl ${
                        showSummonerSelect && summonerSelectSlot === 1 ? 'border-yellow-500 bg-yellow-900/30' : 'border-gray-600 bg-gray-800/80 hover:border-gray-500'
                      }`}
                    >
                      {playerSummoner2 ? playerSummoner2.icon : '❓'}
                    </button>
                    <div className="flex-1">
                      <div className="text-green-400 text-[10px]">Summoner secildi - mac basliyor...</div>
                    </div>
                  </div>

                  {showSummonerSelect && (
                    <div className="mt-1.5 grid grid-cols-5 gap-1">
                      {allSpells.map((spell) => (
                        <button
                          key={spell.id}
                          onClick={() => setSummonerSpell(summonerSelectSlot, spell)}
                          className="flex flex-col items-center gap-0 p-1 rounded bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600 hover:border-gray-500 transition-all"
                        >
                          <span className="text-sm">{spell.icon}</span>
                          <span className="text-[8px] text-gray-300">{spell.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {renderTeam(redTeam, 'red')}
      </div>

      <div className="bg-gray-800/80 border-t border-gray-700 px-2 py-1.5 text-center">
        <div className="text-[10px] text-gray-500">
          {!currentTurn ? 'Mac basliyor...' : isPlayerTurn ? (phase === 'ban' ? 'Yasaklamak icin sampiyona tikla' : 'Secmek icin sampiyona tikla') : 'Rakip secim yapiyor...'}
        </div>
      </div>
    </div>
  );
}