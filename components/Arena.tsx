
import React, { useState } from 'react';
import { Player, ArenaBattleState } from '../types';
import { Swords, Skull, Trophy, AlertTriangle, ArrowRight, Shield } from 'lucide-react';

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
  
  // Only show combat if we have an enemy AND we are in PVE mode
  const showCombat = enemy && mode === 'pve';

  return (
    <div className="max-w-6xl mx-auto pb-20">
      
      {!showCombat ? (
        <div className="parchment-panel p-6">
           {/* Header Section */}
           <div className="flex gap-4 mb-6 border-b-2 border-[#8b5a2b] pb-4">
               <div className="w-32 h-32 border-4 border-[#5e3b1f] bg-[#1a0f0a] shrink-0 overflow-hidden">
                   <img src="https://source.unsplash.com/random/200x200/?gladiator,warrior" className="w-full h-full object-cover sepia" />
               </div>
               <div className="flex-1">
                   <h2 className="font-bold text-[#8a1c1c] text-lg bg-[#eaddcf] border border-[#8b5a2b] inline-block px-2 mb-2">Tanım</h2>
                   <p className="text-sm text-[#3e2714] italic bg-[#f3e5ab] p-3 border border-[#8b5a2b] shadow-inner">
                       Arenaya girer girmez, dehşetin ve ölümün kokusunu alacaksın. Senden önce bu kumların içinden ne efsaneler doğduğunu iyi bilmelisin.
                       <br/><br/>
                       İlerlemek için arenada "Kendi Statün" listesindeki senden daha iyi sıralaması olan birisine karşı zafer kazanmalısın.
                   </p>
               </div>
           </div>

           <h3 className="text-center font-cinzel font-bold text-xl text-[#3e2714] mb-2">Tanrıların İyilik Ligi</h3>
           <p className="text-center text-xs text-[#5e3b1f] mb-6 italic">Kim buraya kadar gelebilmişse kendisine tanrı denilebilir - arenanın tanrısı...</p>

           <div className="flex flex-col md:flex-row gap-4">
               {/* Left Table: Top 5 */}
               <div className="flex-1 border-2 border-[#8b5a2b] bg-[#f3e5ab]">
                   <div className="bg-[#c5a059] text-[#3e2714] font-bold p-1 border-b border-[#8b5a2b] text-sm px-2">En İyi 5</div>
                   <table className="w-full text-xs text-[#3e2714]">
                       <thead>
                           <tr className="border-b border-[#8b5a2b] bg-[#eaddcf]">
                               <th className="p-1 text-left">Sıra</th>
                               <th className="p-1 text-left">İsim</th>
                               <th className="p-1 text-right">Altın</th>
                           </tr>
                       </thead>
                       <tbody>
                           {[1,2,3,4,5].map(rank => (
                               <tr key={rank} className="border-b border-[#8b5a2b]/30 last:border-0 hover:bg-[#fff9e6]">
                                   <td className="p-1 font-bold">{rank} <Trophy size={10} className="inline text-yellow-600"/></td>
                                   <td className="p-1 font-bold text-[#8a1c1c] underline cursor-pointer">Gladyatör {rank}</td>
                                   <td className="p-1 text-right font-mono">{(6000 - rank*500).toLocaleString()}</td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>

               {/* Right Table: Own Position */}
               <div className="flex-1 border-2 border-[#8b5a2b] bg-[#f3e5ab]">
                   <div className="bg-[#c5a059] text-[#3e2714] font-bold p-1 border-b border-[#8b5a2b] text-sm px-2">Kendi Pozisyonun</div>
                   <table className="w-full text-xs text-[#3e2714]">
                       <thead>
                           <tr className="border-b border-[#8b5a2b] bg-[#eaddcf]">
                               <th className="p-1 text-left">Sıra</th>
                               <th className="p-1 text-left">İsim</th>
                               <th className="p-1 text-center">Eylem</th>
                           </tr>
                       </thead>
                       <tbody>
                           {[player.rank-2, player.rank-1, player.rank, player.rank+1, player.rank+2].map(rank => {
                               if(rank < 6) return null;
                               const isMe = rank === player.rank;
                               return (
                               <tr key={rank} className={`border-b border-[#8b5a2b]/30 last:border-0 ${isMe ? 'bg-yellow-200' : 'hover:bg-[#fff9e6]'}`}>
                                   <td className="p-1 font-bold">{rank}</td>
                                   <td className={`p-1 font-bold ${isMe ? 'text-[#3e2714]' : 'text-[#8a1c1c] underline cursor-pointer'}`}>
                                       {isMe ? player.name : `Rakip ${rank}`}
                                   </td>
                                   <td className="p-1 text-center">
                                       {!isMe && (
                                           <button onClick={() => onSearch(0)} className="roman-btn px-2 py-0.5 text-[10px]">
                                               <Swords size={10}/>
                                           </button>
                                       )}
                                   </td>
                               </tr>
                           )})}
                       </tbody>
                   </table>
               </div>
           </div>

           {/* Search Box */}
           <div className="mt-6 bg-[#c5a059]/30 border border-[#8b5a2b] p-3 rounded flex items-center gap-4">
               <div className="flex-1 text-xs text-[#3e2714]">
                   <strong>Belirli Bir Oyuncuyu Ara (Ücreti: 10 Altın)</strong>
                   <p>Birisi vergisini mi ödemedi? Düşmanı arenada yenmek için düelloya davet et!</p>
               </div>
               <div className="flex gap-2">
                   <input className="border border-[#8b5a2b] bg-[#f3e5ab] p-1 text-xs text-[#3e2714] placeholder-[#8b5a2b]/50" placeholder="İsim:" />
                   <button className="roman-btn px-4 py-1 text-xs">Git!</button>
               </div>
           </div>

        </div>
      ) : (
        /* COMBAT VIEW (Keep similar but wrapped in Parchment) */
        <div className="parchment-panel p-6 flex flex-col items-center">
            <h3 className="cinzel font-bold text-2xl mb-6 text-[#8a1c1c]">ARENA SAVAŞI</h3>
            
            <div className="flex justify-between w-full max-w-2xl mb-8">
                <div className="text-center">
                    <div className="w-24 h-24 border-4 border-[#5e3b1f] bg-black mb-2"><img src={player.avatarUrl} className="w-full h-full object-cover"/></div>
                    <div className="font-bold text-[#3e2714]">{player.name}</div>
                    <div className="h-2 w-24 bg-[#1a0f0a] border border-[#5e3b1f]"><div className="h-full bg-red-600" style={{width: `${(player.hp/player.maxHp)*100}%`}}></div></div>
                </div>
                <div className="flex items-center justify-center">
                    <Swords size={48} className="text-[#8a1c1c] animate-pulse"/>
                </div>
                <div className="text-center">
                    <div className="w-24 h-24 border-4 border-[#5e3b1f] bg-black mb-2 flex items-center justify-center"><Skull className="text-red-500" size={48}/></div>
                    <div className="font-bold text-[#8a1c1c]">{enemy!.name}</div>
                    <div className="h-2 w-24 bg-[#1a0f0a] border border-[#5e3b1f]"><div className="h-full bg-red-600" style={{width: `${(enemy!.hp/enemy!.maxHp)*100}%`}}></div></div>
                </div>
            </div>

            <div className="w-full max-w-2xl bg-[#eaddcf] border border-[#8b5a2b] h-48 overflow-y-auto p-4 font-mono text-xs text-[#3e2714] mb-4 shadow-inner">
                {logs.map((log, i) => <div key={i} className="border-b border-[#8b5a2b]/20 pb-1 mb-1">{log}</div>)}
            </div>

            {!isFighting ? (
                logs.length === 0 ? (
                    <button onClick={onStart} className="roman-btn px-8 py-2 text-lg">SALDIR</button>
                ) : (
                    <button onClick={onReset} className="roman-btn px-8 py-2 text-lg">Geri Dön</button>
                )
            ) : (
                <div className="text-[#8a1c1c] font-bold animate-pulse">Savaş Sürüyor...</div>
            )}
        </div>
      )}
    </div>
  );
};

export default Arena;
