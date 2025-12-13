
import React from 'react';
import { Item, ItemRarity } from '../types';
import { Coins, ArrowUp } from 'lucide-react';
import { calculateSellPrice } from '../services/gameLogic';

interface ItemTooltipProps {
    item: Item;
    fixed?: boolean; // New prop to toggle positioning mode
}

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: 'border-slate-600 bg-slate-900 text-slate-300',
  uncommon: 'border-green-600 bg-slate-900 text-green-300',
  rare: 'border-blue-600 bg-slate-900 text-blue-300',
  epic: 'border-purple-600 bg-slate-900 text-purple-300',
  legendary: 'border-orange-600 bg-slate-900 text-orange-300',
};

const ItemTooltip: React.FC<ItemTooltipProps> = ({ item, fixed }) => {
    const sellPrice = calculateSellPrice(item);
    const borderColor = RARITY_COLORS[item.rarity].split(' ')[0];
    const textColor = RARITY_COLORS[item.rarity].split(' ').pop();

    // If fixed, we remove the absolute positioning classes relative to parent
    // The parent/wrapper will handle the fixed position
    const positionClass = fixed 
        ? 'w-64' 
        : 'absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 z-[100] pointer-events-none';

    return (
        <div className={`${positionClass} bg-slate-950 border-2 ${borderColor} rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] p-4`}>
            {/* Header */}
            <div className="border-b border-slate-800 pb-2 mb-2">
                <h5 className={`font-bold text-sm ${textColor} flex justify-between items-center`}>
                    {item.name}
                    {item.upgradeLevel > 0 && <span className="bg-yellow-600 text-white text-[10px] px-1.5 rounded ml-2">+{item.upgradeLevel}</span>}
                </h5>
                <p className="text-[10px] text-slate-400 italic">{item.description}</p>
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">{item.rarity} {item.type}</div>
            </div>
            
            {/* Requirements */}
            {(item.reqLevel || item.reqStat) && (
                <div className="text-[10px] text-red-400 mb-2 bg-red-900/10 p-1 rounded border border-red-900/30">
                    {item.reqLevel && <div>• Gereken Seviye: {item.reqLevel}</div>}
                    {item.reqStat && <div>• Gereken {item.reqStat.stat}: {item.reqStat.value}</div>}
                </div>
            )}

            {/* Stats */}
            <div className="space-y-1 mb-3">
                    {Object.entries(item.stats).map(([key, val]) => {
                        const nextVal = Math.ceil(((val as number) || 0) * 1.1) + 1;
                        return (
                            <div key={key} className="flex justify-between text-xs items-center">
                                <span className="text-slate-300 font-bold">{key}</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-white font-mono">{val}</span>
                                    {item.upgradeLevel < 20 && (
                                        <span className="text-[9px] text-green-500 flex items-center bg-green-900/20 px-1 rounded">
                                            <ArrowUp size={8} /> {nextVal}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <div className="text-[10px] text-slate-500">
                    Güç Skoru: {Math.floor(item.value / 10)}
                </div>
                <div className="text-xs text-yellow-500 font-bold flex items-center gap-1">
                    Satış: {sellPrice} <Coins size={12} />
                </div>
            </div>
        </div>
    );
};

export default ItemTooltip;
