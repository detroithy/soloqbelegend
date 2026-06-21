import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Role } from '../types/game';
import rolesData from '../data/roles.json';
import { ROLE_ICONS, ROLE_COLORS } from '../constants/game';

export default function RoleSelect() {
  const { selectRole, returnToMenu } = useGameStore();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [playerName, setPlayerName] = useState('');

  const handleSelect = () => {
    if (selectedRole && playerName.trim()) {
      selectRole(selectedRole, playerName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4 animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-1">Rolunu Sec</h1>
      <p className="text-gray-400 mb-6 text-sm">Kariyerinde hangi rolu oynamak istersin?</p>

      <input
        type="text"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder="Oyuncu adin..."
        className="w-full max-w-sm px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 mb-6 text-center transition-all"
        maxLength={20}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg mb-6">
        {rolesData.map((role) => {
          const roleId = role.id as Role;
          const isSelected = selectedRole === roleId;
          return (
            <button
              key={role.id}
              onClick={() => setSelectedRole(roleId)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                isSelected
                  ? 'border-yellow-500 bg-yellow-500/10 shadow-lg shadow-yellow-500/20'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'
              }`}
            >
              <div className="text-2xl mb-1">{ROLE_ICONS[roleId]}</div>
              <p className="text-white font-bold text-sm">{role.nameTr}</p>
              <div className="mt-2 space-y-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-400 w-8">Hasar</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-red-500"
                      style={{ width: `${role.baseStats.damage * 10}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-400 w-8">Tank</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-blue-500"
                      style={{ width: `${role.baseStats.tankiness * 10}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-400 w-8">Destek</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-green-500"
                      style={{ width: `${role.baseStats.utility * 10}%` }}
                    />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 w-full max-w-sm">
        <button
          onClick={returnToMenu}
          className="btn-secondary flex-1 py-3"
        >
          Geri
        </button>
        <button
          onClick={handleSelect}
          disabled={!selectedRole || !playerName.trim()}
          className={`flex-1 py-3 font-bold rounded-xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 ${
            selectedRole && playerName.trim()
              ? 'bg-gradient-to-r from-yellow-600 to-orange-500 hover:from-yellow-500 hover:to-orange-400 text-white shadow-lg hover:scale-105'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          Basla
        </button>
      </div>
    </div>
  );
}
