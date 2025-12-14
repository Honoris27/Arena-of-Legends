
import React, { useState } from 'react';
import { Player, BankDeposit } from '../types';
import { Landmark, Coins, Clock, ArrowRight, ShieldCheck, History, Lock } from 'lucide-react';
import { formatTime } from '../services/gameLogic';

interface BankProps {
    player: Player;
    onDeposit: (amount: number) => void;
    onCancelDeposit: (id: string) => void;
    onClaimDeposit: (id: string) => void;
}

const Bank: React.FC<BankProps> = ({ player, onDeposit, onCancelDeposit, onClaimDeposit }) => {
    const [amount, setAmount] = useState<string>("");
    
    const depositAmount = parseInt(amount) || 0;
    const commission = Math.floor(depositAmount * 0.02);
    const netDeposit = depositAmount - commission;

    const handleDeposit = () => {
        if (depositAmount > 0 && depositAmount <= player.gold) {
            onDeposit(depositAmount);
            setAmount("");
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <div className="text-center mb-10">
                <h2 className="text-3xl cinzel font-bold text-yellow-500 mb-2 flex items-center justify-center gap-3">
                    <Landmark size={32} /> İmparatorluk Kasası
                </h2>
                <p className="text-slate-400">Altınlarını hırsızlardan korumak için güvenli kasa.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* DEPOSIT FORM */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Lock className="text-yellow-500"/> Altın Sakla
                    </h3>
                    
                    <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg mb-6 text-sm text-slate-300">
                        <p className="mb-2"><strong className="text-white">Neden Banka?</strong></p>
                        <p>PvP Arena savaşlarında yenilirsen üzerindeki altının <strong>%5'ini</strong> rakibine kaptırırsın. Bankaya yatırılan altınlar <strong>ÇALINAMAZ</strong>.</p>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-lg mb-6 text-sm text-slate-300 space-y-2">
                        <div className="flex justify-between">
                            <span>Cüzdan:</span>
                            <span className="text-yellow-500 font-bold">{player.gold}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Kasa Komisyonu:</span>
                            <span className="text-red-400">%2</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Kilit Süresi:</span>
                            <span className="text-blue-400">7 Gün</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Yatırılacak miktar..." 
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 pl-10 text-white focus:border-yellow-500 outline-none"
                            />
                            <Coins className="absolute left-3 top-3.5 text-slate-500" size={18}/>
                            <button 
                                onClick={() => setAmount(player.gold.toString())}
                                className="absolute right-2 top-2 bg-slate-700 text-xs px-2 py-1.5 rounded hover:bg-slate-600"
                            >
                                MAX
                            </button>
                        </div>

                        {depositAmount > 0 && (
                            <div className="bg-indigo-900/20 border border-indigo-500/30 p-3 rounded text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Yatırılan:</span>
                                    <span className="text-white">{depositAmount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Net Kasa Bakiyesi:</span>
                                    <span className="text-white">{netDeposit}</span>
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={handleDeposit}
                            disabled={depositAmount <= 0 || depositAmount > player.gold}
                            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                                depositAmount > 0 && depositAmount <= player.gold
                                ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-900/20'
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            <ShieldCheck size={18} /> Kasaya Kilitle
                        </button>
                    </div>
                </div>

                {/* ACTIVE DEPOSITS */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <History className="text-blue-500"/> Kasa Hareketleri
                    </h3>

                    <div className="flex-1 overflow-y-auto space-y-3 max-h-[400px]">
                        {player.bankDeposits.length === 0 ? (
                            <div className="text-center text-slate-500 py-10">Kasanız boş.</div>
                        ) : (
                            player.bankDeposits.map(deposit => {
                                const timeLeft = deposit.endTime - Date.now();
                                const isReady = timeLeft <= 0;

                                return (
                                    <div key={deposit.id} className="bg-slate-900 border border-slate-700 rounded-lg p-4 relative overflow-hidden group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="text-xs text-slate-500">Kasadaki Tutar</div>
                                                <div className="font-bold text-white text-lg">{deposit.amount} <span className="text-xs font-normal text-slate-400">Altın</span></div>
                                            </div>
                                            {isReady && <div className="bg-green-900/50 text-green-400 text-xs px-2 py-1 rounded">Çekilebilir</div>}
                                        </div>

                                        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded mb-3">
                                            <Clock size={14} className={isReady ? 'text-green-500' : 'text-blue-500'} />
                                            <span className={`text-xs font-mono ${isReady ? 'text-green-500 font-bold' : 'text-slate-300'}`}>
                                                {isReady ? "SÜRE DOLDU" : formatTime(timeLeft)}
                                            </span>
                                        </div>

                                        {isReady ? (
                                            <button 
                                                onClick={() => onClaimDeposit(deposit.id)}
                                                className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded font-bold text-sm flex items-center justify-center gap-2 animate-pulse"
                                            >
                                                Parayı Çek ({deposit.amount} Altın) <ArrowRight size={16}/>
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => onCancelDeposit(deposit.id)}
                                                className="w-full bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/50 py-2 rounded text-xs transition-colors"
                                            >
                                                Acil Durum: Vadeyi Boz ve Çek
                                            </button>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Bank;
