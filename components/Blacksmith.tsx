
import React, { useState, useEffect, useMemo } from 'react';
import { Item, BlacksmithJob, Stats } from '../types';
import { calculateUpgradeCost, getBlacksmithTime, formatTime } from '../services/gameLogic';
import { Hammer, ArrowRight, Check, Anvil, Clock } from 'lucide-react';
import ItemTooltip from './ItemTooltip';

interface BlacksmithProps {
  inventory: Item[];
  playerGold: number;
  jobs: BlacksmithJob[];
  learnedModifiers: string[];
  onStartJob: (job: BlacksmithJob, cost: number) => void;
  onClaimJob: (jobId: string) => void;
}

const Blacksmith: React.FC<BlacksmithProps> = ({ inventory, playerGold, jobs, learnedModifiers, onStartJob, onClaimJob }) => {
  const [activeTab, setActiveTab] = useState<'upgrade' | 'salvage' | 'craft'>('upgrade');
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
      const t = setInterval(() => setCurrentTime(Date.now()), 1000);
      return () => clearInterval(t);
  }, []);

  return (
    <div className="max-w-6xl mx-auto flex flex-col items-center pb-20 parchment-panel p-6">
      <div className="text-center mb-6 border-b-2 border-[#8b5a2b] w-full pb-4">
        <h2 className="text-3xl cinzel font-bold text-[#3e2714] mb-2 flex items-center justify-center gap-3">
            <Anvil size={32} /> Demirci Atölyesi
        </h2>
        <p className="text-[#5e3b1f] italic text-sm">Ateş ve çelikle kaderini şekillendir.</p>
      </div>

      {/* JOB QUEUE */}
      <div className="w-full mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#dccbb6] p-4 rounded border border-[#8b5a2b] shadow-inner">
          {jobs.map(job => {
              const elapsed = currentTime - job.startTime;
              const progress = Math.min(100, (elapsed / job.duration) * 100);
              const isDone = progress >= 100;
              
              return (
                  <div key={job.id} className="bg-[#eaddcf] border-2 border-[#5e3b1f] rounded p-2 relative overflow-hidden shadow-md">
                      <div className="flex justify-between items-center mb-1 z-10 relative">
                          <span className="text-[10px] font-bold uppercase text-[#5e3b1f]">{job.type === 'upgrade' ? 'Geliştirme' : 'İşlem'}</span>
                          {isDone ? <button onClick={() => onClaimJob(job.id)} className="bg-green-700 text-white text-[10px] px-2 py-0.5 rounded font-bold">AL</button> 
                                  : <span className="text-[10px] font-mono text-[#3e2714]">{formatTime(job.duration - elapsed)}</span>}
                      </div>
                      <div className="text-xs font-bold text-[#2c1810] z-10 relative truncate">{job.item?.name || "Eşya"}</div>
                      <div className="absolute bottom-0 left-0 h-1 bg-[#bcaaa4] w-full">
                          <div className={`h-full ${isDone ? 'bg-green-600' : 'bg-[#c5a059]'} transition-all`} style={{ width: `${progress}%` }}></div>
                      </div>
                  </div>
              )
          })}
          {jobs.length === 0 && <div className="col-span-3 text-center text-xs text-[#8b5a2b] italic">Çalışma tezgahı boş.</div>}
      </div>

      {/* Main Work Area */}
      <div className="flex w-full gap-4">
          <div className="w-1/3 bg-[#dccbb6] border border-[#8b5a2b] p-2 h-[400px] overflow-y-auto">
              <h4 className="text-center font-bold text-[#5e3b1f] border-b border-[#8b5a2b] mb-2 text-xs">Eşyaların</h4>
              {inventory.filter(i => ['weapon','armor'].includes(i.type)).map(i => (
                  <div className="p-2 border-b border-[#8b5a2b]/20 cursor-pointer hover:bg-[#eaddcf] text-xs font-bold text-[#3e2714]">
                      {i.name} <span className="text-[#8a1c1c]">+{i.upgradeLevel}</span>
                  </div>
              ))}
          </div>
          <div className="flex-1 bg-[#1a0f0a] border-4 border-[#5e3b1f] rounded flex items-center justify-center relative p-8 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]">
              <div className="text-center">
                  <Anvil size={64} className="text-[#5e3b1f] mx-auto mb-4 opacity-50"/>
                  <p className="text-[#8b5a2b] text-sm">Bir eşya seçin...</p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Blacksmith;
