import React, { useState, useEffect } from 'react';
import { Map, Play, Mountain, Snowflake, Skull, Swords } from 'lucide-react';
import { ExpeditionDuration, ExpeditionLocation } from '../types';

interface ExpeditionProps {
  locations: ExpeditionLocation[];
  onComplete: (duration: ExpeditionDuration, locationName: string, isBoss?: boolean) => void;
  isBusy: boolean;
}

const Expedition: React.FC<ExpeditionProps> = ({ locations, onComplete, isBusy }) => {
  const [activeExpedition, setActiveExpedition] = useState<{ location: string, endTime: number, isBoss: boolean } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Use a faster multiplier for demo purposes (1 minute = 10 seconds in demo)
  const DEMO_MULTIPLIER = 1 / 6; 

  const startExpedition = (location: ExpeditionLocation | null, isBoss: boolean = false) => {
    if (isBusy || activeExpedition) return;

    let locationName = "Bilinmeyen";
    let durationSeconds = 10;

    if (isBoss) {
        locationName = "Ejderha Mağarası";
        durationSeconds = 15; // Boss fight prep time
    } else if (location) {
        locationName = location.name;
        durationSeconds = location.duration * 60 * DEMO_MULTIPLIER;
        if(location.duration === ExpeditionDuration.EPIC) durationSeconds = 60;
    }

    const now = Date.now();
    const endTime = now + durationSeconds * 1000;

    setActiveExpedition({ location: locationName, endTime, isBoss });
  };

  useEffect(() => {
    if (!activeExpedition) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.ceil((activeExpedition.endTime - now) / 1000);

      if (diff <= 0) {
        clearInterval(interval);
        const locName = activeExpedition.location;
        const isBoss = activeExpedition.isBoss;
        
        // Find duration for callback
        let duration = ExpeditionDuration.SHORT;
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl cinzel font-bold text-white mb-2">Dünya Haritası</h2>
        <p className="text-slate-400">Keşfedilmemiş topraklara yolculuk yap.</p>
      </div>

      {activeExpedition ? (
        <div className={`bg-slate-800 border ${activeExpedition.isBoss ? 'border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.3)]' : 'border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.1)]'} rounded-xl p-12 text-center animate-pulse`}>
          {activeExpedition.isBoss ? <Skull className="w-16 h-16 text-red-600 mx-auto mb-6" /> : <Map className="w-16 h-16 text-yellow-500 mx-auto mb-6" />}
          
          <h3 className="text-2xl font-bold text-white mb-2">{activeExpedition.location}</h3>
          <p className="text-slate-400 mb-6">{activeExpedition.isBoss ? 'Büyük savaşa hazırlanılıyor...' : 'Maceracın şu an seferde...'}</p>
          <div className="text-4xl font-mono font-bold text-white">{timeLeft}s</div>
          <div className="w-full max-w-md mx-auto h-2 bg-slate-900 rounded-full mt-8 overflow-hidden">
             <div className={`h-full animate-progress origin-left w-full ${activeExpedition.isBoss ? 'bg-red-600' : 'bg-yellow-500'}`}></div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
            {/* Standard Locations */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((loc) => (
                <div key={loc.id} className="bg-slate-800 border border-slate-700 hover:border-slate-500 transition-all rounded-xl p-6 flex flex-col justify-between group relative overflow-hidden">
                <div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3 bg-slate-900 rounded-lg group-hover:bg-slate-700 transition-colors">
                            {loc.risk === 'Ölümcül' ? <Skull className="text-red-500"/> : 
                            loc.name.includes('Buz') ? <Snowflake className="text-cyan-400"/> :
                            loc.name.includes('Volkan') ? <Mountain className="text-orange-500"/> :
                            <Map className="text-slate-400 group-hover:text-white" />}
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded bg-slate-900 text-slate-400 border border-slate-700">
                            {loc.duration === ExpeditionDuration.EPIC ? '60 sn' : `${Math.floor(loc.duration * 60 * DEMO_MULTIPLIER)} sn`}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 relative z-10">{loc.name}</h3>
                    <p className="text-sm text-slate-400 mb-4 relative z-10">{loc.desc}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs mb-6 relative z-10">
                        <div className="bg-slate-900 p-2 rounded text-center">
                            <span className="block text-slate-500 mb-1">Risk</span>
                            <span className={`font-bold ${loc.risk === 'Ölümcül' ? 'text-red-600' : loc.risk === 'Yüksek' ? 'text-orange-500' : 'text-slate-300'}`}>{loc.risk}</span>
                        </div>
                        <div className="bg-slate-900 p-2 rounded text-center">
                            <span className="block text-slate-500 mb-1">Ödül</span>
                            <span className="font-bold text-yellow-400">{loc.reward}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => startExpedition(loc)}
                    disabled={isBusy}
                    className={`relative z-10 w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                        isBusy 
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                        : loc.risk === 'Ölümcül' 
                            ? 'bg-red-900 hover:bg-red-800 text-white shadow-lg shadow-red-900/20'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    }`}
                >
                    <Play size={16} fill="currentColor" />
                    Seferi Başlat
                </button>
                </div>
            ))}
            </div>

            {/* Boss Section */}
            <div className="bg-gradient-to-r from-red-950 to-slate-900 border border-red-900/50 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
                
                <div className="relative z-10 text-center md:text-left">
                    <h3 className="text-3xl font-bold text-red-500 cinzel mb-2 flex items-center justify-center md:justify-start gap-3">
                        <Skull size={32} /> BOSS SAVAŞI: Efsanevi Ejderha
                    </h3>
                    <p className="text-red-200/70 max-w-xl">
                        Kadim bir yaratık uyandı. Onu yenmek büyük cesaret ister. Ölüm riski çok yüksektir ancak hazinesi krallara layıktır.
                    </p>
                </div>

                <button
                    onClick={() => startExpedition(null, true)}
                    disabled={isBusy}
                    className={`relative z-10 px-8 py-4 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg border border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all transform hover:scale-105 ${isBusy ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                >
                    <span className="flex items-center gap-2 text-xl">
                        <Swords /> MEYDAN OKU
                    </span>
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default Expedition;