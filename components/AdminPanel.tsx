
import React, { useState } from 'react';
import { X, PlusCircle, Trash2, Edit, Ban, Save, Map, Gift, ShieldAlert, Megaphone, Lock, Skull, Users, Package } from 'lucide-react';
import { Player, Item, ExpeditionLocation, Region, ItemType, Role, Announcement, StatType, EnemyTemplate } from '../types';
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
  // Mobs
  enemyTemplates: EnemyTemplate[];
  onAddEnemyTemplate: (tpl: EnemyTemplate) => void;
  onDeleteEnemyTemplate: (id: string) => void;
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
  enemyTemplates, onAddEnemyTemplate, onDeleteEnemyTemplate,
  currentPlayerId, onAddGold, onLevelUp, onHeal
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'items' | 'mobs' | 'world' | 'system'>('users');
  
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

  // Mob Template Form
  const [newMobName, setNewMobName] = useState('');
  const [newMobMinLvl, setNewMobMinLvl] = useState(1);
  const [newMobMaxLvl, setNewMobMaxLvl] = useState(5);
  const [newMobDesc, setNewMobDesc] = useState('');
  const [newMobBoss, setNewMobBoss] = useState(false);

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
  };

  const handleAddMobTemplate = () => {
      if(!newMobName) return;
      onAddEnemyTemplate({
          id: Date.now().toString(),
          name: newMobName,
          minLevel: newMobMinLvl,
          maxLevel: newMobMaxLvl,
          description: newMobDesc,
          isBoss: newMobBoss,
          statsMultiplier: newMobBoss ? 2 : 1
      });
      setNewMobName('');
      setNewMobDesc('');
  };

  const TABS = [
      { id: 'users', label: 'Kullanıcılar', icon: Users },
      { id: 'items', label: 'Eşyalar', icon: Package },
      { id: 'mobs', label: 'Yaratıklar', icon: Skull },
      { id: 'world', label: 'Dünya', icon: Map },
      { id: 'system', label: 'Sistem', icon: Megaphone },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-slate-900 border border-slate-600 rounded-2xl w-full max-w-6xl h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-800">
            <h2 className="text-2xl font-bold cinzel text-white">Yönetici Paneli</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col p-4 gap-2">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all text-sm font-bold ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    >
                        <tab.icon size={18} /> {tab.label}
                    </button>
                ))}

                <div className="mt-auto pt-4 border-t border-slate-700">
                     <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Hızlı İşlemler</h4>
                     <div className="grid grid-cols-3 gap-2">
                         <button onClick={onAddGold} className="p-2 bg-slate-700 rounded text-yellow-500 hover:bg-slate-600" title="+Altın"><PlusCircle size={16}/></button>
                         <button onClick={onLevelUp} className="p-2 bg-slate-700 rounded text-blue-500 hover:bg-slate-600" title="+Level"><PlusCircle size={16}/></button>
                         <button onClick={onHeal} className="p-2 bg-slate-700 rounded text-red-500 hover:bg-slate-600" title="Heal"><PlusCircle size={16}/></button>
                     </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50">
                
                {/* USERS TAB */}
                {activeTab === 'users' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Kullanıcı Listesi ({users.length})</h3>
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-slate-700">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-slate-800 text-slate-500 uppercase font-bold">
                                    <tr>
                                        <th className="p-3">İsim</th>
                                        <th className="p-3">Level</th>
                                        <th className="p-3">Altın</th>
                                        <th className="p-3">Rol</th>
                                        <th className="p-3 text-right">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700 bg-slate-900">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-800/50">
                                            <td className="p-3 font-bold text-white flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-700 overflow-hidden"><img src={u.avatarUrl} className="w-full h-full object-cover"/></div>
                                                {u.name}
                                            </td>
                                            <td className="p-3">{u.level}</td>
                                            <td className="p-3 text-yellow-500">{u.gold}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${u.role === 'admin' ? 'bg-red-900 text-red-400' : u.role === 'moderator' ? 'bg-blue-900 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
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
                    </div>
                )}

                {/* ITEMS TAB */}
                {activeTab === 'items' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
                            <h3 className="font-bold text-white mb-6 flex items-center gap-2"><Package size={20}/> Eşya Oluşturucu</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-400 uppercase font-bold">Eşya Adı</label>
                                    <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 uppercase font-bold">Güç Seviyesi</label>
                                    <input type="number" value={newItemLevel} onChange={e => setNewItemLevel(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white" />
                                </div>
                                
                                <div className="p-4 bg-slate-900 rounded border border-slate-700">
                                    <div className="text-xs text-yellow-500 font-bold uppercase mb-2">Gereksinimler</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-[10px] text-slate-500">Min Lvl</label>
                                            <input type="number" value={newItemReqLevel} onChange={e => setNewItemReqLevel(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white"/>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500">Stat</label>
                                            <select value={newItemReqStat} onChange={e => setNewItemReqStat(e.target.value as StatType)} className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-xs">
                                                <option value="STR">STR</option>
                                                <option value="AGI">AGI</option>
                                                <option value="VIT">VIT</option>
                                                <option value="INT">INT</option>
                                                <option value="LUK">LUK</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500">Değer</label>
                                            <input type="number" value={newItemReqVal} onChange={e => setNewItemReqVal(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white"/>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={handleCreateCustomItem} className="w-full bg-indigo-600 text-white px-4 py-3 rounded font-bold hover:bg-indigo-500 transition-colors">
                                    Oluştur ve Çantama Ekle
                                </button>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-slate-500 text-center">
                            <Package size={48} className="mb-4 opacity-50"/>
                            <p>Oluşturulan eşyalar direkt olarak şu anki kullanıcının çantasına eklenir.</p>
                        </div>
                    </div>
                )}

                {/* MOBS TAB */}
                {activeTab === 'mobs' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* List */}
                        <div className="lg:col-span-2 space-y-4">
                            <h3 className="font-bold text-white mb-4">Yaratık Şablonları</h3>
                            {enemyTemplates.length === 0 && <div className="text-slate-500 italic">Henüz şablon yok.</div>}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {enemyTemplates.map(mob => (
                                    <div key={mob.id} className="bg-slate-800 p-4 rounded border border-slate-700 flex justify-between items-start group hover:border-red-500 transition-colors">
                                        <div>
                                            <h4 className={`font-bold ${mob.isBoss ? 'text-red-500' : 'text-white'}`}>{mob.name}</h4>
                                            <div className="text-xs text-slate-400">Lvl {mob.minLevel} - {mob.maxLevel}</div>
                                            <div className="text-xs text-slate-500 italic mt-1">{mob.description}</div>
                                        </div>
                                        <button onClick={() => onDeleteEnemyTemplate(mob.id)} className="text-slate-600 hover:text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Form */}
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Skull size={20}/> Yeni Yaratık</h3>
                            <div className="space-y-3">
                                <input type="text" placeholder="İsim (Ör: Goblin)" value={newMobName} onChange={e => setNewMobName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white" />
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="number" placeholder="Min Lvl" value={newMobMinLvl} onChange={e => setNewMobMinLvl(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white" />
                                    <input type="number" placeholder="Max Lvl" value={newMobMaxLvl} onChange={e => setNewMobMaxLvl(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white" />
                                </div>
                                <input type="text" placeholder="Kısa Açıklama" value={newMobDesc} onChange={e => setNewMobDesc(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white" />
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="isBoss" checked={newMobBoss} onChange={e => setNewMobBoss(e.target.checked)} className="rounded bg-slate-900 border-slate-600 text-red-600" />
                                    <label htmlFor="isBoss" className="text-sm text-slate-300">Bu bir Boss mu?</label>
                                </div>
                                <button onClick={handleAddMobTemplate} className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded mt-2">Ekle</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* WORLD TAB */}
                {activeTab === 'world' && (
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {regions.map(region => (
                            <div key={region.id} className="bg-slate-800/50 p-4 rounded border border-slate-600">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-xl text-yellow-500">{region.name} <span className="text-sm text-slate-500">(Lvl {region.minLevel}+)</span></h4>
                                    <button onClick={() => onDeleteRegion(region.id)} className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                                </div>
                                
                                {/* Add Location to Region */}
                                <div className="bg-slate-900 p-3 rounded mb-3">
                                    <h5 className="text-xs font-bold text-slate-400 mb-2">Bu bölgeye Sefer Alanı Ekle</h5>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="text" placeholder="Sefer Adı" value={newLocName} onChange={e => {setNewLocName(e.target.value); setNewLocRegion(region.id)}} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-xs" />
                                        <input type="number" placeholder="Lvl" value={newLocLevel} onChange={e => setNewLocLevel(Number(e.target.value))} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-xs" />
                                        <input type="number" placeholder="Ödül x" value={newLocDuration} onChange={e => setNewLocDuration(Number(e.target.value))} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-xs" />
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
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                )}

                {/* SYSTEM TAB */}
                {activeTab === 'system' && (
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

            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
