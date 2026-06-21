import type { Player, Role } from '../types/game';

export interface PromptContext {
  player: Player;
  gameMinute: number;
  matchState: 'laning' | 'mid' | 'late';
  teammates: string[];
  enemies: string[];
  recentEvents: string[];
}

export function generateEventPrompt(ctx: PromptContext): string {
  const roleContext = getRoleContext(ctx.player.role);
  const rankContext = getRankContext(ctx.player.rank.rank);
  const performanceContext = getPerformanceContext(ctx.player.stats);

  return `
Sen bir League of Legends oyun senaryo yazarisin. Asagidaki baglami goz onunde bulundurarak realistic bir olay olustur.

OYUNCU BILGISI:
- Rol: ${roleContext}
- Rank: ${rankContext}
- Performans: ${performanceContext}
- Oyun Dakikasi: ${ctx.gameMinute}
- Oyun Fazi: ${ctx.matchState}

KURALLAR:
1. Olay ${ctx.matchState === 'laning' ? 'laning fazinda' : ctx.matchState === 'mid' ? 'orta oyun' : 'gec oyun'} icin uygun olmali
2. Olay oyuncunun rolu icin anlamli bir secim sunmali
3. Realistik LoL senaryolari kullan (gank, dragon, baron, tower dive, roam, ward, vs.)
4. Olay metni 2-3 cumle olsun, dramatik ve bağlamalı olsun
5. 3 farkli secenek sun (her biri farkli bir oyun stilini temsil etsin)

FORMATT:
Olay basligi: [KISA BASLIK]
Olay aciklamasi: [2-3 CUMLELIK SENARYO]
Secenek 1: [AGRESIF SECENEK] - [KISA ACIKLAMA]
Secenek 2: [PASIF/GUVENLI SECENEK] - [KISA ACIKLAMA]  
Secenek 3: [STRATEJIK SECENEK] - [KISA ACIKLAMA]

Ornek:
Olay basligi: Tiger Gank Ihtimali
Olay aciklamasi: Corridorda ileriye dogru ilerledin ve vision kaybettin. Junglerin nerede oldugunu bilmiyorsun. Aniden haritada tiger belirtisi gorundu.
Secenek 1: Geri cekil, tower altina sigin
Secenek 2: Ward at, gozlemeye devam et
Secenek 3: Roam at, diger koridordan avantaj yarat
`.trim();
}

function getRoleContext(role: Role): string {
  const roles: Record<Role, string> = {
    carry: 'ADC (Tasiyici) - Hasar odakli, late game guclu',
    top: 'Top - One cikan, hasar emen, frontline',
    jungle: 'Jungle (Ormanci) - Harita kontrolu, gank atan',
    mid: 'Mid (Orta) - High hasar, roamer, map control',
    support: 'Support (Destek) - Vision, peel, takim destegi',
  };
  return roles[role] || role;
}

function getRankContext(rank: string): string {
  const rankDescriptions: Record<string, string> = {
    iron: 'Iron - Yeni baslayan, temel mekanikleri ogreniyor',
    bronze: 'Bronze - Temel bilgi var, karar vermede zayif',
    silver: 'Silver - Orta seviye, hatalar yapiyor',
    gold: 'Gold - Iyi bilgi, tutarsiz performans',
    platinum: 'Platinum - guclu mekanik, iyi kararlar',
    emerald: 'Emerald - Cok iyi oyun bilgisi',
    diamond: 'Diamond - Expert seviye, ince ayarlar onemli',
    master: 'Master - Profesyonel seviye',
    grandmaster: 'Grandmaster - En ust seviye',
    challenger: 'Challenger - Dunya siralamasi',
  };
  return rankDescriptions[rank] || rank;
}

function getPerformanceContext(stats: { kda: number; csPerMin: number; visionScore: number }): string {
  const kdaLevel = stats.kda > 3 ? 'excellet' : stats.kda > 2 ? 'iyi' : stats.kda > 1 ? 'ortalama' : 'kotu';
  const csLevel = stats.csPerMin > 8 ? 'mukemmel' : stats.csPerMin > 6 ? 'iyi' : stats.csPerMin > 4 ? 'ortalama' : 'kotu';
  const visionLevel = stats.visionScore > 30 ? 'mukemmel' : stats.visionScore > 20 ? 'iyi' : stats.visionScore > 10 ? 'ortalama' : 'kotu';

  return `KDA: ${kdaLevel} (${stats.kda.toFixed(1)}), CS: ${csLevel} (${stats.csPerMin.toFixed(1)}/dk), Vision: ${visionLevel} (${stats.visionScore.toFixed(0)})`;
}

export function generateTrainingPrompt(trainingType: string, playerLevel: number): string {
  return `
Antrenman senaryosu olustur: ${trainingType}
Oyuncu seviyesi: ${playerLevel}

Bu antrenman icin kisa bir senaryo ve 3 secenek olustur.
Her secenek farkli bir gelistirme alanina odaklansin.
`.trim();
}
