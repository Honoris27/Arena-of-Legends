
import React from 'react';
import { GameEvent } from '../types';
import { Zap, Clock, Coins, Gift, Sparkles } from 'lucide-react';

interface EventBannerProps {
    event: GameEvent;
}

const EventBanner: React.FC<EventBannerProps> = ({ event }) => {
    return (
        <div className={`
            relative overflow-hidden w-full py-2 bg-gradient-to-r from-red-900 via-yellow-900 to-red-900 border-b border-yellow-500 shadow-lg z-40
        `}>
            {/* Background Animation */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-pulse"></div>
            </div>

            <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 relative z-10">
                <Sparkles className="text-yellow-400 animate-spin-slow" size={24} />
                <div className="flex flex-col items-center">
                    <h3 className="text-lg font-bold cinzel text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] animate-bounce-short">
                        {event.title} ETKİNLİĞİ AKTİF!
                    </h3>
                    <div className="flex gap-4 text-xs font-bold text-yellow-200 uppercase tracking-wider">
                        {event.xpMultiplier > 1 && <span className="flex items-center gap-1"><Zap size={12}/> XP x{event.xpMultiplier}</span>}
                        {event.goldMultiplier > 1 && <span className="flex items-center gap-1"><Coins size={12}/> Altın x{event.goldMultiplier}</span>}
                        {event.dropRateMultiplier > 1 && <span className="flex items-center gap-1"><Gift size={12}/> Drop x{event.dropRateMultiplier}</span>}
                        {event.expeditionTimeMultiplier < 1 && <span className="flex items-center gap-1"><Clock size={12}/> Hızlı Sefer</span>}
                    </div>
                </div>
                <Sparkles className="text-yellow-400 animate-spin-slow" size={24} />
            </div>
        </div>
    );
};

export default EventBanner;
