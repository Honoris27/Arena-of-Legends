
import React, { useState } from 'react';
import { MarketItem } from '../types';
import { Coins, ShoppingBag, X, Check, Crown } from 'lucide-react';

interface MarketProps {
    playerGold: number;
    items: MarketItem[];
    onBuy: (item: MarketItem) => void;
}

const Market: React.FC<MarketProps> = ({ playerGold, items, onBuy }) => {
    return (
        <div className="max-w-5xl mx-auto parchment-panel p-6 min-h-[600px]">
            <div className="text-center mb-8 border-b-2 border-[#8b5a2b] pb-4">
                <h2 className="text-3xl cinzel font-bold text-[#8a1c1c] mb-2 flex items-center justify-center gap-3">
                    <ShoppingBag size={32} /> Şehir Pazarı
                </h2>
                <p className="text-[#5e3b1f] italic text-sm">İmparatorluğun dört bir yanından gelen mallar.</p>
            </div>

            {/* Shelf Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                {items.map(item => {
                    const canAfford = playerGold >= item.price;
                    return (
                        <div key={item.id} className="relative pt-8">
                            {/* Shelf Background */}
                            <div className="absolute top-4 left-0 w-full h-full bg-[#dccbb6] border-2 border-[#8b5a2b] rounded-t-xl z-0 shadow-lg"></div>
                            
                            <div className="relative z-10 flex flex-col items-center p-4">
                                {/* Item Visual */}
                                <div className="w-24 h-24 bg-[#2c1810] border-4 border-[#c5a059] rounded-full flex items-center justify-center text-5xl shadow-[0_5px_10px_rgba(0,0,0,0.5)] mb-4 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]">
                                    {item.icon}
                                </div>
                                
                                <h3 className={`font-bold text-lg mb-1 ${item.type === 'premium' ? 'text-[#8a1c1c]' : 'text-[#3e2714]'}`}>{item.name}</h3>
                                <p className="text-xs text-[#5e3b1f] text-center mb-3 min-h-[2.5em] px-2 leading-tight">{item.description}</p>
                                
                                <div className="bg-[#1a0f0a] text-[#f3e5ab] px-4 py-1 rounded border border-[#c5a059] font-mono font-bold text-lg mb-4 shadow-inner flex items-center gap-2">
                                    {item.price} <Coins size={14} className="text-[#ffd700]"/>
                                </div>
                                
                                <button
                                    onClick={() => canAfford && onBuy(item)}
                                    disabled={!canAfford}
                                    className={`
                                        roman-btn w-full py-2 text-sm font-bold
                                        ${!canAfford ? 'opacity-50 cursor-not-allowed filter grayscale' : ''}
                                    `}
                                >
                                    Satın Al
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Market;
