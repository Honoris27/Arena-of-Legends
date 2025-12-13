
import React, { useState } from 'react';
import { X, PlusCircle, Trash2, Edit, Ban, Save, Map, Gift } from 'lucide-react';
import { Player, Item, ExpeditionLocation, Region, ItemType } from '../types';
import { generateRandomItem } from '../services/gameLogic';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // User Actions
  users: Player[];
  onBanUser: (id: string) => void;
  onDeleteUser: (id: string) => void;
  onEditUser: (id: string, name: string, gold: number) => void;
  onGivePremium: (id: string, days: number) => void;
  // Item Actions
  onAddItemToPlayer: (playerId: string, item: Item) => void;
  // Expedition Actions
  regions: Region[];
  onAddRegion: (region: Region) => void;
  onDeleteRegion: (id: string) => void;
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
  users, onBanUser, onDeleteUser, onEditUser, onGivePremium,
  onAddItemToPlayer,
  regions, onAddRegion, onDeleteRegion,
  locations, onAddLocation, onDeleteLocation,
  currentPlayerId, onAddGold, onLevelUp, onHeal
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'items' | 'expeditions' | 'cheats'>('cheats');
  
  // Forms
  const [newItemName, setNewItemName] = useState('');
  
  // Region Form
  const [newRegionName, setNewRegionName] = useState('');
  const [newRegionLevel, setNewRegionLevel] = useState(1);
  const [newRegionDesc, setNewRegionDesc] = useState('');

  // Location Form
  const [newLocName, setNewLocName] = useState('');
  const [newLocRegion, setNewLocRegion] = useState('');
  const [newLocLevel, setNewLocLevel] = useState(1);
  const [newLocRisk, setNewLocRisk] = useState('Düşük');
  const [newLocDuration, setNewLocDuration] = useState(10);

  if (!isOpen) return null;

  const handleCreateCustomItem = () => {
      const item = generateRandomItem(50, 'legendary');
      item.name = newItemName || "Admin Kılıcı";
      item.description = "Yönetici tarafından oluşturuldu.";
      onAddItemToPlayer(currentPlayerId, item);
      setNewItemName('');
  };

  const handleCreateRegion = () => {
      if(!newRegionName) return;
      onAddRegion({
          id: Date.now().toString(),
          name: newRegionName,
          minLevel: newRegionLevel,
          description: newRegionDesc || 'Yeni bölge'
      });
      setNewRegionName('');
  };

  const handleCreateLocation = () => {
      if(!newLocName || !newLocRegion) return;
      const newLoc: ExpeditionLocation = {
          id: Date.now().toString(),
          regionId: newLocRegion,
          name: newLocName,
          minLevel: newLocLevel,
          duration: newLocDuration,
          desc: "Keşif alanı.",
          risk: newLocRisk,
          rewardRate: 1
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
                    {tab === 'cheats' ? 'Hileler' : tab === 'users' ? 'Kullanıcılar' : tab === 'items' ? 'Eşyalar' : 'Bölgeler'}
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
                        <PlusCircle className="text-red-500" /> Tam İyileşme (HP/Sefer Puanı)
                     </button>
                </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-800 text-slate-500 uppercase font-bold">
                            <tr>
                                <th className="p-3">İsim</th>
                                <th className="p-3">Level</th>
                                <th className="p-3">Premium</th>
                                <th className="p-3 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-800/50">
                                    <td className="p-3 font-bold text-white">{u.name}</td>
                                    <td className="p-3">{u.level}</td>
                                    <td className="p-3">{u.premiumUntil > Date.now() ? 'Evet' : '-'}</td>
                                    <td className="p-3 text-right flex justify-end gap-2">
                                        <button onClick={() => onGivePremium(u.id, 15)} className="p-1 bg-purple-900/50 text-purple-400 rounded hover:bg-purple-900" title="15 Gün Premium Ver"><Gift size={16}/></button>
                                        <button onClick={() => {
                                            const newName = prompt("Yeni İsim:", u.name);
                                            const newGold = prompt("Yeni Altın:", u.gold.toString());
                                            if(newName && newGold) onEditUser(u.id, newName, parseInt(newGold));
                                        }} className="p-1 bg-blue-900/50 text-blue-400 rounded hover:bg-blue-900"><Edit size={16}/></button>
                                        <button onClick={() => onBanUser(u.id)} className="p-1 bg-red-900/50 text-red-400 rounded hover:bg-red-900"><Ban size={16}/></button>
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
                        <h3 className="font-bold text-white mb-2">Özel Eşya Oluştur</h3>
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
                    
                    <h3 className="font-bold text-slate-400 mb-2">Mevcut Oyuncu Envanteri</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {users.find(u => u.id === currentPlayerId)?.inventory.map((item, idx) => (
                            <div key={idx} className="p-2 bg-slate-800 rounded border border-slate-700">
                                <div className="font-bold text-white truncate">{item.name}</div>
                                <div className="text-slate-500">{item.rarity} {item.type}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* EXPEDITIONS TAB */}
            {activeTab === 'expeditions' && (
                <div className="space-y-8">
                     {/* Add Region */}
                     <div className="p-4 bg-slate-800 rounded border border-slate-700">
                        <h3 className="font-bold text-white mb-2 flex items-center gap-2"><Map size={18}/> Yeni Bölge Ekle</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <input type="text" placeholder="Bölge Adı" value={newRegionName} onChange={e => setNewRegionName(e.target.value)} className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white" />
                            <input type="number" placeholder="Min Lvl" value={newRegionLevel} onChange={e => setNewRegionLevel(Number(e.target.value))} className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white" />
                            <input type="text" placeholder="Açıklama" value={newRegionDesc} onChange={e => setNewRegionDesc(e.target.value)} className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white col-span-2" />
                            <button onClick={handleCreateRegion} className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-500 col-span-full">Bölge Oluştur</button>
                        </div>
                    </div>

                    {/* Regions List & Add Location */}
                    <div className="space-y-4">
                        {regions.map(region => (
                            <div key={region.id} className="bg-slate-800/50 p-4 rounded border border-slate-600">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-xl text-yellow-500">{region.name} <span className="text-sm text-slate-500">(Lvl {region.minLevel}+)</span></h4>
                                    <button onClick={() => onDeleteRegion(region.id)} className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                                </div>
                                
                                {/* Add Location to Region */}
                                <div className="bg-slate-900 p-3 rounded mb-3">
                                    <h5 className="text-xs font-bold text-slate-400 mb-2">Bu bölgeye Sefer Alanı Ekle</h5>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                        <input type="text" placeholder="Sefer Adı" value={newLocName} onChange={e => {setNewLocName(e.target.value); setNewLocRegion(region.id)}} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-xs" />
                                        <input type="number" placeholder="Lvl" value={newLocLevel} onChange={e => setNewLocLevel(Number(e.target.value))} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-xs" />
                                        <input type="number" placeholder="Süre (sn)" value={newLocDuration} onChange={e => setNewLocDuration(Number(e.target.value))} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-xs" />
                                        <select value={newLocRisk} onChange={e => setNewLocRisk(e.target.value)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-xs">
                                            <option value="Düşük">Düşük Risk</option>
                                            <option value="Orta">Orta Risk</option>
                                            <option value="Yüksek">Yüksek Risk</option>
                                        </select>
                                        <button onClick={() => {setNewLocRegion(region.id); handleCreateLocation();}} className="bg-blue-600 text-white text-xs rounded font-bold">Ekle</button>
                                    </div>
                                </div>

                                {/* Existing Locations */}
                                <div className="space-y-1 pl-4 border-l-2 border-slate-700">
                                    {locations.filter(l => l.regionId === region.id).map(loc => (
                                        <div key={loc.id} className="flex justify-between items-center text-sm text-slate-300">
                                            <span>{loc.name} (Lvl {loc.minLevel}, {loc.duration}sn)</span>
                                            <button onClick={() => onDeleteLocation(loc.id)} className="text-red-500 hover:text-red-300"><Trash2 size={14}/></button>
                                        </div>
                                    ))}
                                    {locations.filter(l => l.regionId === region.id).length === 0 && <span className="text-xs text-slate-600">Sefer alanı yok.</span>}
                                </div>
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
