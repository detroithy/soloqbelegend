import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { applyEventChoice } from '../utils/matchSimulation';
import { shouldTriggerQTE, generateQTE, calculateQTESuccess, getQTEReward } from '../utils/qteGenerator';
import type { QuickTimeEvent, ChampionCombo } from '../types/game';
import RankBadge from './RankBadge';
import QuickTimeEventPopup from './QuickTimeEventPopup';

const CHOICE_STYLES = [
  { border: 'border-red-500', bg: 'hover:bg-red-900/30', icon: '⚔️', label: 'Agresif' },
  { border: 'border-blue-500', bg: 'hover:bg-blue-900/30', icon: '🛡️', label: 'Savunmaci' },
  { border: 'border-purple-500', bg: 'hover:bg-purple-900/30', icon: '🧠', label: 'Stratejik' },
  { border: 'border-yellow-500', bg: 'hover:bg-yellow-900/30', icon: '⚡', label: 'Ozel' },
];

const EFFECT_LABELS: Record<string, string> = {
  kda: 'KDA',
  csPerMin: 'CS/Dk',
  visionScore: 'Vision',
  damage: 'Hasar',
  utility: 'Destek',
};

export default function GameScreen() {
  const {
    player,
    currentMatch,
    currentEvent,
    eventIndex,
    resolveEvent,
    nextEvent,
    finishMatch,
    returnToMenu,
  } = useGameStore();
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [eventResult, setEventResult] = useState<{
    success: boolean;
    effect: Record<string, number>;
  } | null>(null);
  const [matchSimulating, setMatchSimulating] = useState(false);

  const [activeQTE, setActiveQTE] = useState<QuickTimeEvent | null>(null);
  const [pendingEventResult, setPendingEventResult] = useState<{
    choiceId: string;
    success: boolean;
    effect: Record<string, number>;
  } | null>(null);
  const [qteResultMessage, setQteResultMessage] = useState<string | null>(null);

  if (!player) return null;

  if (matchSimulating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⚔️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Mac Simulasyonu...</h2>
          <p className="text-gray-400">Rakip takimla caprazlasiliyor</p>
          <div className="mt-6 w-48 mx-auto bg-gray-700 rounded-full h-2">
            <div className="bg-yellow-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    );
  }

  const handleEventChoice = (choiceId: string, choice: { id: string; text: string; outcome: { successChance: number; successEffect: Partial<import('../types/game').PlayerStats>; failEffect: Partial<import('../types/game').PlayerStats> } }) => {
    if (!currentEvent) return;
    setSelectedChoiceId(choiceId);
    const result = applyEventChoice(choice);
    const effect = result.effect as Record<string, number>;

    if (shouldTriggerQTE()) {
      const championName = championSelect?.playerPickedChampion?.name || 'Unknown';
      const qte = generateQTE(championName, player.role);
      setPendingEventResult({ choiceId, success: result.success, effect });
      setActiveQTE(qte);
    } else {
      setEventResult({ success: result.success, effect });
    }
  };

  const handleQTEChoice = (combo: ChampionCombo, success: boolean) => {
    if (!pendingEventResult) return;

    const qteReward = getQTEReward(combo, success);
    const mergedEffect = { ...pendingEventResult.effect };

    if (qteReward.kda) mergedEffect.kda = (mergedEffect.kda || 0) + qteReward.kda;
    if (qteReward.csPerMin) mergedEffect.csPerMin = (mergedEffect.csPerMin || 0) + qteReward.csPerMin;
    if (qteReward.visionScore) mergedEffect.visionScore = (mergedEffect.visionScore || 0) + qteReward.visionScore;

    const qteMsg = combo.sequence === 'SAFE'
      ? '🛡️ Güvende kaldın'
      : success
        ? `⚡ ${combo.name} kombosu tuttu!`
        : `❌ ${combo.name} kombosu başarısız!`;

    setQteResultMessage(qteMsg);
    setActiveQTE(null);
    setPendingEventResult(null);

    setTimeout(() => {
      setEventResult({
        success: pendingEventResult.success,
        effect: mergedEffect,
      });
      setQteResultMessage(null);
    }, 1500);
  };

  const championSelect = useGameStore.getState().championSelect;

  if (currentEvent && !eventResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col p-4 animate-fade-in">
        <div className="w-full max-w-md mx-auto flex flex-col h-full">
          <div className="flex justify-between items-center mb-4 pt-2">
            <button
              onClick={returnToMenu}
              className="text-gray-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
            >
              ← Menu
            </button>
            <RankBadge
              rank={player.rank.rank}
              division={player.rank.division}
              lp={player.rank.lp}
              size="sm"
            />
            <span className="text-gray-400 text-xs">
              {eventIndex + 1}/{currentMatch?.events.length}
            </span>
          </div>

          <div className="card mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⚡</span>
              <h2 className="text-lg font-bold text-white">{currentEvent.title}</h2>
            </div>
            <div className="text-gray-400 text-[10px] mb-2">
              Dakika {currentEvent.minute} | {currentEvent.choices.length} secenek
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{currentEvent.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1">
            {currentEvent.choices.map((choice, idx) => {
              const style = CHOICE_STYLES[idx] || CHOICE_STYLES[0];
              return (
                <button
                  key={choice.id}
                  onClick={() => handleEventChoice(choice.id, choice)}
                  className={`p-4 rounded-xl border-2 ${style.border} bg-gray-800/50 ${style.bg} text-left transition-all duration-200 active:scale-95 flex flex-col`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{style.icon}</span>
                    <span className="text-[10px] text-gray-500 font-medium">{style.label}</span>
                  </div>
                  <p className="text-white text-sm font-medium leading-tight flex-1">{choice.text}</p>
                </button>
              );
            })}
          </div>
        </div>

        {activeQTE && (
          <QuickTimeEventPopup
            qte={activeQTE}
            onChoice={handleQTEChoice}
          />
        )}

        {qteResultMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-gray-900/90 border-2 border-yellow-500 rounded-2xl px-8 py-6 animate-qte-result">
              <div className="text-center text-white text-xl font-bold">
                {qteResultMessage}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentEvent && eventResult) {
    const effectEntries = Object.entries(eventResult.effect).filter(
      ([, v]) => typeof v === 'number' && v !== 0
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={returnToMenu}
              className="text-gray-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
            >
              ← Menu
            </button>
          </div>
          <div
            className={`p-6 rounded-2xl border-2 ${
              eventResult.success
                ? 'bg-green-900/30 border-green-500'
                : 'bg-red-900/30 border-red-500'
            }`}
          >
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">{eventResult.success ? '✅' : '❌'}</div>
              <h3 className="text-xl font-bold text-white">
                {eventResult.success ? 'Basarili!' : 'Basarisiz!'}
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                {eventResult.success
                  ? 'Tahminin dogru cikti, avantaj yakaladin!'
                  : 'Tahminin tutmadi, dezavantaj yarattin!'}
              </p>
            </div>

            {effectEntries.length > 0 && (
              <div className="space-y-2 mb-4">
                {effectEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center bg-gray-800/50 px-3 py-2 rounded-lg"
                  >
                    <span className="text-gray-300 text-sm">{EFFECT_LABELS[key] || key}</span>
                    <span
                      className={`font-bold ${
                        (value as number) > 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {(value as number) > 0 ? '+' : ''}
                      {Number(value).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                if (selectedChoiceId) {
                  resolveEvent(
                    selectedChoiceId,
                    eventResult.success,
                    eventResult.effect as any
                  );
                }
                const isLastEvent = currentMatch && eventIndex >= currentMatch.events.length - 1;
                if (isLastEvent) {
                  finishMatch();
                } else {
                  nextEvent();
                }
                setSelectedChoiceId(null);
                setEventResult(null);
              }}
              className="btn-primary w-full py-3"
            >
              {currentMatch && eventIndex >= currentMatch.events.length - 1 ? 'Maci Bitir' : 'Devam Et'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
