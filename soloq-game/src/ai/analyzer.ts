export type PlayStyle = 'aggressive' | 'defensive' | 'strategic' | 'tilted' | 'calm' | 'roaming' | 'farming';

export interface AnalysisResult {
  detectedStyle: PlayStyle;
  confidence: number;
  effectMultiplier: number;
  statBonuses: {
    kda: number;
    csPerMin: number;
    visionScore: number;
  };
  narrative: string;
}

const KEYWORDS: Record<PlayStyle, string[]> = {
  aggressive: [
    'saldir', 'oldur', 'kacma', 'duc', 'saldır', 'kill', 'int', 'all in',
    'tower dive', 'kule alti', 'atak', 'oneshot', 'comb', 'burst',
    'ileri', 'ilerle', 'carpi', 'vur', 'mahvet', 'yok et', 'sava',
  ],
  defensive: [
    'kac', 'geri', 'cekil', 'tower', 'guvenli', 'farm', 'bekle',
    'savin', 'korum', 'heal', 'pot', 'recall', 'base', 'geri cek',
    'risk', 'tehlike', 'kacis', 'sigin', 'saklan',
  ],
  strategic: [
    'ward', 'vision', 'map', 'roam', 'dragon', 'baron', 'objectif',
    'rotation', 'split', 'push', 'wave', 'tempo', 'macro',
    'strateji', 'plan', 'hesapla', 'tahmin et', 'onte', 'yorum',
  ],
  tilted: [
    'troll', 'int', 'ff', 'surrender', 'kaybettik', 'bitti',
    'aptal', 'mal', 'takim', 'yardim', 'mid', 'jg', 'sup',
    'neden', 'nasil', 'anlamiyorum', 'sinir', 'kiz',
  ],
  calm: [
    'sakin', 'devam', 'odaklan', 'dikkat', 'temiz', 'duzgun',
    'normal', 'standart', 'plana gore', 'kontrollu', 'denge',
  ],
  roaming: [
    'roam', 'git', 'gez', 'dolas', 'gank', 'top', 'bot', 'mid',
    'nekadar', 'hizli', 'koş', 'yetis', 'yardim',
  ],
  farming: [
    'farm', 'cs', 'minion', 'wave', 'push', 'freeze', 'slow push',
    'gold', 'para', 'item', 'al', 'topla', 'biriktir',
  ],
};

const STYLE_EFFECTS: Record<PlayStyle, { effectMultiplier: number; statBonuses: { kda: number; csPerMin: number; visionScore: number } }> = {
  aggressive: {
    effectMultiplier: 1.3,
    statBonuses: { kda: 0.4, csPerMin: -0.2, visionScore: -1 },
  },
  defensive: {
    effectMultiplier: 0.8,
    statBonuses: { kda: -0.1, csPerMin: 0.3, visionScore: 1 },
  },
  strategic: {
    effectMultiplier: 1.1,
    statBonuses: { kda: 0.2, csPerMin: 0.2, visionScore: 2 },
  },
  tilted: {
    effectMultiplier: 0.5,
    statBonuses: { kda: -0.5, csPerMin: -0.3, visionScore: -2 },
  },
  calm: {
    effectMultiplier: 1.0,
    statBonuses: { kda: 0.1, csPerMin: 0.2, visionScore: 0.5 },
  },
  roaming: {
    effectMultiplier: 1.15,
    statBonuses: { kda: 0.3, csPerMin: -0.1, visionScore: 1.5 },
  },
  farming: {
    effectMultiplier: 0.95,
    statBonuses: { kda: 0, csPerMin: 0.5, visionScore: 0.5 },
  },
};

const STYLE_NARRATIVES: Record<PlayStyle, string> = {
  aggressive: 'Agresif bir yaklasim Sectin! Riskli ama yuksek odullu bir hamle.',
  defensive: 'Guvenli bir yaklasim tercih ettin. Riski azalttin ama firsatlari kacirabilirsin.',
  strategic: 'Stratejik dusundun! Uzun vadeli avantajlar icin hamle yaptin.',
  tilted: 'Tilt olmus gorunuyorsun! Sakin ol ve oyuna odaklan.',
  calm: 'Sakin ve kontrollu bir yaklasim gosterdin.',
  roaming: 'Harita genisinde aktif olmayi tercih ettin.',
  farming: 'Farm odakli bir yaklasim Sectin. Gold avantaji yaratiyorsun.',
};

export function analyzeResponse(text: string): AnalysisResult {
  const normalizedText = text.toLowerCase();
  const scores: Record<PlayStyle, number> = {
    aggressive: 0,
    defensive: 0,
    strategic: 0,
    tilted: 0,
    calm: 0,
    roaming: 0,
    farming: 0,
  };

  for (const [style, keywords] of Object.entries(KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        scores[style as PlayStyle] += 1;
      }
    }
  }

  let maxStyle: PlayStyle = 'calm';
  let maxScore = 0;
  for (const [style, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxStyle = style as PlayStyle;
    }
  }

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? Math.min(0.95, maxScore / totalScore + 0.3) : 0.5;

  const effects = STYLE_EFFECTS[maxStyle];

  return {
    detectedStyle: maxStyle,
    confidence,
    effectMultiplier: effects.effectMultiplier,
    statBonuses: { ...effects.statBonuses },
    narrative: STYLE_NARRATIVES[maxStyle],
  };
}

export function generateAIResponse(analysis: AnalysisResult, eventContext: string): string {
  const styleResponses: Record<PlayStyle, (ctx: string) => string> = {
    aggressive: (ctx) =>
      `Agresif yaklasimini goz onunde bulundurarak, bu durumda riskli ama potansiyel olarak yuksek kazancli bir hamle yaptin. Oyunu domine etmeye calisiyorsun.`,
    defensive: (ctx) =>
      `Guvenli yaklasiminla riski minimize ettin. Bu durumda hayatta kalman onemliydi ve basardin.`,
    strategic: (ctx) =>
      `Stratejik dusuncen sayesinde uzun vadeli avantajlar yarattin. Harita kontrolu ve vision oneminin farkinasin.`,
    tilted: (ctx) =>
      `Tilt olmus gorunuyorsun. Sakin ol, nefes al ve oyuna odaklan. Bir sonraki mac icin kendini hazirla.`,
    calm: (ctx) =>
      `Sakin ve kontrollu yaklasiminla durumu idare ettin. Istikrar basarinin anahtari.`,
    roaming: (ctx) =>
      `Harita genisinde aktif rolun sayesinde takimina avantaj yarattin. Gank ve roam zamanlamasi cok onemli.`,
    farming: (ctx) =>
      `Farm odakli yaklasimin sayesinde gold avantaji yaratiyorsun. Late game icin guclu bir temel atiyorsun.`,
  };

  const responseFn = styleResponses[analysis.detectedStyle];
  return responseFn(eventContext);
}
