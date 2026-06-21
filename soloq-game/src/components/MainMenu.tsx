import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import RankBadge from './RankBadge';
import heroImg from '../assets/hero.png';
import { ROLE_ICONS, ROLE_NAMES } from '../constants/game';
import TeamOfferPopup from './TeamOfferPopup';

export default function MainMenu() {
  const { player, startMatch, startAIMatch, goToCareer, goToTraining, returnToMenu, teamOffer, acceptTeamOffer, rejectTeamOffer } =
    useGameStore();
  const [showProfile, setShowProfile] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="text-center mb-6">
        <div className="relative inline-block">
          <img
            src={heroImg}
            alt="SoloQ"
            className="w-28 h-28 mx-auto mb-3 rounded-full border-2 border-yellow-500/50 shadow-xl shadow-yellow-500/20 object-cover"
          />
          <div className="absolute inset-0 rounded-full animate-glow pointer-events-none" />
        </div>
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-1 tracking-wider">
          SOLOQ
        </h1>
        <h2 className="text-xl text-gray-300 font-light tracking-wide">Efsane Yolu</h2>
        <p className="text-gray-500 mt-1 text-sm">Iron'dan Challenger'a kariyer yolculugu</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={startAIMatch}
          className="btn-primary w-full py-4 px-6 text-lg"
        >
          <span className="flex items-center justify-center gap-2">
            <span>🤖</span> AI Mac Baslat
          </span>
          <span className="text-[10px] font-normal opacity-75 block mt-1">
            Serbest cevapla oyna, AI degerlendirsin
          </span>
        </button>

        <button
          onClick={startMatch}
          className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/25 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
        >
          <span className="flex items-center justify-center gap-2">
            <span>⚡</span> Klasik Mac Baslat
          </span>
          <span className="text-[10px] font-normal opacity-75 block mt-1">
            Seceneklerle oyna
          </span>
        </button>

        <button
          onClick={goToTraining}
          className="w-full py-3 px-6 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-cyan-500/25 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <span className="flex items-center justify-center gap-2">
            <span>🏋️</span> Antrenman Merkezi
          </span>
          <span className="text-[10px] font-normal opacity-75 block mt-1">
            Beceri gelistir
          </span>
        </button>

        {player && (
          <button
            onClick={goToCareer}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <span className="flex items-center justify-center gap-2">
              <span>📊</span> Kariyerim
            </span>
          </button>
        )}
      </div>

      {player && (
        <>
          <button
            onClick={() => setShowProfile(true)}
            className="mt-6 bg-gray-800/50 rounded-xl p-4 w-full max-w-xs border border-gray-700 hover:border-gray-500 transition-all duration-200 active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 flex items-center justify-center text-2xl">
                {ROLE_ICONS[player.role] || '👤'}
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-bold text-sm">{player.name}</p>
                <p className="text-gray-400 text-xs">{ROLE_NAMES[player.role] || player.role}</p>
              </div>
              <RankBadge
                rank={player.rank.rank}
                division={player.rank.division}
                lp={player.rank.lp}
                size="sm"
              />
            </div>
            <div className="grid grid-cols-5 gap-1 mt-3 pt-3 border-t border-gray-700">
              <div className="text-center">
                <p className="text-green-400 font-bold text-sm">{player.stats.wins}</p>
                <p className="text-gray-500 text-[9px]">G</p>
              </div>
              <div className="text-center">
                <p className="text-red-400 font-bold text-sm">{player.stats.losses}</p>
                <p className="text-gray-500 text-[9px]">M</p>
              </div>
              <div className="text-center">
                <p className={`font-bold text-sm ${player.stats.winRate >= 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                  {player.stats.gamesPlayed > 0 ? (player.stats.winRate * 100).toFixed(0) : 0}%
                </p>
                <p className="text-gray-500 text-[9px]">WR</p>
              </div>
              <div className="text-center">
                <p className="text-yellow-400 font-bold text-sm">{player.stats.kda.toFixed(1)}</p>
                <p className="text-gray-500 text-[9px]">KDA</p>
              </div>
              <div className="text-center">
                <p className="text-purple-400 font-bold text-sm">{player.stats.csPerMin.toFixed(1)}</p>
                <p className="text-gray-500 text-[9px]">CS</p>
              </div>
            </div>
          </button>

          {showProfile && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowProfile(false)}>
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 flex items-center justify-center text-4xl mx-auto mb-2">
                    {ROLE_ICONS[player.role] || '👤'}
                  </div>
                  <h2 className="text-xl font-bold text-white">{player.name}</h2>
                  <p className="text-gray-400 text-sm">{ROLE_NAMES[player.role] || player.role}</p>
                </div>

                <div className="flex justify-center mb-4">
                  <RankBadge rank={player.rank.rank} division={player.rank.division} lp={player.rank.lp} size="lg" />
                </div>

                <div className="space-y-2 mb-4">
                  {[
                    { label: 'KDA', value: player.stats.kda.toFixed(2), color: 'text-yellow-400' },
                    { label: 'CS/Dakika', value: player.stats.csPerMin.toFixed(1), color: 'text-green-400' },
                    { label: 'Vision Skoru', value: player.stats.visionScore.toFixed(0), color: 'text-blue-400' },
                    { label: 'Kazanma Orani', value: player.stats.gamesPlayed > 0 ? (player.stats.winRate * 100).toFixed(0) + '%' : '0%', color: player.stats.winRate >= 0.5 ? 'text-green-400' : 'text-red-400' },
                    { label: 'Form', value: `${player.form > 70 ? 'Mukemmel' : player.form > 50 ? 'Iyi' : player.form > 30 ? 'Normal' : 'Kotu'} (${player.form})`, color: player.form > 70 ? 'text-green-400' : player.form < 30 ? 'text-red-400' : 'text-gray-400' },
                    { label: 'Yorgunluk', value: `${player.fatigue > 50 ? 'Yuksek' : player.fatigue > 20 ? 'Orta' : 'Dusuk'} (${player.fatigue})`, color: player.fatigue > 50 ? 'text-red-400' : player.fatigue > 20 ? 'text-yellow-400' : 'text-green-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between items-center bg-gray-700/50 px-3 py-2 rounded-lg">
                      <span className="text-gray-300 text-sm">{label}</span>
                      <span className={`font-bold ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                    <p className="text-2xl font-bold text-white">{player.stats.gamesPlayed}</p>
                    <p className="text-gray-500 text-[10px]">Toplam Mac</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                    <p className="text-2xl font-bold text-green-400">{player.stats.wins}</p>
                    <p className="text-gray-500 text-[10px]">Galibiyet</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                    <p className="text-2xl font-bold text-red-400">{player.stats.losses}</p>
                    <p className="text-gray-500 text-[10px]">Maglubiyet</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowProfile(false)}
                  className="btn-secondary w-full py-3"
                >
                  Kapat
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <button
        onClick={() => setShowResetConfirm(true)}
        className="mt-4 text-gray-600 text-xs hover:text-gray-400 transition-colors"
      >
        Kaydi Sifirla
      </button>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowResetConfirm(false)}>
          <div className="bg-gray-800 border border-red-500/50 rounded-2xl p-5 w-full max-w-sm shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">⚠️</div>
              <h3 className="text-xl font-bold text-white mb-1">Emin misin?</h3>
              <p className="text-gray-400 text-sm">
                Bu islem geri alinamaz. Tum verilerin, mac gecmisinin ve rank'in silinecek.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="btn-secondary flex-1 py-3"
              >
                Iptal
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('soloq-game-storage');
                  localStorage.removeItem('soloq-training-energy');
                  window.location.reload();
                }}
                className="btn-danger flex-1 py-3"
              >
                Evet, Sifirla
              </button>
            </div>
          </div>
        </div>
      )}

      {teamOffer && (
        <TeamOfferPopup
          offer={teamOffer}
          onAccept={acceptTeamOffer}
          onReject={rejectTeamOffer}
        />
      )}
    </div>
  );
}
