
import React, { useState } from 'react';
import { MarketItem } from '../types';
import { Coins, ShoppingBag, X, Check, Crown } from 'lucide-react';

interface MarketProps {
    playerGold: number;
    items: MarketItem[];
    onBuy: (item: MarketItem) => void;
}

const Market: React.FC<MarketProps> = ({ playerGold, items, onBuy }) => {
    const [confirmItem, setConfirmItem] = useState<MarketItem | null>(null);

    const handleBuyClick = (item: MarketItem) => {
        if (playerGold >= item.price) {
            setConfirmItem(item);
        }
    };

    const confirmPurchase = () => {
        if (confirmItem) {
            onBuy(confirmItem);
            setConfirmItem(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto relative">
            
            {/* Confirmation Modal */}
            {confirmItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-slate-900 border border-slate-600 rounded-xl p-6 max-w-sm w-full shadow-2xl text-center">
                        <h3 className="text-xl font-bold text-white mb-2">Satın Almayı Onayla</h3>
                        <div className="text-4xl my-4">{confirmItem.icon}</div>
                        <p className="text-slate-300 mb-4">
                            <span className="text-yellow-500 font-bold">{confirmItem.name}</span> eşyasını <span className="text-yellow-500 font-bold">{confirmItem.price} Altın</span> karşılığında almak istiyor musun?
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button 
                                onClick={() => setConfirmItem(null)}
                                className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white flex items-center gap-2"
                            >
                                <X size={16} /> İptal
                            </button>
                            <button 
                                onClick={confirmPurchase}
                                className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 text-white font-bold flex items-center gap-2"
                            >
                                <Check size={16} /> Satın Al
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="text-center mb-8">
                <h2 className="text-3xl cinzel font-bold text-white mb-2 flex items-center justify-center gap-3">
                    <ShoppingBag size={32} className="text-green-500" /> Şehir Pazarı
                </h2>
                <p className="text-slate-400">Gerekli malzemeleri buradan temin et.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(item => {
                    const canAfford = playerGold >= item.price;
                    return (
                        <div key={item.id} className={`bg-slate-800 border ${item.type === 'premium' ? 'border-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'border-slate-600'} rounded-xl p-6 flex flex-col items-center text-center hover:border-green-500 transition-colors`}>
                            <div className="text-4xl mb-4 transform hover:scale-110 transition-transform cursor-default">{item.icon}</div>
                            <h3 className={`font-bold text-lg ${item.type === 'premium' ? 'text-yellow-500' : 'text-white'}`}>{item.name}</h3>
                            <p className="text-xs text-slate-400 mb-4 h-10">{item.description}</p>
                            <div className="text-yellow-500 font-mono font-bold text-xl mb-4 flex items-center gap-1">
                                {item.price} <Coins size={16} />
                            </div>
                            
                            <button
                                onClick={() => handleBuyClick(item)}
                                disabled={!canAfford}
                                className={`w-full py-2 rounded font-bold transition-all ${
                                    canAfford 
                                    ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20' 
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                }`}
                            >
                                Satın Al
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Market;
