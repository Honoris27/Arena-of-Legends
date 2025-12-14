
import React, { useState, useEffect, useMemo } from 'react';
import { Item, BlacksmithJob, Stats } from '../types';
import { calculateUpgradeCost, calculateSuccessRate, calculateSalvageReturn, generateDynamicItem, INITIAL_BASE_ITEMS, INITIAL_MODIFIERS, INITIAL_MATERIALS, getFragmentCount, getBlacksmithTime, formatTime } from '../services/gameLogic';
import { Hammer, Coins, ArrowUp, Recycle, Anvil, Clock, Check, ArrowRight } from 'lucide-react';
import ItemTooltip from './ItemTooltip';

interface BlacksmithProps {
  inventory: Item[];
  playerGold: number;
  jobs: BlacksmithJob[];
  learnedModifiers: string[];
  onStartJob: (job: BlacksmithJob, cost: number) => void;
  onClaimJob: (jobId: string) => void;
}

const Blacksmith: React.FC<BlacksmithProps> = ({ inventory, playerGold, jobs, learnedModifiers, onStartJob, onClaimJob }) => {
  const [activeTab, setActiveTab] = useState<'upgrade' | 'salvage' | 'craft'>('upgrade');
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
      const t = setInterval(() => setCurrentTime(Date.now()), 1000);
      return () => clearInterval(t);
  }, []);

  return (
    <div className="max-w-6xl mx-auto flex flex-col items-center pb-20">
      <div className="text-center mb-6">
        <h2 className="text-3xl cinzel font-bold text-orange-500 mb-2 flex items-center justify-center gap-3">
            <Hammer size={32} /> Demirci Atölyesi
        </h2>
        <p className="text-slate-400">Ateş ve çelikle kaderini şekillendir.</p>
      </div>

      {/* JOB QUEUE VISUALIZATION */}
      <div className="w-full mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {jobs.map(job => {
              const elapsed = currentTime - job.startTime;
              const progress = Math.min(100, (elapsed / job.duration) * 100);
              const isDone = progress >= 100;
              
              return (
                  <div key={job.id} className="bg-slate-800 border border-slate-700 rounded-lg p-3 relative overflow-hidden">
                      <div className="flex justify-between items-center mb-2 z-10 relative">
                          <span className="text-xs font-bold uppercase text-slate-400">{job.type === 'craft' ? 'Üretim' : job.type === 'salvage' ? 'Parçalama' : 'Geliştirme'}</span>
                          {isDone ? <button onClick={() => onClaimJob(job.id)} className="bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1"><Check size={12}/> AL</button> 
                                  : <span className="text-xs font-mono">{formatTime(job.duration - elapsed)}</span>}
                      </div>
                      <div className="text-sm font-bold text-white z-10 relative mb-1">{job.item?.name || job.resultItem?.name || "Bilinmeyen Eşya"}</div>
                      
                      {/* Progress Bar Background */}
                      <div className="absolute bottom-0 left-0 h-1 bg-slate-700 w-full">
                          <div className={`h-full ${isDone ? 'bg-green-500' : 'bg-orange-500'} transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
                      </div>
                  </div>
              )
          })}
          {jobs.length < 5 && (
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-3 flex items-center justify-center text-slate-500 text-xs h-[80px]">
                  Boş Slot
              </div>
          )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
          <button onClick={() => setActiveTab('upgrade')} className={`px-6 py-2 rounded-lg font-bold ${activeTab === 'upgrade' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Geliştir</button>
          <button onClick={() => setActiveTab('salvage')} className={`px-6 py-2 rounded-lg font-bold ${activeTab === 'salvage' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Parçala</button>
          <button onClick={() => setActiveTab('craft')} className={`px-6 py-2 rounded-lg font-bold ${activeTab === 'craft' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Üret</button>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 w-full min-h-[500px]">
          {activeTab === 'upgrade' && <UpgradePanel inventory={inventory} playerGold={playerGold} onStartJob={onStartJob} />}
          {activeTab === 'salvage' && <SalvagePanel inventory={inventory} onStartJob={onStartJob} />}
          {activeTab === 'craft' && <CraftPanel inventory={inventory} learnedModifiers={learnedModifiers} onStartJob={onStartJob} />}
      </div>
    </div>
  );
};

const UpgradePanel: React.FC<{ inventory: Item[], playerGold: number, onStartJob: any }> = ({ inventory, playerGold, onStartJob }) => {
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const upgradeableItems = inventory.filter(i => ['weapon','armor','helmet','shield'].includes(i.type));
    const cost = selectedItem ? calculateUpgradeCost(selectedItem) : 0;
    const duration = selectedItem ? getBlacksmithTime('upgrade', selectedItem.upgradeLevel) : 0;

    const handleUpgrade = () => {
        if (!selectedItem) return;
        const job: BlacksmithJob = {
            id: Date.now().toString(),
            type: 'upgrade',
            startTime: Date.now(),
            duration: duration,
            item: selectedItem,
            status: 'working'
        };
        onStartJob(job, cost);
        setSelectedItem(null);
    };

    return (
        <div className="flex gap-8">
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900/50 rounded-xl border border-slate-700 relative overflow-hidden">
                 {selectedItem ? (
                     <div className="w-full flex flex-col items-center">
                         <div className="flex items-center justify-center gap-8 mb-8 w-full">
                             {/* Current Item Card */}
                             <div className="bg-slate-800 p-4 rounded-xl border-2 border-slate-600 w-48 flex flex-col items-center opacity-80">
                                 <h4 className="text-sm font-bold text-slate-300 mb-2">Şu An</h4>
                                 <div className="text-white font-bold mb-2">{selectedItem.name} +{selectedItem.upgradeLevel}</div>
                                 <div className="space-y-1 text-xs w-full">
                                     {Object.entries(selectedItem.stats).map(([key, val]) => (
                                         <div key={key} className="flex justify-between text-slate-400">
                                             <span>{key}</span> <span>{val}</span>
                                         </div>
                                     ))}
                                 </div>
                             </div>

                             <ArrowRight className="text-orange-500 animate-pulse" size={32} />

                             {/* Next Level Card */}
                             <div className="bg-slate-800 p-4 rounded-xl border-2 border-orange-500 w-48 flex flex-col items-center shadow-[0_0_20px_rgba(249,115,22,0.2)]">
                                 <h4 className="text-sm font-bold text-orange-400 mb-2">Sonraki Seviye</h4>
                                 <div className="text-white font-bold mb-2">{selectedItem.name} <span className="text-green-400">+{selectedItem.upgradeLevel + 1}</span></div>
                                 <div className="space-y-1 text-xs w-full">
                                     {Object.entries(selectedItem.stats).map(([key, val]) => {
                                         const nextVal = Math.ceil(((val as number) || 0) * 1.1) + 1;
                                         return (
                                             <div key={key} className="flex justify-between">
                                                 <span className="text-slate-400">{key}</span> 
                                                 <span className="text-green-400 font-bold">{nextVal} <span className="text-[9px]">(+{nextVal - (val as number)})</span></span>
                                             </div>
                                         );
                                     })}
                                 </div>
                             </div>
                         </div>

                         <div className="bg-black/30 p-4 rounded-lg w-full max-w-sm mb-4">
                             <div className="flex justify-between text-sm mb-1">
                                 <span className="text-slate-400">Geliştirme Ücreti:</span>
                                 <span className="text-yellow-500 font-bold">{cost} Altın</span>
                             </div>
                             <div className="flex justify-between text-sm mb-1">
                                 <span className="text-slate-400">Süre:</span>
                                 <span className="text-white font-mono"><Clock size={12} className="inline mr-1"/>{formatTime(duration)}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                 <span className="text-slate-400">Başarı Şansı:</span>
                                 <span className="text-green-400 font-bold">%100 (Şimdilik)</span>
                             </div>
                         </div>

                         <button onClick={handleUpgrade} disabled={playerGold < cost} className="w-full max-w-sm py-3 bg-orange-600 hover:bg-orange-500 text-white rounded font-bold shadow-lg flex items-center justify-center gap-2">
                             <Hammer size={18}/> GELİŞTİRMEYİ BAŞLAT
                         </button>
                     </div>
                 ) : <div className="text-slate-500">Sağdaki listeden geliştirilecek bir eşya seçin.</div>}
            </div>
            <div className="w-1/3 bg-slate-900 border border-slate-700 p-4 h-[400px] overflow-y-auto grid grid-cols-2 gap-2 content-start">
                {upgradeableItems.map(i => (
                    <div key={i.id} onClick={() => setSelectedItem(i)} className={`p-2 border cursor-pointer rounded text-xs transition-colors ${selectedItem?.id === i.id ? 'border-orange-500 bg-slate-800' : 'border-slate-700 hover:border-slate-500'}`}>
                        <div className="font-bold text-slate-200 truncate">{i.name}</div>
                        <div className="text-yellow-600">+{i.upgradeLevel}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}

const SalvagePanel: React.FC<{ inventory: Item[], onStartJob: any }> = ({ inventory, onStartJob }) => {
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const salvageableItems = inventory.filter(i => !['material','consumable','scroll'].includes(i.type));
    const rewards = selectedItem ? calculateSalvageReturn(selectedItem) : { prefixFrag: 0, suffixFrag: 0 };
    const duration = selectedItem ? getBlacksmithTime('salvage', 1) : 0;

    const handleSalvage = () => {
        if (!selectedItem) return;
        const job: BlacksmithJob = {
            id: Date.now().toString(),
            type: 'salvage',
            startTime: Date.now(),
            duration: duration,
            item: selectedItem,
            status: 'working',
            rewards: { items: [] } // Handled in claim
        };
        onStartJob(job, 0);
        setSelectedItem(null);
    };

    return (
        <div className="flex gap-8">
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900/50 rounded-xl border border-slate-700">
                {selectedItem ? (
                    <div className="flex flex-col items-center">
                         <div className="transform scale-110 mb-4 opacity-70 grayscale"><ItemTooltip item={selectedItem} fixed /></div>
                         <div className="text-center mb-4">
                             <div className="text-slate-400 text-xs">Tahmini Çıktı:</div>
                             <div className="text-blue-400 font-bold">{rewards.prefixFrag} Ön Ek / {rewards.suffixFrag} Son Ek</div>
                         </div>
                         <button onClick={handleSalvage} className="bg-red-700 hover:bg-red-600 text-white px-8 py-2 rounded font-bold">ERİT</button>
                    </div>
                ) : <div className="text-slate-500">Parçalanacak eşya seç.</div>}
            </div>
            <div className="w-1/3 bg-slate-900 border border-slate-700 p-4 h-[400px] overflow-y-auto grid grid-cols-2 gap-2 content-start">
                {salvageableItems.map(i => <div key={i.id} onClick={() => setSelectedItem(i)} className="p-2 border border-slate-700 cursor-pointer rounded text-xs truncate">{i.name}</div>)}
            </div>
        </div>
    )
}

const CraftPanel: React.FC<{ inventory: Item[], learnedModifiers: string[], onStartJob: any }> = ({ inventory, learnedModifiers, onStartJob }) => {
    // Simplified Crafting UI for brevity - same logic as before but uses queue
    const prefixFragCount = getFragmentCount(inventory, 'prefix');
    const suffixFragCount = getFragmentCount(inventory, 'suffix');
    
    const [selBase, setSelBase] = useState(INITIAL_BASE_ITEMS[0].id);
    const [selPrefix, setSelPrefix] = useState("");
    const [selSuffix, setSelSuffix] = useState("");
    
    const baseItem = INITIAL_BASE_ITEMS.find(i => i.id === selBase);
    const prefix = INITIAL_MODIFIERS.find(m => m.id === selPrefix);
    const suffix = INITIAL_MODIFIERS.find(m => m.id === selSuffix);
    
    const costPrefix = prefix?.fragmentCost || 0;
    const costSuffix = suffix?.fragmentCost || 0;
    const canAfford = prefixFragCount >= costPrefix && suffixFragCount >= costSuffix;
    
    const previewItem = useMemo(() => {
        return baseItem ? generateDynamicItem(1, [baseItem], INITIAL_MATERIALS, INITIAL_MODIFIERS, 'rare', prefix, suffix) : null;
    }, [baseItem, prefix, suffix]);

    const duration = getBlacksmithTime('craft', 1);

    const handleCraft = () => {
        if (!previewItem || !canAfford) return;
        const job: BlacksmithJob = {
            id: Date.now().toString(),
            type: 'craft',
            startTime: Date.now(),
            duration: duration,
            resultItem: previewItem,
            status: 'working'
        };
        // Pass negative cost logic via callback or handle in App
        onStartJob(job, 0); 
    };

    return (
        <div className="flex gap-8">
            <div className="w-1/2 space-y-4">
                <div className="flex justify-between bg-black/30 p-2 rounded">
                    <span>Ön Ek Parçacığı: {prefixFragCount}</span>
                    <span>Son Ek Parçacığı: {suffixFragCount}</span>
                </div>
                <select className="w-full bg-slate-900 p-2 rounded text-white" value={selBase} onChange={e => setSelBase(e.target.value)}>
                    {INITIAL_BASE_ITEMS.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <select className="w-full bg-slate-900 p-2 rounded text-white" value={selPrefix} onChange={e => setSelPrefix(e.target.value)}>
                    <option value="">Ön Ek Yok</option>
                    {INITIAL_MODIFIERS.filter(m => m.type === 'prefix' && learnedModifiers.includes(m.id)).map(m => <option key={m.id} value={m.id}>{m.name} ({m.fragmentCost}P)</option>)}
                </select>
                 <select className="w-full bg-slate-900 p-2 rounded text-white" value={selSuffix} onChange={e => setSelSuffix(e.target.value)}>
                    <option value="">Son Ek Yok</option>
                    {INITIAL_MODIFIERS.filter(m => m.type === 'suffix' && learnedModifiers.includes(m.id)).map(m => <option key={m.id} value={m.id}>{m.name} ({m.fragmentCost}P)</option>)}
                </select>
                <button onClick={handleCraft} disabled={!canAfford} className={`w-full py-3 rounded font-bold ${canAfford ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-500'}`}>ÜRET (Maliyet: {costPrefix}P / {costSuffix}S)</button>
            </div>
            <div className="flex-1 flex justify-center items-center bg-slate-900/50 rounded border border-slate-700">
                {previewItem && <div className="transform scale-125"><ItemTooltip item={previewItem} fixed /></div>}
            </div>
        </div>
    )
}

export default Blacksmith;
