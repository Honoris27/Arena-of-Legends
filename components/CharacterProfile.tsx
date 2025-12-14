import React, { useState, useEffect } from 'react';
import { Player, StatType, Equipment, Item, ItemRarity } from '../types';
import { calculateMaxXp, getPlayerTotalStats, calculateSellPrice } from '../services/gameLogic';
import { Sword, Shield, Zap, Brain, Clover, Plus, Crown, Hand, Footprints, Coins, Trash2, FlaskConical, Circle, Scroll, Edit, ShoppingBag, LayoutGrid } from 'lucide-react';
import ItemTooltip from './ItemTooltip';

interface CharacterProfileProps {
  player: Player;
  onUpgradeStat: (stat: StatType) => void;
  onEquip: (item: Item) => void;
  onUnequip: (slot: keyof Equipment) => void;
  onDelete: (item: Item) => void;
  onSell: (item: Item) => void;
  onUse: (item: Item) => void;
  onUpdateBio: (bio: string) => void;
}

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: 'border-[#555] bg-[#222]',
  uncommon: 'border-green-800 bg-[#0f2e15]',
  rare: 'border-blue-800 bg-[#0f1d2e]',
  epic: 'border-purple-800 bg-[#1f0f2e]',
  legendary: 'border-amber-600 bg-[#2e1f0f]',
};

const TYPE_ICONS: any = {
    weapon: Sword, shield: Shield, armor: Shield, helmet: Crown,
    gloves: Hand, boots: Footprints, consumable: FlaskConical,
    material: Coins, ring: Circle, necklace: Circle, earring: Circle, belt: Circle, scroll: Scroll
};

const EquipmentSlot = ({ item, icon: Icon, onClick, onHover, onLeave, className, onDrop }: any) => {
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div 
            onClick={item ? onClick : undefined}
            onMouseEnter={() => item && onHover(item)}
            onMouseLeave={onLeave}
            onDragOver={handleDragOver}
            onDrop={onDrop}
            className={`
                w-16 h-16 flex items-center justify-center cursor-pointer transition-all duration-100 shadow-[0_0_10px_rgba(0,0,0,0.5)] relative
                ${item ? `${RARITY_COLORS[item.rarity]} border-2 border-[#c5a059]` : 'item-slot-bg opacity-70 hover:opacity-100'}
                ${className}
            `}
        >
            {item ? (
                <div className="flex flex-col items-center pointer-events-none">
                    <Icon size={32} className="opacity-90 drop-shadow-md text-white" />
                    {item.upgradeLevel > 0 && (
                        <span className="absolute top-0 right-0 bg-red-700 text-white text-[10px] font-bold px-1 rounded-bl border-l border-b border-red-900 shadow">+{item.upgradeLevel}</span>
                    )}
                </div>
            ) : (
                <Icon size={28} className="text-[#5e3b1f] opacity-40" strokeWidth={1.5} />
            )}
        </div>
    );
};

const StatBar = ({ label, value, baseValue, max, colorClass, canUpgrade, onUpgrade }: any) => {
    const percentage = Math.min(100, (value / (max || 200)) * 100); 
    
    return (
        <div className="flex items-center gap-2 mb-1 group">
            <div className="w-20 text-[10px] font-bold text-[#5e3b1f] uppercase">{label}</div>
            <div className="flex-1 h-3 bg-[#1a0f0a] border border-[#5e3b1f] relative rounded-sm overflow-hidden">
                <div className={`h-full ${colorClass}`} style={{ width: `${percentage}%` }}></div>
                <div className="absolute inset-0 flex items-center justify-end pr-1 text-[9px] font-bold text-white drop-shadow-md leading-none">
                    {value}
                </div>
            </div>
            {canUpgrade && (
                <button onClick={onUpgrade} className="w-4 h-4 bg-[#c5a059] border border-[#5e3b1f] flex items-center justify-center text-[#3e2714] hover:bg-white rounded shadow text-[10px] font-bold leading-none pb-0.5">+</button>
            )}
        </div>
    );
}

const CharacterProfile: React.FC<CharacterProfileProps> = ({ player, onUpgradeStat, onEquip, onUnequip, onDelete, onSell, onUse, onUpdateBio }) => {
  const totalStats = getPlayerTotalStats(player);
  const maxXp = calculateMaxXp(player.level);
  const xpPercentage = Math.min(100, (player.currentXp / maxXp) * 100);

  const [hoveredItem, setHoveredItem] = useState<Item | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<Item | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState(player.bio || "");
  
  // Inventory State
  const [activeBag, setActiveBag] = useState(1);
  const BAG_CAPACITY = 50; // 5x10

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    if (hoveredItem) window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [hoveredItem]);

  const handleInventoryAction = (item: Item) => {
      if(['weapon','armor','helmet','gloves','boots','shield','ring','necklace','earring','belt'].includes(item.type)) {
          onEquip(item);
      } else if (item.type === 'consumable' || item.type === 'scroll') {
          onUse(item);
      }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, item: Item, source: 'inventory' | 'equipment') => {
      e.dataTransfer.setData("item", JSON.stringify(item));
      e.dataTransfer.setData("source", source);
  };

  const handleDropOnSlot = (e: React.DragEvent, slot: string) => {
      e.preventDefault();
      const itemData = e.dataTransfer.getData("item");
      const source = e.dataTransfer.getData("source");
      
      if (itemData && source === 'inventory') {
          const item = JSON.parse(itemData) as Item;
          // Simple type check mapping
          const typeMap: Record<string, string[]> = {
              'helmet': ['helmet'],
              'necklace': ['necklace'],
              'earring': ['earring'],
              'earring2': ['earring'],
              'armor': ['armor'],
              'belt': ['belt'],
              'ring': ['ring'],
              'ring2': ['ring'],
              'gloves': ['gloves'],
              'boots': ['boots'],
              'weapon': ['weapon'],
              'shield': ['shield']
          };

          if (typeMap[slot] && typeMap[slot].includes(item.type)) {
              onEquip(item);
          }
      }
  };

  const handleDropOnInventory = (e: React.DragEvent) => {
      e.preventDefault();
      const itemData = e.dataTransfer.getData("item");
      const source = e.dataTransfer.getData("source");
      
      if (itemData && source === 'equipment') {
          const item = JSON.parse(itemData) as Item;
          // Find which slot it came from (reverse lookup implies we just need to unequip the type)
          // Since we don't pass the exact slot key in drag data, we infer or we can pass it.
          // For simplicity, we try to unequip based on item ID match in equipment.
          Object.entries(player.equipment).forEach(([key, eqItem]) => {
              if (eqItem && eqItem.id === item.id) {
                  onUnequip(key as keyof Equipment);
              }
          });
      }
  };

  // Pagination for bags
  const startIndex = (activeBag - 1) * BAG_CAPACITY;
  const currentBagItems = player.inventory.slice(startIndex, startIndex + BAG_CAPACITY);

  return (
    <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-6 pb-20 select-none items-start">
      
      {/* --- LEFT COLUMN: AVATAR & STATS --- */}
      <div className="flex flex-col gap-4 w-full md:w-64 flex-shrink-0">
          
          {/* AVATAR BOX (Moved to Top) */}
          <div className="parchment-panel p-3 flex flex-col items-center">
              <div className="bg-[#8b1c1c] w-full text-[#f3e5ab] text-center font-cinzel font-bold text-sm py-1 mb-2 border border-[#3e2714] shadow-inner uppercase">
                  {player.name}
              </div>
              <div className="relative w-48 h-56 border-4 border-[#5e3b1f] bg-black overflow-hidden shadow-lg mb-2">
                  <img src={player.avatarUrl} className="w-full h-full object-cover" />
                  <button onClick={() => setIsEditing(!isEditing)} className="absolute bottom-0 w-full bg-[#c5a059]/90 text-[#3e2714] text-xs font-bold py-1 hover:bg-[#f3e5ab]">değiştir</button>
              </div>
              <div className="text-xs font-bold text-[#5e3b1f] uppercase tracking-widest">{player.role === 'admin' ? 'İmparator' : 'Gladyatör'}</div>
          </div>

          {/* STATS BOX */}
          <div className="parchment-panel p-3">
              <div className="bg-[#c5a059] text-[#3e2714] text-center font-cinzel font-bold text-sm py-1 mb-2 border border-[#5e3b1f] shadow-inner">
                  İSTATİSTİKLER
              </div>
              
              <div className="space-y-3 p-1">
                  <div className="flex justify-between items-center text-xs font-bold text-[#8a1c1c] border-b border-[#5e3b1f]/30 pb-1">
                      <span>Seviye</span> <span>{player.level}</span>
                  </div>
                  
                  <div className="space-y-1">
                      <div className="text-[10px] font-bold text-[#5e3b1f]">Yaşam Enerjisi</div>
                      <div className="h-3 bg-[#1a0f0a] border border-[#5e3b1f] relative rounded-sm">
                          <div className="h-full bg-red-700" style={{ width: `${Math.max(0, (player.hp / player.maxHp) * 100)}%` }}></div>
                          <div className="absolute inset-0 text-[8px] text-white flex items-center justify-center font-bold">{player.hp} / {player.maxHp}</div>
                      </div>
                  </div>

                  <div className="space-y-1">
                      <div className="text-[10px] font-bold text-[#5e3b1f]">Tecrübe</div>
                      <div className="h-3 bg-[#1a0f0a] border border-[#5e3b1f] relative rounded-sm">
                          <div className="h-full bg-yellow-600" style={{ width: `${xpPercentage}%` }}></div>
                          <div className="absolute inset-0 text-[8px] text-white flex items-center justify-center font-bold">{Math.floor(xpPercentage)}%</div>
                      </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-[#5e3b1f]">
                      <StatBar label="GÜÇ" value={totalStats.STR} baseValue={player.stats.STR} max={1000} colorClass="bg-green-600" canUpgrade={player.statPoints > 0} onUpgrade={() => onUpgradeStat('STR')} />
                      <StatBar label="BECERİ" value={totalStats.AGI} baseValue={player.stats.AGI} max={1000} colorClass="bg-green-600" canUpgrade={player.statPoints > 0} onUpgrade={() => onUpgradeStat('AGI')} />
                      <StatBar label="ÇEVİKLİK" value={totalStats.AGI} baseValue={player.stats.AGI} max={1000} colorClass="bg-green-600" canUpgrade={player.statPoints > 0} onUpgrade={() => onUpgradeStat('AGI')} />
                      <StatBar label="DAYANIKLILIK" value={totalStats.VIT} baseValue={player.stats.VIT} max={1000} colorClass="bg-green-600" canUpgrade={player.statPoints > 0} onUpgrade={() => onUpgradeStat('VIT')} />
                      <StatBar label="KARİZMA" value={totalStats.INT} baseValue={player.stats.INT} max={1000} colorClass="bg-green-600" canUpgrade={player.statPoints > 0} onUpgrade={() => onUpgradeStat('INT')} />
                      <StatBar label="ZEKA" value={totalStats.LUK} baseValue={player.stats.LUK} max={1000} colorClass="bg-green-600" canUpgrade={player.statPoints > 0} onUpgrade={() => onUpgradeStat('LUK')} />
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#5e3b1f] space-y-1 text-xs text-[#5e3b1f] font-bold text-right">
                      <div>Zırh <span className="text-[#3e2714]">{Math.floor(totalStats.VIT * 0.5)}</span></div>
                      <div>Hasar <span className="text-[#8a1c1c]">{Math.floor(totalStats.STR * 1.5)}-{Math.floor(totalStats.STR * 1.8)}</span></div>
                  </div>
              </div>
          </div>
      </div>

      {/* --- CENTER COLUMN: EQUIPMENT GRID --- */}
      <div className="parchment-panel p-6 flex flex-col items-center justify-center min-w-[360px]">
          
          <div className="flex items-center gap-4">
              {/* Left Weapon Slot */}
              <EquipmentSlot item={player.equipment.weapon} icon={Sword} className="w-20 h-32 border-4" onClick={() => onUnequip('weapon')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} onDrop={(e: any) => handleDropOnSlot(e, 'weapon')} />

              {/* The 3x4 Grid */}
              <div className="bg-[#dccbb6] p-2 border-2 border-[#8b5a2b] shadow-inner grid grid-cols-3 gap-2">
                  
                  {/* Row 1: Earring - Helmet - Earring */}
                  <EquipmentSlot item={player.equipment.earring} icon={Circle} onClick={() => onUnequip('earring')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} onDrop={(e: any) => handleDropOnSlot(e, 'earring')} />
                  <EquipmentSlot item={player.equipment.helmet} icon={Crown} onClick={() => onUnequip('helmet')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} onDrop={(e: any) => handleDropOnSlot(e, 'helmet')} />
                  <EquipmentSlot item={player.equipment.earring2} icon={Circle} onClick={() => onUnequip('earring2')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} onDrop={(e: any) => handleDropOnSlot(e, 'earring2')} />

                  {/* Row 2: Necklace - Armor - Belt */}
                  <EquipmentSlot item={player.equipment.necklace} icon={Circle} onClick={() => onUnequip('necklace')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} onDrop={(e: any) => handleDropOnSlot(e, 'necklace')} />
                  <EquipmentSlot item={player.equipment.armor} icon={Shield} onClick={() => onUnequip('armor')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} onDrop={(e: any) => handleDropOnSlot(e, 'armor')} />
                  <EquipmentSlot item={player.equipment.belt} icon={Circle} onClick={() => onUnequip('belt')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} onDrop={(e: any) => handleDropOnSlot(e, 'belt')} />

                  {/* Row 3: Ring - Pants(Visual) - Ring */}
                  <EquipmentSlot item={player.equipment.ring} icon={Circle} onClick={() => onUnequip('ring')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} onDrop={(e: any) => handleDropOnSlot(e, 'ring')} />
                  {/* Visual Placeholder for Pants - Non-functional as we don't have pants item type yet */}
                  <div className="w-16 h-16 bg-black/20 border border-[#8b5a2b] flex items-center justify-center opacity-50"><LayoutGrid size={24}/></div>
                  <EquipmentSlot item={player.equipment.ring2} icon={Circle} onClick={() => onUnequip('ring2')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} onDrop={(e: any) => handleDropOnSlot(e, 'ring2')} />

                  {/* Row 4: Gloves - Shoes(Boots) - Empty */}
                  <EquipmentSlot item={player.equipment.gloves} icon={Hand} onClick={() => onUnequip('gloves')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} onDrop={(e: any) => handleDropOnSlot(e, 'gloves')} />
                  <EquipmentSlot item={player.equipment.boots} icon={Footprints} onClick={() => onUnequip('boots')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} onDrop={(e: any) => handleDropOnSlot(e, 'boots')} />
                  <div className="w-16 h-16 bg-black/10 border border-[#8b5a2b] opacity-30"></div> 

              </div>

              {/* Right Shield Slot */}
              <EquipmentSlot item={player.equipment.shield} icon={Shield} className="w-20 h-32 border-4" onClick={() => onUnequip('shield')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} onDrop={(e: any) => handleDropOnSlot(e, 'shield')} />
          </div>

      </div>

      {/* --- RIGHT COLUMN: INVENTORY 5x10 --- */}
      <div className="parchment-panel p-2 flex-1 flex flex-col h-[650px]" onDragOver={(e) => e.preventDefault()} onDrop={handleDropOnInventory}>
          <div className="flex justify-between items-center mb-1 px-1">
              <div className="flex items-center gap-2">
                  <input type="checkbox" className="accent-[#8b5a2b]" />
                  <span className="text-xs text-[#5e3b1f]">Bütün yığını kaydır</span>
              </div>
          </div>

          {/* Bag Tabs */}
          <div className="flex gap-1 mb-1">
              {[1, 2, 3].map(bagId => (
                  <button 
                    key={bagId} 
                    onClick={() => setActiveBag(bagId)}
                    className={`
                        px-4 py-1 text-xs font-bold rounded-t border-t border-l border-r border-[#8b5a2b]
                        ${activeBag === bagId ? 'bg-[#2b1d12] text-[#c5a059]' : 'bg-[#eaddcf] text-[#5e3b1f] hover:bg-[#dccbb6]'}
                    `}
                  >
                      {bagId}. Çanta
                  </button>
              ))}
          </div>

          <div className="flex-1 bg-[#2b1d12] border-4 border-[#5e3b1f] p-1 shadow-inner relative">
              {/* 5 columns x 10 rows grid */}
              <div className="grid grid-cols-5 grid-rows-10 gap-1 h-full">
                  {Array.from({ length: 50 }).map((_, idx) => {
                      const item = currentBagItems[idx];
                      const isSelected = selectedInventoryItem?.id === item?.id;
                      
                      return (
                          <div 
                            key={idx}
                            className={`
                                relative border flex items-center justify-center cursor-pointer transition-colors
                                ${item ? (isSelected ? 'border-yellow-400 bg-white/20' : `${RARITY_COLORS[item.rarity]} border-opacity-50`) : 'bg-[#1a0f0a] border-[#3e2714] opacity-50'}
                            `}
                            onClick={() => item && setSelectedInventoryItem(item)}
                            onDoubleClick={() => item && handleInventoryAction(item)}
                            onMouseEnter={() => item && setHoveredItem(item)}
                            onMouseLeave={() => setHoveredItem(null)}
                            draggable={!!item}
                            onDragStart={(e) => item && handleDragStart(e, item, 'inventory')}
                          >
                              {item && (
                                  <>
                                    {TYPE_ICONS[item.type] && React.createElement(TYPE_ICONS[item.type], { size: 20, className: "text-white drop-shadow-md" })}
                                    {item.count > 1 && <span className="absolute bottom-0 right-0 text-[9px] text-white bg-black/60 px-1 font-mono font-bold rounded-tl">{item.count}</span>}
                                    {item.upgradeLevel > 0 && <span className="absolute top-0 left-0 text-[8px] text-red-500 font-bold drop-shadow-md">+{item.upgradeLevel}</span>}
                                  </>
                              )}
                          </div>
                      );
                  })}
              </div>
          </div>

          {/* Item Details Footer */}
          <div className="mt-2 border border-[#8b5a2b] bg-[#f3e5ab] p-2 rounded text-xs text-[#5e3b1f]">
              <div className="font-bold border-b border-[#8b5a2b]/30 mb-1 flex justify-between h-4 items-center">
                  <span>Ayrıntılar</span>
                  {selectedInventoryItem && <span className="text-[#8a1c1c] truncate max-w-[150px]">{selectedInventoryItem.name}</span>}
              </div>
              
              <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="detail" className="accent-[#8b5a2b]" /> yok</label>
                  <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="detail" className="accent-[#8b5a2b]" /> Kalite</label>
                  <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="detail" defaultChecked className="accent-[#8b5a2b]" /> Kalite / Seviye</label>
              </div>

              {selectedInventoryItem ? (
                  <div className="flex gap-2 justify-end">
                      <button onClick={() => onSell(selectedInventoryItem)} className="bg-[#5e3b1f] text-white px-2 py-1 rounded hover:bg-[#3e2714]">Sat ({calculateSellPrice(selectedInventoryItem)})</button>
                      <button onClick={() => onDelete(selectedInventoryItem)} className="bg-[#8a1c1c] text-white px-2 py-1 rounded hover:bg-red-800">Sil</button>
                  </div>
              ) : (
                  <div className="h-6"></div> // Spacer
              )}
          </div>
      </div>

      {/* Floating Tooltip */}
      {hoveredItem && (
          <div style={{ position: 'fixed', top: mousePos.y + 15, left: Math.min(mousePos.x + 15, window.innerWidth - 270), zIndex: 9999, pointerEvents: 'none' }}>
              <ItemTooltip item={hoveredItem} fixed />
          </div>
      )}
    </div>
  );
};

export default CharacterProfile;