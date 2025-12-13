
import React, { useState } from 'react';
import { X, PlusCircle, Trash2, Edit, Ban, Save, Map, Gift, ShieldAlert, Megaphone, Lock } from 'lucide-react';
import { Player, Item, ExpeditionLocation, Region, ItemType, Role, Announcement, StatType } from '../types';
import { generateRandomItem } from '../services/gameLogic';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // User Actions
  users: Player[];
  onBanUser: (id: string) => void;
  onEditUser: (id: string, name: string, gold: number, role: Role) => void;
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
  // Announcements
  onAddAnnouncement: (ann: Announcement) => void;
  // Cheat Actions
  currentPlayerId: string;
  onAddGold: () => void;
  onLevelUp: () => void;
  onHeal: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  isOpen, onClose, 
  users, onBanUser, onEditUser, onGivePremium,
  onAddItemToPlayer,
  regions, onAddRegion, onDeleteRegion,
  locations, onAddLocation, onDeleteLocation,
  onAddAnnouncement,
  currentPlayerId, onAddGold, onLevelUp, onHeal
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'items' | 'expeditions' | 'announcements' | 'cheats'>('cheats');
  
  // Item Form
  const [newItemName, setNewItemName] = useState('');
  const [newItemLevel, setNewItemLevel] = useState(1);
  const [newItemReqLevel, setNewItemReqLevel] = useState(1);
  const [newItemReqStat, setNewItemReqStat] = useState<StatType>('STR');
  const [newItemReqVal, setNewItemReqVal] = useState(0);

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

  // Announcement Form
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

  if (!isOpen) return null;

  const handleCreateCustomItem = () => {
      const item = generateRandomItem(newItemLevel, 'legendary');
      item.name = newItemName || "Admin Eşyası";
      item.description = "Yönetici tarafından oluşturuldu.";
      // Set requirements
      item.reqLevel = newItemReqLevel;
      if (newItemReqVal > 0) {
          item.reqStat = { stat: newItemReqStat, value: newItemReqVal };
      }

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

  const handlePostAnnouncement = () => {
      if(!annTitle || !annContent) return;
      onAddAnnouncement({
          id: Date.now().toString(),
          title: annTitle,
          content: annContent,
          timestamp: Date.now(),
          type: 'general'
      });
      setAnnTitle('');
      setAnnContent('');
      alert("Duyuru yayınlandı.");
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-slate-900 border border-slate-600 rounded-2xl w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-800">
            <h2 className="text-2xl font-bold cinzel text-white">Yönetici Paneli</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-800 border-b border-slate-700 overflow-x-auto">
            {['cheats', 'users', 'items', 'expeditions', 'announcements'].map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex-1 min-w-[100px] py-3 font-bold uppercase text-xs tracking-wider transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                >
                    {tab}
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
                                <th className="p-3">İsim</th>
                                <th className="p-3">Level</th>
                                <th className="p-3">Rol</th>
                                <th className="p-3 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-800/50">
                                    <td className="p-3 font-bold text-white">{u.name}</td>
                                    <td className="p-3">{u.level}</td>
                                    <td className="p-3 uppercase text-xs">{u.role}</td>
                                    <td className="p-3 text-right flex justify-end gap-2">
                                        <button onClick={() => onGivePremium(u.id, 15)} className="p-1 bg-purple-900/50 text-purple-400 rounded hover:bg-purple-900" title="15 Gün Premium Ver"><Gift size={16}/></button>
                                        <button onClick={() => {
                                            const newName = prompt("Yeni İsim:", u.name) || u.name;
                                            const newGold = parseInt(prompt("Yeni Altın:", u.gold.toString()) || u.gold.toString());
                                            const newRole = prompt("Yeni Rol (admin, moderator, player):", u.role) as Role;
                                            onEditUser(u.id, newName, newGold, newRole);
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
                        <h3 className="font-bold text-white mb-4">Özel Eşya Oluştur</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input 
                                type="text" 
                                placeholder="Eşya Adı" 
                                value={newItemName}
                                onChange={e => setNewItemName(e.target.value)}
                                className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white"
                            />
                             <input 
                                type="number" 
                                placeholder="Eşya Güç Seviyesi (Level)" 
                                value={newItemLevel}
                                onChange={e => setNewItemLevel(Number(e.target.value))}
                                className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white"
                            />
                        </div>
                        
                        <div className="mb-2 text-xs font-bold text-slate-400 uppercase">Gereksinimler</div>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <div>
                                <label className="text-xs text-slate-500">Min Lvl</label>
                                <input type="number" value={newItemReqLevel} onChange={e => setNewItemReqLevel(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white"/>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">Gereken Stat</label>
                                <select value={newItemReqStat} onChange={e => setNewItemReqStat(e.target.value as StatType)} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white">
                                    <option value="STR">STR</option>
                                    <option value="AGI">AGI</option>
                                    <option value="VIT">VIT</option>
                                    <option value="INT">INT</option>
                                    <option value="LUK">LUK</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">Stat Değeri</label>
                                <input type="number" value={newItemReqVal} onChange={e => setNewItemReqVal(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white"/>
                            </div>
                        </div>

                        <button onClick={handleCreateCustomItem} className="bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-500 w-full">Eşyayı Oluştur ve Bana Ver</button>
                    </div>
                </div>
            )}

            {/* ANNOUNCEMENTS TAB */}
            {activeTab === 'announcements' && (
                <div className="p-4 bg-slate-800 rounded border border-slate-700">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Megaphone size={18} /> Yeni Duyuru Yayınla</h3>
                    <input 
                        type="text" 
                        placeholder="Başlık" 
                        value={annTitle} 
                        onChange={e => setAnnTitle(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white mb-2" 
                    />
                    <textarea 
                        rows={4} 
                        placeholder="İçerik..." 
                        value={annContent} 
                        onChange={e => setAnnContent(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white mb-2" 
                    />
                    <button onClick={handlePostAnnouncement} className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-500 w-full">Yayınla</button>
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
                                        <input type="number" placeholder="Ödül Çarpanı" value={newLocDuration} onChange={e => setNewLocDuration(Number(e.target.value))} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-xs" />
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
                                            <span>{loc.name} (Lvl {loc.minLevel}, x{loc.duration})</span>
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
