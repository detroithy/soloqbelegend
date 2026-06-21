import type { Player, Role, MatchEvent, EventChoice } from '../types/game';
import { generateEventPrompt, type PromptContext } from './promptTemplates';
import { analyzeResponse, generateAIResponse, type AnalysisResult } from './analyzer';

export interface AIGeneratedEvent {
  id: string;
  minute: number;
  title: string;
  description: string;
  prompt: string;
  choices: EventChoice[];
}

export interface AIDecision {
  rawInput: string;
  analysis: AnalysisResult;
  aiResponse: string;
  successChance: number;
  statChanges: {
    kda: number;
    csPerMin: number;
    visionScore: number;
  };
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const MATCH_SCENARIOS = {
  laning: [
    {
      title: 'Lane Gank Tehlikesi',
      baseDesc: 'Koridorunda ileri pozisyonda bulunuyorsun ve vision kaybettin. Junglerin nerede oldugu belli degil.',
      context: 'Laning fazinda gank riski yuksek',
    },
    {
      title: 'Tower Dive Karari',
      baseDesc: 'Rakibin cani dusuk ama tower altinda bekliyor. Takim arkadasin da yardima geliyor.',
      context: 'Tower dive firsati var',
    },
    {
      title: 'Wave Management',
      baseDesc: 'Dalga su an senin lehine donuyor. Rakibin cani dusuk ama senin de manan azaldi.',
      context: 'Dalga yonetimi onemli',
    },
    {
      title: '1v1 Duellosu',
      baseDesc: 'Rakibinle karsilastin. Her ikiniz de tam can ve manada. Mekaniklerin on plana cikacak.',
      context: '1v1 karsilasmasi',
    },
    {
      title: 'TP Karari',
      baseDesc: 'Diger koridorda kavga basladi. TP\'nin hazir ama kendi koridorundan ayrilmak riskli.',
      context: 'TP ile join karari',
    },
  ],
  mid: [
    {
      title: 'Dragon Spawndu',
      baseDesc: 'Ejderha spawn oldu. Her iki takim da etrafinda toplaniyor. Savaş baslamak uzere.',
      context: 'Dragon oncesi pozisyon',
    },
    {
      title: 'Baron Karari',
      baseDesc: 'Rakip takimdan 2 kisi oyun disinda. Baron firsati var ama riskli.',
      context: 'Baron call karari',
    },
    {
      title: 'Tower Push',
      baseDesc: 'Orta koridordaki tower\'a yaklastin. Rakip takim savunma pozisyonunda.',
      context: 'Tower ittirme firsati',
    },
    {
      title: 'Flank Firsati',
      baseDesc: 'Takim savasi baslamak uzere. Yan taraftan dolanarak rakip carry\'ye ulasma firsatin var.',
      context: 'Flank pozisyonu',
    },
    {
      title: 'Vision Savaşı',
      baseDesc: 'Baron etrafinda vision savasi basladi. Ward atmak mi yoksa dusman ward\'larini temizlemek mi?',
      context: 'Vision kontrolu',
    },
  ],
  late: [
    {
      title: 'Son Mac',
      baseDesc: 'Oyun 40. dakikaya girdi. Her iki takim da full item. Bir hata oyunu bitirebilir.',
      context: 'Late game - tek hata kaybettirir',
    },
    {
      title: 'Baron Dance',
      baseDesc: 'Baron etrafinda dans ediyorsunuz. Rakip takim da yakinda. Initiation zamani.',
      context: 'Baron oncesi pozisyon',
    },
    {
      title: 'Split Push Karari',
      baseDesc: 'Takimin 4 kisi savasirken sen split push yapiyorsun. Rakip senden 2 kisi gonderdi.',
      context: 'Split push stratejisi',
    },
    {
      title: 'Elder Dragon',
      baseDesc: 'Elder Dragon spawn oldu. Bu objektif oyunu bitirebilir.',
      context: 'Elder Dragon onemli',
    },
    {
      title: 'Base Race',
      baseDesc: 'Her iki takimin da base\'i acik. Kim once rakibin base\'ini yok ederse kazanir.',
      context: 'Base race - son sans',
    },
  ],
};

const AI_RESPONSE_TEMPLATES = {
  aggressive: [
    'Agresif yaklasimini goz onunde bulundurarak, bu durumda riskli ama yuksek potansiyelli bir hamle yaptin.',
    'Saldirmayi sectin! Bu karar cesaret gerektiriyor ama dikkatli olmalisin.',
    'Agresif oyun stilin sayesinde rakibi baski altina aliyorsun.',
  ],
  defensive: [
    'Guvenli yaklasiminla riski azalttin. Hayatta kalman onemliydi.',
    'Savunmaci tercihin sayesinde firsat kaybettin ama hayatta kaldin.',
    'Risk almamayi tercih ettin. Bu bazen en dogru karardir.',
  ],
  strategic: [
    'Stratejik dusuncen sayesinde avantajli duruma gectin.',
    'Makro oyun bilgin sayesinde dogru karari verdin.',
    'Harita kontrolu ve vision bilincin isini kolaylastirdi.',
  ],
  tilted: [
    'Tilt olmus gorunuyorsun. Sakin ol, her sey duzelsecek.',
    'Kizginlikla hareket etme. Bir sonraki mac daha iyi olacak.',
    'Oyun disi etkenler oyuna yansidi. Odagini korumalisin.',
  ],
  calm: [
    'Sakin yaklasimin her zaman ise yariyor.',
    'Kontrollu oyun stilin seni ileriye tasiyacak.',
    'Panik yapmadan durumu idare ettin.',
  ],
  roaming: [
    'Harita genisindeki hareketlilgin takimina avantaj sagladi.',
    'Roaming zamanlaman cok iyi.',
    'Gank firsatlarini degerlendirme becerin yuksek.',
  ],
  farming: [
    'Farm odakli yaklasimin gold avantaji yaratti.',
    'CS\'nin ustunde calismaya devam et.',
    'Ekonomik avantaj oyunu kazandirir.',
  ],
};

export function generateMatchEvent(
  player: Player,
  gameMinute: number,
  matchState: 'laning' | 'mid' | 'late'
): AIGeneratedEvent {
  const scenarios = MATCH_SCENARIOS[matchState];
  const scenario = pickRandom(scenarios);

  const context: PromptContext = {
    player,
    gameMinute,
    matchState,
    teammates: ['Top', 'Jungle', 'Mid', 'ADC', 'Support'].filter((r) => r !== player.role),
    enemies: ['Top', 'Jungle', 'Mid', 'ADC', 'Support'],
    recentEvents: [],
  };

  const prompt = generateEventPrompt(context);

  const choices: EventChoice[] = [
    {
      id: 'choice_aggressive',
      text: getAggressiveChoice(matchState, player.role),
      outcome: {
        successChance: 0.45,
        successEffect: { kda: 0.8, visionScore: -1 },
        failEffect: { kda: -1.2, visionScore: -2 },
      },
    },
    {
      id: 'choice_defensive',
      text: getDefensiveChoice(matchState, player.role),
      outcome: {
        successChance: 0.75,
        successEffect: { csPerMin: 0.4, visionScore: 1 },
        failEffect: { csPerMin: -0.2 },
      },
    },
    {
      id: 'choice_strategic',
      text: getStrategicChoice(matchState, player.role),
      outcome: {
        successChance: 0.6,
        successEffect: { visionScore: 2, kda: 0.3 },
        failEffect: { visionScore: -1, kda: -0.3 },
      },
    },
  ];

  return {
    id: `ai_event_${Date.now()}`,
    minute: gameMinute,
    title: scenario.title,
    description: scenario.baseDesc,
    prompt,
    choices,
  };
}

function getAggressiveChoice(state: string, role: Role): string {
  const choices: Record<string, Record<Role, string>> = {
    laning: {
      carry: 'Karsilast, hasarini dokerkene kacmaya calis',
      top: 'Duc, hasarini ustune al ve takimina firsat yarat',
      jungle: 'Counter-gank yap, rakip jungler\'i yakala',
      mid: 'Rakibin ustune yur, one-shot combo dene',
      support: 'ADC\'nin yanina git, birlikte saldir',
    },
    mid: {
      carry: 'Ejderhanin ustune atla, hasarini doker',
      top: 'One cik, takimi icin alan ac',
      jungle: 'Smite ile ejderhayi kap, takima join ol',
      mid: 'Rakip carry\'yi hedef al, onu oldur',
      support: 'Vision ac, takim icin alan yarat',
    },
    late: {
      carry: 'Full hasar build ile on saflarda savas',
      top: 'Rakip carry\'ye ultini at, kontrol et',
      jungle: 'Baron\'u solo dene, rakipleri engelle',
      mid: 'AoE hasar ile rakip takimi parcal',
      support: 'Takimini buff\'la, savasi destekle',
    },
  };
  return choices[state]?.[role] || 'Agresif hareket et, riske atla!';
}

function getDefensiveChoice(state: string, role: Role): string {
  const choices: Record<string, Record<Role, string>> = {
    laning: {
      carry: 'Geri cekil, farm\'a odaklan',
      top: 'Tower altina sigin, dalgi bekle',
      jungle: 'Ormanina don, farm yap',
      mid: 'Tower\'a don, wave temizle',
      support: 'ADC\'nin yanina don, koruma pozisyonu al',
    },
    mid: {
      carry: 'Geri cekil, objektifi bırak',
      top: 'Takimini geri cek',
      jungle: 'Baron\'u bırak, savunmaya gec',
      mid: 'Safini koru, hasar al',
      support: 'Takimini iyilestir, koruma sagla',
    },
    late: {
      carry: 'Backline\'da kal, guvende ol',
      top: 'Takimini koru, arka planda kal',
      jungle: 'Orman kontrolu yap, vision ac',
      mid: 'Safini koru, poke yap',
      support: 'Takimini iyilestir, cc kullan',
    },
  };
  return choices[state]?.[role] || 'Guvenli ol, geri cekil!';
}

function getStrategicChoice(state: string, role: Role): string {
  const choices: Record<string, Record<Role, string>> = {
    laning: {
      carry: 'Wave yonet, freeze yap',
      top: 'Vision ac, gank icin bekle',
      jungle: 'Harita genisinde control sagla',
      mid: 'Roam firsatini degerlendir',
      support: 'Ward yerlestir, vision sagla',
    },
    mid: {
      carry: 'Split push yap, alt\'i ac',
      top: 'Baron\'a git, takimini topla',
      jungle: 'Rakip ormanina gir, vision ac',
      mid: 'Rotation yap, farkli koridora git',
      support: 'Baron etrafinda vision ac',
    },
    late: {
      carry: 'Split push stratejisi uygula',
      top: 'Baron dance yap, pozisyon al',
      jungle: 'Elder\'a git, smite hazir et',
      mid: 'Flank pozisyonu al',
      support: 'Vision savasini kazan, ward ac',
    },
  };
  return choices[state]?.[role] || 'Stratejik dusun, plan yap!';
}

export function processAIResponse(
  rawInput: string,
  event: AIGeneratedEvent
): AIDecision {
  const analysis = analyzeResponse(rawInput);
  const aiResponse = generateAIResponse(analysis, event.description);

  const baseChance = 0.5;
  const styleBonus = (analysis.confidence - 0.5) * analysis.effectMultiplier;
  const successChance = Math.min(0.95, Math.max(0.1, baseChance + styleBonus));

  return {
    rawInput,
    analysis,
    aiResponse,
    successChance,
    statChanges: {
      kda: analysis.statBonuses.kda * analysis.effectMultiplier,
      csPerMin: analysis.statBonuses.csPerMin * analysis.effectMultiplier,
      visionScore: analysis.statBonuses.visionScore * analysis.effectMultiplier,
    },
  };
}

export function getMatchPhase(minute: number): 'laning' | 'mid' | 'late' {
  if (minute <= 14) return 'laning';
  if (minute <= 25) return 'mid';
  return 'late';
}
