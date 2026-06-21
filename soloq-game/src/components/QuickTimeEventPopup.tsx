import { useState, useEffect, useCallback } from 'react';
import type { QuickTimeEvent, ChampionCombo } from '../types/game';
import { getChampionIconUrl } from '../utils/championIcons';
import championsData from '../data/champions.json';
import type { Champion } from '../types/game';

interface QuickTimeEventPopupProps {
  qte: QuickTimeEvent;
  onChoice: (combo: ChampionCombo, success: boolean) => void;
}

const RISK_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: 'Düşük Risk', color: 'text-green-400', bg: 'bg-green-900/30 border-green-600' },
  medium: { label: 'Orta Risk', color: 'text-yellow-400', bg: 'bg-yellow-900/30 border-yellow-600' },
  high: { label: 'Yüksek Risk', color: 'text-red-400', bg: 'bg-red-900/30 border-red-600' },
};

export default function QuickTimeEventPopup({ qte, onChoice }: QuickTimeEventPopupProps) {
  const [timeLeft, setTimeLeft] = useState(qte.timeLimit);
  const [selectedCombo, setSelectedCombo] = useState<ChampionCombo | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [wasSuccess, setWasSuccess] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const allChampions: Champion[] = championsData as Champion[];
  const champion = allChampions.find(c => c.name === qte.championName);

  const handleTimeUp = useCallback(() => {
    if (selectedCombo) return;
    const safeChoice = qte.choices.find(c => c.combo.sequence === 'SAFE');
    if (safeChoice) {
      setSelectedCombo(safeChoice.combo);
      setWasSuccess(true);
      setShowResult(true);
      setTimeout(() => onChoice(safeChoice.combo, true), 1200);
    }
  }, [selectedCombo, qte.choices, onChoice]);

  useEffect(() => {
    if (timeLeft <= 0 || showResult) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 0.05;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [timeLeft, showResult, handleTimeUp]);

  const handleComboSelect = (choice: typeof qte.choices[0]) => {
    if (selectedCombo || isAnimating) return;

    setIsAnimating(true);
    setSelectedCombo(choice.combo);

    const isSafe = choice.combo.sequence === 'SAFE';
    const success = isSafe ? true : Math.random() > (choice.combo.difficulty / 100);

    setWasSuccess(success);
    setShowResult(true);

    setTimeout(() => {
      onChoice(choice.combo, success);
    }, 1200);
  };

  const timerPercent = (timeLeft / qte.timeLimit) * 100;
  const timerColor = timeLeft > 2 ? '#22c55e' : timeLeft > 1 ? '#eab308' : '#ef4444';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

      <div className="relative z-10 w-full max-w-sm mx-4 animate-qte-enter">
        <div className="bg-gray-900 border-2 border-yellow-500 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-yellow-600 to-orange-600 px-4 py-2 flex items-center justify-between">
            <span className="text-white font-bold text-sm">⚡ QUICK TIME EVENT</span>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="16" fill="none"
                  stroke={timerColor}
                  strokeWidth="3"
                  strokeDasharray="100.53"
                  strokeDashoffset={100.53 - (timerPercent / 100) * 100.53}
                  strokeLinecap="round"
                  transform="rotate(-90 18 18)"
                  style={{ transition: 'stroke-dashoffset 0.05s linear' }}
                />
              </svg>
              <span className={`font-mono font-bold text-sm ${timeLeft <= 1 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {timeLeft.toFixed(1)}s
              </span>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              {champion && (
                <img
                  src={getChampionIconUrl(champion.name, champion.dragonName)}
                  alt={champion.name}
                  className="w-12 h-12 rounded-lg border-2 border-yellow-500"
                />
              )}
              <div>
                <h3 className="text-white font-bold text-lg">{qte.title}</h3>
                <p className="text-gray-400 text-xs">{qte.description}</p>
              </div>
            </div>

            {!showResult ? (
              <div className="space-y-2">
                {qte.choices.map((choice) => {
                  const riskStyle = RISK_LABELS[choice.combo.risk];
                  return (
                    <button
                      key={choice.id}
                      onClick={() => handleComboSelect(choice)}
                      disabled={isAnimating}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all duration-150 active:scale-95 ${
                        selectedCombo?.id === choice.combo.id
                          ? 'border-yellow-400 bg-yellow-900/30'
                          : `${riskStyle.bg} hover:brightness-125`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-bold text-sm">{choice.combo.name}</div>
                          <div className="text-gray-300 text-xs font-mono mt-0.5">
                            {choice.combo.sequence === 'SAFE' ? '🛡️ Güvende kal' : choice.combo.sequence}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-[10px] font-medium ${riskStyle.color}`}>
                            {riskStyle.label}
                          </div>
                          {choice.combo.sequence !== 'SAFE' && (
                            <div className="text-gray-500 text-[10px]">
                              %{Math.round((1 - choice.combo.difficulty / 100) * 100)}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className={`text-center py-4 animate-qte-result ${wasSuccess ? 'text-green-400' : 'text-red-400'}`}>
                <div className="text-4xl mb-2">{wasSuccess ? '✅' : '❌'}</div>
                <div className="text-xl font-bold mb-1">
                  {wasSuccess ? 'BAŞARILI!' : 'BAŞARISIZ!'}
                </div>
                <div className="text-sm text-gray-400">
                  {selectedCombo?.sequence === 'SAFE'
                    ? 'Güvende kaldın'
                    : wasSuccess
                      ? `${selectedCombo?.name} kombosu tuttu!`
                      : `${selectedCombo?.name} kombosu başarısız!`}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
