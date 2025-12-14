
import React, { useState, useEffect } from 'react';
import { Player, StatType, Equipment, Item, ItemRarity } from '../types';
import { calculateMaxXp, getPlayerTotalStats, calculateSellPrice } from '../services/gameLogic';
import { Sword, Shield, Zap, Brain, Clover, Plus, Crown, Hand, Footprints, Coins, Trash2, FlaskConical, Circle, Scroll, Edit } from 'lucide-react';
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

const EquipmentSlot = ({ item, icon: Icon, onClick, onHover, onLeave, className }: any) => (
    <div 
        onClick={item ? onClick : undefined}
        onMouseEnter={() => item && onHover(item)}
        onMouseLeave={onLeave}
        className={`
            absolute w-14 h-14 md:w-16 md:h-16 flex items-center justify-center cursor-pointer transition-all duration-100 shadow-[0_0_10px_rgba(0,0,0,0.5)]
            ${item ? `${RARITY_COLORS[item.rarity]} border-2 border-[#c5a059]` : 'item-slot-bg opacity-70 hover:opacity-100'}
            ${className}
        `}
    >
        {item ? (
            <div className="flex flex-col items-center">
                <Icon size={28} className="opacity-90 drop-shadow-md text-white" />
                {item.upgradeLevel > 0 && (
                    <span className="absolute top-0 right-0 bg-red-700 text-white text-[10px] font-bold px-1 rounded-bl border-l border-b border-red-900 shadow">+{item.upgradeLevel}</span>
                )}
            </div>
        ) : (
            <Icon size={24} className="text-[#5e3b1f] opacity-40" strokeWidth={1.5} />
        )}
    </div>
);

const StatBar = ({ label, value, baseValue, max, colorClass, canUpgrade, onUpgrade }: any) => {
    const bonus = value - baseValue;
    const percentage = Math.min(100, (value / (max || 200)) * 100); // Arbitrary max for visual bar
    
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
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState(player.bio || "");

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

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 pb-20 select-none items-start">
      
      {/* --- LEFT COLUMN: STATS --- */}
      <div className="parchment-panel p-3 w-full lg:w-64 flex-shrink-0">
          <div className="bg-[#c5a059] text-[#3e2714] text-center font-cinzel font-bold text-sm py-1 mb-2 border border-[#5e3b1f] shadow-inner">
              İSTATİSTİKLER
          </div>
          
          <div className="space-y-3 p-2">
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
                  <StatBar label="Güç" value={totalStats.STR} baseValue={player.stats.STR} max={2000} colorClass="bg-green-600" canUpgrade={player.statPoints > 0} onUpgrade={() => onUpgradeStat('STR')} />
                  <StatBar label="Beceri" value={totalStats.AGI} baseValue={player.stats.AGI} max={2000} colorClass="bg-green-600" canUpgrade={player.statPoints > 0} onUpgrade={() => onUpgradeStat('AGI')} />
                  <StatBar label="Çeviklik" value={totalStats.AGI} baseValue={player.stats.AGI} max={2000} colorClass="bg-green-600" canUpgrade={player.statPoints > 0} onUpgrade={() => onUpgradeStat('AGI')} />
                  <StatBar label="Dayanıklılık" value={totalStats.VIT} baseValue={player.stats.VIT} max={2000} colorClass="bg-green-600" canUpgrade={player.statPoints > 0} onUpgrade={() => onUpgradeStat('VIT')} />
                  <StatBar label="Karizma" value={totalStats.INT} baseValue={player.stats.INT} max={2000} colorClass="bg-green-600" canUpgrade={player.statPoints > 0} onUpgrade={() => onUpgradeStat('INT')} />
                  <StatBar label="Zeka" value={totalStats.LUK} baseValue={player.stats.LUK} max={2000} colorClass="bg-green-600" canUpgrade={player.statPoints > 0} onUpgrade={() => onUpgradeStat('LUK')} />
              </div>

              <div className="mt-2 pt-2 border-t border-[#5e3b1f] space-y-1 text-xs text-[#5e3b1f] font-bold">
                  <div className="flex justify-between"><span>Zırh</span> <span>{Math.floor(totalStats.VIT * 0.5)}</span></div>
                  <div className="flex justify-between text-[#8a1c1c]"><span>Hasar</span> <span>{Math.floor(totalStats.STR * 1.5)}-{Math.floor(totalStats.STR * 1.8)}</span></div>
              </div>
          </div>
      </div>

      {/* --- CENTER COLUMN: PAPER DOLL --- */}
      <div className="parchment-panel flex-col items-center p-4 relative min-w-[340px] hidden md:flex">
          <div className="bg-red-900 border-2 border-yellow-500 text-yellow-100 font-cinzel font-bold text-lg px-6 py-1 rounded shadow-lg mb-4 text-center min-w-[200px]">
              {player.name}
              <div className="text-[10px] text-yellow-300 font-normal uppercase tracking-widest">Gladyatör</div>
          </div>

          <div className="relative w-[340px] h-[400px] bg-[#eaddcf] border-4 border-[#eaddcf] shadow-inner rounded-xl overflow-visible">
              
              {/* Character Image */}
              <div className="absolute top-4 left-4 w-[180px] h-[220px] border-2 border-[#5e3b1f] bg-black overflow-hidden shadow-lg z-10">
                  <img src={player.avatarUrl} className="w-full h-full object-cover" />
              </div>
              <button onClick={() => setIsEditing(!isEditing)} className="absolute top-[230px] left-4 w-[180px] bg-[#c5a059] border border-[#5e3b1f] text-[#3e2714] text-xs font-bold py-1 rounded shadow hover:bg-white">değiştir</button>

              {/* SLOTS - Absolute Layout based on Screenshot */}
              <div className="absolute top-0 right-0 w-[140px] h-full">
                  {/* Helmet */}
                  <EquipmentSlot item={player.equipment.helmet} icon={Crown} className="top-4 left-1/2 -translate-x-1/2" onClick={() => onUnequip('helmet')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                  
                  {/* Necklace & Earrings (Small) */}
                  <EquipmentSlot item={player.equipment.necklace} icon={Circle} className="top-24 left-1/2 translate-x-4 w-8 h-8" onClick={() => onUnequip('necklace')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
                  <EquipmentSlot item={player.equipment.earring} icon={Circle} className="top-24 left-1/2 -translate-x-12 w-8 h-8" onClick={() => onUnequip('earring')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />

                  {/* Armor */}
                  <EquipmentSlot item={player.equipment.armor} icon={Shield} className="top-36 left-1/2 -translate-x-1/2 w-16 h-20" onClick={() => onUnequip('armor')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />

                  {/* Belt */}
                  <EquipmentSlot item={player.equipment.belt} icon={Circle} className="bottom-24 left-1/2 -translate-x-1/2 h-8" onClick={() => onUnequip('belt')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />

                  {/* Boots */}
                  <EquipmentSlot item={player.equipment.boots} icon={Footprints} className="bottom-4 left-1/2 -translate-x-1/2" onClick={() => onUnequip('boots')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
              </div>

              {/* Weapon & Shield on Sides of Image */}
              <EquipmentSlot item={player.equipment.weapon} icon={Sword} className="top-4 -right-16 h-24" onClick={() => onUnequip('weapon')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
              <EquipmentSlot item={player.equipment.shield} icon={Shield} className="top-32 -right-16 h-24" onClick={() => onUnequip('shield')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
              
              {/* Gloves */}
              <EquipmentSlot item={player.equipment.gloves} icon={Hand} className="bottom-32 left-4 w-12 h-12" onClick={() => onUnequip('gloves')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
              
              {/* Rings */}
              <EquipmentSlot item={player.equipment.ring} icon={Circle} className="bottom-16 left-4 w-8 h-8" onClick={() => onUnequip('ring')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />
              <EquipmentSlot item={player.equipment.ring2} icon={Circle} className="bottom-16 left-14 w-8 h-8" onClick={() => onUnequip('ring2')} onHover={setHoveredItem} onLeave={() => setHoveredItem(null)} />

          </div>
      </div>

      {/* --- RIGHT COLUMN: INVENTORY GRID --- */}
      <div className="parchment-panel p-2 flex-1 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-2 px-1">
              <div className="flex items-center gap-2">
                  <input type="checkbox" className="accent-[#8b5a2b]" />
                  <span className="text-xs text-[#5e3b1f]">Bütün yığını kaydır</span>
              </div>
          </div>

          <div className="flex-1 bg-[#2b1d12] border-4 border-[#5e3b1f] p-1 grid grid-cols-5 gap-1 content-start overflow-y-auto custom-scrollbar h-[350px] shadow-inner relative">
              {/* Grid Background */}
              <div className="absolute inset-0 grid grid-cols-5 gap-1 p-1 pointer-events-none">
                  {Array.from({ length: 40 }).map((_, i) => (
                      <div key={i} className="bg-[#1a0f0a] border border-[#3e2714] rounded-sm opacity-50"></div>
                  ))}
              </div>

              {/* Render Items */}
              {player.inventory.map((item, idx) => {
                  const Icon = TYPE_ICONS[item.type] || Shield;
                  const isSelected = selectedInventoryItem?.id === item.id;
                  return (
                      <div 
                        key={item.id}
                        onClick={() => setSelectedInventoryItem(item)}
                        onDoubleClick={() => handleInventoryAction(item)}
                        onMouseEnter={() => setHoveredItem(item)}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={`
                            w-full aspect-square border cursor-pointer flex flex-col items-center justify-center relative z-10
                            ${isSelected ? 'border-yellow-400 bg-white/20' : `${RARITY_COLORS[item.rarity]} border-opacity-50`}
                        `}
                      >
                          <Icon size={24} className="text-white drop-shadow-md" />
                          {item.count > 1 && <span className="absolute bottom-0 right-0 text-[10px] text-white bg-black/60 px-1 font-mono font-bold rounded-tl">{item.count}</span>}
                          {item.upgradeLevel > 0 && <span className="absolute top-0 left-0 text-[9px] text-red-500 font-bold drop-shadow-md">+{item.upgradeLevel}</span>}
                      </div>
                  )
              })}
          </div>

          {/* Item Details Footer */}
          <div className="mt-2 border border-[#8b5a2b] bg-[#f3e5ab] p-2 rounded text-xs text-[#5e3b1f]">
              <div className="font-bold border-b border-[#8b5a2b]/30 mb-1 flex justify-between">
                  <span>Ayrıntılar</span>
                  {selectedInventoryItem && <span className="text-[#8a1c1c]">{selectedInventoryItem.name}</span>}
              </div>
              
              <div className="flex gap-4">
                  <label className="flex items-center gap-1"><input type="radio" name="detail" className="accent-[#8b5a2b]" /> yok</label>
                  <label className="flex items-center gap-1"><input type="radio" name="detail" className="accent-[#8b5a2b]" /> Kalite</label>
                  <label className="flex items-center gap-1"><input type="radio" name="detail" defaultChecked className="accent-[#8b5a2b]" /> Kalite / Seviye</label>
              </div>

              {selectedInventoryItem && (
                  <div className="mt-2 flex gap-2 justify-end">
                      <button onClick={() => onSell(selectedInventoryItem)} className="bg-[#5e3b1f] text-white px-2 py-1 rounded hover:bg-[#3e2714]">Sat ({calculateSellPrice(selectedInventoryItem)})</button>
                      <button onClick={() => onDelete(selectedInventoryItem)} className="bg-[#8a1c1c] text-white px-2 py-1 rounded hover:bg-red-800">Sil</button>
                  </div>
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
