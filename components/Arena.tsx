
import React, { useState } from 'react';
import { Player, ArenaBattleState } from '../types';
import { Swords, Skull, Trophy, AlertTriangle, ArrowRight } from 'lucide-react';

interface ArenaProps {
  player: Player;
  isBusy: boolean;
  battleState: ArenaBattleState;
  onSearch: (difficulty: number) => void;
  onStart: () => void;
  onReset: () => void;
}

const Arena: React.FC<ArenaProps> = ({ player, isBusy, battleState, onSearch, onStart, onReset }) => {
  const { enemy, logs, isFighting, mode } = battleState;
  const [selectedDepth, setSelectedDepth] = useState(1);

  // Only show combat if we have an enemy AND we are in PVE mode
  const showCombat = enemy && mode === 'pve';

  return (
    <div className="max-w-5xl mx-auto pb-20">
       <div className="text-center mb-8">
        <h2 className="text-4xl cinzel font-black text-amber-600 mb-2 drop-shadow-md">Karanlık Zindan</h2>
        <p className="text-stone-400 font-serif italic">Yeraltının derinliklerine in, korkularını yen.</p>
      </div>

      {!showCombat ? (
        <div className="bg-stone-900 border-2 border-stone-700 rounded-xl overflow-hidden relative shadow-2xl">
           {/* Atmospheric Background */}
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 grayscale"></div>
           
           <div className="relative z-10 p-8 md:p-12 flex flex-col items-center">
               
               <div className="bg-stone-950/80 border border-stone-600 p-6 rounded-xl w-full max-w-2xl mb-8 backdrop-blur-sm">
                   <h3 className="text-xl font-bold text-stone-200 mb-4 flex items-center justify-center gap-2 cinzel">
                       <Skull size={24} className="text-red-600"/> Zindan Derinliği Seç
                   </h3>
                   
                   <div className="flex justify-between items-center gap-2 mb-2 bg-stone-900 rounded-lg p-2 border border-stone-800">
                        <button 
                            disabled={selectedDepth <= 1}
                            onClick={() => setSelectedDepth(d => d - 1)}
                            className="p-2 bg-stone-800 hover:bg-stone-700 rounded disabled:opacity-30"
                        >
                            <ArrowRight className="rotate-180" size={20}/>
                        </button>
                        <div className="text-center px-4">
                            <span className="text-4xl font-black cinzel text-amber-500">{selectedDepth}</span>
                            <span className="text-xs text-stone-500 block uppercase tracking-widest">Seviye</span>
                        </div>
                        <button 
                            disabled={selectedDepth >= 10} // Max depth 10 for safety
                            onClick={() => setSelectedDepth(d => d + 1)}
                            className="p-2 bg-stone-800 hover:bg-stone-700 rounded disabled:opacity-30"
                        >
                            <ArrowRight size={20}/>
                        </button>
                   </div>

                   <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-stone-900 p-3 rounded border border-stone-700 text-center">
                            <div className="text-xs text-stone-500 uppercase font-bold">Düşman Seviyesi</div>
                            <div className="text-red-400 font-bold">~{player.level + (selectedDepth * 2) - 1}</div>
                        </div>
                        <div className="bg-stone-900 p-3 rounded border border-stone-700 text-center">
                            <div className="text-xs text-stone-500 uppercase font-bold">Ödül Çarpanı</div>
                            <div className="text-green-400 font-bold">x{(1 + (selectedDepth * 0.2)).toFixed(1)}</div>
                        </div>
                   </div>

                   <div className="mt-4 text-xs text-stone-400 text-center bg-red-900/10 p-2 rounded border border-red-900/20">
                       <AlertTriangle size={12} className="inline mr-1 text-red-500"/>
                       Derinlik arttıkça yaratıklar güçlenir ve ölüm riski artar.
                   </div>
               </div>

               <button 
                onClick={() => onSearch(selectedDepth * 2)} // Pass level modifier
                disabled={isBusy}
                className="group relative px-10 py-5 bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white font-bold rounded shadow-lg shadow-red-900/50 transition-all transform hover:scale-105"
               >
                 <span className="flex items-center gap-3 text-xl cinzel tracking-wider">
                    <Swords size={28} />
                    ZİNDANA GİR
                 </span>
               </button>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative animate-fade-in">
            {/* Player Card */}
            <div className={`bg-stone-900 border-2 ${isFighting ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border-stone-600'} rounded-xl p-6 transition-all duration-300 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-2 opacity-10"><Trophy size={100} className="text-blue-500"/></div>
                <h3 className="text-xl font-bold text-blue-400 mb-1 cinzel">{player.name}</h3>
                <p className="text-xs text-stone-500 mb-4 font-serif">Seviye {player.level} Gladyatör</p>
                
                <div className="relative h-6 bg-stone-950 rounded border border-stone-700 overflow-hidden mb-2">
                    <div className="h-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-300" style={{ width: `${Math.max(0, (player.hp / player.maxHp) * 100)}%` }}></div>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">
                        {player.hp} / {player.maxHp} HP
                    </div>
                </div>
            </div>

            {/* VS Badge */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
                <div className="bg-stone-950 border-4 border-amber-700 rounded-full w-20 h-20 flex items-center justify-center font-black text-3xl cinzel text-red-600 shadow-[0_0_30px_rgba(220,38,38,0.5)] animate-pulse-slow">VS</div>
            </div>

            {/* Enemy Card */}
            <div className={`bg-stone-900 border-2 ${isFighting ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'border-stone-600'} rounded-xl p-6 transition-all duration-300 relative overflow-hidden`}>
                <div className="flex justify-between items-start z-10 relative">
                    <div>
                        <h3 className="text-xl font-bold text-red-500 mb-1 flex items-center gap-2 cinzel">
                            {enemy!.name}
                        </h3>
                        <p className="text-xs text-stone-500 mb-4 font-serif italic">"{enemy!.description}"</p>
                    </div>
                    <Skull className="text-red-900/50 w-16 h-16 opacity-50" />
                </div>
                
                <div className="relative h-6 bg-stone-950 rounded border border-stone-700 overflow-hidden mb-2 z-10">
                    <div className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-300" style={{ width: `${Math.max(0, (enemy!.hp / enemy!.maxHp) * 100)}%` }}></div>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">
                        {enemy!.hp} / {enemy!.maxHp} HP
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-stone-400 z-10 relative bg-stone-950/50 p-2 rounded">
                    <div>Seviye: <span className="text-stone-200 font-bold">{enemy!.level}</span></div>
                    <div>Güç: <span className="text-stone-200 font-bold">{enemy!.stats.STR}</span></div>
                </div>
            </div>

            {/* Action Area */}
            <div className="md:col-span-2 flex flex-col items-center mt-4">
                {!isFighting && logs.length === 0 && (
                    <button 
                        onClick={onStart}
                        className="px-16 py-4 bg-gradient-to-r from-amber-700 to-yellow-600 hover:from-amber-600 hover:to-yellow-500 text-stone-900 font-black rounded text-xl shadow-[0_0_20px_rgba(234,179,8,0.4)] cinzel tracking-widest animate-bounce-short border border-yellow-400"
                    >
                        SALDIR
                    </button>
                )}

                {/* Combat Log */}
                <div className="w-full bg-stone-950/80 border border-stone-700 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm space-y-2 mt-6 flex flex-col-reverse shadow-inner custom-scrollbar">
                    {logs.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-stone-600 italic">
                            Savaş başlamak üzere...
                        </div>
                    ) : (
                        [...logs].reverse().map((log, idx) => (
                            <div key={idx} className={`
                                border-b border-stone-800 pb-1
                                ${log.includes('KAZANDIN') ? 'text-green-400 font-bold text-base bg-green-900/20 p-2 rounded border-green-800' : ''}
                                ${log.includes('KAYBETTİN') ? 'text-red-400 font-bold text-base bg-red-900/20 p-2 rounded border-red-800' : ''}
                                ${!log.includes('KAZANDIN') && !log.includes('KAYBETTİN') ? 'text-stone-300' : ''}
                            `}>
                                <span className="opacity-50 mr-2 text-xs">[{idx+1}]</span> {log}
                            </div>
                        ))
                    )}
                </div>

                {!isFighting && logs.length > 0 && (
                     <button 
                        onClick={onReset}
                        className="mt-6 px-8 py-3 bg-stone-700 hover:bg-stone-600 text-stone-200 font-bold rounded shadow-lg border border-stone-500 cinzel"
                    >
                        Zindana Dön
                    </button>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default Arena;
