import React, { useState } from 'react';
import { Item } from '../types';
import { calculateUpgradeCost, calculateSuccessRate } from '../services/gameLogic';
import { Hammer, Coins, ArrowUp, Zap, Sparkles } from 'lucide-react';

interface BlacksmithProps {
  inventory: Item[];
  playerGold: number;
  onUpgrade: (item: Item, cost: number, hasLuck: boolean) => void;
}

const Blacksmith: React.FC<BlacksmithProps> = ({ inventory, playerGold, onUpgrade }) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [useLuck, setUseLuck] = useState(false);

  // Filter items logic
  const upgradeableItems = inventory.filter(i => i.type !== 'material' && i.type !== 'consumable');
  const luckItems = inventory.filter(i => i.name === 'Şans Tozu');
  const hasLuckItem = luckItems.length > 0;

  const cost = selectedItem ? calculateUpgradeCost(selectedItem) : 0;
  const canAfford = playerGold >= cost;
  
  const baseSuccess = selectedItem ? calculateSuccessRate(selectedItem) : 0;
  const finalSuccess = Math.min(100, baseSuccess + (useLuck ? 20 : 0));

  return (
    <div className="max-w-5xl mx-auto flex flex-col items-center">
      <div className="text-center mb-8">
        <h2 className="text-3xl cinzel font-bold text-orange-500 mb-2 flex items-center justify-center gap-3">
            <Hammer size={32} /> Demirci Atölyesi
        </h2>
        <p className="text-slate-400">Ateş ve çelikle kaderini şekillendir.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 w-full">
          {/* Anvil Section */}
          <div className="flex-1 bg-slate-800 border-2 border-orange-900/50 rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-900/20 via-slate-900/50 to-slate-900 pointer-events-none"></div>

             {selectedItem ? (
                 <div className="relative z-10 w-full flex flex-col items-center animate-fade-in">
                     <div className={`w-24 h-24 border-2 rounded-xl mb-4 flex items-center justify-center bg-slate-900 shadow-[0_0_30px_rgba(234,88,12,0.3)]`}>
                        <Zap size={40} className="text-orange-400" />
                     </div>
                     
                     <h3 className="text-xl font-bold text-white mb-1">{selectedItem.name}</h3>
                     <span className="text-orange-400 text-sm font-bold mb-6">Seviye +{selectedItem.upgradeLevel}</span>

                     <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-6">
                        <div className="bg-slate-900/80 p-3 rounded text-center border border-slate-700">
                            <span className="block text-slate-500 text-xs uppercase mb-1">Maliyet</span>
                            <span className="text-lg font-mono text-yellow-500 flex items-center justify-center gap-1">
                                {cost} <Coins size={14} />
                            </span>
                        </div>
                        <div className="bg-slate-900/80 p-3 rounded text-center border border-slate-700">
                            <span className="block text-slate-500 text-xs uppercase mb-1">Başarı Şansı</span>
                            <span className={`text-lg font-mono font-bold ${finalSuccess > 70 ? 'text-green-400' : finalSuccess > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                %{finalSuccess}
                            </span>
                        </div>
                     </div>

                     {/* Luck Item Toggle */}
                     <div className="w-full max-w-sm mb-6 p-3 bg-slate-900/50 rounded-lg border border-slate-700 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <span className="text-xl">✨</span>
                             <div className="text-left">
                                 <div className="text-sm font-bold text-slate-200">Şans Tozu</div>
                                 <div className="text-[10px] text-slate-500">Mevcut: {luckItems.length}</div>
                             </div>
                         </div>
                         <button 
                            onClick={() => setUseLuck(!useLuck)}
                            disabled={!hasLuckItem}
                            className={`px-3 py-1 text-xs rounded border transition-colors ${
                                useLuck 
                                ? 'bg-purple-600 border-purple-400 text-white' 
                                : hasLuckItem ? 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-300' : 'opacity-50 cursor-not-allowed bg-slate-800 border-slate-800'
                            }`}
                         >
                             {useLuck ? 'Kullanılıyor (+%20)' : 'Kullan'}
                         </button>
                     </div>

                     <button 
                        onClick={() => onUpgrade(selectedItem, cost, useLuck)}
                        disabled={!canAfford}
                        className={`
                            w-full max-w-sm py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 transition-all
                            ${canAfford 
                                ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_20px_rgba(234,88,12,0.4)] hover:scale-105' 
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
                        `}
                     >
                        <Hammer className={canAfford ? 'animate-bounce' : ''} />
                        GELİŞTİRMEYİ DENE
                     </button>
                     {!canAfford && <p className="text-red-500 text-xs mt-2">Yetersiz Altın</p>}
                 </div>
             ) : (
                 <div className="text-center text-slate-500">
                     <Hammer size={64} className="mx-auto mb-4 opacity-20" />
                     <p>Çantadan bir eşya seç.</p>
                 </div>
             )}
          </div>

          {/* Inventory Selection */}
          <div className="w-full md:w-80 bg-slate-900/50 border-l border-slate-800 p-4 h-[500px] overflow-y-auto">
              <h4 className="font-bold text-slate-400 mb-4 sticky top-0 bg-slate-900 py-2 z-10">Geliştirilebilir Eşyalar</h4>
              <div className="grid grid-cols-3 gap-2">
                  {upgradeableItems.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => { setSelectedItem(item); setUseLuck(false); }}
                        className={`
                            aspect-square rounded border cursor-pointer p-2 flex flex-col items-center justify-center text-xs text-center transition-all
                            ${selectedItem?.id === item.id ? 'border-orange-500 bg-orange-900/20' : 'border-slate-700 hover:border-slate-500 bg-slate-800'}
                        `}
                      >
                          <span className="truncate w-full">{item.name}</span>
                          <span className="text-yellow-500">+{item.upgradeLevel}</span>
                      </div>
                  ))}
                  {upgradeableItems.length === 0 && <span className="col-span-3 text-center text-slate-600 text-xs py-4">Geliştirilecek eşya yok.</span>}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Blacksmith;