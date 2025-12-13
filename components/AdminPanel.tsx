import React, { useState } from 'react';
import { X, PlusCircle, Trash2, Edit, Ban, Save } from 'lucide-react';
import { Player, Item, ExpeditionLocation, ExpeditionDuration, ItemType, ItemRarity } from '../types';
import { generateRandomItem } from '../services/gameLogic';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // User Actions
  users: Player[];
  onBanUser: (id: string) => void;
  onDeleteUser: (id: string) => void;
  onEditUser: (id: string, name: string, gold: number) => void;
  // Item Actions
  onAddItemToPlayer: (playerId: string, item: Item) => void;
  // Expedition Actions
  locations: ExpeditionLocation[];
  onAddLocation: (loc: ExpeditionLocation) => void;
  onDeleteLocation: (id: string) => void;
  // Cheat Actions
  currentPlayerId: string;
  onAddGold: () => void;
  onLevelUp: () => void;
  onHeal: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  isOpen, onClose, 
  users, onBanUser, onDeleteUser, onEditUser,
  onAddItemToPlayer,
  locations, onAddLocation, onDeleteLocation,
  currentPlayerId, onAddGold, onLevelUp, onHeal
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'items' | 'expeditions' | 'cheats'>('cheats');
  
  // Forms
  const [newItemName, setNewItemName] = useState('');
  const [newLocName, setNewLocName] = useState('');

  if (!isOpen) return null;

  const handleCreateCustomItem = () => {
      // Create a simplified legendary item for demo
      const item = generateRandomItem(50, 'legendary'); // Level 50 item
      item.name = newItemName || "Admin Kılıcı";
      item.description = "Yönetici tarafından oluşturuldu.";
      onAddItemToPlayer(currentPlayerId, item);
      setNewItemName('');
  };

  const handleCreateLocation = () => {
      if(!newLocName) return;
      const newLoc: ExpeditionLocation = {
          id: Date.now().toString(),
          name: newLocName,
          duration: ExpeditionDuration.MEDIUM,
          desc: "Yeni keşfedilen bölge.",
          risk: "Yüksek",
          reward: "Yüksek"
      };
      onAddLocation(newLoc);
      setNewLocName('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-slate-900 border border-slate-600 rounded-2xl w-full max-w-4xl h-[80vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-800">
            <h2 className="text-2xl font-bold cinzel text-white">Yönetici Paneli</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-800 border-b border-slate-700">
            {['cheats', 'users', 'items', 'expeditions'].map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex-1 py-3 font-bold uppercase text-xs tracking-wider transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                >
                    {tab === 'cheats' ? 'Hileler' : tab === 'users' ? 'Kullanıcılar' : tab === 'items' ? 'Eşyalar' : 'Seferler'}
                </button>
            ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50">
            
            {/* CHEATS TAB */}
            {activeTab === 'cheats' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <button onClick={onAddGold} className="p-4 bg-slate-800 rounded border border-slate-600 hover:border-yellow-500 flex items-center gap-3">
                        <PlusCircle className="text-yellow-500" /> +1000 Altın Ekle
                     </button>
                     <button onClick={onLevelUp} className="p-4 bg-slate-800 rounded border border-slate-600 hover:border-blue-500 flex items-center gap-3">
                        <PlusCircle className="text-blue-500" /> Seviye Atla
                     </button>
                     <button onClick={onHeal} className="p-4 bg-slate-800 rounded border border-slate-600 hover:border-red-500 flex items-center gap-3">
                        <PlusCircle className="text-red-500" /> Tam İyileşme
                     </button>
                </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-800 text-slate-500 uppercase font-bold">
                            <tr>
                                <th className="p-3">ID</th>
                                <th className="p-3">İsim</th>
                                <th className="p-3">Altın</th>
                                <th className="p-3">Durum</th>
                                <th className="p-3 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-800/50">
                                    <td className="p-3 font-mono text-xs text-slate-500">{u.id.substring(0,6)}...</td>
                                    <td className="p-3 font-bold text-white">{u.name}</td>
                                    <td className="p-3 text-yellow-500">{u.gold}</td>
                                    <td className="p-3">
                                        {u.isBanned ? <span className="text-red-500 font-bold">YASAKLI</span> : <span className="text-green-500">Aktif</span>}
                                    </td>
                                    <td className="p-3 text-right flex justify-end gap-2">
                                        <button onClick={() => {
                                            const newName = prompt("Yeni İsim:", u.name);
                                            const newGold = prompt("Yeni Altın:", u.gold.toString());
                                            if(newName && newGold) onEditUser(u.id, newName, parseInt(newGold));
                                        }} className="p-1 bg-blue-900/50 text-blue-400 rounded hover:bg-blue-900"><Edit size={16}/></button>
                                        
                                        <button onClick={() => onBanUser(u.id)} className="p-1 bg-orange-900/50 text-orange-400 rounded hover:bg-orange-900"><Ban size={16}/></button>
                                        
                                        <button onClick={() => onDeleteUser(u.id)} className="p-1 bg-red-900/50 text-red-400 rounded hover:bg-red-900"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ITEMS TAB */}
            {activeTab === 'items' && (
                <div>
                    <div className="mb-6 p-4 bg-slate-800 rounded border border-slate-700">
                        <h3 className="font-bold text-white mb-2">Özel Eşya Oluştur (Mevcut Oyuncuya)</h3>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Eşya Adı" 
                                value={newItemName}
                                onChange={e => setNewItemName(e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none"
                            />
                            <button onClick={handleCreateCustomItem} className="bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-500">Oluştur & Ver</button>
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm">Not: Bu panel şu an sadece aktif oyuncuya eşya ekler. Envanter yönetimi oyun içi çanta üzerinden yapılır.</p>
                </div>
            )}

            {/* EXPEDITIONS TAB */}
            {activeTab === 'expeditions' && (
                <div>
                     <div className="mb-6 p-4 bg-slate-800 rounded border border-slate-700">
                        <h3 className="font-bold text-white mb-2">Yeni Bölge Ekle</h3>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Bölge Adı" 
                                value={newLocName}
                                onChange={e => setNewLocName(e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none"
                            />
                            <button onClick={handleCreateLocation} className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-500">Ekle</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {locations.map(loc => (
                            <div key={loc.id} className="flex justify-between items-center bg-slate-800 p-4 rounded border border-slate-700">
                                <div>
                                    <h4 className="font-bold text-white">{loc.name}</h4>
                                    <p className="text-xs text-slate-400">{loc.desc} (Risk: {loc.risk})</p>
                                </div>
                                <button onClick={() => onDeleteLocation(loc.id)} className="text-red-500 hover:text-red-400"><Trash2 size={20} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default AdminPanel;