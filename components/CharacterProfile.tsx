import React from 'react';
import { Player, StatType, Equipment, Item } from '../types';
import { calculateMaxXp, getPlayerTotalStats } from '../services/gameLogic';
import { Sword, Shield, Zap, Brain, Clover, Plus, Crown, Hand, Footprints } from 'lucide-react';

interface CharacterProfileProps {
  player: Player;
  onUpgradeStat: (stat: StatType) => void;
  onUnequip: (slot: keyof Equipment) => void;
}

const StatRow = ({ 
  label, 
  value, 
  baseValue,
  icon: Icon, 
  canUpgrade, 
  onUpgrade, 
  colorClass 
}: { 
  label: string; 
  value: number; 
  baseValue: number;
  icon: React.ElementType; 
  canUpgrade: boolean; 
  onUpgrade: () => void;
  colorClass: string;
}) => {
  const bonus = value - baseValue;
  return (
    <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg mb-2 border border-slate-700">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full bg-slate-900 ${colorClass}`}>
          <Icon size={18} />
        </div>
        <div className="flex flex-col">
            <span className="font-semibold text-slate-200">{label}</span>
            {bonus > 0 && <span className="text-xs text-green-400">+{bonus} Eşya Bonusu</span>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold font-mono">{value}</span>
        <button
          onClick={onUpgrade}
          disabled={!canUpgrade}
          className={`p-1 rounded transition-colors ${
            canUpgrade 
              ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-900/20' 
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

const EquipmentSlot = ({ 
    item, 
    slotName, 
    icon: Icon,
    onClick 
}: { 
    item: Item | null, 
    slotName: string, 
    icon: React.ElementType,
    onClick: () => void
}) => {
    const rarityColors = {
        common: 'border-slate-500 bg-slate-800',
        uncommon: 'border-green-500 bg-green-900/20',
        rare: 'border-blue-500 bg-blue-900/20',
        epic: 'border-purple-500 bg-purple-900/20',
        legendary: 'border-orange-500 bg-orange-900/20',
    };

    return (
        <div 
            onClick={item ? onClick : undefined}
            className={`
                relative w-16 h-16 md:w-20 md:h-20 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-105
                ${item ? rarityColors[item.rarity] : 'border-slate-700 bg-slate-900 border-dashed'}
            `}
            title={item ? `${item.name}\n${JSON.stringify(item.stats)}` : slotName}
        >
            {item ? (
                <div className="text-center">
                    <Icon className="mx-auto mb-1 text-white" size={24} />
                    <span className="text-[10px] block leading-none w-full truncate px-1">{item.name}</span>
                </div>
            ) : (
                <Icon className="text-slate-600" size={24} />
            )}
            <span className="absolute -bottom-6 text-xs text-slate-500 whitespace-nowrap">{slotName}</span>
        </div>
    );
};

const CharacterProfile: React.FC<CharacterProfileProps> = ({ player, onUpgradeStat, onUnequip }) => {
  const totalStats = getPlayerTotalStats(player);
  const maxXp = calculateMaxXp(player.level);
  const xpPercentage = Math.min(100, (player.currentXp / maxXp) * 100);
  const hpPercentage = Math.min(100, (player.hp / player.maxHp) * 100);
  const mpPercentage = Math.min(100, (player.mp / player.maxMp) * 100);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-10">
      {/* Header Card */}
      <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-600 via-red-500 to-purple-600"></div>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <img 
              src={player.avatarUrl} 
              alt="Character Avatar" 
              className="w-24 h-24 rounded-full border-4 border-slate-600 shadow-2xl object-cover"
            />
            <div className="absolute -bottom-2 -right-2 bg-yellow-600 text-white text-xs font-bold px-2 py-1 rounded-full border border-slate-900">
              Lv. {player.level}
            </div>
          </div>
          
          <div className="flex-1 w-full text-center md:text-left">
            <h2 className="text-2xl font-bold cinzel text-white mb-1">{player.name}</h2>
            <p className="text-slate-400 text-sm mb-4">Efsanevi Gladyatör</p>
            
            {/* HP Bar */}
            <div className="mb-2">
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>CAN (HP)</span>
                    <span>{player.hp} / {player.maxHp}</span>
                </div>
                <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                    <div 
                        className="h-full bg-red-600 transition-all duration-500"
                        style={{ width: `${hpPercentage}%` }}
                    ></div>
                </div>
            </div>

            {/* MP Bar */}
            <div className="mb-2">
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>MANA (MP)</span>
                    <span>{player.mp} / {player.maxMp}</span>
                </div>
                <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                    <div 
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${mpPercentage}%` }}
                    ></div>
                </div>
            </div>

            {/* XP Bar */}
            <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>DENEYİM (EXP)</span>
                    <span>{player.currentXp} / {maxXp}</span>
                </div>
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700 mt-1">
                    <div 
                        className="h-full bg-yellow-500 transition-all duration-500"
                        style={{ width: `${xpPercentage}%` }}
                    ></div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Layout */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col items-center">
            <h3 className="text-xl font-bold cinzel text-slate-200 mb-6">Ekipmanlar</h3>
            <div className="grid grid-cols-3 gap-6 gap-y-10">
                <div className="col-start-2">
                    <EquipmentSlot item={player.equipment.helmet} slotName="Kask" icon={Crown} onClick={() => onUnequip('helmet')} />
                </div>
                <div className="col-start-1 row-start-2">
                    <EquipmentSlot item={player.equipment.weapon} slotName="Silah" icon={Sword} onClick={() => onUnequip('weapon')} />
                </div>
                <div className="col-start-2 row-start-2">
                    <EquipmentSlot item={player.equipment.armor} slotName="Zırh" icon={Shield} onClick={() => onUnequip('armor')} />
                </div>
                <div className="col-start-3 row-start-2">
                    <EquipmentSlot item={player.equipment.gloves} slotName="Eldiven" icon={Hand} onClick={() => onUnequip('gloves')} />
                </div>
                <div className="col-start-2 row-start-3">
                    <EquipmentSlot item={player.equipment.boots} slotName="Bot" icon={Footprints} onClick={() => onUnequip('boots')} />
                </div>
            </div>
             <p className="text-xs text-slate-500 mt-10">Ekipmana tıklayarak çıkarabilirsiniz.</p>
        </div>

        {/* Stats Section */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold cinzel text-slate-200">Karakter Özellikleri</h3>
                {player.statPoints > 0 && (
                    <span className="bg-yellow-500/20 text-yellow-400 text-sm font-bold px-3 py-1 rounded-full border border-yellow-500/50 animate-pulse">
                        {player.statPoints} Puan Mevcut
                    </span>
                )}
            </div>

            <div className="space-y-3">
                <StatRow 
                    label="Güç (STR)" 
                    value={totalStats.STR} 
                    baseValue={player.stats.STR}
                    icon={Sword} 
                    canUpgrade={player.statPoints > 0} 
                    onUpgrade={() => onUpgradeStat('STR')}
                    colorClass="text-red-400"
                />
                <StatRow 
                    label="Çeviklik (AGI)" 
                    value={totalStats.AGI} 
                    baseValue={player.stats.AGI}
                    icon={Zap} 
                    canUpgrade={player.statPoints > 0} 
                    onUpgrade={() => onUpgradeStat('AGI')}
                    colorClass="text-yellow-400"
                />
                <StatRow 
                    label="Dayanıklılık (VIT)" 
                    value={totalStats.VIT} 
                    baseValue={player.stats.VIT}
                    icon={Shield} 
                    canUpgrade={player.statPoints > 0} 
                    onUpgrade={() => onUpgradeStat('VIT')}
                    colorClass="text-green-400"
                />
                <StatRow 
                    label="Zeka (INT)" 
                    value={totalStats.INT} 
                    baseValue={player.stats.INT}
                    icon={Brain} 
                    canUpgrade={player.statPoints > 0} 
                    onUpgrade={() => onUpgradeStat('INT')}
                    colorClass="text-blue-400"
                />
                <StatRow 
                    label="Şans (LUK)" 
                    value={totalStats.LUK} 
                    baseValue={player.stats.LUK}
                    icon={Clover} 
                    canUpgrade={player.statPoints > 0} 
                    onUpgrade={() => onUpgradeStat('LUK')}
                    colorClass="text-purple-400"
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterProfile;