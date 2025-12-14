
import React, { useEffect, useState } from 'react';
import { RankEntry, Stats, Player, Equipment, Item, Enemy } from '../types';
import { Trophy, Medal, User, Crown, RefreshCw, MessageCircle, X, Sword, Shield, Zap, Brain, Clover, Hand, Footprints } from 'lucide-react';
import { fetchLeaderboard, sendMessage } from '../services/supabase';

interface LeaderboardProps {
    currentUser: Player;
    onAttack: (enemy: Enemy) => void;
}

const RARITY_COLORS: any = {
  common: 'border-slate-600 bg-slate-900 text-slate-300',
  uncommon: 'border-green-600 bg-slate-900 text-green-300',
  rare: 'border-blue-600 bg-slate-900 text-blue-300',
  epic: 'border-purple-600 bg-slate-900 text-purple-300',
  legendary: 'border-orange-600 bg-slate-900 text-orange-300',
};

// Mini Component for Displaying Equipment in Modal
const SimpleEquipSlot = ({ item, icon: Icon }: { item?: Item | null, icon: any }) => {
    if (!item) return <div className="w-10 h-10 rounded border border-slate-700 bg-slate-800 flex items-center justify-center opacity-50"><Icon size={16}/></div>;
    return (
        <div className={`w-10 h-10 rounded border flex items-center justify-center relative group cursor-help ${RARITY_COLORS[item.rarity] || 'border-slate-600'}`}>
            <Icon size={16} />
            <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-1 bg-black border border-slate-600 text-xs p-2 rounded w-32 z-50 pointer-events-none">
                <div className="font-bold">{item.name}</div>
                <div className="text-[9px] text-yellow-500">+{item.upgradeLevel}</div>
            </div>
        </div>
    );
};

const Leaderboard: React.FC<LeaderboardProps> = ({ currentUser, onAttack }) => {
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<RankEntry | null>(null);
  const [msgContent, setMsgContent] = useState("");
  const [msgSent, setMsgSent] = useState(false);
  const [msgError, setMsgError] = useState("");

  const loadData = async () => {
      setLoading(true);
      const data = await fetchLeaderboard();
      setRankings(data);
      setLoading(false);
  };

  useEffect(() => {
      loadData();
  }, []);

  const handleSendMessage = async () => {
      if (!selectedUser?.id) return;
      if (selectedUser.id === currentUser.id) {
          alert("Kendine mesaj gönderemezsin.");
          return;
      }

      setMsgError("");
      const success = await sendMessage(currentUser.name, selectedUser.id, "Özel Mesaj", msgContent);
      
      if (success) {
          setMsgSent(true);
          setTimeout(() => {
              setMsgSent(false);
              setMsgContent("");
          }, 2000);
      } else {
          setMsgError("Mesaj gönderilemedi.");
      }
  };

  const handleAttackClick = () => {
      if(!selectedUser) return;
      if(selectedUser.id === currentUser.id) {
          alert("Kendine saldıramazsın!");
          return;
      }

      // Convert RankEntry to Enemy format
      const enemy: Enemy = {
          id: selectedUser.id,
          name: selectedUser.name,
          level: selectedUser.level,
          rank: selectedUser.rank,
          hp: 100, // Default or calculate from stats if available
          maxHp: 100, // Default
          stats: selectedUser.stats || { STR:10, AGI:5, VIT:10, INT:5, LUK:5 },
          description: `Sıralama #${selectedUser.rank}`,
          isPlayer: true,
          avatarUrl: selectedUser.avatar,
          gold: 1000 // Placeholder, handled by backend usually
      };
      
      onAttack(enemy);
      setSelectedUser(null);
  };

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* Player Inspect Modal */}
      {selectedUser && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
              <div className="bg-slate-900 border border-slate-600 rounded-xl w-full max-w-2xl p-6 relative shadow-2xl flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
                  <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"><X /></button>
                  
                  {/* Left Column: Avatar & Actions */}
                  <div className="w-full md:w-1/3 flex flex-col items-center border-b md:border-b-0 md:border-r border-slate-700 pb-4 md:pb-0 md:pr-4">
                      <img src={selectedUser.avatar} className="w-24 h-24 rounded-full border-4 border-yellow-500 shadow-lg mb-4 bg-black" />
                      <h2 className="text-xl font-bold text-white cinzel text-center">{selectedUser.name}</h2>
                      <div className="text-yellow-500 font-bold text-sm mb-4">#{selectedUser.rank} • Lvl {selectedUser.level}</div>
                      
                      <div className="w-full space-y-2 mt-auto">
                          <button 
                            onClick={handleAttackClick}
                            className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded flex items-center justify-center gap-2 shadow-lg shadow-red-900/50"
                          >
                              <Sword size={18}/> SALDIR
                          </button>
                      </div>
                  </div>

                  {/* Right Column: Stats, Equip, Message */}
                  <div className="w-full md:w-2/3 space-y-6">
                      
                      {/* Bio */}
                      <div className="bg-slate-800 p-3 rounded text-sm italic text-slate-400">
                          "{selectedUser.bio || "Sessiz bir savaşçı..."}"
                      </div>

                      {/* Stats Grid */}
                      <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">İstatistikler</h4>
                          <div className="grid grid-cols-5 gap-2 text-center bg-slate-800 p-2 rounded">
                              <div><div className="text-xs text-slate-500">STR</div><div className="text-white font-mono">{selectedUser.stats?.STR || 0}</div></div>
                              <div><div className="text-xs text-slate-500">AGI</div><div className="text-white font-mono">{selectedUser.stats?.AGI || 0}</div></div>
                              <div><div className="text-xs text-slate-500">VIT</div><div className="text-white font-mono">{selectedUser.stats?.VIT || 0}</div></div>
                              <div><div className="text-xs text-slate-500">INT</div><div className="text-white font-mono">{selectedUser.stats?.INT || 0}</div></div>
                              <div><div className="text-xs text-slate-500">LUK</div><div className="text-white font-mono">{selectedUser.stats?.LUK || 0}</div></div>
                          </div>
                      </div>

                      {/* Equipment Grid */}
                      <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Ekipmanlar</h4>
                          <div className="flex flex-wrap gap-2 justify-center bg-slate-800 p-3 rounded">
                              <SimpleEquipSlot item={selectedUser.equipment?.helmet} icon={Crown} />
                              <SimpleEquipSlot item={selectedUser.equipment?.armor} icon={Shield} />
                              <SimpleEquipSlot item={selectedUser.equipment?.gloves} icon={Hand} />
                              <SimpleEquipSlot item={selectedUser.equipment?.boots} icon={Footprints} />
                              <SimpleEquipSlot item={selectedUser.equipment?.weapon} icon={Sword} />
                              <SimpleEquipSlot item={selectedUser.equipment?.shield} icon={Shield} />
                          </div>
                      </div>

                      {/* Message Input */}
                      <div className="pt-4 border-t border-slate-800">
                          <label className="text-xs font-bold text-slate-400 mb-1 block">Özel Mesaj</label>
                          <div className="flex gap-2">
                              <input 
                                type="text"
                                className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 text-sm text-white focus:border-indigo-500 outline-none"
                                placeholder="Mesajını yaz..."
                                value={msgContent}
                                onChange={e => setMsgContent(e.target.value)}
                              />
                              <button 
                                onClick={handleSendMessage}
                                disabled={!msgContent || msgSent}
                                className={`px-4 py-2 rounded text-white font-bold text-xs transition-colors ${msgSent ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                              >
                                  {msgSent ? 'Gönderildi' : <MessageCircle size={16}/>}
                              </button>
                          </div>
                          {msgError && <p className="text-xs text-red-500 mt-1">{msgError}</p>}
                      </div>

                  </div>
              </div>
          </div>
      )}

      {/* Weekly Champions Section */}
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-yellow-600/30 rounded-xl p-6 shadow-2xl relative overflow-hidden min-h-[300px] flex flex-col items-center justify-center">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={100} className="text-yellow-500"/></div>
          <div className="absolute top-4 right-4 z-10">
              <button onClick={loadData} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
          </div>

          <h2 className="text-2xl font-bold cinzel text-yellow-500 mb-6 flex items-center gap-2">
              <Crown /> Haftanın Şampiyonları
          </h2>
          
          {rankings.length > 0 ? (
          <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-8 pb-4 w-full">
              {/* Rank 2 */}
              {top3[1] && (
              <div className="order-2 md:order-1 flex flex-col items-center cursor-pointer hover:scale-105 transition-transform" onClick={() => setSelectedUser(top3[1])}>
                   <div className="w-20 h-20 rounded-full border-4 border-slate-400 bg-slate-800 flex items-center justify-center mb-2 overflow-hidden shadow-lg">
                       <img src={top3[1].avatar} alt="" className="w-full h-full object-cover"/>
                   </div>
                   <div className="bg-slate-700 text-white px-3 py-1 rounded text-sm font-bold mb-1">{top3[1].name}</div>
                   <div className="text-slate-400 text-xs">{top3[1].wins} Zafer</div>
                   <div className="h-24 w-16 bg-slate-700/50 rounded-t-lg border-t-4 border-slate-400 mt-2 flex items-end justify-center pb-2 font-bold text-4xl text-slate-500">2</div>
              </div>
              )}

              {/* Rank 1 */}
              {top3[0] && (
              <div className="order-1 md:order-2 flex flex-col items-center relative z-10 scale-110 cursor-pointer hover:scale-115 transition-transform" onClick={() => setSelectedUser(top3[0])}>
                   <Crown className="text-yellow-500 mb-1 animate-bounce" />
                   <div className="w-24 h-24 rounded-full border-4 border-yellow-500 bg-slate-800 flex items-center justify-center mb-2 overflow-hidden shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                        <img src={top3[0].avatar} alt="" className="w-full h-full object-cover"/>
                   </div>
                   <div className="bg-yellow-600 text-white px-4 py-1 rounded text-sm font-bold mb-1">{top3[0].name}</div>
                   <div className="text-yellow-500 text-xs font-bold">{top3[0].wins} Zafer</div>
                   <div className="h-32 w-20 bg-yellow-900/20 rounded-t-lg border-t-4 border-yellow-500 mt-2 flex items-end justify-center pb-2 font-bold text-5xl text-yellow-500/50">1</div>
              </div>
              )}

              {/* Rank 3 */}
              {top3[2] && (
              <div className="order-3 flex flex-col items-center cursor-pointer hover:scale-105 transition-transform" onClick={() => setSelectedUser(top3[2])}>
                   <div className="w-20 h-20 rounded-full border-4 border-amber-700 bg-slate-800 flex items-center justify-center mb-2 overflow-hidden shadow-lg">
                        <img src={top3[2].avatar} alt="" className="w-full h-full object-cover"/>
                   </div>
                   <div className="bg-amber-900/50 text-white px-3 py-1 rounded text-sm font-bold mb-1">{top3[2].name}</div>
                   <div className="text-amber-700 text-xs">{top3[2].wins} Zafer</div>
                   <div className="h-16 w-16 bg-amber-900/20 rounded-t-lg border-t-4 border-amber-700 mt-2 flex items-end justify-center pb-2 font-bold text-4xl text-amber-900/50">3</div>
              </div>
              )}
          </div>
          ) : (
              <div className="text-slate-500">Henüz şampiyon yok.</div>
          )}
      </div>

      {/* Main Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
          <div className="grid grid-cols-12 bg-slate-900 p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-2 text-center">Sıra</div>
              <div className="col-span-6">Gladyatör</div>
              <div className="col-span-2 text-center">Seviye</div>
              <div className="col-span-2 text-center">Zafer</div>
          </div>

          <div className="divide-y divide-slate-700">
              {rest.length > 0 ? rest.map((entry) => (
                  <div key={entry.rank} onClick={() => setSelectedUser(entry)} className="grid grid-cols-12 p-4 items-center hover:bg-slate-700/50 transition-colors cursor-pointer">
                      <div className="col-span-2 flex justify-center">
                          <span className="font-mono font-bold text-slate-500 text-lg">#{entry.rank}</span>
                      </div>
                      <div className="col-span-6 flex items-center gap-4">
                          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden">
                              <img src={entry.avatar} alt="" className="w-full h-full object-cover"/>
                          </div>
                          <span className="font-bold text-slate-300">
                              {entry.name}
                          </span>
                      </div>
                      <div className="col-span-2 text-center font-mono text-slate-400">
                          {entry.level}
                      </div>
                      <div className="col-span-2 text-center font-bold text-slate-500">
                          {entry.wins.toLocaleString()}
                      </div>
                  </div>
              )) : (
                  <div className="p-8 text-center text-slate-500">Başka gladyatör yok.</div>
              )}
          </div>
      </div>
    </div>
  );
};

export default Leaderboard;
