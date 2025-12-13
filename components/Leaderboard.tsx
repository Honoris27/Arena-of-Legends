
import React, { useEffect, useState } from 'react';
import { RankEntry, Stats } from '../types';
import { Trophy, Medal, User, Crown, RefreshCw, MessageCircle, X } from 'lucide-react';
import { fetchLeaderboard } from '../services/supabase';

const Leaderboard: React.FC = () => {
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<RankEntry | null>(null);
  const [msgContent, setMsgContent] = useState("");
  const [msgSent, setMsgSent] = useState(false);

  const loadData = async () => {
      setLoading(true);
      const data = await fetchLeaderboard();
      setRankings(data);
      setLoading(false);
  };

  useEffect(() => {
      loadData();
  }, []);

  const handleSendMessage = () => {
      // Mock sending message
      setMsgSent(true);
      setTimeout(() => {
          setMsgSent(false);
          setMsgContent("");
          setSelectedUser(null);
          alert("Mesaj gönderildi!");
      }, 1000);
  };

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* Player Inspect Modal */}
      {selectedUser && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
              <div className="bg-slate-900 border border-slate-600 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
                  <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X /></button>
                  
                  <div className="flex flex-col items-center mb-6">
                      <img src={selectedUser.avatar} className="w-24 h-24 rounded-full border-4 border-yellow-500 shadow-lg mb-4" />
                      <h2 className="text-2xl font-bold text-white cinzel">{selectedUser.name}</h2>
                      <div className="flex gap-4 text-sm text-slate-400 mt-2">
                          <span>Seviye {selectedUser.level}</span>
                          <span className="text-yellow-500 font-bold">{selectedUser.wins} Zafer</span>
                      </div>
                  </div>

                  <div className="bg-slate-800 p-4 rounded-lg mb-6">
                      <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Karakter Tanımı</h3>
                      <p className="text-slate-300 italic text-sm">
                          {selectedUser.bio || "Bu gladyatör henüz bir biyografi yazmamış."}
                      </p>
                  </div>

                  <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400">Mesaj Gönder</label>
                      <textarea 
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none"
                        rows={3}
                        placeholder="Mesajını yaz..."
                        value={msgContent}
                        onChange={e => setMsgContent(e.target.value)}
                      ></textarea>
                      <button 
                        onClick={handleSendMessage}
                        disabled={!msgContent || msgSent}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded transition-colors flex items-center justify-center gap-2"
                      >
                          {msgSent ? 'Gönderildi!' : <><MessageCircle size={16}/> Gönder</>}
                      </button>
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
