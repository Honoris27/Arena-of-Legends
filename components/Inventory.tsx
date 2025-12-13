import React from 'react';
import { Item, ItemRarity } from '../types';
import { calculateSellPrice } from '../services/gameLogic';
import { Sword, Shield, Crown, Hand, Footprints, Trash2, Coins, FlaskConical, CircleDollarSign } from 'lucide-react';

interface InventoryProps {
  items: Item[];
  onEquip: (item: Item) => void;
  onDelete: (item: Item) => void;
  onSell: (item: Item) => void;
  onUse: (item: Item) => void;
}

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: 'border-slate-600 bg-slate-800 text-slate-300',
  uncommon: 'border-green-600 bg-green-900/20 text-green-300',
  rare: 'border-blue-600 bg-blue-900/20 text-blue-300',
  epic: 'border-purple-600 bg-purple-900/20 text-purple-300',
  legendary: 'border-orange-600 bg-orange-900/20 text-orange-300',
};

const TYPE_ICONS: any = {
  weapon: Sword,
  armor: Shield,
  helmet: Crown,
  gloves: Hand,
  boots: Footprints,
  consumable: FlaskConical,
  material: Coins // Fallback or generic
};

const Inventory: React.FC<InventoryProps> = ({ items, onEquip, onDelete, onSell, onUse }) => {
  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="text-center mb-8">
        <h2 className="text-3xl cinzel font-bold text-white mb-2">Çanta</h2>
        <p className="text-slate-400">{items.length} Eşya</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
           <p className="text-slate-500">Çantan bomboş...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item, index) => {
            const Icon = TYPE_ICONS[item.type] || Shield;
            const isEquippable = ['weapon', 'armor', 'helmet', 'gloves', 'boots'].includes(item.type);
            const isConsumable = item.type === 'consumable';
            const sellPrice = calculateSellPrice(item);
            
            return (
              <div 
                key={item.id}
                className={`
                  relative group p-3 rounded-xl border-2 transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer animate-pop-in
                  ${RARITY_COLORS[item.rarity]}
                `}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => isEquippable && onEquip(item)}
              >
                {/* Upgrade Badge */}
                {item.upgradeLevel > 0 && (
                    <div className="absolute top-1 right-1 bg-yellow-600 text-white text-[10px] font-bold px-1.5 rounded shadow-sm z-10">
                        +{item.upgradeLevel}
                    </div>
                )}

                <div className="flex justify-center mb-2">
                  <Icon size={28} />
                </div>
                <h4 className="font-bold text-xs text-center mb-1 truncate">{item.name}</h4>
                <p className="text-[9px] text-center uppercase tracking-wider opacity-70 mb-2">{item.rarity}</p>
                
                {/* Value Display */}
                <div className="flex justify-center text-xs text-yellow-500/80 gap-1 items-center bg-black/20 rounded py-1 mb-2">
                    <Coins size={10} /> {item.value}
                </div>

                {/* Quick Actions (Always Visible on Hover, or separate buttons) */}
                <div className="grid grid-cols-2 gap-1 mt-2">
                     {isConsumable && (
                        <button 
                             onClick={(e) => { e.stopPropagation(); onUse(item); }}
                             className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] py-1 rounded font-bold"
                         >
                             Kullan
                         </button>
                     )}
                     
                     <button 
                        onClick={(e) => { e.stopPropagation(); onSell(item); }}
                        className="bg-yellow-600/20 hover:bg-yellow-600 border border-yellow-600/50 text-yellow-500 hover:text-white text-[10px] py-1 rounded flex items-center justify-center gap-1"
                        title={`Sat: ${sellPrice} Altın`}
                     >
                        <CircleDollarSign size={12} /> Sat
                     </button>
                     
                     <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                        className="bg-red-600/20 hover:bg-red-600 border border-red-600/50 text-red-500 hover:text-white text-[10px] py-1 rounded flex items-center justify-center"
                        title="Sil (Yok Et)"
                     >
                        <Trash2 size={12} />
                     </button>
                </div>

                {isEquippable && (
                    <div className="mt-2 text-center text-[9px] text-slate-500 group-hover:text-yellow-400 transition-colors">
                        Kuşanmak için tıkla
                    </div>
                )}

                {/* RICH TOOLTIP */}
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 border border-slate-500 rounded-lg shadow-2xl p-3 z-50 pointer-events-none">
                    <h5 className={`font-bold text-sm mb-1 ${RARITY_COLORS[item.rarity].split(' ').pop()}`}>{item.name} {item.upgradeLevel > 0 ? `+${item.upgradeLevel}` : ''}</h5>
                    <p className="text-[10px] text-slate-400 italic mb-2">{item.description}</p>
                    <div className="space-y-1 border-t border-slate-700 pt-2 mb-2">
                         {Object.entries(item.stats).map(([key, val]) => (
                             <div key={key} className="flex justify-between text-xs">
                                <span className="text-slate-300">{key}</span>
                                <span className="text-green-400 font-mono">+{val}</span>
                             </div>
                         ))}
                    </div>
                    <div className="text-[10px] text-yellow-500 flex items-center justify-end gap-1">
                        Satış Fiyatı: {sellPrice} <Coins size={10} />
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Inventory;