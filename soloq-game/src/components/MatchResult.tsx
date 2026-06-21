import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import RankBadge from './RankBadge';

const CONFETTI_COLORS = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#4caf50', '#ff9800', '#ffeb3b'];

function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      size: 6 + Math.random() * 8,
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function MatchResult() {
  const { player, matchHistory, returnToMenu, startMatch, startAIMatch, rankPromoted } = useGameStore();
  const [showConfetti, setShowConfetti] = useState(false);

  const lastMatch = matchHistory[matchHistory.length - 1];

  useEffect(() => {
    if (lastMatch?.win || rankPromoted) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!player) return null;

  const recentMatches = matchHistory.slice(-5).reverse();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center p-4 animate-fade-in">
      {showConfetti && <Confetti />}
      <div className="w-full max-w-md pt-8">

        {rankPromoted && (
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border-2 border-yellow-500 rounded-2xl text-center animate-glow">
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-xl font-bold text-yellow-400">TEBRIKLER!</h2>
            <p className="text-white font-bold">{player.rank.rank.toUpperCase()} {player.rank.division} rankina ulastin!</p>
          </div>
        )}
        <div className="text-center mb-6">
          <RankBadge rank={player.rank.rank} division={player.rank.division} lp={player.rank.lp} size="lg" />
        </div>

        {lastMatch && (
          <div
            className={`p-6 rounded-2xl border-2 mb-6 ${
              lastMatch.win
                ? 'bg-green-900/20 border-green-600'
                : 'bg-red-900/20 border-red-600'
            }`}
          >
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">{lastMatch.win ? '🏆' : '💀'}</div>
              <h2 className="text-2xl font-bold text-white">
                {lastMatch.win ? 'Galibiyet!' : 'Maglubiyet'}
              </h2>
              <p
                className={`text-lg font-bold ${
                  lastMatch.lpGained >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {lastMatch.lpGained >= 0 ? '+' : ''}{lastMatch.lpGained} LP
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="stat-item">
                <p className="text-gray-400 text-xs">KDA</p>
                <p className="text-white font-bold">
                  {lastMatch.statsGained?.kda !== undefined
                    ? (lastMatch.statsGained.kda > 0 ? '+' : '') + Number(lastMatch.statsGained.kda).toFixed(1)
                    : '0'}
                </p>
              </div>
              <div className="stat-item">
                <p className="text-gray-400 text-xs">CS/Dk</p>
                <p className="text-white font-bold">
                  {lastMatch.statsGained?.csPerMin !== undefined
                    ? (lastMatch.statsGained.csPerMin > 0 ? '+' : '') + Number(lastMatch.statsGained.csPerMin).toFixed(1)
                    : '0'}
                </p>
              </div>
              <div className="stat-item">
                <p className="text-gray-400 text-xs">Vision</p>
                <p className="text-white font-bold">
                  {lastMatch.statsGained?.visionScore !== undefined
                    ? (lastMatch.statsGained.visionScore > 0 ? '+' : '') + Number(lastMatch.statsGained.visionScore).toFixed(1)
                    : '0'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="card-glass mb-6">
          <h3 className="text-white font-bold mb-3">Genel Durum</h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-xl font-bold text-white">{player.stats.gamesPlayed}</p>
              <p className="text-gray-500 text-xs">Mac</p>
            </div>
            <div>
              <p className="text-xl font-bold text-green-400">{player.stats.wins}</p>
              <p className="text-gray-500 text-xs">Galibiyet</p>
            </div>
            <div>
              <p className="text-xl font-bold text-red-400">{player.stats.losses}</p>
              <p className="text-gray-500 text-xs">Maglubiyet</p>
            </div>
            <div>
              <p className={`text-xl font-bold ${player.stats.winRate >= 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                {player.stats.gamesPlayed > 0
                  ? (player.stats.winRate * 100).toFixed(0)
                  : 0}%
              </p>
              <p className="text-gray-500 text-xs">Kazanma</p>
            </div>
          </div>
        </div>

        {recentMatches.length > 0 && (
          <div className="card-glass mb-6">
            <h3 className="text-white font-bold mb-3">Son Mac Sonuclari</h3>
            <div className="flex gap-2 justify-center">
              {recentMatches.map((m, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                    m.win
                      ? 'bg-green-900/50 border border-green-600'
                      : 'bg-red-900/50 border border-red-600'
                  }`}
                >
                  {m.win ? 'W' : 'L'}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={returnToMenu}
            className="btn-secondary flex-1 py-3"
          >
            Ana Menu
          </button>
          <button
            onClick={startMatch}
            className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-xl transition-all duration-200 shadow-lg active:scale-95 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
          >
            <span className="flex items-center justify-center gap-1">
              <span>⚡</span> Klasik
            </span>
          </button>
          <button
            onClick={startAIMatch}
            className="btn-primary flex-1 py-3"
          >
            <span className="flex items-center justify-center gap-1">
              <span>🤖</span> AI
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
