
import React from 'react';
import { Player, ArenaBattleState } from '../types';
import { Swords, Skull, Trophy } from 'lucide-react';

interface ArenaProps {
  player: Player;
  isBusy: boolean;
  battleState: ArenaBattleState;
  onSearch: () => void;
  onStart: () => void;
  onReset: () => void;
}

const Arena: React.FC<ArenaProps> = ({ player, isBusy, battleState, onSearch, onStart, onReset }) => {
  const { enemy, logs, isFighting } = battleState;

  return (
    <div className="max-w-4xl mx-auto pb-20">
       <div className="text-center mb-6">
        <h2 className="text-3xl cinzel font-bold text-white mb-2">Zindan (PvE)</h2>
        <p className="text-slate-400">Vahşi yaratıklara karşı savaş ve ganimet topla.</p>
      </div>

      {/* PvE Stats */}
      <div className="flex justify-center mb-8">
          <div className="bg-slate-800 px-6 py-3 rounded-lg border border-slate-700 text-center flex items-center gap-4">
              <div className="p-2 bg-green-900/30 rounded-full"><Trophy className="text-green-500" size={24} /></div>
              <div>
                <div className="text-xs text-slate-500 uppercase font-bold">Zafer Puanı</div>
                <div className="text-2xl font-bold text-green-400">{player.victoryPoints}</div>
              </div>
          </div>
      </div>

      {!enemy ? (
        <div className="flex flex-col items-center justify-center bg-slate-800/50 border border-slate-700 rounded-xl p-12 min-h-[300px]">
           <div className="text-center mb-6 max-w-md text-slate-400 text-sm">
               <p className="mb-2">Zindanda rastgele yaratıklarla savaş.</p>
               <ul className="list-disc list-inside text-slate-300">
                   <li>Altın ve Deneyim Puanı kazan.</li>
                   <li><strong className="text-green-400">+1 Zafer Puanı</strong> kazan.</li>
                   <li>Ölüm riski yoktur, sadece yaralanırsın.</li>
               </ul>
           </div>

           <button 
            onClick={onSearch}
            disabled={isBusy}
            className="group relative px-8 py-4 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg overflow-hidden transition-all shadow-lg shadow-red-900/50"
           >
             <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
             <span className="flex items-center gap-3 text-lg">
                <Swords size={24} />
                Yaratık Ara
             </span>
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            {/* Player Card */}
            <div className={`bg-slate-800 border-2 ${isFighting ? 'border-blue-500' : 'border-slate-600'} rounded-xl p-6 transition-colors`}>
                <h3 className="text-xl font-bold text-blue-400 mb-1">{player.name}</h3>
                <p className="text-xs text-slate-500 mb-4">Sen (Lvl {player.level})</p>
                <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                    <div className="h-full bg-blue-600 w-full transition-all duration-300" style={{ width: `${Math.max(0, (player.hp / player.maxHp) * 100)}%` }}></div>
                </div>
                <div className="mt-1 text-center text-xs font-bold text-white">{player.hp} / {player.maxHp} HP</div>
            </div>

            {/* VS Badge */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
                <div className="bg-slate-900 border-4 border-slate-700 rounded-full w-16 h-16 flex items-center justify-center font-black text-2xl text-red-500 shadow-xl">VS</div>
            </div>

            {/* Enemy Card */}
            <div className={`bg-slate-800 border-2 ${isFighting ? 'border-red-500' : 'border-slate-600'} rounded-xl p-6 transition-colors relative`}>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-red-400 mb-1 flex items-center gap-2">
                            {enemy.name}
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">{enemy.description}</p>
                    </div>
                    <Skull className="text-red-800/50 absolute top-4 right-4 w-16 h-16" />
                </div>
                
                <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                    <div className="h-full bg-red-600 w-full transition-all duration-300" style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }}></div>
                </div>
                <div className="mt-1 text-center text-xs font-bold text-white">{enemy.hp} / {enemy.maxHp} HP</div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-300">
                    <div>Lv: {enemy.level}</div>
                    <div>Güç: {enemy.stats.STR}</div>
                </div>
            </div>

            {/* Action Area */}
            <div className="md:col-span-2 flex flex-col items-center">
                {!isFighting && logs.length === 0 && (
                    <button 
                        onClick={onStart}
                        className="px-12 py-4 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg text-xl shadow-lg shadow-yellow-900/30 animate-bounce-short"
                    >
                        SAVAŞ!
                    </button>
                )}

                {/* Combat Log */}
                <div className="w-full bg-black/40 rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm space-y-2 border border-slate-700 mt-4 flex flex-col-reverse">
                    {logs.length === 0 ? (
                        <span className="text-slate-600 italic text-center py-4">Savaş kayıtları burada görünecek...</span>
                    ) : (
                        [...logs].reverse().map((log, idx) => (
                            <div key={idx} className={`
                                ${log.includes('KAZANDIN') ? 'text-green-400 font-bold border-t border-slate-700 pt-2' : ''}
                                ${log.includes('KAYBETTİN') ? 'text-red-400 font-bold border-t border-slate-700 pt-2' : ''}
                                ${!log.includes('KAZANDIN') && !log.includes('KAYBETTİN') ? 'text-slate-300' : ''}
                            `}>
                                {'>'} {log}
                            </div>
                        ))
                    )}
                </div>

                {!isFighting && logs.length > 0 && (
                     <button 
                        onClick={onReset}
                        className="mt-6 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                    >
                        Yeni Yaratık Ara
                    </button>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default Arena;
