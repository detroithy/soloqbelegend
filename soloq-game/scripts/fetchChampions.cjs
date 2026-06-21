const https = require('https');
const fs = require('fs');
const path = require('path');

const DDRAGON_VERSION = '14.10.1';
const BASE_URL = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/data/en_US`;

// ALL champions mapped to their correct roles (keys match Data Dragon names exactly)
const CHAMPION_ROLES = {
  // === CARRY (ADC) ===
  'Aphelios': 'carry', 'Ashe': 'carry', 'Caitlyn': 'carry', 'Corki': 'carry',
  'Draven': 'carry', 'Ezreal': 'carry', 'Jhin': 'carry', 'Jinx': 'carry',
  'Kaisa': 'carry', 'Kalista': 'carry', 'KogMaw': 'carry',
  'Lucian': 'carry', 'MissFortune': 'carry', 'Nilah': 'carry', 'Quinn': 'carry',
  'Samira': 'carry', 'Senna': 'carry', 'Sivir': 'carry', 'Smolder': 'carry',
  'Tristana': 'carry', 'Twitch': 'carry', 'Varus': 'carry', 'Vayne': 'carry',
  'Xayah': 'carry', 'Zeri': 'carry',

  // === TOP ===
  'Aatrox': 'top', 'Akali': 'top', 'Camille': 'top', 'Chogath': 'top',
  'Darius': 'top', 'DrMundo': 'top', 'Fiora': 'top', 'Gangplank': 'top',
  'Garen': 'top', 'Gnar': 'top', 'Gragas': 'top', 'Gwen': 'top',
  'Illaoi': 'top', 'Irelia': 'top', 'Jax': 'top', 'Jayce': 'top',
  'Kayle': 'top', 'Kennen': 'top', 'Kled': 'top', 'KSante': 'top',
  'Malphite': 'top', 'Mordekaiser': 'top', 'Nasus': 'top', 'Olaf': 'top',
  'Ornn': 'top', 'Poppy': 'top', 'Renekton': 'top', 'Riven': 'top',
  'Rumble': 'top', 'Sett': 'top', 'Shen': 'top', 'Shyvana': 'top',
  'Singed': 'top', 'Sion': 'top', 'Skarner': 'top', 'Teemo': 'top',
  'Trundle': 'top', 'Tryndamere': 'top', 'Urgot': 'top', 'Volibear': 'top',
  'MonkeyKing': 'top', 'Yorick': 'top', 'Yone': 'top', 'Zac': 'top',
  'Warwick': 'top', 'Maokai': 'top', 'Swain': 'top', 'Sylas': 'top',
  'Vladimir': 'top', 'TahmKench': 'top', 'Rammus': 'top',

  // === JUNGLE ===
  'Amumu': 'jungle', 'Belveth': 'jungle', 'Diana': 'jungle', 'Ekko': 'jungle',
  'Elise': 'jungle', 'Evelynn': 'jungle', 'Fiddlesticks': 'jungle', 'Graves': 'jungle',
  'Hecarim': 'jungle', 'Ivern': 'jungle', 'JarvanIV': 'jungle', 'Kayn': 'jungle',
  'Khazix': 'jungle', 'Kindred': 'jungle', 'LeeSin': 'jungle', 'Lillia': 'jungle',
  'MasterYi': 'jungle', 'Nidalee': 'jungle', 'Nocturne': 'jungle', 'Nunu': 'jungle',
  'RekSai': 'jungle', 'Rengar': 'jungle', 'Sejuani': 'jungle', 'Shaco': 'jungle',
  'Taliyah': 'jungle', 'Udyr': 'jungle', 'Vi': 'jungle', 'Viego': 'jungle',
  'XinZhao': 'jungle', 'Zed': 'jungle', 'Briar': 'jungle', 'Naafiri': 'jungle',

  // === MID ===
  'Ahri': 'mid', 'Akshan': 'mid', 'Anivia': 'mid', 'Annie': 'mid',
  'AurelionSol': 'mid', 'Aurora': 'mid', 'Azir': 'mid', 'Cassiopeia': 'mid',
  'Fizz': 'mid', 'Galio': 'mid', 'Hwei': 'mid', 'Heimerdinger': 'mid',
  'Kassadin': 'mid', 'Katarina': 'mid', 'Leblanc': 'mid', 'Lissandra': 'mid',
  'Lux': 'mid', 'Malzahar': 'mid', 'Orianna': 'mid', 'Qiyana': 'mid',
  'Ryze': 'mid', 'Syndra': 'mid', 'Talon': 'mid', 'TwistedFate': 'mid',
  'Veigar': 'mid', 'Vex': 'mid', 'Viktor': 'mid', 'Velkoz': 'mid',
  'Yasuo': 'mid', 'Ziggs': 'mid', 'Zoe': 'mid', 'Neeko': 'mid',
  'Brand': 'mid', 'Karthus': 'mid', 'Xerath': 'mid',

  // === SUPPORT ===
  'Alistar': 'support', 'Bard': 'support', 'Blitzcrank': 'support',
  'Braum': 'support', 'Janna': 'support', 'Karma': 'support',
  'Leona': 'support', 'Lulu': 'support', 'Milio': 'support',
  'Nami': 'support', 'Nautilus': 'support', 'Pantheon': 'support',
  'Pyke': 'support', 'Rakan': 'support', 'Renata': 'support',
  'Seraphine': 'support', 'Sona': 'support', 'Soraka': 'support',
  'Taric': 'support', 'Thresh': 'support', 'Yuumi': 'support',
  'Zilean': 'support', 'Zyra': 'support', 'Morgana': 'support',
  'Rell': 'support', 'Sona': 'support',
};

const NAME_NORMALIZATIONS = {
  "Kai'Sa": "Kaisa", "Cho'Gath": "Chogath", "Kha'Zix": "Khazix",
  "Rek'Sai": "RekSai", "Jarvan IV": "JarvanIV", "Nunu & Willump": "Nunu",
  "Dr. Mundo": "DrMundo", "Kog'Maw": "KogMaw", "Bel'Veth": "Belveth",
  "Renata Glasc": "RenataGlasc", "K'Sante": "KSante", "Aurelion Sol": "AurelionSol",
  "Miss Fortune": "MissFortune", "Tahm Kench": "TahmKench", "Lee Sin": "LeeSin",
  "Master Yi": "MasterYi", "Twisted Fate": "TwistedFate", "Xin Zhao": "XinZhao",
  "Vel'Koz": "Velkoz", "Nunu & Willump": "Nunu",
};

function getDragonName(displayName) {
  return NAME_NORMALIZATIONS[displayName] || displayName.replace(/[^a-zA-Z]/g, '');
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

function mapInfoToStats(info) {
  return {
    attack: Math.round(info.attack * 12.5),
    defense: Math.round(info.defense * 12.5),
    magic: Math.round(info.magic * 12.5),
    difficulty: Math.round(info.difficulty * 12.5),
  };
}

async function main() {
  console.log('Fetching champion list from Data Dragon...');
  const champList = await fetchJSON(`${BASE_URL}/champion.json`);
  const champNames = Object.keys(champList.data);
  console.log(`Found ${champNames.length} champions`);

  const champions = [];
  const errors = [];
  const unmapped = [];

  for (const name of champNames) {
    try {
      const detailed = await fetchJSON(`${BASE_URL}/champion/${name}.json`);
      const champ = detailed.data[name];

      const role = CHAMPION_ROLES[name];
      if (!role) {
        unmapped.push(name);
      }

      const dragonName = getDragonName(name);

      const abilities = [];
      if (champ.passive) {
        abilities.push({ name: champ.passive.name, description: champ.passive.description.replace(/<[^>]*>/g, '').substring(0, 100) });
      }
      for (const spell of champ.spells) {
        abilities.push({ name: spell.name, description: spell.description.replace(/<[^>]*>/g, '').substring(0, 100) });
      }

      champions.push({
        id: name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        name: name,
        role: role || 'mid',
        title: champ.title,
        dragonName: dragonName,
        stats: mapInfoToStats(champ.info),
        abilities: abilities,
        tags: champ.tags,
      });

      process.stdout.write(`  ${name} (${role || '???MID???'}) ✓\n`);
    } catch (e) {
      errors.push({ name, error: e.message });
      process.stdout.write(`  ${name} ✗ ${e.message}\n`);
    }
  }

  champions.sort((a, b) => {
    if (a.role !== b.role) return a.role.localeCompare(b.role);
    return a.name.localeCompare(b.name);
  });

  const outputPath = path.join(__dirname, '..', 'src', 'data', 'champions.json');
  fs.writeFileSync(outputPath, JSON.stringify(champions, null, 2));
  console.log(`\nWrote ${champions.length} champions to ${outputPath}`);

  if (unmapped.length > 0) {
    console.log(`\n⚠️ ${unmapped.length} champions NOT in CHAMPION_ROLES (defaulted to mid):`);
    unmapped.forEach(n => console.log(`  ${n}`));
  }

  if (errors.length > 0) {
    console.log(`\n${errors.length} errors:`);
    errors.forEach(e => console.log(`  ${e.name}: ${e.error}`));
  }

  const roleCounts = {};
  champions.forEach(c => { roleCounts[c.role] = (roleCounts[c.role] || 0) + 1; });
  console.log('\nRole distribution:');
  Object.entries(roleCounts).sort().forEach(([role, count]) => {
    console.log(`  ${role}: ${count}`);
  });
}

main().catch(console.error);
