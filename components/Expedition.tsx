
import React, { useState, useEffect } from 'react';
import { Map, Play, Skull, ArrowLeft, Clock, Zap, Crown } from 'lucide-react';
import { ExpeditionLocation, Region, Player } from '../types';
import { isPremium, formatTime } from '../services/gameLogic';

interface ExpeditionProps {
  player: Player;
  regions: Region[];
  locations: ExpeditionLocation[];
  onComplete: (duration: number, locationName: string, isBoss?: boolean) => void;
  isBusy: boolean;
}

const Expedition: React.FC<ExpeditionProps> = ({ player, regions, locations, onComplete, isBusy }) => {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [activeExpedition, setActiveExpedition] = useState<{ location: string, endTime: number, isBoss: boolean } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update timer every second for UI purposes (cooldowns, regen)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startExpedition = (location: ExpeditionLocation | null, isBoss: boolean = false) => {
    if (isBusy || activeExpedition) return;
    
    // Check points
    if (player.expeditionPoints <= 0) {
        alert("Sefer Puanın yetersiz!");
        return;
    }
    // Check cooldown
    if (player.nextExpeditionTime > Date.now()) {
        alert("Henüz yeni bir sefere çıkamazsın. Dinlenmen lazım.");
        return;
    }

    let locationName = "Bilinmeyen";
    let durationSeconds = 10;

    if (isBoss) {
        locationName = "Ejderha Mağarası";
        durationSeconds = 15; // Boss fight prep time
    } else if (location) {
        locationName = location.name;
        durationSeconds = location.duration; // Use actual seconds from config
    }

    const now = Date.now();
    const endTime = now + durationSeconds * 1000;

    setActiveExpedition({ location: locationName, endTime, isBoss });
  };

  // Internal timer for active expedition progress
  useEffect(() => {
    if (!activeExpedition) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.ceil((activeExpedition.endTime - now) / 1000);

      if (diff <= 0) {
        clearInterval(interval);
        const locName = activeExpedition.location;
        const isBoss = activeExpedition.isBoss;
        
        // Find duration for callback logic if needed
        let duration = 0;
        const loc = locations.find(l => l.name === locName);
        if(loc) duration = loc.duration;

        setActiveExpedition(null);
        setTimeLeft(0);
        onComplete(duration, locName, isBoss);
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeExpedition, onComplete, locations]);

  const premiumActive = isPremium(player);
  const cooldownRemaining = Math.max(0, player.nextExpeditionTime - currentTime);
  const regenRemaining = Math.max(0, player.nextPointRegenTime - currentTime);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Expedition Stats Bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg">
          <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative">
                <div className="w-12 h-12 bg-indigo-900 rounded-full flex items-center justify-center border-2 border-indigo-500">
                    <Map className="text-white" />
                </div>
                {premiumActive && <div className="absolute -top-1 -right-1 text-yellow-500"><Crown size={16} fill="currentColor"/></div>}
              </div>
              <div>
                  <h3 className="text-sm text-slate-400 font-bold uppercase">Sefer Puanı</h3>
                  <div className="text-2xl font-mono font-bold text-white flex items-center gap-2">
                      {player.expeditionPoints} / {player.maxExpeditionPoints}
                      <span className="text-xs text-slate-500 font-normal ml-2">
                        (+1 Puan: {formatTime(regenRemaining)})
                      </span>
                  </div>
              </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto bg-slate-900/50 p-3 rounded-lg border border-slate-800">
              <div className={`p-2 rounded-full ${cooldownRemaining > 0 ? 'bg-red-900/30 text-red-500' : 'bg-green-900/30 text-green-500'}`}>
                  <Clock size={20} />
              </div>
              <div>
                  <h3 className="text-xs text-slate-500 font-bold uppercase">Sefer Bekleme Süresi</h3>
                  <div className={`text-xl font-mono font-bold ${cooldownRemaining > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {cooldownRemaining > 0 ? formatTime(cooldownRemaining) : "HAZIR"}
                  </div>
              </div>
          </div>
      </div>

      {activeExpedition ? (
        // ACTIVE EXPEDITION VIEW
        <div className={`bg-slate-800 border ${activeExpedition.isBoss ? 'border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.3)]' : 'border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.1)]'} rounded-xl p-12 text-center animate-pulse`}>
          {activeExpedition.isBoss ? <Skull className="w-16 h-16 text-red-600 mx-auto mb-6" /> : <Zap className="w-16 h-16 text-yellow-500 mx-auto mb-6" />}
          
          <h3 className="text-2xl font-bold text-white mb-2">{activeExpedition.location}</h3>
          <p className="text-slate-400 mb-6">{activeExpedition.isBoss ? 'Büyük savaşa hazırlanılıyor...' : 'Maceracın şu an seferde...'}</p>
          <div className="text-4xl font-mono font-bold text-white">{timeLeft}s</div>
          <div className="w-full max-w-md mx-auto h-2 bg-slate-900 rounded-full mt-8 overflow-hidden">
             <div className={`h-full animate-progress origin-left w-full ${activeExpedition.isBoss ? 'bg-red-600' : 'bg-yellow-500'}`}></div>
          </div>
        </div>
      ) : selectedRegion ? (
        // LOCATIONS IN REGION VIEW
        <div>
            <button 
                onClick={() => setSelectedRegion(null)}
                className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ArrowLeft size={20} /> Bölgelere Dön
            </button>
            
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
                 <h2 className="text-3xl cinzel font-bold text-white mb-2">{selectedRegion.name}</h2>
                 <p className="text-slate-400">{selectedRegion.description}</p>
                 <p className="text-xs text-slate-500 mt-2">Minimum Seviye: {selectedRegion.minLevel}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {locations.filter(l => l.regionId === selectedRegion.id).map(loc => {
                    const canEnter = player.level >= loc.minLevel;
                    return (
                        <div key={loc.id} className={`bg-slate-800 border ${canEnter ? 'border-slate-700 hover:border-indigo-500' : 'border-slate-800 opacity-60'} transition-all rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group`}>
                             {!canEnter && (
                                 <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center">
                                     <div className="bg-slate-900 px-4 py-2 rounded border border-red-500 text-red-500 font-bold text-xs flex items-center gap-2">
                                         <Skull size={14}/> Seviye {loc.minLevel} Gerekli
                                     </div>
                                 </div>
                             )}

                             <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-white">{loc.name}</h3>
                                    <span className="text-xs bg-slate-900 px-2 py-1 rounded text-slate-400 font-mono">Risk: {loc.risk}</span>
                                </div>
                                <p className="text-sm text-slate-400 mb-6">{loc.desc}</p>
                                
                                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                                    <div className="bg-slate-900 p-2 rounded text-center">
                                        <span className="block text-slate-500 mb-1">Süre</span>
                                        <span className="font-bold text-white">{loc.duration} sn</span>
                                    </div>
                                    <div className="bg-slate-900 p-2 rounded text-center">
                                        <span className="block text-slate-500 mb-1">Maliyet</span>
                                        <span className="font-bold text-yellow-500">1 Puan</span>
                                    </div>
                                </div>
                             </div>

                             <button
                                onClick={() => startExpedition(loc)}
                                disabled={isBusy || cooldownRemaining > 0 || !canEnter || player.expeditionPoints <= 0}
                                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                                    isBusy || cooldownRemaining > 0 || player.expeditionPoints <= 0
                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                }`}
                             >
                                <Play size={16} fill="currentColor" />
                                {cooldownRemaining > 0 ? formatTime(cooldownRemaining) : 'Seferi Başlat'}
                             </button>
                        </div>
                    );
                })}
                {locations.filter(l => l.regionId === selectedRegion.id).length === 0 && (
                    <div className="col-span-full text-center py-10 text-slate-500">
                        Bu bölgede henüz keşfedilmiş bir alan yok.
                    </div>
                )}
            </div>
        </div>
      ) : (
        // REGION SELECTION VIEW
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {regions.map(region => {
                const locked = player.level < region.minLevel;
                return (
                    <div 
                        key={region.id}
                        onClick={() => !locked && setSelectedRegion(region)}
                        className={`
                            relative h-64 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all transform hover:scale-[1.02]
                            ${locked ? 'border-slate-800 opacity-50 grayscale cursor-not-allowed' : 'border-slate-600 hover:border-yellow-500 shadow-2xl'}
                        `}
                    >
                        {/* Background Image Placeholder */}
                        <div className="absolute inset-0 bg-slate-800">
                             {region.imageUrl ? (
                                 <img src={region.imageUrl} alt={region.name} className="w-full h-full object-cover" />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                                     <Map size={64} className="text-slate-700" />
                                 </div>
                             )}
                        </div>
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-6 flex flex-col justify-end">
                             <h3 className="text-3xl cinzel font-bold text-white mb-2">{region.name}</h3>
                             <p className="text-slate-300 text-sm mb-2">{region.description}</p>
                             {locked ? (
                                 <div className="flex items-center gap-2 text-red-500 font-bold bg-black/50 p-2 rounded w-fit">
                                     <Skull size={16} /> Seviye {region.minLevel} Gerekli
                                 </div>
                             ) : (
                                 <div className="text-yellow-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                     Tıklayıp Keşfet <ArrowLeft className="rotate-180" size={12}/>
                                 </div>
                             )}
                        </div>
                    </div>
                );
            })}
        </div>
      )}
    </div>
  );
};

export default Expedition;
