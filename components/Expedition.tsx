
import React, { useState, useEffect } from 'react';
import { Map, Swords, Skull, ArrowLeft, Clock, Zap, Crown, X, Compass, Crosshair, HelpCircle, Coins, Diamond } from 'lucide-react';
import { ExpeditionLocation, Region, Player, Item } from '../types';
import { isPremium, formatTime } from '../services/gameLogic';
import ItemTooltip from './ItemTooltip';

interface ExpeditionProps {
  player: Player;
  regions: Region[];
  locations: ExpeditionLocation[];
  onStartExpedition: (location: ExpeditionLocation, isBoss: boolean) => void;
  isBusy: boolean;
}

const Expedition: React.FC<ExpeditionProps> = ({ player, regions, locations, onStartExpedition, isBusy }) => {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const premiumActive = isPremium(player);
  const cooldownRemaining = Math.max(0, player.nextExpeditionTime - currentTime);
  const expeditionProgress = player.activeExpedition ? Math.max(0, player.activeExpedition.endTime - currentTime) : 0;

  return (
    <div className="max-w-6xl mx-auto flex flex-col min-h-[500px]">
      
     {/* Active Expedition Overlay */}
     {player.activeExpedition && (
         <div className="parchment-panel p-4 mb-4 flex items-center justify-between bg-[#f3e5ab] border-[#8b5a2b]">
             <div className="flex items-center gap-4">
                 <div className="animate-spin-slow"><Compass size={32} className="text-[#8b5a2b]"/></div>
                 <div>
                     <div className="text-xs font-bold text-[#8b5a2b] uppercase tracking-widest">Sefer Sürüyor</div>
                     <div className="text-lg font-bold text-[#2c1810]">{player.activeExpedition.locationName}</div>
                 </div>
             </div>
             <div className="text-3xl font-mono font-bold text-[#8a1c1c]">{formatTime(expeditionProgress)}</div>
         </div>
     )}

     <div className={`flex-1 ${player.activeExpedition ? 'opacity-50 pointer-events-none' : ''}`}>
         
         {!selectedRegion ? (
            // REGION SELECTION (World Map Style)
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {regions.map(region => {
                    const isLocked = player.level < region.minLevel;
                    return (
                        <div 
                            key={region.id} 
                            onClick={() => !isLocked && setSelectedRegion(region)} 
                            className={`
                                group relative h-64 rounded-xl border-4 transition-all cursor-pointer overflow-hidden shadow-xl
                                ${isLocked 
                                    ? 'border-gray-700 bg-gray-800 opacity-60 grayscale' 
                                    : 'border-[#5e3b1f] bg-[#2c1810] hover:border-[#c5a059] hover:-translate-y-1'}
                            `}
                        >
                             <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity bg-cover bg-center" style={{backgroundImage: `url(https://source.unsplash.com/random/400x300/?fantasy,forest,${region.id})`}}></div>
                             <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
                                 <h3 className={`text-2xl cinzel font-black text-shadow-lg ${isLocked ? 'text-gray-500' : 'text-[#f3e5ab] group-hover:text-white'}`}>{region.name}</h3>
                                 {isLocked && <div className="mt-2 bg-red-900/80 px-3 py-1 rounded text-red-200 text-xs font-bold border border-red-500">Seviye {region.minLevel}+</div>}
                             </div>
                        </div>
                    );
                })}
            </div>
         ) : (
            // ENEMY CARD VIEW (Like Screenshot 4)
            <div className="parchment-panel p-4 min-h-[600px]">
                {/* Header Tab */}
                <div className="flex items-center gap-2 mb-6 border-b-4 border-[#5e3b1f] pb-1">
                    <button onClick={() => setSelectedRegion(null)} className="bg-[#5e3b1f] text-[#f3e5ab] px-3 py-1 rounded-t font-bold hover:bg-[#3e2714] text-xs flex items-center gap-1">
                        <ArrowLeft size={12}/> Geri
                    </button>
                    <div className="bg-[#8b1c1c] text-white px-6 py-1 rounded-t font-cinzel font-bold text-sm shadow-inner border-t border-l border-r border-[#5e3b1f]">
                        {selectedRegion.name}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {locations.filter(l => l.regionId === selectedRegion.id).map((loc, idx) => {
                        const canEnter = player.level >= loc.minLevel;
                        // Determine generic image based on index or name
                        const imgUrl = `https://source.unsplash.com/random/200x200/?monster,creature,fantasy,${idx}`;
                        
                        return (
                            <div key={loc.id} className="bg-[#eaddcf] border-2 border-[#5e3b1f] p-2 flex flex-col gap-2 shadow-[0_0_10px_rgba(0,0,0,0.3)]">
                                 {/* Title Box */}
                                 <div className="bg-[#8b1c1c] text-[#f3e5ab] text-center font-bold text-xs py-1 border border-[#3e2714] shadow-inner truncate">
                                     {loc.name}
                                 </div>

                                 {/* Image Box */}
                                 <div className="aspect-square bg-black border-2 border-[#5e3b1f] relative overflow-hidden group">
                                     <img src={imgUrl} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${!canEnter ? 'grayscale opacity-50' : ''}`} />
                                     {!canEnter && (
                                         <div className="absolute inset-0 flex items-center justify-center bg-black/60 font-bold text-red-500 text-lg rotate-45 border-4 border-red-900 m-4 rounded">
                                             KİLİTLİ
                                         </div>
                                     )}
                                 </div>

                                 {/* Action Button */}
                                 <button
                                    onClick={() => onStartExpedition(loc, false)}
                                    disabled={isBusy || cooldownRemaining > 0 || !canEnter || player.expeditionPoints <= 0}
                                    className={`
                                        w-full py-1 text-sm font-bold border border-[#3e2714] shadow-md transition-all
                                        ${isBusy || cooldownRemaining > 0 || !canEnter || player.expeditionPoints <= 0 
                                            ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                                            : 'bg-gradient-to-b from-[#c5a059] to-[#8b5a2b] text-[#3e2714] hover:brightness-110'}
                                    `}
                                 >
                                     {cooldownRemaining > 0 ? formatTime(cooldownRemaining) : "Saldır"}
                                 </button>

                                 {/* Loot Icons */}
                                 <div className="flex justify-between bg-[#c5a059]/30 p-1 border border-[#8b5a2b]/30 rounded">
                                     <div title="Altın" className="flex items-center gap-0.5 text-[10px] font-bold text-[#3e2714]"><Coins size={10}/> +</div>
                                     <div title="XP" className="flex items-center gap-0.5 text-[10px] font-bold text-[#3e2714]"><Zap size={10}/> +</div>
                                     <div title="Eşya" className="flex items-center gap-0.5 text-[10px] font-bold text-[#3e2714]"><Swords size={10}/> +</div>
                                 </div>
                            </div>
                        )
                    })}
                </div>
            </div>
         )}
     </div>
    </div>
  );
};

export default Expedition;
