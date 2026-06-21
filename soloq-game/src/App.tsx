import { useGameStore } from './store/gameStore';
import MainMenu from './components/MainMenu';
import RoleSelect from './components/RoleSelect';
import GameScreen from './components/GameScreen';
import MatchResult from './components/MatchResult';
import Career from './components/Career';
import TrainingScreen from './components/TrainingScreen';
import AIEventScreen from './components/AIEventScreen';
import ChampionSelect from './components/ChampionSelect';

const ROLE_BG: Record<string, string> = {
  carry: 'from-red-900/30 via-gray-900 to-gray-900',
  top: 'from-blue-900/30 via-gray-900 to-gray-900',
  jungle: 'from-green-900/30 via-gray-900 to-gray-900',
  mid: 'from-purple-900/30 via-gray-900 to-gray-900',
  support: 'from-yellow-900/30 via-gray-900 to-gray-900',
};

function App() {
  const { screen, player } = useGameStore();

  const bgClass = player ? ROLE_BG[player.role] || 'from-gray-900 via-gray-800 to-gray-900' : 'from-gray-900 via-gray-800 to-gray-900';

  const renderScreen = () => {
    if (!player && screen !== 'menu' && screen !== 'roleSelect') {
      return <RoleSelect />;
    }

    switch (screen) {
      case 'menu':
        return player ? <MainMenu /> : <RoleSelect />;
      case 'roleSelect':
        return <RoleSelect />;
      case 'championSelect':
        return <ChampionSelect />;
      case 'game':
        return <GameScreen />;
      case 'aiGame':
        return <AIEventScreen />;
      case 'matchResult':
        return <MatchResult />;
      case 'career':
        return <Career />;
      case 'training':
        return <TrainingScreen />;
      default:
        return <MainMenu />;
    }
  };

  return <div className={`min-h-screen bg-gradient-to-br ${bgClass}`}>{renderScreen()}</div>;
}

export default App;
