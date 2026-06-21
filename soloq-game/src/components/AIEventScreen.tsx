import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import type { PlayerStats, QuickTimeEvent, ChampionCombo } from '../types/game';
import {
  generateMatchEvent,
  processAIResponse,
  getMatchPhase,
  type AIGeneratedEvent,
  type AIDecision,
} from '../ai/localAI';
import { shouldTriggerQTE, generateQTE, calculateQTESuccess, getQTEReward } from '../utils/qteGenerator';
import RankBadge from './RankBadge';
import QuickTimeEventPopup from './QuickTimeEventPopup';

const STYLE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  aggressive: { label: 'Agresif', color: 'text-red-400', icon: '⚔️' },
  defensive: { label: 'Savunmaci', color: 'text-blue-400', icon: '🛡️' },
  strategic: { label: 'Stratejik', color: 'text-purple-400', icon: '🧠' },
  tilted: { label: 'Tilt', color: 'text-orange-400', icon: '😤' },
  calm: { label: 'Sakin', color: 'text-green-400', icon: '🧘' },
  roaming: { label: 'Roaming', color: 'text-cyan-400', icon: '🏃' },
  farming: { label: 'Farm', color: 'text-yellow-400', icon: '💰' },
};

export default function AIEventScreen() {
  const { player, currentMatch, finishMatch, finishAIMatch, returnToMenu } = useGameStore();
  const [gameMinute, setGameMinute] = useState(3);
  const [currentEvent, setCurrentEvent] = useState<AIGeneratedEvent | null>(null);
  const [playerInput, setPlayerInput] = useState('');
  const [aiDecision, setAiDecision] = useState<AIDecision | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [eventLog, setEventLog] = useState<
    Array<{ event: AIGeneratedEvent; decision: AIDecision; success: boolean }>
  >([]);
  const [matchComplete, setMatchComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSuccess, setCurrentSuccess] = useState<boolean | null>(null);
  const [matchStats, setMatchStats] = useState({
    isWin: false,
    statsGained: { kda: 0, csPerMin: 0, visionScore: 0 } as Partial<PlayerStats>,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [activeQTE, setActiveQTE] = useState<QuickTimeEvent | null>(null);
  const [pendingDecision, setPendingDecision] = useState<{
    event: AIGeneratedEvent;
    decision: AIDecision;
    success: boolean;
  } | null>(null);
  const [qteResultMessage, setQteResultMessage] = useState<string | null>(null);

  useEffect(() => {
    if (player && !currentEvent && !matchComplete) {
      generateNewEvent();
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [playerInput]);

  const generateNewEvent = () => {
    if (!player) return;

    const minuteJump = Math.floor(Math.random() * 5) + 3;
    const newMinute = Math.min(gameMinute + minuteJump, 40);
    setGameMinute(newMinute);

    const phase = getMatchPhase(newMinute);
    const event = generateMatchEvent(player, newMinute, phase);
    setCurrentEvent(event);
    setPlayerInput('');
    setAiDecision(null);
    setCurrentSuccess(null);
    setShowResult(false);
  };

  const handleSubmitResponse = () => {
    if (!playerInput.trim() || !currentEvent || isProcessing) return;

    setIsProcessing(true);

    setTimeout(() => {
      if (!currentEvent) {
        setIsProcessing(false);
        return;
      }
      const decision = processAIResponse(playerInput, currentEvent);
      const success = Math.random() < decision.successChance;

      if (shouldTriggerQTE()) {
        const championName = useGameStore.getState().championSelect?.playerPickedChampion?.name || 'Unknown';
        const qte = generateQTE(championName, player!.role);
        setPendingDecision({ event: currentEvent, decision, success });
        setActiveQTE(qte);
        setIsProcessing(false);
      } else {
        setAiDecision(decision);
        setCurrentSuccess(success);
        setShowResult(true);
        setIsProcessing(false);
      }
    }, 800 + Math.random() * 700);
  };

  const handleQTEChoice = (combo: ChampionCombo, qteSuccess: boolean) => {
    if (!pendingDecision) return;

    const qteReward = getQTEReward(combo, qteSuccess);
    const modifiedDecision = { ...pendingDecision.decision };

    if (qteReward.kda) modifiedDecision.statChanges.kda += qteReward.kda;
    if (qteReward.csPerMin) modifiedDecision.statChanges.csPerMin += qteReward.csPerMin;
    if (qteReward.visionScore) modifiedDecision.statChanges.visionScore += qteReward.visionScore;

    const qteMsg = combo.sequence === 'SAFE'
      ? '🛡️ Güvende kaldın'
      : qteSuccess
        ? `⚡ ${combo.name} kombosu tuttu!`
        : `❌ ${combo.name} kombosu başarısız!`;

    setQteResultMessage(qteMsg);
    setActiveQTE(null);

    setTimeout(() => {
      setAiDecision(modifiedDecision);
      setCurrentSuccess(pendingDecision.success);
      setShowResult(true);
      setPendingDecision(null);
      setQteResultMessage(null);
    }, 1500);
  };

  const handleContinue = () => {
    if (!currentEvent || !aiDecision || currentSuccess === null) return;

    const success = currentSuccess;

    const newLog = [
      ...eventLog,
      { event: currentEvent, decision: aiDecision, success },
    ];
    setEventLog(newLog);

    if (gameMinute >= 40 || newLog.length >= 8) {
      const wins = newLog.filter((e) => e.success).length;
      const totalKda = newLog.reduce((sum, e) => sum + e.decision.statChanges.kda, 0);
      const totalCs = newLog.reduce((sum, e) => sum + e.decision.statChanges.csPerMin, 0);
      const totalVision = newLog.reduce((sum, e) => sum + e.decision.statChanges.visionScore, 0);

      setMatchStats({
        isWin: wins > newLog.length / 2,
        statsGained: {
          kda: parseFloat(totalKda.toFixed(2)),
          csPerMin: parseFloat(totalCs.toFixed(2)),
          visionScore: parseFloat(totalVision.toFixed(1)),
        },
      });
      setMatchComplete(true);
    } else {
      generateNewEvent();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitResponse();
    }
  };

  if (!player) return null;

  if (matchComplete) {
    const wins = eventLog.filter((e) => e.success).length;
    const total = eventLog.length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex flex-col items-center p-4 animate-fade-in">
        <div className="w-full max-w-md pt-8">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">{winRate >= 60 ? '🏆' : winRate >= 40 ? '⚔️' : '💀'}</div>
            <h1 className="text-2xl font-bold text-white mb-1">Mac Sonucu</h1>
            <p className="text-gray-400">
              {winRate >= 60
                ? 'Harika bir performans gosterdin!'
                : winRate >= 40
                ? 'Iyi bir savasti!'
                : 'Bir dahaki sefere daha iyi olacak!'}
            </p>
          </div>

          <div className="card-glass mb-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-2xl font-bold text-white">{total}</p>
                <p className="text-gray-500 text-xs">Toplam Olay</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-2xl font-bold text-green-400">{wins}</p>
                <p className="text-gray-500 text-xs">Basarili</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className={`text-2xl font-bold ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>{winRate.toFixed(0)}%</p>
                <p className="text-gray-500 text-xs">Basari Orani</p>
              </div>
            </div>
          </div>

          <div className="card-glass mb-6 max-h-60 overflow-y-auto">
            <h3 className="text-white font-bold mb-3 text-sm">Olay Gecmisi</h3>
            <div className="space-y-2">
              {eventLog.map((entry, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg text-xs ${
                    entry.success ? 'bg-green-900/30' : 'bg-red-900/30'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white font-medium">{entry.event.title}</span>
                    <span className={entry.success ? 'text-green-400' : 'text-red-400'}>
                      {entry.success ? '✓' : '✗'}
                    </span>
                  </div>
                  <p className="text-gray-400">{entry.decision.aiResponse}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={returnToMenu}
              className="btn-secondary flex-1 py-3"
            >
              Ana Menu
            </button>
            <button
              onClick={() => finishAIMatch(matchStats.isWin, matchStats.statsGained)}
              className="btn-primary flex-1 py-3"
            >
              Sonraki Mac
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex flex-col p-4 animate-fade-in">
      <div className="w-full max-w-md mx-auto flex flex-col h-full">
        <div className="flex justify-between items-center mb-4 pt-2">
          <button
            onClick={returnToMenu}
            className="text-gray-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
          >
            ← Menu
          </button>
          <div className="text-center">
            <p className="text-gray-400 text-xs">Dakika {gameMinute}</p>
            <p className="text-white font-bold text-sm">{player.name}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs">Olay {eventLog.length + 1}</p>
            <p className="text-purple-400 text-xs font-medium capitalize">{player.role}</p>
          </div>
        </div>

        {currentEvent && !showResult && (
          <div className="flex-1 flex flex-col">
            <div className="card mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⚡</span>
                <h2 className="text-lg font-bold text-white">{currentEvent.title}</h2>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                {currentEvent.description}
              </p>

              <div className="bg-gray-900/50 rounded-xl p-3 border border-gray-600">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">AI Prompt</p>
                <p className="text-gray-400 text-xs italic leading-relaxed">
                  "{currentEvent.prompt.slice(0, 200)}..."
                </p>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <label className="text-gray-400 text-xs mb-2 block">
                Ne yapmayi tercih edersin? (Serbest cevap yaz)
              </label>
              <textarea
                ref={textareaRef}
                value={playerInput}
                onChange={(e) => setPlayerInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ornegin: Geri cekilip tower altinda beklerim, dalga gelene kadar farm yaparim..."
                className="flex-1 min-h-[120px] p-4 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none text-sm leading-relaxed transition-all"
                disabled={isProcessing}
              />

              <div className="mt-3 flex gap-2">
                {currentEvent.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => {
                      setPlayerInput(choice.text);
                    }}
                    className="flex-1 py-2 px-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 text-gray-300 rounded-lg text-[10px] transition-all duration-200"
                  >
                    {choice.text.length > 30 ? choice.text.slice(0, 30) + '...' : choice.text}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSubmitResponse}
                disabled={!playerInput.trim() || isProcessing}
                className={`mt-3 w-full py-3 font-bold rounded-xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                  playerInput.trim() && !isProcessing
                    ? 'btn-primary'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span> AI Degerlendiriyor...
                  </span>
                ) : (
                  'Cevabi Gonder'
                )}
              </button>
            </div>
          </div>
        )}

        {showResult && aiDecision && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div
              className={`p-5 rounded-2xl border-2 mb-4 ${
                currentSuccess
                  ? 'bg-green-900/30 border-green-500'
                  : 'bg-red-900/30 border-red-500'
              }`}
            >
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">
                  {STYLE_LABELS[aiDecision.analysis.detectedStyle]?.icon || '🎮'}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">AI Degerlendirmesi</h3>
                <span
                  className={`text-sm font-medium ${
                    STYLE_LABELS[aiDecision.analysis.detectedStyle]?.color || 'text-gray-400'
                  }`}
                >
                  {STYLE_LABELS[aiDecision.analysis.detectedStyle]?.label || 'Bilinmiyor'} Oyun Stili
                </span>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-3 mb-3">
                <p className="text-gray-300 text-sm leading-relaxed">{aiDecision.aiResponse}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-gray-500">Guven</p>
                  <p className="text-white font-bold text-sm">
                    %{Math.round(aiDecision.analysis.confidence * 100)}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-gray-500">Etki</p>
                  <p className="text-white font-bold text-sm">
                    x{aiDecision.analysis.effectMultiplier.toFixed(1)}
                  </p>
                </div>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-3">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">
                  Tahmini Degisimler
                </p>
                <div className="space-y-1">
                  {Object.entries(aiDecision.statChanges).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-gray-400 text-xs capitalize">{key}</span>
                      <span
                        className={`font-bold text-xs ${
                          value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-gray-500'
                        }`}
                      >
                        {value > 0 ? '+' : ''}{value.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-800/30 rounded-xl p-3 mb-4">
              <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Senin Cevabin</p>
              <p className="text-gray-300 text-sm italic">"{aiDecision.rawInput}"</p>
            </div>

            <button
              onClick={handleContinue}
              className="btn-primary w-full py-3"
            >
              Devam Et
            </button>
          </div>
        )}

        {eventLog.length > 0 && (
          <div className="mt-4 mb-2">
            <div className="flex gap-1 justify-center">
              {eventLog.map((entry, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    entry.success
                      ? 'bg-green-900/50 border border-green-600 text-green-400'
                      : 'bg-red-900/50 border border-red-600 text-red-400'
                  }`}
                >
                  {entry.success ? 'W' : 'L'}
                </div>
              ))}
            </div>
          </div>
        )}
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
