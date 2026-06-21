const CHAMPION_NAME_MAP: Record<string, string> = {
  'Kai\'Sa': 'Kaisa',
  'Cho\'Gath': 'Chogath',
  'Kha\'Zix': 'Khazix',
  'Lee Sin': 'LeeSin',
  'Master Yi': 'MasterYi',
  'Miss Fortune': 'MissFortune',
  'Dr. Mundo': 'DrMundo',
  'Wukong': 'MonkeyKing',
  'Nunu & Willump': 'Nunu',
  'Twisted Fate': 'TwistedFate',
  'Jarvan IV': 'JarvanIV',
  'Bel\'Veth': 'Belveth',
  'K\'Sante': 'KSante',
  'Rek\'Sai': 'RekSai',
  'Renata Glasc': 'RenataGlasc',
  'Aurelion Sol': 'AurelionSol',
  'Kog\'Maw': 'KogMaw',
  'Xin Zhao': 'XinZhao',
  'Vel\'Koz': 'Velkoz',
};

const DD_VERSION = '14.10.1';

export function getChampionIconUrl(championName: string, dragonName?: string): string {
  const normalized = dragonName || CHAMPION_NAME_MAP[championName] || championName.replace(/['.\s&]/g, '');
  return `https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}/img/champion/${normalized}.png`;
}

export function getChampionSplashUrl(championName: string, skinNum = 0, dragonName?: string): string {
  const normalized = dragonName || CHAMPION_NAME_MAP[championName] || championName.replace(/['.\s&]/g, '');
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${normalized}_${skinNum}.jpg`;
}

export function getChampionSquareUrl(championName: string, dragonName?: string): string {
  const normalized = dragonName || CHAMPION_NAME_MAP[championName] || championName.replace(/['.\s&]/g, '');
  return `https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}/img/champion/${normalized}.png`;
}
