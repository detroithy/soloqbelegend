import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import trainingData from '../data/training.json';
import type { PlayerStats } from '../types/game';

type TrainingType = 'farm' | 'kda' | 'vision' | 'macro' | 'mental';

interface TrainingState {
  type: TrainingType | null;
  scenarioIndex: number;
  score: number;
  completed: boolean;
  timeLeft: number;
  active: boolean;
}

const STAT_LABELS: Record<string, string> = {
  csPerMin: 'CS/Dakika',
  kda: 'KDA',
  visionScore: 'Vision Skoru',
};

export default function TrainingScreen() {
  const { player, returnToMenu, trainingEnergy, useTrainingEnergy, applyTrainingBonus } =
    useGameStore();
  const [training, setTraining] = useState<TrainingState>({
    type: null,
    scenarioIndex: 0,
    score: 0,
    completed: false,
    timeLeft: 0,
    active: false,
  });
  const [showResult, setShowResult] = useState(false);
  const [lastScenarioResult, setLastScenarioResult] = useState<{
    success: boolean;
    points: number;
    message: string;
  } | null>(null);
  const [appliedBonus, setAppliedBonus] = useState(0);

  const currentTraining = training.type
    ? trainingData.find((t) => t.id === training.type)
    : null;

  const currentScenario = currentTraining
    ? currentTraining.scenarios[training.scenarioIndex]
    : null;

  useEffect(() => {
    if (training.active && training.timeLeft > 0) {
      const timer = setInterval(() => {
        setTraining((prev) => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
      return () => clearInterval(timer);
    }
    if (training.active && training.timeLeft === 0 && training.type) {
      finishTraining();
    }
  }, [training.active, training.timeLeft]);

  const startTraining = (type: TrainingType) => {
    if (trainingEnergy <= 0) return;

    const t = trainingData.find((td) => td.id === type);
    if (!t) return;

    const used = useTrainingEnergy();
    if (!used) return;

    setTraining({
      type,
      scenarioIndex: 0,
      score: 0,
      completed: false,
      timeLeft: t.duration,
      active: true,
    });
    setShowResult(false);
    setLastScenarioResult(null);
    setAppliedBonus(0);
  };

  const handleChoice = (optionIndex: number) => {
    if (!currentScenario || !currentTraining) return;

    const option = currentScenario.options[optionIndex];
    const success = Math.random() < option.successChance;
    const points = success ? Math.floor(option.effect * 100) : 0;

    setLastScenarioResult({
      success,
      points,
      message: success
        ? `Basarili! +${points} puan`
        : 'Basarisiz! Daha iyi olmaliydin.',
    });
    setShowResult(true);

    setTraining((prev) => ({
      ...prev,
      score: prev.score + points,
    }));
  };

  const nextScenario = () => {
    if (!currentTraining) return;

    const nextIndex = training.scenarioIndex + 1;
    if (nextIndex >= currentTraining.scenarios.length) {
      finishTraining();
    } else {
      setTraining((prev) => ({
        ...prev,
        scenarioIndex: nextIndex,
      }));
      setShowResult(false);
      setLastScenarioResult(null);
    }
  };

  const finishTraining = useCallback(() => {
    if (!currentTraining || !player) return;

    const statBonus = Math.floor(training.score / 20);
    const stat = currentTraining.statFocus as keyof PlayerStats;

    if (statBonus > 0) {
      applyTrainingBonus(stat, statBonus);
      setAppliedBonus(statBonus);
    }

    setTraining((prev) => ({ ...prev, completed: true, active: false }));
  }, [currentTraining, training.score, player, applyTrainingBonus]);

  if (!player) return null;

  if (training.active && currentScenario && currentTraining) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex flex-col items-center p-4 animate-fade-in">
        <div className="w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">
              {currentTraining.icon} {currentTraining.name}
            </h2>
            <span className="text-gray-400 text-sm">
              {Math.floor(training.timeLeft / 60)}:
              {(training.timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-2 mb-4">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Puan: {training.score}</span>
              <span>
                Senaryo {training.scenarioIndex + 1}/{currentTraining.scenarios.length}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{
                  width: `${
                    ((training.scenarioIndex + 1) / currentTraining.scenarios.length) * 100
                  }%`,
                }}
              />
            </div>
          </div>

          {!showResult ? (
            <div className="card">
              <h3 className="text-xl font-bold text-white mb-2">{currentScenario.title}</h3>
              <p className="text-gray-300 text-sm mb-6">{currentScenario.description}</p>

              <div className="space-y-3">
                {currentScenario.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChoice(idx)}
                    className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-purple-500 text-white rounded-xl text-left transition-all duration-200 active:scale-[0.98]"
                  >
                    <span className="font-medium">{option.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div
              className={`p-6 rounded-2xl border-2 ${
                lastScenarioResult?.success
                  ? 'bg-green-900/30 border-green-500'
                  : 'bg-red-900/30 border-red-500'
              }`}
            >
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">
                  {lastScenarioResult?.success ? '✅' : '❌'}
                </div>
                <h3 className="text-xl font-bold text-white">
                  {lastScenarioResult?.success ? 'Basarili!' : 'Basarisiz!'}
                </h3>
                {lastScenarioResult?.points ? (
                  <p className="text-green-400 font-bold">+{lastScenarioResult.points} puan</p>
                ) : null}
              </div>

              <p className="text-gray-300 text-sm text-center mb-4">
                {lastScenarioResult?.message}
              </p>

              <button
                onClick={nextScenario}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                {training.scenarioIndex + 1 >= currentTraining.scenarios.length
                  ? 'Antrenmani Bitir'
                  : 'Sonraki Senaryo'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (training.completed && currentTraining) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex flex-col items-center justify-center p-4 animate-fade-in">
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-4 animate-scale-in">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2 animate-slide-up">Antrenman Tamamlandi!</h2>
          <p className="text-gray-400 mb-6">{currentTraining.name}</p>

          <div className="card mb-6 animate-scale-in">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-purple-400">{training.score}</p>
                <p className="text-gray-500 text-xs">Toplam Puan</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-400 animate-glow">+{appliedBonus}</p>
                <p className="text-gray-500 text-xs">
                  {STAT_LABELS[currentTraining.statFocus]}
                </p>
              </div>
            </div>
          </div>

          {appliedBonus > 0 && (
            <div className="bg-green-900/30 border border-green-500 rounded-xl p-4 mb-6 animate-slide-up">
              <p className="text-green-300 text-sm font-bold">
                {STAT_LABELS[currentTraining.statFocus]} +{appliedBonus} kazanildi!
              </p>
              <p className="text-green-400/60 text-xs mt-1">
                {currentTraining.name} sayesinde daha guclu oldun!
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={returnToMenu}
              className="btn-secondary flex-1 py-3"
            >
              Geri Don
            </button>
            <button
              onClick={() => {
                setTraining({
                  type: null,
                  scenarioIndex: 0,
                  score: 0,
                  completed: false,
                  timeLeft: 0,
                  active: false,
                });
                setShowResult(false);
                setLastScenarioResult(null);
                setAppliedBonus(0);
              }}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            >
              Baska Antrenman
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex flex-col items-center p-4 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Antrenman Merkezi</h1>
          <p className="text-gray-400 text-sm">Beceri gelistir, rakiplerinin onune gec</p>
        </div>

        <div className="card-glass mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Kalan Hakkin:</span>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    i < trainingEnergy
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-500'
                  }`}
                >
                  ⚡
                </div>
              ))}
            </div>
          </div>
          <p className="text-gray-500 text-[10px] mt-2 text-center">
            Her gun 3 antrenman hakki. Yarin tekrar dene!
          </p>
        </div>

        <div className="space-y-3">
          {trainingData.map((t) => (
            <button
              key={t.id}
              onClick={() => startTraining(t.id as TrainingType)}
              disabled={trainingEnergy <= 0}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                trainingEnergy > 0
                  ? 'bg-gray-800/50 border-gray-700 hover:border-purple-500 hover:bg-gray-800'
                  : 'bg-gray-800/30 border-gray-800 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{t.icon}</span>
                <div className="flex-1">
                  <p className="text-white font-bold">{t.name}</p>
                  <p className="text-gray-400 text-xs">{t.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-purple-400 text-xs font-medium">
                    +{t.scenarios.length * 10} potansiyel
                  </p>
                  <p className="text-gray-500 text-[10px]">{t.duration}s</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={returnToMenu}
          className="btn-secondary w-full mt-6 py-3"
        >
          Geri Don
        </button>
      </div>
    </div>
  );
}
