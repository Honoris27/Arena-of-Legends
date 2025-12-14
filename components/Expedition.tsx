
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
  const regenRemaining = Math.max(0, player.nextPointRegenTime - currentTime);
  const expeditionProgress = player.activeExpedition ? Math.max(0, player.activeExpedition.endTime - currentTime) : 0;

  const getRiskColor = (risk: string) => {
      switch(risk) {
          case 'Düşük': return 'bg-green-500';
          case 'Orta': return 'bg-yellow-500';
          case 'Yüksek': return 'bg-red-500';
          default: return 'bg-slate-500';
      }
  };

  const getRiskWidth = (risk: string) => {
      switch(risk) {
          case 'Düşük': return 'w-1/3';
          case 'Orta': return 'w-2/3';
          case 'Yüksek': return 'w-full';
          default: return 'w-0';
      }
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      
      {/* Top Bar Stats */}
      <div className="bg-slate-900 border-b border-slate-700 p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-10 h-10 bg-indigo-900 rounded-full flex items-center justify-center border border-indigo-500 shadow-lg shadow-indigo-500/20">
                    <Compass className="text-white" size={20} />
                </div>
                {premiumActive && <div className="absolute -top-1 -right-1 text-yellow-500"><Crown size={14} fill="currentColor"/></div>}
              </div>
              <div>
                  <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sefer Puanı</h3>
                  <div className="text-lg font-mono font-bold text-white flex items-center gap-2">
                      {player.expeditionPoints} / {player.maxExpeditionPoints}
                      <span className="text-[10px] text-slate-500 font-normal bg-slate-800 px-1.5 py-0.5 rounded">
                        +1: {formatTime(regenRemaining)}
                      </span>
                  </div>
              </div>
          </div>

          <div className="flex items-center gap-3">
              <div className={`text-sm font-bold ${cooldownRemaining > 0 ? 'text-red-400' : 'text-green-400'} bg-slate-800 px-3 py-1.5 rounded border border-slate-700 flex items-center gap-2`}>
                  <Clock size={14} />
                  {cooldownRemaining > 0 ? formatTime(cooldownRemaining) : "HAZIR"}
              </div>
          </div>
      </div>

     {/* Active Expedition Overlay */}
     {player.activeExpedition && (
         <div className="absolute inset-x-0 top-20 z-50 flex justify-center pointer-events-none">
             <div className="bg-slate-900/90 border-2 border-amber-500 backdrop-blur-md rounded-xl p-6 text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-auto min-w-[300px]">
                 <div className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-2 animate-pulse">Sefer Sürüyor</div>
                 <div className="text-xl font-bold text-white mb-4">{player.activeExpedition.locationName}</div>
                 <div className="text-5xl font-mono font-black text-white mb-4 tabular-nums tracking-wider">{formatTime(expeditionProgress)}</div>
                 <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                     <div className="h-full bg-amber-500 animate-progress-indeterminate"></div>
                 </div>
             </div>
         </div>
     )}

     {/* Main Content Area */}
     <div className={`flex-1 overflow-hidden p-6 relative ${player.activeExpedition ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
         
         {!selectedRegion ? (
            // REGION SELECTION (World Map Style)
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full content-start overflow-y-auto pr-2 custom-scrollbar">
                {regions.map(region => {
                    const isLocked = player.level < region.minLevel;
                    return (
                        <div 
                            key={region.id} 
                            onClick={() => !isLocked && setSelectedRegion(region)} 
                            className={`
                                group relative h-64 rounded-xl border-2 transition-all cursor-pointer overflow-hidden
                                ${isLocked 
                                    ? 'border-slate-800 bg-slate-900 opacity-60' 
                                    : 'border-slate-600 bg-slate-800 hover:border-amber-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:-translate-y-1'}
                            `}
                        >
                             {/* Background Image Placeholder */}
                             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                             <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
                                 <Map size={120} />
                             </div>

                             {isLocked && (
                                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20 backdrop-blur-sm">
                                     <Skull size={48} className="text-slate-600 mb-2"/>
                                     <div className="text-red-500 font-bold uppercase tracking-widest text-sm">Kilitli</div>
                                     <div className="text-slate-400 text-xs">Seviye {region.minLevel}+</div>
                                 </div>
                             )}

                             <div className="absolute bottom-0 left-0 w-full p-6 z-10">
                                 <div className="flex justify-between items-end">
                                     <div>
                                         <h3 className={`text-2xl cinzel font-black ${isLocked ? 'text-slate-600' : 'text-white group-hover:text-amber-400'} transition-colors`}>{region.name}</h3>
                                         <p className="text-xs text-slate-400 mt-1 line-clamp-2">{region.description}</p>
                                     </div>
                                     {!isLocked && <ArrowLeft className="rotate-180 text-amber-600 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-2" />}
                                 </div>
                             </div>
                        </div>
                    );
                })}
            </div>
         ) : (
            // LOCATION SELECTION (Detailed List)
            <div className="h-full flex flex-col">
                <button onClick={() => setSelectedRegion(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 w-fit transition-colors group">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
                    <span className="font-bold text-sm uppercase tracking-wide">Dünya Haritası</span>
                </button>

                <div className="flex items-center gap-4 mb-6 border-b border-slate-700 pb-4">
                    <h2 className="text-4xl cinzel font-black text-white">{selectedRegion.name}</h2>
                    <div className="px-3 py-1 bg-slate-800 rounded text-xs text-slate-400 border border-slate-700">Seviye {selectedRegion.minLevel}+ Bölgesi</div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                    {locations.filter(l => l.regionId === selectedRegion.id).map((loc, idx) => {
                        const canEnter = player.level >= loc.minLevel;
                        return (
                            <div key={loc.id} className={`bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex flex-col md:flex-row items-center gap-6 hover:bg-slate-800 transition-colors relative overflow-hidden group ${!canEnter ? 'opacity-50' : ''}`}>
                                 {/* Difficulty Stripe */}
                                 <div className={`absolute left-0 top-0 bottom-0 w-1 ${getRiskColor(loc.risk)}`}></div>

                                 {/* Info */}
                                 <div className="flex-1">
                                     <div className="flex items-center gap-3 mb-1">
                                         <h4 className="text-lg font-bold text-white">{loc.name}</h4>
                                         {!canEnter && <span className="text-[10px] text-red-500 font-bold border border-red-900 bg-red-900/20 px-2 py-0.5 rounded">LVL {loc.minLevel}</span>}
                                     </div>
                                     <p className="text-xs text-slate-400 mb-3">{loc.desc}</p>
                                     
                                     {/* Metrics */}
                                     <div className="flex gap-4 text-xs">
                                         <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900 px-2 py-1 rounded">
                                             <Clock size={12} className="text-slate-500"/> {loc.duration} dk
                                         </div>
                                         <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900 px-2 py-1 rounded">
                                             <Crosshair size={12} className="text-red-500"/> Risk: {loc.risk}
                                         </div>
                                         <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900 px-2 py-1 rounded">
                                             <Diamond size={12} className="text-blue-400"/> Ganimet x{loc.rewardRate}
                                         </div>
                                     </div>
                                 </div>

                                 {/* Visual Risk Meter */}
                                 <div className="w-32 hidden md:block">
                                     <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                         <span>Güvenli</span>
                                         <span>Ölümcül</span>
                                     </div>
                                     <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                         <div className={`h-full ${getRiskColor(loc.risk)} ${getRiskWidth(loc.risk)}`}></div>
                                     </div>
                                 </div>

                                 {/* Action */}
                                 <button
                                    onClick={() => onStartExpedition(loc, false)}
                                    disabled={isBusy || cooldownRemaining > 0 || !canEnter || player.expeditionPoints <= 0}
                                    className={`
                                        px-6 py-3 rounded font-bold text-sm flex items-center gap-2 transition-all min-w-[140px] justify-center
                                        ${isBusy || cooldownRemaining > 0 || !canEnter || player.expeditionPoints <= 0 
                                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:scale-105'}
                                    `}
                                 >
                                     {cooldownRemaining > 0 ? formatTime(cooldownRemaining) : (
                                         <>
                                            <Swords size={16}/> SEFERE ÇIK
                                         </>
                                     )}
                                 </button>
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
