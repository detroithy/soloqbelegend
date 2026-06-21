import type { Role, ChampionCombo, QuickTimeEvent } from '../types/game';
import comboData from '../data/combos.json';

type ComboData = Record<Role, ChampionCombo[]>;

const QTE_TRIGGER_CHANCE = 0.25;
const QTE_TIME_LIMIT = 3.65;

const QTE_SCENARIOS: { title: string; description: string }[] = [
  {
    title: '⚔️ Trade Combo!',
    description: 'Rakibinle trade\'e girdin! Hangi komboyu kullanacaksın?',
  },
  {
    title: '🔥 All-In Fırsatı!',
    description: 'Rakibin hata yaptı! Tam zamanı, ne yapacaksın?',
  },
  {
    title: '🛡️ Savunma Zamanı!',
    description: 'Rakip saldırıyor! Nasıl karşılık vereceksin?',
  },
  {
    title: '⚡ Skirmish!',
    description: 'Orman yakınında karşılaşma! Hızlı karar ver!',
  },
  {
    title: '🎯 Kritik An!',
    description: 'Rakibinin cooldown\'u bitmiş! Fırsatı değerlendir!',
  },
  {
    title: '💀 Hayat veya Ölüm!',
    description: 'Düşük HP\'de yakalandın! Nasıl çıkacaksın?',
  },
  {
    title: '🏆 Turnavta Fırsatı!',
    description: 'Rakip hata yaptı! Bu avantajı kullan!',
  },
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function shouldTriggerQTE(): boolean {
  return Math.random() < QTE_TRIGGER_CHANCE;
}

export function generateQTE(championName: string, role: Role): QuickTimeEvent {
  const combos = (comboData as ComboData)[role] || comboData.mid;

  const safeCombo = combos.find(c => c.sequence === 'SAFE');
  const combatCombos = combos.filter(c => c.sequence !== 'SAFE');

  const shuffled = shuffleArray(combatCombos);
  const selectedCombos = shuffled.slice(0, 3);

  const allChoices = [...selectedCombos];
  if (safeCombo) {
    allChoices.push(safeCombo);
  }

  const shuffledChoices = shuffleArray(allChoices);

  const scenario = QTE_SCENARIOS[Math.floor(Math.random() * QTE_SCENARIOS.length)];

  return {
    id: `qte_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    championName,
    title: scenario.title,
    description: scenario.description,
    timeLimit: QTE_TIME_LIMIT,
    choices: shuffledChoices.map((combo) => ({
      id: combo.id,
      text: combo.sequence === 'SAFE' ? '🛡️ Güvende Kal' : `${combo.sequence} (${combo.risk === 'high' ? 'YZ' : combo.risk === 'medium' ? 'O' : 'K'})`,
      combo,
    })),
  };
}

export function calculateQTESuccess(
  combo: ChampionCombo,
  playerForm: number,
  playerFatigue: number,
  championDifficulty: number
): boolean {
  let baseChance = combo.difficulty > 0 ? (100 - combo.difficulty) / 100 : 1.0;

  const formBonus = (playerForm - 50) / 500;
  baseChance += formBonus;

  const fatiguePenalty = playerFatigue > 50 ? (playerFatigue - 50) / 200 : 0;
  baseChance -= fatiguePenalty;

  const difficultyPenalty = championDifficulty / 500;
  baseChance -= difficultyPenalty;

  baseChance = Math.max(0.1, Math.min(0.95, baseChance));

  return Math.random() < baseChance;
}

export function getQTEReward(combo: ChampionCombo, success: boolean): Partial<{ kda: number; csPerMin: number; visionScore: number }> {
  if (!success) {
    return {
      kda: combo.risk === 'high' ? -0.5 : combo.risk === 'medium' ? -0.3 : -0.1,
      csPerMin: -0.1,
    };
  }

  const damageMultiplier = combo.damage / 100;
  return {
    kda: damageMultiplier * (combo.risk === 'high' ? 1.0 : combo.risk === 'medium' ? 0.7 : 0.4),
    csPerMin: 0.1,
    visionScore: 0.5,
  };
}
