
import React, { useState } from 'react';
import { X, PlusCircle, Trash2, Edit, Save, Map, Gift, Megaphone, Skull, Users, Package, Database, Hammer, Eye, Check } from 'lucide-react';
import { Player, Item, ExpeditionLocation, Region, ItemType, Role, Announcement, StatType, EnemyTemplate, BaseItem, ItemMaterial, ItemModifier, ModifierBonus, BonusType, GameMode } from '../types';
import { generateDynamicItem, INITIAL_BASE_ITEMS, INITIAL_MATERIALS, INITIAL_MODIFIERS } from '../services/gameLogic';
import ItemTooltip from './ItemTooltip';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // Data State
  baseItems: BaseItem[];
  setBaseItems: (items: BaseItem[]) => void;
  materials: ItemMaterial[];
  setMaterials: (mats: ItemMaterial[]) => void;
  modifiers: ItemModifier[];
  setModifiers: (mods: ItemModifier[]) => void;
  // User Actions
  users: Player[];
  onAddItemToPlayer: (playerId: string, item: Item) => void;
  // Expedition
  regions: Region[];
  onAddRegion: (region: Region) => void;
  locations: ExpeditionLocation[];
  onAddLocation: (loc: ExpeditionLocation) => void;
  onDeleteLocation: (id: string) => void;
  // Other
  enemyTemplates: EnemyTemplate[];
  currentPlayerId: string;
  
  // Added props to match usage in App.tsx
  onBanUser: () => void;
  onEditUser: () => void;
  onGivePremium: () => void;
  onAddAnnouncement: () => void;
  onAddEnemyTemplate: () => void;
  onDeleteEnemyTemplate: () => void;
  onAddGold: () => void;
  onLevelUp: () => void;
  onHeal: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  isOpen, onClose, 
  baseItems, setBaseItems,
  materials, setMaterials,
  modifiers, setModifiers,
  users, onAddItemToPlayer,
  regions, onAddRegion,
  locations, onAddLocation, onDeleteLocation,
  enemyTemplates, currentPlayerId,
  // Added props
  onBanUser, onEditUser, onGivePremium, onAddAnnouncement,
  onAddEnemyTemplate, onDeleteEnemyTemplate, onAddGold, onLevelUp, onHeal
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'modifiers' | 'expedition'>('items');
  
  // Item Creator State
  const [targetLvl, setTargetLvl] = useState(1);
  const [selBase, setSelBase] = useState<string>("");
  const [selMat, setSelMat] = useState<string>("");
  const [selPrefix, setSelPrefix] = useState<string>("");
  const [selSuffix, setSelSuffix] = useState<string>("");
  const [previewItem, setPreviewItem] = useState<Item | null>(null);

  // New Modifier State
  const [newModName, setNewModName] = useState("");
  const [newModType, setNewModType] = useState<'prefix' | 'suffix'>('prefix');
  const [newModMinLvl, setNewModMinLvl] = useState(1);
  const [newModCost, setNewModCost] = useState(20);
  const [newModIsAi, setNewModIsAi] = useState(false);
  const [newModBonuses, setNewModBonuses] = useState<ModifierBonus[]>([]);
  
  // Temp Bonus State
  const [tempBonusStat, setTempBonusStat] = useState<string>('STR');
  const [tempBonusVal, setTempBonusVal] = useState(0);
  const [tempBonusType, setTempBonusType] = useState<BonusType>('FLAT');
  const [tempBonusMode, setTempBonusMode] = useState<GameMode>('GLOBAL');

  if (!isOpen) return null;

  // --- HANDLERS ---

  const handlePreviewItem = () => {
      const forcedBase = baseItems.find(i => i.id === selBase);
      const forcedMat = materials.find(i => i.id === selMat);
      const forcedPre = modifiers.find(i => i.id === selPrefix);
      const forcedSuf = modifiers.find(i => i.id === selSuffix);
      
      const item = generateDynamicItem(
          targetLvl, 
          forcedBase ? [forcedBase] : baseItems, 
          forcedMat ? [forcedMat] : materials, 
          modifiers, 
          undefined, 
          forcedPre,
          forcedSuf
      );
      setPreviewItem(item);
  };

  const handleSaveItemTemplate = () => {
      // In a real app, this would save to a 'saved_items' table. 
      // Here we just simulate giving it to admin or console logging.
      alert(`Şablon DB'ye kaydedildi (Simülasyon):\n${previewItem?.name}`);
  };

  const handleAddBonus = () => {
      setNewModBonuses([...newModBonuses, {
          stat: tempBonusStat as any,
          value: tempBonusVal,
          type: tempBonusType,
          mode: tempBonusMode
      }]);
  };

  const handleSaveModifier = () => {
      const newMod: ItemModifier = {
          id: Date.now().toString(),
          name: newModName,
          type: newModType,
          minLevel: newModMinLvl,
          rarity: 'rare', // default
          allowedTypes: 'ALL',
          isActive: true,
          fragmentCost: newModCost,
          isAiOnly: newModIsAi,
          bonuses: newModBonuses
      };
      setModifiers([...modifiers, newMod]);
      alert("Modifier eklendi!");
      setNewModName("");
      setNewModBonuses([]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-600 rounded-2xl w-full max-w-6xl h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-800">
            <h2 className="text-2xl font-bold cinzel text-white">Yönetici Paneli</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col p-4 gap-2">
                <button onClick={() => setActiveTab('items')} className={`p-3 rounded text-left font-bold ${activeTab === 'items' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Eşya Oluştur</button>
                <button onClick={() => setActiveTab('modifiers')} className={`p-3 rounded text-left font-bold ${activeTab === 'modifiers' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Modifier / Bonus</button>
                <button onClick={() => setActiveTab('expedition')} className={`p-3 rounded text-left font-bold ${activeTab === 'expedition' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Sefer Yönetimi</button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50">
                
                {/* ITEM CREATOR */}
                {activeTab === 'items' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
                            <h3 className="font-bold text-white mb-6">Eşya Oluşturucu</h3>
                            <div className="space-y-4">
                                <input type="number" placeholder="Seviye" value={targetLvl} onChange={e => setTargetLvl(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
                                
                                <select value={selBase} onChange={e => setSelBase(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white">
                                    <option value="">Rastgele Base</option>
                                    {baseItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                </select>

                                <div className="grid grid-cols-2 gap-4">
                                    <select value={selPrefix} onChange={e => setSelPrefix(e.target.value)} className="bg-slate-900 border border-slate-600 rounded p-2 text-white text-xs">
                                        <option value="">Ön Ek Yok</option>
                                        {modifiers.filter(m => m.type === 'prefix').map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                    </select>
                                    <select value={selSuffix} onChange={e => setSelSuffix(e.target.value)} className="bg-slate-900 border border-slate-600 rounded p-2 text-white text-xs">
                                        <option value="">Son Ek Yok</option>
                                        {modifiers.filter(m => m.type === 'suffix').map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                    </select>
                                </div>

                                <button onClick={handlePreviewItem} className="w-full bg-blue-600 hover:bg-blue-500 text-white p-2 rounded font-bold">Önizle</button>
                            </div>
                         </div>

                         <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 flex flex-col items-center justify-center">
                             {previewItem ? (
                                 <div className="flex flex-col items-center gap-4">
                                     <div className="transform scale-125"><ItemTooltip item={previewItem} fixed /></div>
                                     <div className="flex gap-2">
                                        <button onClick={() => onAddItemToPlayer(currentPlayerId, previewItem)} className="bg-green-600 text-white px-4 py-2 rounded">Bana Ver</button>
                                        <button onClick={handleSaveItemTemplate} className="bg-yellow-600 text-white px-4 py-2 rounded">DB'ye Kaydet</button>
                                     </div>
                                 </div>
                             ) : <div className="text-slate-500">Önizleme bekleniyor...</div>}
                         </div>
                    </div>
                )}

                {/* MODIFIER EDITOR */}
                {activeTab === 'modifiers' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* List */}
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 h-[600px] overflow-y-auto">
                            <h3 className="font-bold text-white mb-4">Mevcut Modifierlar</h3>
                            <table className="w-full text-xs text-left text-slate-300">
                                <thead className="bg-slate-900 text-white font-bold">
                                    <tr>
                                        <th className="p-2">İsim</th>
                                        <th className="p-2">Tip</th>
                                        <th className="p-2">Bonuslar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {modifiers.map(m => (
                                        <tr key={m.id} className="border-b border-slate-700">
                                            <td className="p-2">{m.name} {m.isAiOnly && <span className="text-purple-400">(AI)</span>}</td>
                                            <td className="p-2 uppercase">{m.type}</td>
                                            <td className="p-2">
                                                {m.bonuses.map((b, i) => (
                                                    <div key={i}>{b.stat} {b.value} ({b.mode})</div>
                                                ))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Creator */}
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                             <h3 className="font-bold text-white mb-4">Yeni Modifier Ekle</h3>
                             <div className="space-y-4">
                                 <input type="text" placeholder="Modifier Adı (Ör: Ejderhanın)" value={newModName} onChange={e => setNewModName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
                                 <div className="flex gap-4">
                                     <select value={newModType} onChange={e => setNewModType(e.target.value as any)} className="bg-slate-900 border border-slate-600 rounded p-2 text-white">
                                         <option value="prefix">Ön Ek</option>
                                         <option value="suffix">Son Ek</option>
                                     </select>
                                     <label className="flex items-center gap-2 text-slate-300">
                                         <input type="checkbox" checked={newModIsAi} onChange={e => setNewModIsAi(e.target.checked)} /> AI Only
                                     </label>
                                 </div>
                                 
                                 <div className="p-4 bg-slate-900 rounded border border-slate-700">
                                     <h4 className="text-xs font-bold text-slate-400 mb-2">Bonus Ekle</h4>
                                     <div className="grid grid-cols-2 gap-2 mb-2">
                                         <select value={tempBonusStat} onChange={e => setTempBonusStat(e.target.value)} className="bg-slate-800 border border-slate-600 rounded p-1 text-white text-xs">
                                             <option value="STR">STR</option>
                                             <option value="AGI">AGI</option>
                                             <option value="CRIT_CHANCE">Kritik Şans</option>
                                             <option value="CRIT_DAMAGE">Kritik Hasar</option>
                                             <option value="LIFESTEAL">Can Çalma</option>
                                         </select>
                                         <input type="number" placeholder="Değer" value={tempBonusVal} onChange={e => setTempBonusVal(Number(e.target.value))} className="bg-slate-800 border border-slate-600 rounded p-1 text-white text-xs" />
                                     </div>
                                     <div className="grid grid-cols-2 gap-2 mb-2">
                                          <select value={tempBonusMode} onChange={e => setTempBonusMode(e.target.value as any)} className="bg-slate-800 border border-slate-600 rounded p-1 text-white text-xs">
                                             <option value="GLOBAL">Global</option>
                                             <option value="ARENA">Arena</option>
                                             <option value="EXPEDITION">Sefer</option>
                                          </select>
                                          <button onClick={handleAddBonus} className="bg-green-600 text-white text-xs rounded font-bold">Listeye Ekle</button>
                                     </div>
                                     <div className="text-xs text-slate-400 mt-2">
                                         {newModBonuses.map((b, i) => (
                                             <div key={i}>+ {b.stat} {b.value} ({b.mode})</div>
                                         ))}
                                     </div>
                                 </div>

                                 <button onClick={handleSaveModifier} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded font-bold">Kaydet</button>
                             </div>
                        </div>
                    </div>
                )}

                {/* EXPEDITION MANAGER */}
                {activeTab === 'expedition' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {/* Existing Expedition Management Logic */}
                         <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                             <h3 className="font-bold text-white mb-2">Sefer Bölgeleri</h3>
                             {regions.map(r => (
                                 <div key={r.id} className="p-2 border-b border-slate-700 text-sm flex justify-between">
                                     <span>{r.name} (Lvl {r.minLevel})</span>
                                     <span className="text-slate-500">{r.id}</span>
                                 </div>
                             ))}
                             <button onClick={() => onAddRegion({id: Date.now().toString(), name: 'Yeni Bölge', minLevel: 1, description: 'Test'})} className="mt-2 text-xs bg-green-600 text-white px-2 py-1 rounded">Hızlı Bölge Ekle</button>
                         </div>
                         <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                             <h3 className="font-bold text-white mb-2">Lokasyonlar</h3>
                             {locations.map(l => (
                                 <div key={l.id} className="p-2 border-b border-slate-700 text-sm flex justify-between items-center">
                                     <span>{l.name} - {l.risk}</span>
                                     <button onClick={() => onDeleteLocation(l.id)} className="text-red-500"><Trash2 size={12}/></button>
                                 </div>
                             ))}
                         </div>
                     </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
