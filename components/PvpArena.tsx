
import React, { useState, useEffect } from 'react';
import { Player, ArenaBattleState, Enemy } from '../types';
import { Swords, Shield, Crown, Medal, Trophy, RefreshCw } from 'lucide-react';
import { getLeagueInfo } from '../services/gameLogic';
import { fetchPvpOpponents } from '../services/supabase';

interface PvpArenaProps {
  player: Player;
  isBusy: boolean;
  battleState: ArenaBattleState;
  onSearch: (enemy: Enemy) => void;
  onStart: () => void;
  onReset: () => void;
}

const PvpArena: React.FC<PvpArenaProps> = ({ player, isBusy, battleState, onSearch, onStart, onReset }) => {
  const { enemy, logs, isFighting, mode } = battleState;
  const [opponents, setOpponents] = useState<Enemy[]>([]);
  const [loading, setLoading] = useState(false);

  const currentLeague = getLeagueInfo(player.level);

  // Only show combat if we have an enemy AND we are in PVP mode
  const showCombat = enemy && mode === 'pvp';

  const loadOpponents = async () => {
      setLoading(true);
      const opps = await fetchPvpOpponents(currentLeague.minLevel, currentLeague.maxLevel, player.rank || 9999, player.id);
      setOpponents(opps);
      setLoading(false);
  };

  useEffect(() => {
      // Only reload opponents if we are not in combat view
      if (!showCombat) loadOpponents();
  }, [showCombat, player.level, player.rank]);

  return (
    <div className="max-w-4xl mx-auto pb-20">
       <div className="text-center mb-6">
        <h2 className="text-3xl cinzel font-bold text-yellow-500 mb-2 drop-shadow-md">PvP Arena</h2>
        
        <div className="flex justify-center items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-2 bg-slate-800 px-4 py-1 rounded-full border border-yellow-600/50">
                <Trophy size={16} className="text-yellow-500"/>
                <span className="text-yellow-500 font-bold text-sm uppercase">{currentLeague.name}</span>
            </div>
        </div>
        <p className="text-slate-400 text-xs">Mevcut Sıralaman: <span className="text-white font-bold">#{player.rank || 9999}</span></p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-center">
              <div className="text-xs text-slate-500 uppercase font-bold">Pasif Gelir</div>
              <div className="text-xl font-bold text-green-400">+{currentLeague.passiveGold} <span className="text-xs">/10dk</span></div>
              <div className="text-[10px] text-slate-500">(Sadece Şampiyon)</div>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-center relative overflow-hidden">
               <div className="absolute top-1 right-1 opacity-20"><Crown size={24} className="text-yellow-500"/></div>
              <div className="text-xs text-slate-500 uppercase font-bold">Kumbara Bonusu</div>
              <div className="text-xl font-bold text-yellow-500">%20</div>
              <div className="text-[10px] text-slate-500">(10dk'da bir)</div>
          </div>
           <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-center relative overflow-hidden">
              <div className="text-xs text-slate-500 uppercase font-bold">Benim Kumbaram</div>
              <div className="text-xl font-bold text-white">{player.piggyBank} <span className="text-xs text-yellow-500">Altın</span></div>
          </div>
      </div>

      {!showCombat ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 min-h-[300px]">
           <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold text-white">Sıralama Rakipleri</h3>
               <button onClick={loadOpponents} disabled={loading} className="text-slate-400 hover:text-white"><RefreshCw size={20} className={loading ? 'animate-spin' : ''}/></button>
           </div>

           <div className="space-y-3">
               {opponents.length === 0 ? (
                   <div className="text-center py-10 text-slate-500">
                       Bu ligde senden üst sırada rakip bulunamadı. <br/> Ya lidersin ya da lig boş!
                   </div>
               ) : (
                   opponents.map(opp => (
                       <div key={opp.id} className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex items-center justify-between hover:border-yellow-600 transition-colors group">
                           <div className="flex items-center gap-4">
                               <div className="w-10 h-10 flex items-center justify-center font-bold text-lg text-slate-500 bg-slate-800 rounded-full border border-slate-600">
                                   #{opp.rank}
                               </div>
                               <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-600 bg-black">
                                   <img src={opp.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=X"} className="w-full h-full object-cover"/>
                               </div>
                               <div>
                                   <div className="font-bold text-white flex items-center gap-2">
                                       {opp.name}
                                       {opp.rank === 1 && <Crown size={14} className="text-yellow-500 animate-bounce"/>}
                                   </div>
                                   <div className="text-xs text-slate-400">Seviye {opp.level}</div>
                               </div>
                           </div>

                           <div className="text-right flex flex-col items-end gap-2">
                               {opp.piggyBank && opp.piggyBank > 0 && (
                                   <span className="text-xs text-yellow-500 bg-yellow-900/20 px-2 py-1 rounded border border-yellow-500/30">
                                       Kumbara: {opp.piggyBank}
                                   </span>
                               )}
                               <button 
                                onClick={() => onSearch(opp)}
                                disabled={isBusy}
                                className="bg-red-700 hover:bg-red-600 text-white px-4 py-1.5 rounded font-bold text-sm shadow-lg flex items-center gap-2"
                               >
                                   <Swords size={14}/> SAVAŞ
                               </button>
                           </div>
                       </div>
                   ))
               )}
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            {/* Player Card */}
            <div className={`bg-slate-800 border-2 ${isFighting ? 'border-blue-500' : 'border-slate-600'} rounded-xl p-6 transition-colors`}>
                <h3 className="text-xl font-bold text-blue-400 mb-1">{player.name}</h3>
                <p className="text-xs text-slate-500 mb-4">Sen (Sıra #{player.rank})</p>
                <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                    <div className="h-full bg-blue-600 w-full transition-all duration-300" style={{ width: `${Math.max(0, (player.hp / player.maxHp) * 100)}%` }}></div>
                </div>
                <div className="mt-1 text-center text-xs font-bold text-white">{player.hp} / {player.maxHp} HP</div>
                
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-300">
                    <div>STR: {player.stats.STR}</div>
                    <div>AGI: {player.stats.AGI}</div>
                </div>
            </div>

            {/* VS Badge */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
                <div className="bg-slate-900 border-4 border-slate-700 rounded-full w-16 h-16 flex items-center justify-center font-black text-2xl text-yellow-500 shadow-xl">VS</div>
            </div>

            {/* Enemy Card */}
            <div className={`bg-slate-800 border-2 ${isFighting ? 'border-red-500' : 'border-slate-600'} rounded-xl p-6 transition-colors relative`}>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-red-400 mb-1 flex items-center gap-2">
                            {enemy!.name}
                            {enemy!.rank === 1 && (
                                <span title="Lig Lideri">
                                    <Crown size={16} className="text-yellow-500 animate-pulse"/>
                                </span>
                            )}
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">Sıralama: #{enemy!.rank}</p>
                    </div>
                    <Shield className="text-red-800/50 absolute top-4 right-4 w-16 h-16" />
                </div>
                
                <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                    <div className="h-full bg-red-600 w-full transition-all duration-300" style={{ width: `${Math.max(0, (enemy!.hp / enemy!.maxHp) * 100)}%` }}></div>
                </div>
                <div className="mt-1 text-center text-xs font-bold text-white">{enemy!.hp} / {enemy!.maxHp} HP</div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-300">
                    <div>Lv: {enemy!.level}</div>
                    <div>Güç: {enemy!.stats.STR}</div>
                </div>

                <div className="mt-4 flex gap-2">
                    {enemy!.piggyBank && enemy!.piggyBank > 0 ? (
                        <div className="flex-1 bg-yellow-900/30 border border-yellow-500/30 rounded p-2 text-center">
                            <div className="text-xs text-yellow-500 uppercase font-bold mb-1">Kumbara</div>
                            <div className="font-mono text-white">{enemy!.piggyBank} Altın</div>
                        </div>
                    ) : (
                        <div className="flex-1 bg-slate-900/50 border border-slate-700 rounded p-2 text-center">
                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Çalınabilir</div>
                            <div className="font-mono text-white">~{Math.floor((enemy!.gold || 0) * 0.05)} Altın</div>
                        </div>
                    )}
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
                        Yeni Rakip Ara
                    </button>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default PvpArena;
