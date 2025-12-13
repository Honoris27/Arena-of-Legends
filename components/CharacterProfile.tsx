
import React, { useState } from 'react';
import { Player, StatType, Equipment, Item, ItemRarity } from '../types';
import { calculateMaxXp, getPlayerTotalStats, calculateSellPrice, canEquipItem } from '../services/gameLogic';
import { Sword, Shield, Zap, Brain, Clover, Plus, Crown, Hand, Footprints, Coins, CircleDollarSign, Trash2, FlaskConical, Circle } from 'lucide-react';

interface CharacterProfileProps {
  player: Player;
  onUpgradeStat: (stat: StatType) => void;
  onEquip: (item: Item) => void;
  onUnequip: (slot: keyof Equipment) => void;
  onDelete: (item: Item) => void;
  onSell: (item: Item) => void;
  onUse: (item: Item) => void;
}

// ---- HELPER COMPONENTS ----

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: 'border-slate-600 bg-slate-800 text-slate-300',
  uncommon: 'border-green-600 bg-green-900/20 text-green-300',
  rare: 'border-blue-600 bg-blue-900/20 text-blue-300',
  epic: 'border-purple-600 bg-purple-900/20 text-purple-300',
  legendary: 'border-orange-600 bg-orange-900/20 text-orange-300',
};

const TYPE_ICONS: any = {
    weapon: Sword,
    shield: Shield,
    armor: Shield,
    helmet: Crown,
    gloves: Hand,
    boots: Footprints,
    consumable: FlaskConical,
    material: Coins,
    ring: Circle,
    necklace: Circle,
    earring: Circle,
    belt: Circle
};

const ItemTooltip = ({ item }: { item: Item }) => (
    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-900 border border-slate-500 rounded-lg shadow-2xl p-3 z-[100] pointer-events-none">
        <h5 className={`font-bold text-sm mb-1 ${RARITY_COLORS[item.rarity].split(' ').pop()}`}>{item.name} {item.upgradeLevel > 0 ? `+${item.upgradeLevel}` : ''}</h5>
        <p className="text-[10px] text-slate-400 italic mb-2">{item.description}</p>
        
        {/* Requirements */}
        {(item.reqLevel || item.reqStat) && (
            <div className="text-[10px] text-red-400 mb-2 border-b border-slate-700 pb-1">
                {item.reqLevel && <div>Gereken Seviye: {item.reqLevel}</div>}
                {item.reqStat && <div>Gereken {item.reqStat.stat}: {item.reqStat.value}</div>}
            </div>
        )}

        <div className="space-y-1 pt-1 mb-2">
                {Object.entries(item.stats).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-xs">
                    <span className="text-slate-300">{key}</span>
                    <span className="text-green-400 font-mono">+{val}</span>
                    </div>
                ))}
        </div>
        <div className="text-[10px] text-yellow-500 flex items-center justify-end gap-1">
            Değer: {item.value} <Coins size={10} />
        </div>
    </div>
);

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
    const rarityClass = item ? RARITY_COLORS[item.rarity] : 'border-slate-700 bg-slate-900 border-dashed';

    return (
        <div 
            onClick={item ? onClick : undefined}
            className={`
                relative w-14 h-14 md:w-16 md:h-16 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-105 group
                ${rarityClass}
            `}
        >
            {item ? (
                <>
                    <div className="text-center">
                        <Icon className="mx-auto mb-1 text-white opacity-80" size={20} />
                    </div>
                    {/* Tooltip */}
                    <ItemTooltip item={item} />
                </>
            ) : (
                <Icon className="text-slate-600" size={20} />
            )}
            <span className="absolute -bottom-5 text-[9px] text-slate-500 whitespace-nowrap uppercase font-bold tracking-wider">{slotName}</span>
        </div>
    );
};

const InventoryItem = ({ item, onEquip, onUse, onSell, onDelete, player }: any) => {
    const Icon = TYPE_ICONS[item.type] || Shield;
    const isEquippable = ['weapon', 'shield', 'armor', 'helmet', 'gloves', 'boots', 'ring', 'necklace', 'earring', 'belt'].includes(item.type);
    const isConsumable = item.type === 'consumable';
    const sellPrice = calculateSellPrice(item);
    
    const equipCheck = isEquippable ? canEquipItem(player, item) : { can: false };

    return (
        <div className={`relative group p-2 rounded-lg border border-slate-700 hover:border-slate-500 bg-slate-800 transition-all cursor-pointer`}>
            {/* Badge */}
            {item.upgradeLevel > 0 && (
                <div className="absolute top-1 right-1 bg-yellow-600 text-white text-[9px] font-bold px-1 rounded z-10">
                    +{item.upgradeLevel}
                </div>
            )}

            <div className="flex justify-center mb-1">
                <Icon size={20} className={isEquippable && !equipCheck.can ? 'opacity-50' : 'text-slate-200'} />
            </div>
            
            <ItemTooltip item={item} />

            {/* Actions Overlay */}
            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-1 rounded-lg z-20">
                 {isConsumable && (
                    <button onClick={() => onUse(item)} className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded w-3/4">Kullan</button>
                 )}
                 {isEquippable && (
                     equipCheck.can ? (
                        <button onClick={() => onEquip(item)} className="text-[10px] bg-green-600 text-white px-2 py-1 rounded w-3/4">Kuşan</button>
                     ) : (
                        <span className="text-[9px] text-red-500 font-bold text-center px-1">{equipCheck.reason}</span>
                     )
                 )}
                 <button onClick={() => onSell(item)} className="text-[10px] bg-yellow-600/50 text-yellow-200 px-2 py-1 rounded w-3/4 flex justify-center gap-1"><CircleDollarSign size={10}/> {sellPrice}</button>
                 <button onClick={() => onDelete(item)} className="text-[10px] bg-red-600/50 text-red-200 px-2 py-1 rounded w-3/4"><Trash2 size={10}/></button>
            </div>
        </div>
    );
};

const StatRow = ({ 
    label, value, baseValue, icon: Icon, canUpgrade, onUpgrade, colorClass 
  }: { 
    label: string; value: number; baseValue: number; icon: React.ElementType; canUpgrade: boolean; onUpgrade: () => void; colorClass: string;
  }) => {
    const bonus = value - baseValue;
    return (
      <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded mb-1 border border-slate-700/50">
        <div className="flex items-center gap-2">
          <Icon size={14} className={colorClass} />
          <span className="text-xs font-bold text-slate-300">{label}</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-white">{value}</span>
            {bonus > 0 && <span className="text-[10px] text-green-500">(+{bonus})</span>}
            {canUpgrade && (
                <button onClick={onUpgrade} className="bg-yellow-600 hover:bg-yellow-500 text-white p-0.5 rounded">
                    <Plus size={12}/>
                </button>
            )}
        </div>
      </div>
    );
  };

const CharacterProfile: React.FC<CharacterProfileProps> = ({ player, onUpgradeStat, onEquip, onUnequip, onDelete, onSell, onUse }) => {
  const totalStats = getPlayerTotalStats(player);
  const maxXp = calculateMaxXp(player.level);
  const xpPercentage = Math.min(100, (player.currentXp / maxXp) * 100);

  return (
    <div className="max-w-6xl mx-auto pb-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: Paper Doll & Stats */}
      <div className="lg:col-span-5 space-y-6">
          
          {/* Avatar & Basic Info */}
          <div className="bg-slate-800 border border-slate-600 rounded-xl p-4 flex gap-4 items-center shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-50 text-[10px] bg-slate-900 rounded-bl text-slate-400">
                   Rol: <span className="uppercase font-bold text-yellow-500">{player.role}</span>
               </div>
               <img src={player.avatarUrl} className="w-20 h-20 rounded-full border-2 border-slate-500 bg-slate-900" />
               <div className="flex-1">
                   <h2 className="text-xl font-bold text-white cinzel">{player.name}</h2>
                   <div className="text-xs text-slate-400 mb-2">Seviye {player.level} Gladyatör</div>
                   
                   {/* XP Bar */}
                   <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                        <div className="h-full bg-yellow-500" style={{ width: `${xpPercentage}%` }}></div>
                   </div>
                   <div className="text-[10px] text-right text-slate-500 mt-1">{player.currentXp} / {maxXp} XP</div>
               </div>
          </div>

          {/* Paper Doll Layout */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 relative flex flex-col items-center">
              <h3 className="absolute top-2 left-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Ekipman</h3>
              
              <div className="flex gap-8 mt-4">
                  {/* Left Column */}
                  <div className="flex flex-col gap-6">
                      <EquipmentSlot item={player.equipment.helmet} slotName="Kask" icon={Crown} onClick={() => onUnequip('helmet')} />
                      <EquipmentSlot item={player.equipment.armor} slotName="Zırh" icon={Shield} onClick={() => onUnequip('armor')} />
                      <EquipmentSlot item={player.equipment.gloves} slotName="Eldiven" icon={Hand} onClick={() => onUnequip('gloves')} />
                      <EquipmentSlot item={player.equipment.belt} slotName="Kemer" icon={Circle} onClick={() => onUnequip('belt')} />
                      <EquipmentSlot item={player.equipment.boots} slotName="Bot" icon={Footprints} onClick={() => onUnequip('boots')} />
                  </div>

                  {/* Center Character Placeholder (Visual only) */}
                  <div className="w-24 h-64 bg-slate-900/50 rounded-full border border-slate-700/50 hidden md:flex items-center justify-center opacity-30">
                      <span className="cinzel text-4xl">⚔️</span>
                  </div>

                  {/* Right Column */}
                  <div className="flex flex-col gap-6">
                      <EquipmentSlot item={player.equipment.necklace} slotName="Kolye" icon={Circle} onClick={() => onUnequip('necklace')} />
                      <div className="flex gap-2">
                           <EquipmentSlot item={player.equipment.weapon} slotName="Silah" icon={Sword} onClick={() => onUnequip('weapon')} />
                           <EquipmentSlot item={player.equipment.shield} slotName="Kalkan" icon={Shield} onClick={() => onUnequip('shield')} />
                      </div>
                      <div className="flex gap-2">
                           <EquipmentSlot item={player.equipment.ring} slotName="Yüzük" icon={Circle} onClick={() => onUnequip('ring')} />
                           <EquipmentSlot item={player.equipment.earring} slotName="Küpe" icon={Circle} onClick={() => onUnequip('earring')} />
                      </div>
                  </div>
              </div>
          </div>

          {/* Stats Panel */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-slate-300 uppercase">Özellikler</h3>
                  {player.statPoints > 0 && <span className="text-xs text-yellow-500 font-bold animate-pulse">{player.statPoints} Puan</span>}
              </div>
              <div className="space-y-1">
                <StatRow label="Güç" value={totalStats.STR} baseValue={player.stats.STR} icon={Sword} canUpgrade={player.statPoints > 0} onUpgrade={() => onUpgradeStat('STR')} colorClass="text-red-400"/>
                <StatRow label="Çeviklik" value={totalStats.AGI} baseValue={player.stats.AGI} icon={Zap} canUpgrade={player.statPoints > 0} onUpgrade={() => onUpgradeStat('AGI')} colorClass="text-yellow-400"/>
                <StatRow label="Can" value={totalStats.VIT} baseValue={player.stats.VIT} icon={Shield} canUpgrade={player.statPoints > 0} onUpgrade={() => onUpgradeStat('VIT')} colorClass="text-green-400"/>
                <StatRow label="Zeka" value={totalStats.INT} baseValue={player.stats.INT} icon={Brain} canUpgrade={player.statPoints > 0} onUpgrade={() => onUpgradeStat('INT')} colorClass="text-blue-400"/>
                <StatRow label="Şans" value={totalStats.LUK} baseValue={player.stats.LUK} icon={Clover} canUpgrade={player.statPoints > 0} onUpgrade={() => onUpgradeStat('LUK')} colorClass="text-purple-400"/>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                  <div className="bg-slate-900 p-2 rounded border border-slate-700">
                      <div className="text-[10px] text-slate-500">HP</div>
                      <div className="text-sm font-bold text-red-500">{player.hp} / {player.maxHp}</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-700">
                      <div className="text-[10px] text-slate-500">MP</div>
                      <div className="text-sm font-bold text-blue-500">{player.mp} / {player.maxMp}</div>
                  </div>
              </div>
          </div>

      </div>

      {/* RIGHT COLUMN: Inventory Grid */}
      <div className="lg:col-span-7 bg-slate-800/80 border border-slate-600 rounded-xl p-4 flex flex-col h-full min-h-[500px]">
          <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
              <h3 className="font-bold text-white flex items-center gap-2"><Coins className="text-yellow-500"/> Çanta</h3>
              <div className="text-xs text-slate-400">{player.inventory.length} Eşya</div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {player.inventory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                      <Coins size={48} className="mb-2"/>
                      <p>Çantanız boş.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                      {player.inventory.map((item, idx) => (
                          <InventoryItem 
                            key={item.id} 
                            item={item} 
                            player={player}
                            onEquip={onEquip} 
                            onUse={onUse} 
                            onSell={onSell} 
                            onDelete={onDelete} 
                          />
                      ))}
                  </div>
              )}
          </div>
      </div>

    </div>
  );
};

export default CharacterProfile;
