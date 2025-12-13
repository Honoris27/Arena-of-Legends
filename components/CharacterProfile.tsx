
import React, { useState, useEffect, useMemo } from 'react';
import { Player, StatType, Equipment, Item, ItemRarity, ItemType } from '../types';
import { calculateMaxXp, getPlayerTotalStats, calculateSellPrice, canEquipItem } from '../services/gameLogic';
import { Sword, Shield, Zap, Brain, Clover, Plus, Crown, Hand, Footprints, Coins, CircleDollarSign, Trash2, FlaskConical, Circle, Search, X } from 'lucide-react';
import ItemTooltip from './ItemTooltip';

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
  rare: 'border-blue-600 bg-slate-900 text-blue-300',
  epic: 'border-purple-600 bg-slate-900 text-purple-300',
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

interface EquipmentSlotProps {
    item: Item | null;
    slotName: string;
    icon: React.ElementType;
    onClick: () => void;
    onHover: (item: Item) => void;
    onLeave: () => void;
}

const EquipmentSlot: React.FC<EquipmentSlotProps> = ({ 
    item, 
    slotName, 
    icon: Icon,
    onClick,
    onHover,
    onLeave
}) => {
    const rarityClass = item ? RARITY_COLORS[item.rarity] : 'border-slate-700 bg-slate-900 border-dashed';

    return (
        <div 
            onClick={item ? onClick : undefined}
            onMouseEnter={() => item && onHover(item)}
            onMouseLeave={onLeave}
            className={`
                relative w-14 h-14 md:w-16 md:h-16 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-105 group
                ${rarityClass}
            `}
        >
            {item ? (
                <div className="text-center">
                    <Icon className="mx-auto mb-1 text-white opacity-80" size={20} />
                </div>
            ) : (
                <Icon className="text-slate-600" size={20} />
            )}
            <span className="absolute -bottom-5 text-[9px] text-slate-500 whitespace-nowrap uppercase font-bold tracking-wider">{slotName}</span>
        </div>
    );
};

// Interface for Display Item (handles stacks)
interface DisplayItem extends Item {
    count: number;
    stackIds: string[]; // IDs of all items in this stack
}

interface InventoryItemProps {
    item: DisplayItem;
    isSelected: boolean;
    onClick: () => void;
    onHover: (i: Item) => void;
    onLeave: () => void;
}

const InventoryItem: React.FC<InventoryItemProps> = ({ item, isSelected, onClick, onHover, onLeave }) => {
    const Icon = TYPE_ICONS[item.type] || Shield;
    
    return (
        <div 
            className={`
                relative group p-2 rounded-lg border-2 transition-all cursor-pointer select-none
                ${isSelected ? 'border-yellow-500 bg-slate-700 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'border-slate-700 bg-slate-800 hover:border-slate-500'}
            `}
            onClick={onClick}
            onMouseEnter={() => onHover(item)}
            onMouseLeave={onLeave}
        >
            {/* Upgrade Badge */}
            {item.upgradeLevel > 0 && (
                <div className="absolute top-1 left-1 bg-yellow-600 text-white text-[9px] font-bold px-1 rounded z-10">
                    +{item.upgradeLevel}
                </div>
            )}

            {/* Stack Count Badge */}
            {item.count > 1 && (
                <div className="absolute top-1 right-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 rounded z-10 shadow-sm">
                    x{item.count}
                </div>
            )}

            <div className="flex justify-center mb-1">
                <Icon size={24} className={isSelected ? 'text-yellow-100' : 'text-slate-300'} />
            </div>
            
            <div className="text-[10px] text-center truncate text-slate-400">{item.name}</div>
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

  // Floating Tooltip State
  const [hoveredItem, setHoveredItem] = useState<Item | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Inventory Logic State
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<DisplayItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'equip' | 'consumable' | 'material'>('all');

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };
    if (hoveredItem) {
        window.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [hoveredItem]);

  // Process Inventory (Stacking & Filtering)
  const processedInventory = useMemo(() => {
      const grouped: DisplayItem[] = [];
      const stackableTypes: ItemType[] = ['material', 'consumable'];

      player.inventory.forEach(item => {
          // Check if item should stack
          if (stackableTypes.includes(item.type)) {
              // Stack based on Name + Rarity
              const existingIndex = grouped.findIndex(g => g.name === item.name && g.rarity === item.rarity);
              if (existingIndex > -1) {
                  grouped[existingIndex].count += 1;
                  grouped[existingIndex].stackIds.push(item.id);
              } else {
                  grouped.push({ ...item, count: 1, stackIds: [item.id] });
              }
          } else {
              // Unique items (Equipment) do not stack
              grouped.push({ ...item, count: 1, stackIds: [item.id] });
          }
      });

      // Filter
      return grouped.filter(item => {
          const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesType = 
            filterType === 'all' ? true :
            filterType === 'equip' ? ['weapon', 'shield', 'armor', 'helmet', 'gloves', 'boots', 'ring', 'necklace', 'earring', 'belt'].includes(item.type) :
            filterType === 'consumable' ? item.type === 'consumable' :
            filterType === 'material' ? item.type === 'material' : true;
          
          return matchesSearch && matchesType;
      });
  }, [player.inventory, searchTerm, filterType]);

  // Handle Multi-Item Operations for Stacks
  const handleBatchSell = (displayItem: DisplayItem) => {
      // Logic: Sell one instance of the item
      const realItem = player.inventory.find(i => i.id === displayItem.stackIds[0]);
      if(realItem) onSell(realItem);
      // If last item was sold, clear selection
      if(displayItem.count <= 1) setSelectedInventoryItem(null);
  };

  const handleBatchDelete = (displayItem: DisplayItem) => {
      const realItem = player.inventory.find(i => i.id === displayItem.stackIds[0]);
      if(realItem) onDelete(realItem);
      if(displayItem.count <= 1) setSelectedInventoryItem(null);
  };

  const handleBatchUse = (displayItem: DisplayItem) => {
      const realItem = player.inventory.find(i => i.id === displayItem.stackIds[0]);
      if(realItem) onUse(realItem);
      if(displayItem.count <= 1) setSelectedInventoryItem(null);
  };

  const handleSingleEquip = (displayItem: DisplayItem) => {
      const realItem = player.inventory.find(i => i.id === displayItem.stackIds[0]);
      if(realItem) onEquip(realItem);
      setSelectedInventoryItem(null);
  }


  return (
    <div className="max-w-6xl mx-auto pb-10 grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
      
      {/* GLOBAL FLOATING TOOLTIP */}
      {hoveredItem && (
          <div 
            style={{ 
                position: 'fixed', 
                top: mousePos.y + 15, 
                left: Math.min(mousePos.x + 15, window.innerWidth - 270), 
                zIndex: 9999,
                pointerEvents: 'none'
            }}
          >
              <ItemTooltip item={hoveredItem} fixed />
          </div>
      )}

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
                      <EquipmentSlot item={player.equipment.helmet} slotName="Kask" icon={Crown} onClick={() => onUnequip('helmet')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                      <EquipmentSlot item={player.equipment.armor} slotName="Zırh" icon={Shield} onClick={() => onUnequip('armor')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                      <EquipmentSlot item={player.equipment.gloves} slotName="Eldiven" icon={Hand} onClick={() => onUnequip('gloves')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                      <EquipmentSlot item={player.equipment.belt} slotName="Kemer" icon={Circle} onClick={() => onUnequip('belt')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                      <EquipmentSlot item={player.equipment.boots} slotName="Bot" icon={Footprints} onClick={() => onUnequip('boots')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                  </div>

                  {/* Center Character Placeholder (Visual only) */}
                  <div className="w-24 h-64 bg-slate-900/50 rounded-full border border-slate-700/50 hidden md:flex items-center justify-center opacity-30">
                      <span className="cinzel text-4xl">⚔️</span>
                  </div>

                  {/* Right Column */}
                  <div className="flex flex-col gap-6">
                      <EquipmentSlot item={player.equipment.necklace} slotName="Kolye" icon={Circle} onClick={() => onUnequip('necklace')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                      <div className="flex gap-2">
                           <EquipmentSlot item={player.equipment.weapon} slotName="Silah" icon={Sword} onClick={() => onUnequip('weapon')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                           <EquipmentSlot item={player.equipment.shield} slotName="Kalkan" icon={Shield} onClick={() => onUnequip('shield')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                      </div>
                      <div className="flex gap-2">
                           <EquipmentSlot item={player.equipment.ring} slotName="Yüzük" icon={Circle} onClick={() => onUnequip('ring')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                           <EquipmentSlot item={player.equipment.earring} slotName="Küpe" icon={Circle} onClick={() => onUnequip('earring')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
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

      {/* RIGHT COLUMN: Inventory Grid & Management */}
      <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-slate-800/80 border border-slate-600 rounded-xl flex flex-col h-[500px]">
              
              {/* Toolbar */}
              <div className="p-4 border-b border-slate-700 flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-900/50 rounded-t-xl">
                  <div className="flex items-center gap-2 w-full md:w-auto">
                      <h3 className="font-bold text-white flex items-center gap-2"><Coins className="text-yellow-500"/> Çanta</h3>
                      <span className="text-xs text-slate-500">({player.inventory.length} / 100)</span>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                      {/* Search */}
                      <div className="relative flex-1 md:w-40">
                          <Search size={14} className="absolute left-2 top-2.5 text-slate-500"/>
                          <input 
                            type="text" 
                            placeholder="Ara..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded py-1.5 pl-7 pr-2 text-xs text-white focus:border-yellow-500 outline-none"
                          />
                      </div>
                      
                      {/* Filters */}
                      <select 
                        value={filterType} 
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="bg-slate-900 border border-slate-700 rounded py-1.5 px-2 text-xs text-white outline-none cursor-pointer hover:border-slate-500"
                      >
                          <option value="all">Tümü</option>
                          <option value="equip">Ekipman</option>
                          <option value="consumable">Tüketilebilir</option>
                          <option value="material">Materyal</option>
                      </select>
                  </div>
              </div>
              
              {/* Inventory Grid */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-900/20">
                  {processedInventory.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                          <Coins size={48} className="mb-2"/>
                          <p>Eşya bulunamadı.</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 content-start">
                          {processedInventory.map((item, idx) => (
                              <InventoryItem 
                                key={idx} // Using Index because ID might be shared in stack render logic
                                item={item}
                                isSelected={selectedInventoryItem?.name === item.name && selectedInventoryItem?.rarity === item.rarity}
                                onClick={() => setSelectedInventoryItem(item)}
                                onHover={setHoveredItem}
                                onLeave={() => setHoveredItem(null)}
                              />
                          ))}
                      </div>
                  )}
              </div>
          </div>

          {/* Selected Item Actions Panel */}
          {selectedInventoryItem ? (
             <div className="bg-slate-800 border border-slate-600 rounded-xl p-4 animate-fade-in flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded border border-slate-600 flex items-center justify-center">
                         {/* Dynamic Icon based on type */}
                         {React.createElement(TYPE_ICONS[selectedInventoryItem.type] || Shield, { size: 24, className: "text-slate-400" })}
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                            {selectedInventoryItem.name}
                            <span className="text-[10px] bg-slate-900 px-1 rounded text-slate-400 uppercase">{selectedInventoryItem.rarity}</span>
                        </h4>
                        <div className="flex gap-2 text-xs text-slate-400">
                            <span>{selectedInventoryItem.type}</span>
                            <span className="text-yellow-600 flex items-center gap-1"><Coins size={10}/> {calculateSellPrice(selectedInventoryItem)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    {['weapon', 'shield', 'armor', 'helmet', 'gloves', 'boots', 'ring', 'necklace', 'earring', 'belt'].includes(selectedInventoryItem.type) && (
                         <button 
                            onClick={() => handleSingleEquip(selectedInventoryItem)} 
                            className="flex-1 md:flex-none px-4 py-2 bg-green-700 hover:bg-green-600 text-white text-xs font-bold rounded flex items-center justify-center gap-2 transition-colors"
                         >
                            <Shield size={14}/> Kuşan
                         </button>
                    )}
                    
                    {selectedInventoryItem.type === 'consumable' && (
                        <button 
                             onClick={() => handleBatchUse(selectedInventoryItem)}
                             className="flex-1 md:flex-none px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold rounded flex items-center justify-center gap-2 transition-colors"
                        >
                            <FlaskConical size={14}/> Kullan
                        </button>
                    )}

                    <button 
                        onClick={() => handleBatchSell(selectedInventoryItem)}
                        className="flex-1 md:flex-none px-4 py-2 bg-yellow-700/20 hover:bg-yellow-700 border border-yellow-700/50 text-yellow-200 text-xs font-bold rounded flex items-center justify-center gap-2 transition-colors"
                    >
                        <CircleDollarSign size={14}/> Sat
                    </button>

                    <button 
                        onClick={() => handleBatchDelete(selectedInventoryItem)}
                        className="flex-1 md:flex-none px-4 py-2 bg-red-900/20 hover:bg-red-800 border border-red-900/50 text-red-300 text-xs font-bold rounded flex items-center justify-center gap-2 transition-colors"
                    >
                        <Trash2 size={14}/> Sil
                    </button>

                    <button 
                        onClick={() => setSelectedInventoryItem(null)}
                        className="px-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
             </div>
          ) : (
            <div className="bg-slate-800/30 border border-slate-700 border-dashed rounded-xl p-4 text-center text-slate-500 text-xs h-[84px] flex items-center justify-center">
                İşlem yapmak için çantadan bir eşya seçin.
            </div>
          )}
      </div>

    </div>
  );
};

export default CharacterProfile;
