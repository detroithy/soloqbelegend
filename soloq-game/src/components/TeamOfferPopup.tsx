import { useState, useEffect } from 'react';
import type { TeamOffer } from '../types/game';
import { calculateTeamSalary } from '../utils/teamOffers';

interface TeamOfferPopupProps {
  offer: TeamOffer;
  onAccept: () => void;
  onReject: () => void;
}

const TIER_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  S: { label: 'S-Tier (Dünya Klası)', color: 'text-yellow-400', bg: 'bg-yellow-900/30 border-yellow-500' },
  A: { label: 'A-Tier (Üst Düzey)', color: 'text-orange-400', bg: 'bg-orange-900/30 border-orange-500' },
  B: { label: 'B-Tier (Orta Düzey)', color: 'text-blue-400', bg: 'bg-blue-900/30 border-blue-500' },
  C: { label: 'C-Tier (Gelişme)', color: 'text-purple-400', bg: 'bg-purple-900/30 border-purple-500' },
  D: { label: 'D-Tier (Akademi)', color: 'text-gray-400', bg: 'bg-gray-900/30 border-gray-500' },
};

export default function TeamOfferPopup({ offer, onAccept, onReject }: TeamOfferPopupProps) {
  const [timeLeft, setTimeLeft] = useState(offer.gameHoursLeft);
  const [showResult, setShowResult] = useState<'accept' | 'reject' | null>(null);

  const { team } = offer;
  const tierStyle = TIER_LABELS[team.tier] || TIER_LABELS.D;
  const salary = calculateTeamSalary(team, 50);

  useEffect(() => {
    if (showResult) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onReject();
          return 0;
        }
        return prev - 1;
      });
    }, 60000);

    return () => clearInterval(timer);
  }, [showResult, onReject]);

  const handleAccept = () => {
    setShowResult('accept');
    setTimeout(() => onAccept(), 1500);
  };

  const handleReject = () => {
    setShowResult('reject');
    setTimeout(() => onReject(), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" />

      <div className="relative z-10 w-full max-w-sm mx-4 animate-qte-enter">
        <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border-2" style={{ borderColor: team.primaryColor }}>
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ background: `linear-gradient(135deg, ${team.primaryColor}CC, ${team.secondaryColor}33)` }}
          >
            <span className="text-white font-bold text-sm">📨 TAKIM TEKLİFİ</span>
            <div className="flex items-center gap-2">
              <span className="text-white/80 text-xs">{timeLeft} maç kaldı</span>
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            </div>
          </div>

          <div className="p-4">
            <div className="text-center mb-4">
              <div
                className="w-20 h-20 rounded-2xl mx-auto mb-3 flex items-center justify-center text-4xl border-2"
                style={{
                  backgroundColor: `${team.primaryColor}22`,
                  borderColor: team.primaryColor,
                }}
              >
                {team.logo}
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{team.name}</h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: team.primaryColor, color: team.secondaryColor }}>
                  {team.tag}
                </span>
                <span className="text-gray-400 text-xs">{team.league}</span>
                <span className="text-gray-500 text-xs">•</span>
                <span className="text-gray-400 text-xs">{team.region}</span>
              </div>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${tierStyle.bg} ${tierStyle.color}`}>
                {tierStyle.label}
              </div>
            </div>

            <div className="bg-gray-800/80 rounded-xl p-3 mb-4">
              <p className="text-gray-300 text-sm italic text-center">"{offer.message}"</p>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between bg-gray-800/50 px-3 py-2 rounded-lg">
                <span className="flex items-center gap-2 text-gray-300 text-sm">
                  <span>💰</span> Maaş
                </span>
                <span className="text-green-400 font-bold">${salary}K/maç</span>
              </div>
              <div className="flex items-center justify-between bg-gray-800/50 px-3 py-2 rounded-lg">
                <span className="flex items-center gap-2 text-gray-300 text-sm">
                  <span>📈</span> Form Bonusu
                </span>
                <span className="text-yellow-400 font-bold">+{team.bonuses.formBonus}</span>
              </div>
              <div className="flex items-center justify-between bg-gray-800/50 px-3 py-2 rounded-lg">
                <span className="flex items-center gap-2 text-gray-300 text-sm">
                  <span>😴</span> Yorgunluk Azaltma
                </span>
                <span className="text-cyan-400 font-bold">-{team.bonuses.fatigueReduction}</span>
              </div>
              <div className="flex items-center justify-between bg-gray-800/50 px-3 py-2 rounded-lg">
                <span className="flex items-center gap-2 text-gray-300 text-sm">
                  <span>🏆</span> LP Bonusu
                </span>
                <span className="text-purple-400 font-bold">+{team.bonuses.lpBonus}</span>
              </div>
            </div>

            {team.sponsors.length > 0 && (
              <div className="mb-4">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Sponsorlar</p>
                <div className="flex flex-wrap gap-1">
                  {team.sponsors.map((sponsor) => (
                    <span key={sponsor} className="px-2 py-0.5 bg-gray-700/50 rounded text-gray-400 text-[10px]">
                      {sponsor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-gray-500 text-xs text-center mb-4">{team.description}</p>

            {!showResult ? (
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all duration-200 active:scale-95"
                >
                  ❌ Reddet
                </button>
                <button
                  onClick={handleAccept}
                  className="flex-1 py-3 font-bold rounded-xl transition-all duration-200 active:scale-95 text-white"
                  style={{ backgroundColor: team.primaryColor }}
                >
                  ✅ Kabul Et
                </button>
              </div>
            ) : (
              <div className={`text-center py-4 animate-qte-result ${showResult === 'accept' ? 'text-green-400' : 'text-red-400'}`}>
                <div className="text-3xl mb-2">{showResult === 'accept' ? '🎉' : '👋'}</div>
                <div className="text-lg font-bold">
                  {showResult === 'accept'
                    ? `${team.name}'a Katıldın!`
                    : 'Teklif Reddedildi'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
