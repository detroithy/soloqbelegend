import { useGameStore } from '../store/gameStore';
import RankBadge from './RankBadge';
import { ROLE_ICONS, ROLE_NAMES } from '../constants/game';

export default function Career() {
  const { player, matchHistory, returnToMenu } = useGameStore();

  if (!player) return null;

  const winStreak = matchHistory.reduceRight((streak, m) => {
    if (m.win) return streak + 1;
    return streak;
  }, 0);

  const lossStreak = matchHistory.reduceRight((streak, m) => {
    if (!m.win) return streak + 1;
    return streak;
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center p-4 animate-fade-in">
      <div className="w-full max-w-md pt-6">
        <h1 className="text-2xl font-bold text-white text-center mb-6">Kariyer Profili</h1>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 flex items-center justify-center text-4xl mx-auto mb-2">
            {ROLE_ICONS[player.role] || '👤'}
          </div>
          <h2 className="text-xl font-bold text-white">{player.name}</h2>
          <p className="text-gray-400 text-sm">{ROLE_NAMES[player.role] || player.role}</p>

          {player.currentTeam && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2" style={{ borderColor: player.currentTeam.primaryColor, backgroundColor: `${player.currentTeam.primaryColor}22` }}>
              <span className="text-2xl">{player.currentTeam.logo}</span>
              <div className="text-left">
                <p className="text-white font-bold text-sm">{player.currentTeam.name}</p>
                <p className="text-gray-400 text-[10px]">{player.currentTeam.league} • {player.currentTeam.region}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center mb-6">
          <RankBadge rank={player.rank.rank} division={player.rank.division} lp={player.rank.lp} size="lg" />
        </div>

        <div className="card-glass mb-4">
          <h3 className="text-white font-bold mb-3">Istatistikler</h3>
          <div className="space-y-2">
            {[
              { label: 'KDA', value: player.stats.kda.toFixed(2), color: 'text-yellow-400' },
              { label: 'CS/Dakika', value: player.stats.csPerMin.toFixed(1), color: 'text-green-400' },
              { label: 'Vision Skoru', value: player.stats.visionScore.toFixed(0), color: 'text-blue-400' },
              { label: 'Kazanma Orani', value: (player.stats.winRate * 100).toFixed(0) + '%', color: player.stats.winRate >= 0.5 ? 'text-green-400' : 'text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center bg-gray-800/80 px-3 py-2 rounded-lg">
                <span className="text-gray-300 text-sm">{label}</span>
                <span className={`font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-glass mb-4">
          <h3 className="text-white font-bold mb-3">Mac Ozeti</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">{player.stats.gamesPlayed}</p>
              <p className="text-gray-500 text-xs">Toplam Mac</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-400">{player.stats.wins}</p>
              <p className="text-gray-500 text-xs">Galibiyet</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-400">{player.stats.losses}</p>
              <p className="text-gray-500 text-xs">Maglubiyet</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {winStreak > 0 ? `${winStreak}W` : lossStreak > 0 ? `${lossStreak}L` : '-'}
              </p>
              <p className="text-gray-500 text-xs">
                {winStreak > 0 ? 'Galibiyet Serisi' : lossStreak > 0 ? 'Maglubiyet Serisi' : 'Seri'}
              </p>
            </div>
          </div>
        </div>

        {player.teamHistory && player.teamHistory.length > 0 && (
          <div className="card-glass mb-4">
            <h3 className="text-white font-bold mb-3">Takım Geçmişi</h3>
            <div className="space-y-2">
              {player.teamHistory.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/80"
                  style={{ borderLeft: `3px solid ${entry.team.primaryColor}` }}
                >
                  <span className="text-xl">{entry.team.logo}</span>
                  <div className="flex-1">
                    <p className="text-white font-bold text-sm">{entry.team.name}</p>
                    <p className="text-gray-500 text-[10px]">
                      {entry.team.league} • {entry.team.region}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-[10px]">
                      {new Date(entry.startDate).toLocaleDateString('tr-TR')}
                    </p>
                    {!entry.endDate && (
                      <span className="text-green-400 text-[10px] font-bold">Aktif</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {matchHistory.length > 0 ? (
          <div className="card-glass mb-6">
            <h3 className="text-white font-bold mb-3">Son Mac Gecmisi</h3>
            <div className="space-y-2">
              {matchHistory
                .slice(-10)
                .reverse()
                .map((m, i) => (
                  <div
                    key={i}
                    className={`flex justify-between items-center px-3 py-2 rounded-lg ${
                      m.win ? 'bg-green-900/30' : 'bg-red-900/30'
                    }`}
                  >
                    <span className={`font-bold ${m.win ? 'text-green-400' : 'text-red-400'}`}>
                      {m.win ? 'GALIP' : 'MAGLUP'}
                    </span>
                    <span
                      className={`font-bold text-sm ${
                        m.lpGained >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {m.lpGained >= 0 ? '+' : ''}{m.lpGained} LP
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="card-glass mb-6 text-center py-8">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-400 text-sm">Henuz mac oynamadin.</p>
            <p className="text-gray-500 text-xs mt-1">Ilk macini oynayarak kariyerine basla!</p>
          </div>
        )}

        <button
          onClick={returnToMenu}
          className="btn-secondary w-full py-3"
        >
          Geri Don
        </button>
      </div>
    </div>
  );
}
