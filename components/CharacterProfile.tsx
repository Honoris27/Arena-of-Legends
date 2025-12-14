
import React, { useState, useEffect, useMemo } from 'react';
import { Player, StatType, Equipment, Item, ItemRarity, ItemType } from '../types';
import { calculateMaxXp, getPlayerTotalStats, calculateSellPrice, canEquipItem, getStatDescription, getEquipmentBonuses } from '../services/gameLogic';
import { Sword, Shield, Zap, Brain, Clover, Plus, Crown, Hand, Footprints, Coins, CircleDollarSign, Trash2, FlaskConical, Circle, Search, X, Scroll, Edit, Lock, Trophy, Medal } from 'lucide-react';
import ItemTooltip from './ItemTooltip';
import { supabase } from '../services/supabase';

interface CharacterProfileProps {
  player: Player;
  onUpgradeStat: (stat: StatType) => void;
  onEquip: (item: Item) => void;
  onUnequip: (slot: keyof Equipment) => void;
  onDelete: (item: Item) => void;
  onSell: (item: Item) => void;
  onUse: (item: Item) => void;
  onUpdateBio: (bio: string) => void; // New prop
}

// ---- HELPER COMPONENTS ----

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: 'border-stone-600 bg-stone-800 text-stone-300',
  uncommon: 'border-green-800 bg-green-950/40 text-green-400',
  rare: 'border-blue-800 bg-blue-950/40 text-blue-300',
  epic: 'border-purple-800 bg-purple-950/40 text-purple-300',
  legendary: 'border-amber-600 bg-amber-950/40 text-amber-400',
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
    belt: Circle,
    scroll: Scroll
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
    // Styling specifically for empty vs filled slots
    const baseClass = "relative w-14 h-14 md:w-16 md:h-16 rounded border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-105 group shadow-inner";
    const emptyClass = "border-stone-700 bg-stone-900/50 border-dashed text-stone-700";
    const filledClass = item ? RARITY_COLORS[item.rarity] : "";

    return (
        <div 
            onClick={item ? onClick : undefined}
            onMouseEnter={() => item && onHover(item)}
            onMouseLeave={onLeave}
            className={`${baseClass} ${item ? filledClass : emptyClass}`}
        >
            {item ? (
                <div className="text-center">
                    <Icon className="mx-auto mb-1 opacity-90" size={24} />
                </div>
            ) : (
                <Icon size={24} />
            )}
            <span className="absolute -bottom-5 text-[9px] text-stone-500 whitespace-nowrap uppercase font-bold tracking-wider">{slotName}</span>
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
    onDoubleClick: () => void;
    onHover: (i: Item) => void;
    onLeave: () => void;
}

const InventoryItem: React.FC<InventoryItemProps> = ({ item, isSelected, onClick, onDoubleClick, onHover, onLeave }) => {
    const Icon = TYPE_ICONS[item.type] || Shield;
    
    return (
        <div 
            className={`
                relative group p-2 rounded border-2 transition-all cursor-pointer select-none
                ${isSelected 
                    ? 'border-amber-500 bg-stone-800 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                    : `${RARITY_COLORS[item.rarity]} hover:border-stone-400`}
            `}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onMouseEnter={() => onHover(item)}
            onMouseLeave={onLeave}
        >
            {/* Upgrade Badge */}
            {item.upgradeLevel > 0 && (
                <div className="absolute top-0 left-0 bg-stone-900 border border-stone-600 text-amber-500 text-[9px] font-bold px-1 rounded-br z-10">
                    +{item.upgradeLevel}
                </div>
            )}

            {/* Stack Count Badge */}
            {item.count > 1 && (
                <div className="absolute top-0 right-0 bg-stone-900 border border-stone-600 text-stone-300 text-[9px] font-bold px-1 rounded-bl z-10">
                    x{item.count}
                </div>
            )}

            <div className="flex justify-center mb-1 mt-1">
                <Icon size={22} className={isSelected ? 'text-amber-100' : 'opacity-80'} />
            </div>
            
            <div className="text-[9px] text-center truncate opacity-80 font-serif">{item.name}</div>
        </div>
    );
};

const StatRow = ({ 
    label, value, baseValue, icon: Icon, canUpgrade, onUpgrade, colorClass, tooltip 
  }: { 
    label: string; value: number; baseValue: number; icon: React.ElementType; canUpgrade: boolean; onUpgrade: () => void; colorClass: string; tooltip: string;
  }) => {
    const bonus = value - baseValue;
    return (
      <div className="relative group/stat">
          <div className="flex items-center justify-between p-2 bg-stone-900/80 rounded mb-1 border border-stone-800 cursor-help transition-colors hover:bg-stone-800 hover:border-stone-600">
            <div className="flex items-center gap-2">
              <Icon size={14} className={colorClass} />
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wide">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-stone-200">{value}</span>
                {bonus > 0 && <span className="text-[10px] text-green-600 font-bold">(+{bonus})</span>}
                {canUpgrade && (
                    <button onClick={(e) => { e.stopPropagation(); onUpgrade(); }} className="bg-amber-700 hover:bg-amber-600 text-white p-0.5 rounded border border-amber-900 shadow-sm z-10">
                        <Plus size={12}/>
                    </button>
                )}
            </div>
          </div>
          
          {/* Tooltip */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-black/90 border border-stone-500 rounded p-2 text-[10px] text-stone-300 pointer-events-none opacity-0 group-hover/stat:opacity-100 transition-opacity z-50 shadow-xl whitespace-pre-wrap text-center">
              <div className="font-bold text-amber-500 mb-1">{label} Bonusu</div>
              {tooltip}
          </div>
      </div>
    );
  };

const CharacterProfile: React.FC<CharacterProfileProps> = ({ player, onUpgradeStat, onEquip, onUnequip, onDelete, onSell, onUse, onUpdateBio }) => {
  const totalStats = getPlayerTotalStats(player);
  const bonuses = getEquipmentBonuses(player.equipment);
  const maxXp = calculateMaxXp(player.level);
  const xpPercentage = Math.min(100, (player.currentXp / maxXp) * 100);

  // Floating Tooltip State
  const [hoveredItem, setHoveredItem] = useState<Item | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Inventory Logic State
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<DisplayItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'equip' | 'consumable' | 'material'>('all');

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState(player.bio || "");
  const [newPassword, setNewPassword] = useState("");
  const [passMessage, setPassMessage] = useState("");

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
      const stackableTypes: ItemType[] = ['material', 'consumable', 'scroll'];

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
            filterType === 'consumable' ? ['consumable', 'scroll'].includes(item.type) :
            filterType === 'material' ? item.type === 'material' : true;
          
          return matchesSearch && matchesType;
      });
  }, [player.inventory, searchTerm, filterType]);

  const handleSaveProfile = async () => {
      onUpdateBio(editBio);
      
      if(newPassword) {
          if(newPassword.length < 6) {
              setPassMessage("Şifre en az 6 karakter olmalı.");
              return;
          }
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if(error) setPassMessage("Şifre hatası: " + error.message);
          else {
              setPassMessage("Şifre başarıyla güncellendi.");
              setNewPassword("");
              setTimeout(() => setIsEditing(false), 1500);
          }
      } else {
          setIsEditing(false);
      }
  };

  // ... (Inventory handlers handleBatchSell etc. remain same, omitting for brevity as they are unchanged)
  const handleBatchSell = (displayItem: DisplayItem) => {
      const realItem = player.inventory.find(i => i.id === displayItem.stackIds[0]);
      if(realItem) onSell(realItem);
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

  const handleItemDoubleClick = (item: DisplayItem) => {
      if (['weapon', 'shield', 'armor', 'helmet', 'gloves', 'boots', 'ring', 'necklace', 'earring', 'belt'].includes(item.type)) {
          handleSingleEquip(item);
      } else if (item.type === 'consumable' || item.type === 'scroll') {
          handleBatchUse(item);
      }
  };

  return (
    <div className="max-w-6xl mx-auto pb-10 grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
      
      {/* EDIT MODAL */}
      {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur p-4">
              <div className="bg-stone-900 border border-stone-600 rounded-xl p-6 max-w-md w-full shadow-2xl rpg-panel">
                  <h3 className="text-xl font-bold text-amber-500 mb-4 flex items-center gap-2 cinzel"><Edit size={20}/> Profili Düzenle</h3>
                  
                  <div className="mb-4">
                      <label className="text-xs text-stone-400 block mb-1">Biyografi (Karakter Hikayesi)</label>
                      <textarea 
                          value={editBio} 
                          onChange={(e) => setEditBio(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-700 rounded p-2 text-stone-200 h-24 resize-none focus:border-amber-600 outline-none font-serif"
                      />
                  </div>
                  
                  <div className="mb-4 border-t border-stone-800 pt-4">
                      <label className="text-xs text-stone-400 block mb-1 flex items-center gap-1"><Lock size={12}/> Yeni Şifre (İsteğe Bağlı)</label>
                      <input 
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Değiştirmek için yazın..."
                          className="w-full bg-stone-950 border border-stone-700 rounded p-2 text-stone-200 focus:border-amber-600 outline-none"
                      />
                      {passMessage && <div className="text-xs mt-1 text-yellow-500">{passMessage}</div>}
                  </div>

                  <div className="flex gap-2 justify-end">
                      <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-stone-800 text-stone-400 rounded hover:bg-stone-700 border border-stone-600">İptal</button>
                      <button onClick={handleSaveProfile} className="px-4 py-2 bg-green-800 text-white font-bold rounded hover:bg-green-700 border border-green-600 shadow">Kaydet</button>
                  </div>
              </div>
          </div>
      )}

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
          <div className="rpg-panel rounded-lg p-4 flex gap-4 items-start relative overflow-hidden group">
               <button onClick={() => setIsEditing(true)} className="absolute top-2 right-2 p-1.5 bg-stone-800/50 rounded hover:bg-stone-700 text-stone-400 hover:text-white transition-colors">
                   <Edit size={14}/>
               </button>
               
               <div className="w-20 h-20 rounded-full border-2 border-amber-700 shadow-md overflow-hidden bg-black shrink-0">
                   <img src={player.avatarUrl} className="w-full h-full object-cover" />
               </div>
               <div className="flex-1 min-w-0">
                   <h2 className="text-xl font-black text-amber-500 cinzel tracking-wide truncate">{player.name}</h2>
                   <div className="text-xs text-stone-400 mb-1 font-serif">Seviye {player.level} Gladyatör</div>
                   
                   {/* Honor & Victory Points */}
                   <div className="flex gap-3 mb-2">
                       <div className="flex items-center gap-1 text-xs text-stone-300 bg-stone-900/50 px-2 py-0.5 rounded border border-stone-700" title="Zafer Puanı">
                           <Trophy size={12} className="text-green-500"/>
                           <span className="font-bold">{player.victoryPoints}</span>
                       </div>
                       <div className="flex items-center gap-1 text-xs text-stone-300 bg-stone-900/50 px-2 py-0.5 rounded border border-stone-700" title="Onur Puanı">
                           <Medal size={12} className="text-blue-500"/>
                           <span className="font-bold">{player.honor}</span>
                       </div>
                   </div>

                   {/* XP Bar */}
                   <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-700">
                        <div className="h-full bg-gradient-to-r from-amber-700 to-yellow-500" style={{ width: `${xpPercentage}%` }}></div>
                   </div>
                   <div className="text-[10px] text-right text-stone-500 mt-1">{player.currentXp} / {maxXp} XP</div>
               </div>
          </div>

          {/* Paper Doll Layout */}
          <div className="rpg-panel rounded-lg p-6 relative flex flex-col items-center bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')]">
              <h3 className="absolute top-2 left-3 text-xs font-bold text-stone-600 uppercase tracking-widest cinzel">Ekipman</h3>
              
              <div className="flex gap-6 mt-2">
                  {/* Left Column */}
                  <div className="flex flex-col gap-4 mt-8">
                      <EquipmentSlot item={player.equipment.helmet} slotName="Kask" icon={Crown} onClick={() => onUnequip('helmet')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                      <EquipmentSlot item={player.equipment.armor} slotName="Zırh" icon={Shield} onClick={() => onUnequip('armor')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                      <EquipmentSlot item={player.equipment.gloves} slotName="Eldiven" icon={Hand} onClick={() => onUnequip('gloves')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                      <EquipmentSlot item={player.equipment.belt} slotName="Kemer" icon={Circle} onClick={() => onUnequip('belt')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                      <EquipmentSlot item={player.equipment.boots} slotName="Bot" icon={Footprints} onClick={() => onUnequip('boots')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                  </div>

                  {/* Center Character Placeholder */}
                  <div className="w-32 h-80 bg-black/40 rounded-full border border-stone-700 hidden md:flex items-center justify-center opacity-40 shadow-inner">
                      <span className="cinzel text-6xl text-stone-600">⚔️</span>
                  </div>

                  {/* Right Column */}
                  <div className="flex flex-col gap-4 mt-8">
                      <EquipmentSlot item={player.equipment.necklace} slotName="Kolye" icon={Circle} onClick={() => onUnequip('necklace')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                      <div className="flex gap-2">
                           <EquipmentSlot item={player.equipment.weapon} slotName="Silah" icon={Sword} onClick={() => onUnequip('weapon')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                           <EquipmentSlot item={player.equipment.shield} slotName="Kalkan" icon={Shield} onClick={() => onUnequip('shield')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                      </div>
                      <div className="flex gap-2">
                           <EquipmentSlot item={player.equipment.ring} slotName="Yüzük I" icon={Circle} onClick={() => onUnequip('ring')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                           <EquipmentSlot item={player.equipment.ring2 || null} slotName="Yüzük II" icon={Circle} onClick={() => onUnequip('ring2')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                      </div>
                      <div className="flex gap-2">
                           <EquipmentSlot item={player.equipment.earring} slotName="Küpe I" icon={Circle} onClick={() => onUnequip('earring')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                           <EquipmentSlot item={player.equipment.earring2 || null} slotName="Küpe II" icon={Circle} onClick={() => onUnequip('earring2')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                      </div>
                  </div>
              </div>
          </div>

          {/* Stats Panel */}
          <div className="rpg-panel rounded-lg p-4">
              <div className="flex justify-between items-center mb-3 border-b border-stone-700 pb-2">
                  <h3 className="text-sm font-bold text-amber-500 uppercase cinzel">Özellikler</h3>
                  {player.statPoints > 0 && <span className="text-xs bg-yellow-900 text-yellow-200 px-2 py-0.5 rounded font-bold animate-pulse">{player.statPoints} Puan</span>}
              </div>
              <div className="space-y-1 mb-4">
                <StatRow label="Güç" value={totalStats.STR} baseValue={player.stats.STR} icon={Sword} canUpgrade={player.statPoints > 0} onUpgrade={() => onUpgradeStat('STR')} colorClass="text-red-500" tooltip={getStatDescription('STR', totalStats.STR, player.level)}/>
                <StatRow label="Çeviklik" value={totalStats.AGI} baseValue={player.stats.AGI} icon={Zap} canUpgrade={player.statPoints > 0} onUpgrade={() => onUpgradeStat('AGI')} colorClass="text-yellow-500" tooltip={getStatDescription('AGI', totalStats.AGI, player.level)}/>
                <StatRow label="Can" value={totalStats.VIT} baseValue={player.stats.VIT} icon={Shield} canUpgrade={player.statPoints > 0} onUpgrade={() => onUpgradeStat('VIT')} colorClass="text-green-500" tooltip={getStatDescription('VIT', totalStats.VIT, player.level)}/>
                <StatRow label="Zeka" value={totalStats.INT} baseValue={player.stats.INT} icon={Brain} canUpgrade={player.statPoints > 0} onUpgrade={() => onUpgradeStat('INT')} colorClass="text-blue-500" tooltip={getStatDescription('INT', totalStats.INT, player.level)}/>
                <StatRow label="Şans" value={totalStats.LUK} baseValue={player.stats.LUK} icon={Clover} canUpgrade={player.statPoints > 0} onUpgrade={() => onUpgradeStat('LUK')} colorClass="text-purple-500" tooltip={getStatDescription('LUK', totalStats.LUK, player.level)}/>
              </div>

              {/* Advanced Stats */}
              <div className="bg-stone-950 p-2 rounded border border-stone-800 space-y-1">
                  <div className="flex justify-between text-xs text-stone-400">
                      <span>Ekstra Savunma:</span> <span className="text-green-400 font-mono">+{bonuses.defense}</span>
                  </div>
                  <div className="flex justify-between text-xs text-stone-400">
                      <span>Kritik Direnci:</span> <span className="text-blue-400 font-mono">%{bonuses.critRes}</span>
                  </div>
                  <div className="flex justify-between text-xs text-stone-400">
                      <span>Ekstra Kritik Şansı:</span> <span className="text-yellow-400 font-mono">%{bonuses.critChanceBonus}</span>
                  </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                  <div className="bg-black/40 p-2 rounded border border-red-900/30">
                      <div className="text-[10px] text-stone-500">Can (HP)</div>
                      <div className="text-sm font-bold text-red-500 font-mono">{player.hp} / {player.maxHp}</div>
                  </div>
                  <div className="bg-black/40 p-2 rounded border border-blue-900/30">
                      <div className="text-[10px] text-stone-500">Mana (MP)</div>
                      <div className="text-sm font-bold text-blue-500 font-mono">{player.mp} / {player.maxMp}</div>
                  </div>
              </div>
          </div>

      </div>

      {/* RIGHT COLUMN: Inventory Grid & Management */}
      <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="rpg-panel rounded-lg flex flex-col h-[600px] border-2 border-stone-600">
              
              {/* Toolbar */}
              <div className="p-3 border-b border-stone-600 flex flex-col md:flex-row gap-3 justify-between items-center bg-stone-900 rounded-t-lg">
                  <div className="flex items-center gap-2 w-full md:w-auto">
                      <h3 className="font-bold text-stone-300 flex items-center gap-2 cinzel text-lg"><Coins className="text-amber-500"/> Çanta</h3>
                      <span className="text-xs text-stone-500 font-serif italic">({player.inventory.length} / 100)</span>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                      {/* Search */}
                      <div className="relative flex-1 md:w-40">
                          <Search size={14} className="absolute left-2 top-2.5 text-stone-500"/>
                          <input 
                            type="text" 
                            placeholder="Eşya ara..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-700 rounded py-1.5 pl-7 pr-2 text-xs text-stone-300 focus:border-amber-600 outline-none"
                          />
                      </div>
                      
                      {/* Filters */}
                      <select 
                        value={filterType} 
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="bg-stone-950 border border-stone-700 rounded py-1.5 px-2 text-xs text-stone-300 outline-none cursor-pointer hover:border-amber-600"
                      >
                          <option value="all">Tümü</option>
                          <option value="equip">Ekipman</option>
                          <option value="consumable">İksir/Parşömen</option>
                          <option value="material">Materyal</option>
                      </select>
                  </div>
              </div>
              
              {/* Inventory Grid - Using a texture background */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-stone-950 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]">
                  {processedInventory.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-stone-600 opacity-50">
                          <Coins size={48} className="mb-2"/>
                          <p className="font-serif">Çanta boş.</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 content-start">
                          {processedInventory.map((item, idx) => (
                              <InventoryItem 
                                key={idx} 
                                item={item}
                                isSelected={selectedInventoryItem?.name === item.name && selectedInventoryItem?.rarity === item.rarity}
                                onClick={() => setSelectedInventoryItem(item)}
                                onDoubleClick={() => handleItemDoubleClick(item)}
                                onHover={setHoveredItem}
                                onLeave={() => setHoveredItem(null)}
                              />
                          ))}
                      </div>
                  )}
              </div>
          </div>

          {/* Selected Item Actions Panel */}
          <div className="rpg-panel rounded-lg p-4 min-h-[100px] flex items-center justify-center">
          {selectedInventoryItem ? (
             <div className="w-full flex flex-col md:flex-row gap-4 items-center justify-between animate-fade-in">
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded border-2 flex items-center justify-center bg-stone-900 ${RARITY_COLORS[selectedInventoryItem.rarity]}`}>
                         {React.createElement(TYPE_ICONS[selectedInventoryItem.type] || Shield, { size: 28, className: "opacity-90" })}
                    </div>
                    <div>
                        <h4 className={`font-bold text-sm flex items-center gap-2 cinzel ${selectedInventoryItem.rarity === 'legendary' ? 'text-amber-500' : 'text-stone-200'}`}>
                            {selectedInventoryItem.name}
                        </h4>
                        <div className="flex gap-3 text-xs text-stone-400 mt-1">
                            <span className="uppercase tracking-wide">{selectedInventoryItem.type}</span>
                            <span className="text-amber-600 font-bold flex items-center gap-1"><Coins size={12}/> {calculateSellPrice(selectedInventoryItem)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    {['weapon', 'shield', 'armor', 'helmet', 'gloves', 'boots', 'ring', 'necklace', 'earring', 'belt'].includes(selectedInventoryItem.type) && (
                         <button 
                            onClick={() => handleSingleEquip(selectedInventoryItem)} 
                            className="flex-1 md:flex-none rpg-btn text-green-400 hover:text-green-300 px-4 py-2 rounded text-xs font-bold flex items-center justify-center gap-2"
                         >
                            <Shield size={14}/> KUŞAN
                         </button>
                    )}
                    
                    {(selectedInventoryItem.type === 'consumable' || selectedInventoryItem.type === 'scroll') && (
                        <button 
                             onClick={() => handleBatchUse(selectedInventoryItem)}
                             className="flex-1 md:flex-none rpg-btn text-blue-400 hover:text-blue-300 px-4 py-2 rounded text-xs font-bold flex items-center justify-center gap-2"
                        >
                            <FlaskConical size={14}/> {selectedInventoryItem.type === 'scroll' ? 'OKU' : 'KULLAN'}
                        </button>
                    )}

                    <button 
                        onClick={() => handleBatchSell(selectedInventoryItem)}
                        className="flex-1 md:flex-none rpg-btn text-amber-500 hover:text-amber-300 px-4 py-2 rounded text-xs font-bold flex items-center justify-center gap-2"
                    >
                        <CircleDollarSign size={14}/> SAT
                    </button>

                    <button 
                        onClick={() => handleBatchDelete(selectedInventoryItem)}
                        className="flex-1 md:flex-none rpg-btn text-red-500 hover:text-red-400 px-4 py-2 rounded text-xs font-bold flex items-center justify-center gap-2"
                    >
                        <Trash2 size={14}/> YOK ET
                    </button>

                    <button 
                        onClick={() => setSelectedInventoryItem(null)}
                        className="px-2 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded transition-colors border border-stone-600"
                    >
                        <X size={16} />
                    </button>
                </div>
             </div>
          ) : (
            <div className="text-stone-500 text-sm font-serif italic opacity-60">
                Detayları görmek için bir eşyaya dokun...
            </div>
          )}
          </div>
      </div>

    </div>
  );
};

export default CharacterProfile;
