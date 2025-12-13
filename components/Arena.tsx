import React, { useState } from 'react';
import { Enemy, Player, Stats } from '../types';
import { generateEnemy, calculateDamage } from '../services/gameLogic';
import { generateEnemyNameAndDescription } from '../services/geminiService';
import { Swords, Skull, Trophy } from 'lucide-react';

interface ArenaProps {
  player: Player;
  onWin: (gold: number, xp: number) => void;
  onLoss: () => void;
  isBusy: boolean;
  setBusy: (busy: boolean) => void;
}

const Arena: React.FC<ArenaProps> = ({ player, onWin, onLoss, isBusy, setBusy }) => {
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [isFighting, setIsFighting] = useState(false);
  const [loadingEnemy, setLoadingEnemy] = useState(false);

  const findOpponent = async () => {
    if (isBusy) return;
    setLoadingEnemy(true);
    setEnemy(null);
    setCombatLog([]);

    // 1. Generate Stats Logic
    const baseEnemy = generateEnemy(player.level);
    
    // 2. Enhance with AI (Name/Desc)
    const flavor = await generateEnemyNameAndDescription(baseEnemy.level);
    
    setEnemy({
        ...baseEnemy,
        name: flavor.name,
        description: flavor.description
    });
    setLoadingEnemy(false);
  };

  const startFight = async () => {
    if (!enemy) return;
    setBusy(true);
    setIsFighting(true);

    const logs: string[] = [];
    logs.push(`${player.name} vs ${enemy.name}! Savaş başlıyor!`);

    let playerHp = player.hp;
    let enemyHp = enemy.hp;
    let round = 1;

    // Fight Loop Simulation with slight delays for effect
    const fightInterval = setInterval(() => {
        // Player Turn
        const dmgToEnemy = calculateDamage(player.stats, enemy.stats);
        enemyHp -= dmgToEnemy;
        logs.push(`Raunt ${round}: ${player.name}, ${enemy.name}'a ${dmgToEnemy} hasar verdi!`);

        if (enemyHp <= 0) {
            clearInterval(fightInterval);
            logs.push(`${enemy.name} yere yığıldı! KAZANDIN!`);
            setCombatLog([...logs]);
            endFight(true);
            return;
        }

        // Enemy Turn
        const dmgToPlayer = calculateDamage(enemy.stats, player.stats);
        playerHp -= dmgToPlayer;
        logs.push(`Raunt ${round}: ${enemy.name}, sana ${dmgToPlayer} hasar verdi!`);

        if (playerHp <= 0) {
            clearInterval(fightInterval);
            logs.push(`Ağır yaralandın... KAYBETTİN.`);
            setCombatLog([...logs]);
            endFight(false);
            return;
        }

        round++;
        // Update live logs only last few to avoid scroll spam
        setCombatLog(prev => [...prev, logs[logs.length-2], logs[logs.length-1]]);
        
    }, 800);
  };

  const endFight = (won: boolean) => {
    setIsFighting(false);
    setBusy(false);
    if (won) {
        const goldReward = (enemy!.level * 10) + Math.floor(Math.random() * 20);
        const xpReward = (enemy!.level * 20) + Math.floor(Math.random() * 10);
        onWin(goldReward, xpReward);
    } else {
        onLoss();
    }
    // Keep enemy visible to show result
  };

  return (
    <div className="max-w-4xl mx-auto">
       <div className="text-center mb-8">
        <h2 className="text-3xl cinzel font-bold text-white mb-2">Arena</h2>
        <p className="text-slate-400">Şan ve şöhret için savaş.</p>
      </div>

      {!enemy ? (
        <div className="flex flex-col items-center justify-center bg-slate-800/50 border border-slate-700 rounded-xl p-12 min-h-[300px]">
           {loadingEnemy ? (
                <div className="text-center">
                    <Swords className="w-12 h-12 text-yellow-500 animate-spin mx-auto mb-4" />
                    <p className="text-xl cinzel text-slate-300">Rakip aranıyor...</p>
                </div>
           ) : (
               <button 
                onClick={findOpponent}
                disabled={isBusy}
                className="group relative px-8 py-4 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg overflow-hidden transition-all shadow-lg shadow-red-900/50"
               >
                 <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                 <span className="flex items-center gap-3 text-lg">
                    <Swords size={24} />
                    Rakip Bul
                 </span>
               </button>
           )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Player Card */}
            <div className={`bg-slate-800 border-2 ${isFighting ? 'border-blue-500' : 'border-slate-600'} rounded-xl p-6 transition-colors`}>
                <h3 className="text-xl font-bold text-blue-400 mb-1">{player.name}</h3>
                <p className="text-xs text-slate-500 mb-4">Sen</p>
                <div className="h-4 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 w-full"></div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-300">
                    <div>STR: {player.stats.STR}</div>
                    <div>AGI: {player.stats.AGI}</div>
                </div>
            </div>

            {/* Enemy Card */}
            <div className={`bg-slate-800 border-2 ${isFighting ? 'border-red-500' : 'border-slate-600'} rounded-xl p-6 transition-colors relative`}>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-red-400 mb-1">{enemy.name}</h3>
                        <p className="text-xs text-slate-500 mb-4">{enemy.description}</p>
                    </div>
                    <Skull className="text-red-800/50 absolute top-4 right-4 w-16 h-16" />
                </div>
                
                <div className="h-4 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-red-600 w-full"></div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-300">
                    <div>Lv: {enemy.level}</div>
                    <div>Tahmini Güç: {enemy.stats.STR + enemy.stats.VIT}</div>
                </div>
            </div>

            {/* Action Area */}
            <div className="md:col-span-2 flex flex-col items-center">
                {!isFighting && combatLog.length === 0 && (
                    <button 
                        onClick={startFight}
                        className="px-12 py-4 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg text-xl shadow-lg shadow-yellow-900/30 animate-bounce-short"
                    >
                        SAVAŞ!
                    </button>
                )}

                {/* Combat Log */}
                <div className="w-full bg-black/40 rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm space-y-2 border border-slate-700 mt-4">
                    {combatLog.length === 0 ? (
                        <span className="text-slate-600 italic">Savaş kayıtları burada görünecek...</span>
                    ) : (
                        combatLog.map((log, idx) => (
                            <div key={idx} className={`
                                ${log.includes('KAZANDIN') ? 'text-green-400 font-bold' : ''}
                                ${log.includes('KAYBETTİN') ? 'text-red-400 font-bold' : ''}
                                ${!log.includes('KAZANDIN') && !log.includes('KAYBETTİN') ? 'text-slate-300' : ''}
                            `}>
                                {'>'} {log}
                            </div>
                        ))
                    )}
                </div>

                {!isFighting && combatLog.length > 0 && (
                     <button 
                        onClick={() => setEnemy(null)}
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

export default Arena;