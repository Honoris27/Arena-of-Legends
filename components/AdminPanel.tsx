
import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Trash2, Edit, Save, Map, Gift, Megaphone, Skull, Users, Package, Database, Hammer, Eye, Check, RefreshCw, Zap, Clock, Coins, FileText, Ban, ShoppingBag, Settings, Shield } from 'lucide-react';
import { Player, Item, ExpeditionLocation, Region, ItemType, Role, Announcement, StatType, EnemyTemplate, BaseItem, ItemMaterial, ItemModifier, ModifierBonus, BonusType, GameMode, GameEvent, ItemRarity, MarketItem, GlobalConfig } from '../types';
import { generateDynamicItem, INITIAL_BASE_ITEMS, INITIAL_MATERIALS, INITIAL_MODIFIERS } from '../services/gameLogic';
import { saveSystemData } from '../services/supabase';
import ItemTooltip from './ItemTooltip';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: Role; // New prop for role check
  // Data State
  baseItems: BaseItem[];
  setBaseItems: (items: BaseItem[]) => void;
  materials: ItemMaterial[];
  setMaterials: (mats: ItemMaterial[]) => void;
  modifiers: ItemModifier[];
  setModifiers: (mods: ItemModifier[]) => void;
  marketItems: MarketItem[];
  setMarketItems: (items: MarketItem[]) => void;
  globalConfig: GlobalConfig;
  setGlobalConfig: (cfg: GlobalConfig) => void;
  // User Actions
  users: Player[];
  onAddItemToPlayer: (playerId: string, item: Item) => void;
  onBanUser: (id: string) => void;
  onEditUser: (id: string, updates: Partial<Player>) => void;
  onGivePremium: (id: string, days: number) => void;
  // Expedition
  regions: Region[];
  onAddRegion: (region: Region) => void;
  locations: ExpeditionLocation[];
  onAddLocation: (loc: ExpeditionLocation) => void;
  onDeleteLocation: (id: string) => void;
  // Other
  enemyTemplates: EnemyTemplate[];
  currentPlayerId: string;
  onAddAnnouncement: (ann: Announcement) => void;
  onAddEnemyTemplate: (tpl: EnemyTemplate) => void;
  onDeleteEnemyTemplate: (id: string) => void;
  // Events
  activeEvent: GameEvent | null;
  onUpdateEvent: (event: GameEvent | null) => void;
  // Cheats
  onAddGold: () => void;
  onLevelUp: () => void;
  onHeal: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  isOpen, onClose, currentUserRole,
  baseItems, setBaseItems,
  materials, setMaterials,
  modifiers, setModifiers,
  marketItems, setMarketItems,
  globalConfig, setGlobalConfig,
  users, onAddItemToPlayer, onBanUser, onEditUser, onGivePremium,
  regions, onAddRegion,
  locations, onAddLocation, onDeleteLocation,
  enemyTemplates, currentPlayerId,
  onAddAnnouncement,
  onAddEnemyTemplate, onDeleteEnemyTemplate,
  activeEvent, onUpdateEvent,
  onAddGold, onLevelUp, onHeal
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'items' | 'modifiers' | 'world' | 'mobs' | 'system' | 'market' | 'config'>('users');
  const [itemsFilter, setItemsFilter] = useState<ItemType | 'ALL'>('ALL');
  
  // --- USER MGMT STATE ---
  const [editingUser, setEditingUser] = useState<Player | null>(null);
  const [giftModalUser, setGiftModalUser] = useState<Player | null>(null);
  const [giftType, setGiftType] = useState<'item' | 'gold' | 'level' | 'premium'>('item');
  const [giftAmount, setGiftAmount] = useState(0);

  // --- ITEM CREATOR STATE ---
  const [targetLvl, setTargetLvl] = useState(1);
  const [selBase, setSelBase] = useState<string>("");
  const [selMat, setSelMat] = useState<string>("");
  const [selPrefix, setSelPrefix] = useState<string>("");
  const [selSuffix, setSelSuffix] = useState<string>("");
  const [previewItem, setPreviewItem] = useState<Item | null>(null);
  
  // New Base Item Form State
  const [newBaseName, setNewBaseName] = useState("");
  const [newBaseType, setNewBaseType] = useState<ItemType>('weapon');
  const [newBaseMinLvl, setNewBaseMinLvl] = useState(1);
  const [newBaseStat, setNewBaseStat] = useState<StatType>('STR');
  const [newBaseVal, setNewBaseVal] = useState(0);

  // --- MARKET STATE ---
  const [newMarketName, setNewMarketName] = useState("");
  const [newMarketPrice, setNewMarketPrice] = useState(100);
  const [newMarketType, setNewMarketType] = useState<string>("consumable");
  const [newMarketDesc, setNewMarketDesc] = useState("");
  const [newMarketIcon, setNewMarketIcon] = useState("📦");

  // --- MODIFIER STATE ---
  const [modEditorOpen, setModEditorOpen] = useState(false);
  const [editingModId, setEditingModId] = useState<string | null>(null);
  // Form Fields
  const [modName, setModName] = useState("");
  const [modType, setModType] = useState<'prefix' | 'suffix'>('prefix');
  const [modMinLvl, setModMinLvl] = useState(1);
  const [modCost, setModCost] = useState(20);
  const [modIsAi, setModIsAi] = useState(false);
  const [modRarity, setModRarity] = useState<ItemRarity>('common');
  const [modAllowed, setModAllowed] = useState<string>('ALL');
  const [modBonuses, setModBonuses] = useState<ModifierBonus[]>([]);
  // Temp Bonus
  const [tempStat, setTempStat] = useState<string>('STR');
  const [tempVal, setTempVal] = useState(0);
  const [tempType, setTempType] = useState<BonusType>('FLAT');
  const [tempMode, setTempMode] = useState<GameMode>('GLOBAL');

  // --- WORLD STATE ---
  const [newRegionName, setNewRegionName] = useState('');
  const [newRegionLevel, setNewRegionLevel] = useState(1);
  const [newRegionDesc, setNewRegionDesc] = useState('');
  
  const [newLocName, setNewLocName] = useState('');
  const [newLocRegion, setNewLocRegion] = useState('');
  const [newLocLevel, setNewLocLevel] = useState(1);
  const [newLocDuration, setNewLocDuration] = useState(1);
  const [newLocRisk, setNewLocRisk] = useState('Düşük');
  const [newLocReward, setNewLocReward] = useState(1.0);

  // --- EVENT STATE ---
  const [newEventTitle, setNewEventTitle] = useState("Haftasonu Çılgınlığı");
  const [evtStart, setEvtStart] = useState("");
  const [evtEnd, setEvtEnd] = useState("");
  const [evtXp, setEvtXp] = useState(1.5);
  const [evtGold, setEvtGold] = useState(1.5);
  const [evtDrop, setEvtDrop] = useState(1.2);
  const [evtTime, setEvtTime] = useState(0.8);
  const [evtScroll, setEvtScroll] = useState(0.1);
  const [evtSalvage, setEvtSalvage] = useState(1.5);

  // Force moderators to only see 'users'
  useEffect(() => {
    if (currentUserRole === 'moderator' && activeTab !== 'users') {
        setActiveTab('users');
    }
  }, [currentUserRole, activeTab]);

  if (!isOpen) return null;
  // Security Guard: Regular players cannot access
  if (currentUserRole === 'player') return null;

  // --- ITEM LOGIC ---
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
      alert(`Şablon DB'ye kaydedildi (Simülasyon):\n${previewItem?.name}`);
  };

  const handleAddBaseItem = () => {
      if(!newBaseName) return;
      const newItem: BaseItem = {
          id: Date.now().toString(),
          name: newBaseName,
          type: newBaseType,
          minLevel: newBaseMinLvl,
          baseStats: { [newBaseStat]: newBaseVal }
      };
      setBaseItems([...baseItems, newItem]);
      saveSystemData('item', newItem); // Save to DB
      alert(`${newBaseName} veritabanına eklendi!`);
      setNewBaseName("");
  };

  const deleteBaseItem = (id: string) => {
      if(confirm('Silmek istediğine emin misin?')) {
          setBaseItems(baseItems.filter(i => i.id !== id));
          saveSystemData('delete_item', id); // Delete from DB
      }
  };

  // --- MARKET LOGIC ---
  const handleAddMarketItem = () => {
      if(!newMarketName) return;
      const newItem: MarketItem = {
          id: Date.now().toString(),
          name: newMarketName,
          price: newMarketPrice,
          type: newMarketType as any,
          description: newMarketDesc,
          icon: newMarketIcon
      };
      setMarketItems([...marketItems, newItem]);
      saveSystemData('market', newItem); // Save to DB
      setNewMarketName("");
  };

  const handleDeleteMarketItem = (id: string) => {
      setMarketItems(marketItems.filter(m => m.id !== id));
      saveSystemData('delete_market', id); // Delete from DB
  };

  // --- MODIFIER HANDLERS ---
  const openModEditor = (mod?: ItemModifier) => {
      if (mod) {
          setEditingModId(mod.id);
          setModName(mod.name);
          setModType(mod.type);
          setModMinLvl(mod.minLevel);
          setModCost(mod.fragmentCost);
          setModIsAi(mod.isAiOnly || false);
          setModRarity(mod.rarity);
          setModAllowed(Array.isArray(mod.allowedTypes) ? mod.allowedTypes.join(',') : 'ALL');
          setModBonuses(mod.bonuses);
      } else {
          setEditingModId(null);
          setModName("");
          setModType('prefix');
          setModMinLvl(1);
          setModCost(20);
          setModIsAi(false);
          setModRarity('common');
          setModAllowed('ALL');
          setModBonuses([]);
      }
      setModEditorOpen(true);
  };

  const saveModifier = () => {
      const allowed = modAllowed === 'ALL' ? 'ALL' : modAllowed.split(',').map(s => s.trim() as ItemType);
      
      const newMod: ItemModifier = {
          id: editingModId || Date.now().toString(),
          name: modName,
          type: modType,
          minLevel: modMinLvl,
          rarity: modRarity,
          allowedTypes: allowed,
          isActive: true,
          fragmentCost: modCost,
          isAiOnly: modIsAi,
          bonuses: modBonuses
      };

      if (editingModId) {
          setModifiers(modifiers.map(m => m.id === editingModId ? newMod : m));
      } else {
          setModifiers([...modifiers, newMod]);
      }
      saveSystemData('modifier', newMod); // Save to DB
      setModEditorOpen(false);
  };

  const deleteModifier = (id: string) => {
      if(confirm("Bu özelliği silmek istediğine emin misin?")) {
          setModifiers(modifiers.filter(m => m.id !== id));
          saveSystemData('delete_modifier', id); // Delete from DB
      }
  };

  const addBonusToMod = () => {
      setModBonuses([...modBonuses, { stat: tempStat as any, value: tempVal, type: tempType, mode: tempMode }]);
  };

  const removeBonusFromMod = (idx: number) => {
      setModBonuses(modBonuses.filter((_, i) => i !== idx));
  };

  // --- WORLD LOGIC ---
  const handleAddRegion = () => {
      if(!newRegionName) return;
      onAddRegion({ 
          id: 'r' + Date.now().toString(), 
          name: newRegionName, 
          minLevel: newRegionLevel, 
          description: newRegionDesc 
      });
      setNewRegionName('');
      setNewRegionDesc('');
      setNewRegionLevel(1);
  }
  const handleAddLoc = () => {
      if(!newLocName || !newLocRegion) return;
      onAddLocation({ 
          id: 'l' + Date.now().toString(), 
          regionId: newLocRegion, 
          name: newLocName, 
          minLevel: newLocLevel, 
          duration: newLocDuration, 
          desc: 'Yeni Alan', 
          risk: newLocRisk, 
          rewardRate: newLocReward,
          difficultyScore: Math.ceil(newLocReward * 2) 
      });
      setNewLocName('');
  }

  // --- EVENT HANDLERS ---
  const startEvent = () => {
      const sTime = evtStart ? new Date(evtStart).getTime() : Date.now();
      const eTime = evtEnd ? new Date(evtEnd).getTime() : undefined;

      const evt: GameEvent = {
          id: Date.now().toString(),
          title: newEventTitle,
          isActive: true, // Will be managed by dates in gameLogic
          startTime: sTime,
          endTime: eTime,
          xpMultiplier: evtXp,
          goldMultiplier: evtGold,
          dropRateMultiplier: evtDrop,
          expeditionTimeMultiplier: evtTime,
          scrollDropChance: evtScroll,
          salvageYieldMultiplier: evtSalvage
      };
      onUpdateEvent(evt);
      saveSystemData('event', evt); // Save to DB

      // Auto Announce
      let durStr = "süresiz";
      if(eTime) {
          const diffHrs = Math.ceil((eTime - sTime) / (1000 * 60 * 60));
          durStr = `${diffHrs} saat`;
      }

      onAddAnnouncement({
          id: Date.now().toString(),
          title: "📢 YENİ ETKİNLİK: " + newEventTitle,
          content: `${newEventTitle} başlıyor! \nBaşlangıç: ${new Date(sTime).toLocaleString()} \nBitiş: ${eTime ? new Date(eTime).toLocaleString() : 'Belirsiz'} \nFırsatları kaçırmayın!`,
          timestamp: Date.now(),
          type: 'event'
      });
      alert("Etkinlik planlandı ve duyuru yayınlandı.");
  };

  const stopEvent = () => {
      onUpdateEvent(null);
      saveSystemData('event', null); // Clears active event in DB logic
  };

  // --- USER HANDLERS ---
  const handleGiftSubmit = () => {
      if (!giftModalUser) return;
      if (giftType === 'gold') {
          onEditUser(giftModalUser.id, { gold: giftModalUser.gold + giftAmount });
      } else if (giftType === 'level') {
          // Simplified level up logic just for admin, normally involves XP calc
          onEditUser(giftModalUser.id, { level: giftModalUser.level + giftAmount }); 
      } else if (giftType === 'premium') {
          onGivePremium(giftModalUser.id, giftAmount);
      } else if (giftType === 'item') {
          const item = generateDynamicItem(giftModalUser.level, baseItems, materials, modifiers, 'legendary');
          onAddItemToPlayer(giftModalUser.id, item);
      }
      setGiftModalUser(null);
      alert("Hediye gönderildi.");
  };

  const handleChangeRole = (u: Player) => {
      const newRole = u.role === 'admin' ? 'player' : 'admin';
      if(confirm(`${u.name} kullanıcısını ${newRole === 'admin' ? 'YÖNETİCİ (Admin)' : 'OYUNCU'} yapmak istediğine emin misin?`)) {
          onEditUser(u.id, { role: newRole });
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-600 rounded-2xl w-full max-w-6xl h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-800">
            <h2 className="text-2xl font-bold cinzel text-white">Yönetici Paneli {currentUserRole === 'moderator' && '(Moderatör)'}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col p-4 gap-2">
                <button onClick={() => setActiveTab('users')} className={`p-3 rounded text-left font-bold ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Users size={16} className="inline mr-2"/> Kullanıcılar</button>
                
                {currentUserRole === 'admin' && (
                    <>
                    <button onClick={() => setActiveTab('items')} className={`p-3 rounded text-left font-bold ${activeTab === 'items' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Package size={16} className="inline mr-2"/> Eşya Editörü</button>
                    <button onClick={() => setActiveTab('market')} className={`p-3 rounded text-left font-bold ${activeTab === 'market' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><ShoppingBag size={16} className="inline mr-2"/> Pazar</button>
                    <button onClick={() => setActiveTab('modifiers')} className={`p-3 rounded text-left font-bold ${activeTab === 'modifiers' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Hammer size={16} className="inline mr-2"/> Modifier</button>
                    <button onClick={() => setActiveTab('world')} className={`p-3 rounded text-left font-bold ${activeTab === 'world' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Map size={16} className="inline mr-2"/> Dünya</button>
                    <button onClick={() => setActiveTab('mobs')} className={`p-3 rounded text-left font-bold ${activeTab === 'mobs' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Skull size={16} className="inline mr-2"/> Yaratıklar</button>
                    <button onClick={() => setActiveTab('system')} className={`p-3 rounded text-left font-bold ${activeTab === 'system' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Zap size={16} className="inline mr-2"/> Event & Sistem</button>
                    <button onClick={() => setActiveTab('config')} className={`p-3 rounded text-left font-bold ${activeTab === 'config' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Settings size={16} className="inline mr-2"/> Ayarlar</button>
                    
                    {/* Quick Cheats for Testing - Admin Only */}
                    <div className="mt-auto pt-4 border-t border-slate-700">
                         <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Hızlı Hileler (Kendine)</h4>
                         <div className="grid grid-cols-3 gap-2">
                             <button onClick={onAddGold} className="p-2 bg-slate-700 rounded text-yellow-500 hover:bg-slate-600" title="+Altın"><PlusCircle size={16}/></button>
                             <button onClick={onLevelUp} className="p-2 bg-slate-700 rounded text-blue-500 hover:bg-slate-600" title="+Level"><PlusCircle size={16}/></button>
                             <button onClick={onHeal} className="p-2 bg-slate-700 rounded text-red-500 hover:bg-slate-600" title="Heal"><PlusCircle size={16}/></button>
                         </div>
                    </div>
                    </>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50">
                
                {/* USERS TAB */}
                {activeTab === 'users' && (
                    <div>
                        <h3 className="font-bold text-white mb-4">Kullanıcı Yönetimi</h3>
                        <table className="w-full text-left text-sm text-slate-300 bg-slate-800 rounded">
                            <thead className="text-slate-500 font-bold uppercase border-b border-slate-700">
                                <tr><th className="p-3">Ad</th><th className="p-3">Lvl</th><th className="p-3">Gold</th><th className="p-3">Rol</th><th className="p-3 text-right">İşlemler</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-700/30">
                                        <td className="p-3 flex items-center gap-2"><img src={u.avatarUrl} className="w-6 h-6 rounded-full"/> {u.name}</td>
                                        <td className="p-3">{u.level}</td>
                                        <td className="p-3 text-yellow-500">{u.gold}</td>
                                        <td className="p-3"><span className={`bg-slate-900 px-2 py-1 rounded text-xs uppercase ${u.role === 'admin' ? 'text-red-400 font-bold' : 'text-slate-400'}`}>{u.role}</span></td>
                                        <td className="p-3 text-right flex justify-end gap-2">
                                            {/* Admin Only Actions */}
                                            {currentUserRole === 'admin' && (
                                                <>
                                                    <button onClick={() => handleChangeRole(u)} className="p-1.5 bg-indigo-900/50 text-indigo-400 rounded hover:bg-indigo-800" title="Rol Değiştir"><Shield size={16}/></button>
                                                    <button onClick={() => setGiftModalUser(u)} className="p-1.5 bg-green-900/50 text-green-400 rounded hover:bg-green-800" title="Hediye Ver"><Gift size={16}/></button>
                                                    <button onClick={() => {
                                                        const name = prompt("Yeni İsim:", u.name);
                                                        if(name) onEditUser(u.id, { name });
                                                    }} className="p-1.5 bg-blue-900/50 text-blue-400 rounded hover:bg-blue-800" title="Düzenle"><Edit size={16}/></button>
                                                </>
                                            )}
                                            
                                            {/* Moderator & Admin Action */}
                                            <button onClick={() => onBanUser(u.id)} className="p-1.5 bg-red-900/50 text-red-400 rounded hover:bg-red-800" title="Banla/Sil"><Ban size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Gift Modal */}
                        {giftModalUser && currentUserRole === 'admin' && (
                            <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4">
                                <div className="bg-slate-800 p-6 rounded-xl border border-slate-600 w-full max-w-sm">
                                    <h4 className="font-bold text-white mb-4">Hediye Gönder: {giftModalUser.name}</h4>
                                    <div className="space-y-3">
                                        <select value={giftType} onChange={e => setGiftType(e.target.value as any)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white">
                                            <option value="item">Rastgele Eşya (Legendary)</option>
                                            <option value="gold">Altın</option>
                                            <option value="level">Seviye Ekle</option>
                                            <option value="premium">Premium Gün</option>
                                        </select>
                                        {giftType !== 'item' && (
                                            <input type="number" placeholder="Miktar" value={giftAmount} onChange={e => setGiftAmount(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                                        )}
                                        <div className="flex gap-2 mt-4">
                                            <button onClick={handleGiftSubmit} className="flex-1 bg-green-600 text-white py-2 rounded font-bold">Gönder</button>
                                            <button onClick={() => setGiftModalUser(null)} className="flex-1 bg-slate-700 text-white py-2 rounded">İptal</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* REST OF TABS ... (Unchanged logic, just ensure wrapper handles them) */}
                {/* ITEMS TAB */}
                {activeTab === 'items' && currentUserRole === 'admin' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {/* Base Item List & Add */}
                         <div className="flex flex-col gap-6">
                             {/* Add Form */}
                             <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
                                 <h3 className="font-bold text-white mb-6 border-b border-slate-600 pb-2">Yeni Ana Eşya (Base Item) Ekle</h3>
                                 <div className="space-y-4">
                                     <input placeholder="Eşya Adı (Ör: Efsanevi Kılıç)" value={newBaseName} onChange={e => setNewBaseName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"/>
                                     <div className="flex gap-2">
                                         <select value={newBaseType} onChange={e => setNewBaseType(e.target.value as any)} className="bg-slate-900 border border-slate-600 rounded p-2 text-white flex-1">
                                             <option value="weapon">Silah</option><option value="armor">Zırh</option><option value="helmet">Kask</option>
                                             <option value="shield">Kalkan</option><option value="gloves">Eldiven</option><option value="boots">Bot</option>
                                             <option value="ring">Yüzük</option><option value="necklace">Kolye</option><option value="earring">Küpe</option><option value="belt">Kemer</option>
                                         </select>
                                         <input type="number" placeholder="Min Lvl" value={newBaseMinLvl} onChange={e => setNewBaseMinLvl(Number(e.target.value))} className="bg-slate-900 border border-slate-600 rounded p-2 text-white w-24"/>
                                     </div>
                                     <div className="flex gap-2 items-center bg-slate-900 p-2 rounded">
                                         <span className="text-xs text-slate-400">Temel Stat:</span>
                                         <select value={newBaseStat} onChange={e => setNewBaseStat(e.target.value as any)} className="bg-slate-800 border border-slate-600 rounded p-1 text-white text-xs">
                                             <option value="STR">STR</option><option value="AGI">AGI</option><option value="VIT">VIT</option><option value="INT">INT</option><option value="LUK">LUK</option>
                                         </select>
                                         <input type="number" placeholder="Değer" value={newBaseVal} onChange={e => setNewBaseVal(Number(e.target.value))} className="bg-slate-800 border border-slate-600 rounded p-1 text-white text-xs w-20"/>
                                     </div>
                                     <button onClick={handleAddBaseItem} className="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-2 rounded">Veritabanına Ekle</button>
                                 </div>
                             </div>

                             {/* List of Base Items */}
                             <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex-1 overflow-hidden flex flex-col">
                                 <div className="flex justify-between items-center mb-4">
                                     <h3 className="font-bold text-white">Mevcut Eşyalar</h3>
                                     <select value={itemsFilter} onChange={e => setItemsFilter(e.target.value as any)} className="bg-slate-900 text-xs p-1 rounded border border-slate-600 text-white">
                                         <option value="ALL">Tümü</option>
                                         <option value="weapon">Silahlar</option><option value="armor">Zırhlar</option><option value="helmet">Kasklar</option>
                                         <option value="shield">Kalkanlar</option><option value="gloves">Eldivenler</option><option value="boots">Botlar</option>
                                         <option value="ring">Yüzükler</option><option value="necklace">Kolyeler</option><option value="belt">Kemerler</option>
                                     </select>
                                 </div>
                                 <div className="overflow-y-auto max-h-[300px] space-y-1">
                                     {baseItems.filter(i => itemsFilter === 'ALL' || i.type === itemsFilter).map(item => (
                                         <div key={item.id} className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-700">
                                             <div>
                                                 <div className="text-sm font-bold text-slate-200">{item.name}</div>
                                                 <div className="text-xs text-slate-500 uppercase">{item.type} | Lvl {item.minLevel}</div>
                                             </div>
                                             <button onClick={() => deleteBaseItem(item.id)} className="text-red-500 hover:text-red-400"><Trash2 size={14}/></button>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         </div>

                         {/* GENERATOR SIMULATION */}
                         <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
                            <h3 className="font-bold text-white mb-6 border-b border-slate-600 pb-2">Eşya Üretim Simülasyonu</h3>
                            <div className="space-y-4">
                                <input type="number" placeholder="Hedef Seviye" value={targetLvl} onChange={e => setTargetLvl(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
                                
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
                                {previewItem && (
                                     <div className="mt-4 flex flex-col items-center">
                                         <div className="transform scale-110 mb-2"><ItemTooltip item={previewItem} fixed /></div>
                                         <button onClick={() => onAddItemToPlayer(currentPlayerId, previewItem)} className="text-xs bg-green-600 px-3 py-1 rounded text-white">Bana Ver</button>
                                     </div>
                                )}
                            </div>
                         </div>
                    </div>
                )}

                {/* MARKET TAB */}
                {activeTab === 'market' && currentUserRole === 'admin' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                            <h3 className="font-bold text-white mb-4">Yeni Pazar Ürünü Ekle</h3>
                            <div className="space-y-4">
                                <input placeholder="Ürün Adı" value={newMarketName} onChange={e => setNewMarketName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"/>
                                <input placeholder="Açıklama" value={newMarketDesc} onChange={e => setNewMarketDesc(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"/>
                                <div className="flex gap-2">
                                    <select value={newMarketType} onChange={e => setNewMarketType(e.target.value)} className="bg-slate-900 border border-slate-600 rounded p-2 text-white flex-1">
                                        <option value="consumable">Tüketilebilir</option>
                                        <option value="material">Materyal</option>
                                        <option value="premium">Premium</option>
                                    </select>
                                    <input type="number" placeholder="Fiyat" value={newMarketPrice} onChange={e => setNewMarketPrice(Number(e.target.value))} className="bg-slate-900 border border-slate-600 rounded p-2 text-white w-24"/>
                                    <input type="text" placeholder="İkon (Emoji)" value={newMarketIcon} onChange={e => setNewMarketIcon(e.target.value)} className="bg-slate-900 border border-slate-600 rounded p-2 text-white w-16"/>
                                </div>
                                <button onClick={handleAddMarketItem} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded">Pazara Ekle</button>
                            </div>
                        </div>

                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                            <h3 className="font-bold text-white mb-4">Pazardaki Ürünler</h3>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {marketItems.map(m => (
                                    <div key={m.id} className="flex justify-between items-center bg-slate-900 p-3 rounded border border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{m.icon}</span>
                                            <div>
                                                <div className="font-bold text-white">{m.name}</div>
                                                <div className="text-xs text-yellow-500">{m.price} Altın</div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteMarketItem(m.id)} className="text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* MODIFIERS TAB */}
                {activeTab === 'modifiers' && currentUserRole === 'admin' && (
                    <div className="h-full flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white">Modifier & Bonus Yönetimi</h3>
                            <button onClick={() => openModEditor()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2"><PlusCircle size={16}/> Yeni Ekle</button>
                        </div>

                        {modEditorOpen ? (
                            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 animate-fade-in">
                                <div className="flex justify-between mb-4">
                                    <h4 className="font-bold text-white">{editingModId ? 'Modifier Düzenle' : 'Yeni Modifier'}</h4>
                                    <button onClick={() => setModEditorOpen(false)}><X className="text-slate-400"/></button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <input placeholder="Adı (Ör: Ölümcül)" value={modName} onChange={e => setModName(e.target.value)} className="bg-slate-900 border border-slate-600 rounded p-2 text-white" />
                                    <div className="flex gap-2">
                                        <select value={modType} onChange={e => setModType(e.target.value as any)} className="bg-slate-900 border border-slate-600 rounded p-2 text-white flex-1">
                                            <option value="prefix">Ön Ek</option>
                                            <option value="suffix">Son Ek</option>
                                        </select>
                                        <input type="number" placeholder="Min Lvl" value={modMinLvl} onChange={e => setModMinLvl(Number(e.target.value))} className="bg-slate-900 border border-slate-600 rounded p-2 text-white w-20" />
                                    </div>
                                    <select value={modRarity} onChange={e => setModRarity(e.target.value as any)} className="bg-slate-900 border border-slate-600 rounded p-2 text-white w-full">
                                        <option value="common">Common</option>
                                        <option value="uncommon">Uncommon</option>
                                        <option value="rare">Rare</option>
                                        <option value="epic">Epic</option>
                                        <option value="legendary">Legendary</option>
                                    </select>
                                    <input placeholder="Allowed Types (ALL, weapon, armor...)" value={modAllowed} onChange={e => setModAllowed(e.target.value)} className="bg-slate-900 border border-slate-600 rounded p-2 text-white w-full" />
                                </div>
                                <div className="mb-4">
                                    <label className="flex items-center gap-2 text-slate-300">
                                        <input type="checkbox" checked={modIsAi} onChange={e => setModIsAi(e.target.checked)} /> 
                                        Sadece AI Üretebilir (Admin ekleyemez, sadece event/drop)
                                    </label>
                                </div>

                                <div className="bg-slate-900 p-4 rounded border border-slate-700 mb-4">
                                    <h5 className="text-xs font-bold text-slate-400 uppercase mb-2">Bonuslar</h5>
                                    {modBonuses.map((b, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-slate-800 p-2 rounded mb-1 border border-slate-700">
                                            <span className="text-sm text-slate-200">{b.stat} {b.value > 0 ? '+' : ''}{b.value} ({b.type}) [{b.mode}]</span>
                                            <button onClick={() => removeBonusFromMod(idx)} className="text-red-500"><X size={14}/></button>
                                        </div>
                                    ))}
                                    <div className="flex gap-2 mt-2">
                                        <select value={tempStat} onChange={e => setTempStat(e.target.value)} className="bg-slate-800 border border-slate-600 rounded p-1 text-white text-xs flex-1">
                                            <option value="STR">STR</option><option value="AGI">AGI</option><option value="VIT">VIT</option><option value="INT">INT</option><option value="LUK">LUK</option>
                                            <option value="CRIT_CHANCE">Kritik Şans</option><option value="CRIT_DAMAGE">Kritik Hasar</option>
                                            <option value="LIFESTEAL">Can Çalma</option><option value="GOLD_GAIN">Altın Kazanma</option>
                                            <option value="XP_GAIN">XP Kazanma</option><option value="DROP_CHANCE">Drop Şansı</option>
                                        </select>
                                        <input type="number" placeholder="Değer" value={tempVal} onChange={e => setTempVal(Number(e.target.value))} className="bg-slate-800 border border-slate-600 rounded p-1 text-white text-xs w-20" />
                                        <select value={tempType} onChange={e => setTempType(e.target.value as any)} className="bg-slate-800 border border-slate-600 rounded p-1 text-white text-xs w-24">
                                            <option value="FLAT">Sabit</option><option value="PERCENT">Yüzde</option>
                                        </select>
                                        <select value={tempMode} onChange={e => setTempMode(e.target.value as any)} className="bg-slate-800 border border-slate-600 rounded p-1 text-white text-xs w-24">
                                            <option value="GLOBAL">Her Yer</option><option value="ARENA">Arena</option><option value="EXPEDITION">Sefer</option>
                                        </select>
                                        <button onClick={addBonusToMod} className="bg-green-600 text-white px-2 rounded"><PlusCircle size={16}/></button>
                                    </div>
                                </div>
                                <button onClick={saveModifier} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-bold">Kaydet</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
                                {modifiers.map(m => (
                                    <div key={m.id} className="bg-slate-800 border border-slate-700 p-3 rounded hover:border-slate-500 transition-colors group relative">
                                        <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                                            <button onClick={() => openModEditor(m)} className="p-1 bg-blue-900 text-blue-400 rounded"><Edit size={14}/></button>
                                            <button onClick={() => deleteModifier(m.id)} className="p-1 bg-red-900 text-red-400 rounded"><Trash2 size={14}/></button>
                                        </div>
                                        <div className="font-bold text-white text-sm">{m.name}</div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">{m.type} {m.isAiOnly && '(AI)'}</div>
                                        <div className="text-[10px] text-yellow-500 mb-1">Rarity: {m.rarity}</div>
                                        <div className="space-y-1">
                                            {m.bonuses.map((b, i) => (
                                                <div key={i} className="text-[10px] text-slate-400 flex justify-between">
                                                    <span>{b.stat}</span>
                                                    <span className="text-yellow-500">+{b.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* WORLD MANAGER */}
                {activeTab === 'world' && currentUserRole === 'admin' && (
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full overflow-hidden">
                         
                         {/* Regions Column */}
                         <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col h-full">
                             <h3 className="font-bold text-white mb-2 flex items-center gap-2"><Map size={18}/> Sefer Bölgeleri</h3>
                             
                             <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
                                 {regions.map(r => (
                                     <div key={r.id} className="p-3 bg-slate-900 rounded border border-slate-700">
                                         <div className="flex justify-between items-center">
                                             <span className="font-bold text-sm text-white">{r.name}</span>
                                             <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">Lvl {r.minLevel}+</span>
                                         </div>
                                         <p className="text-xs text-slate-400 mt-1">{r.description}</p>
                                     </div>
                                 ))}
                             </div>

                             <div className="border-t border-slate-700 pt-4 space-y-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase">Yeni Bölge Ekle</h4>
                                <input placeholder="Bölge Adı" value={newRegionName} onChange={e => setNewRegionName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"/>
                                <textarea placeholder="Açıklama" value={newRegionDesc} onChange={e => setNewRegionDesc(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white resize-none h-16"/>
                                <div className="flex gap-2 items-center">
                                    <span className="text-xs text-slate-400">Min Level:</span>
                                    <input type="number" value={newRegionLevel} onChange={e => setNewRegionLevel(Number(e.target.value))} className="w-16 bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"/>
                                    <button onClick={handleAddRegion} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded text-sm">Bölgeyi Ekle</button>
                                </div>
                             </div>
                         </div>

                         {/* Locations Column */}
                         <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col h-full">
                             <h3 className="font-bold text-white mb-2 flex items-center gap-2"><Map size={18}/> Lokasyonlar</h3>
                             
                             <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
                                 {locations.map(l => {
                                     const parentRegion = regions.find(r => r.id === l.regionId);
                                     return (
                                         <div key={l.id} className="p-3 bg-slate-900 rounded border border-slate-700 group relative">
                                             <div className="absolute top-2 right-2 hidden group-hover:block">
                                                 <button onClick={() => onDeleteLocation(l.id)} className="text-red-500 hover:text-red-400"><Trash2 size={14}/></button>
                                             </div>
                                             <div className="flex justify-between items-center mb-1">
                                                 <span className="font-bold text-sm text-white">{l.name}</span>
                                                 <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${l.risk === 'Yüksek' ? 'bg-red-900 text-red-300' : l.risk === 'Orta' ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300'}`}>{l.risk} Risk</span>
                                             </div>
                                             <div className="text-xs text-slate-500 flex gap-2">
                                                 <span>{parentRegion?.name}</span> • <span>Lvl {l.minLevel}</span> • <span>{l.duration}dk</span> • <span className="text-green-400">x{l.rewardRate} Ödül</span>
                                             </div>
                                         </div>
                                     );
                                 })}
                             </div>

                             <div className="border-t border-slate-700 pt-4 space-y-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase">Yeni Lokasyon Ekle</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <select value={newLocRegion} onChange={e => setNewLocRegion(e.target.value)} className="bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white w-full col-span-2">
                                        <option value="">Bölge Seç...</option>
                                        {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                    <input placeholder="Alan Adı" value={newLocName} onChange={e => setNewLocName(e.target.value)} className="bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white col-span-2"/>
                                    
                                    <div className="flex flex-col">
                                        <label className="text-[10px] text-slate-500">Min Level</label>
                                        <input type="number" value={newLocLevel} onChange={e => setNewLocLevel(Number(e.target.value))} className="bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"/>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[10px] text-slate-500">Süre (dk)</label>
                                        <input type="number" value={newLocDuration} onChange={e => setNewLocDuration(Number(e.target.value))} className="bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"/>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[10px] text-slate-500">Risk</label>
                                        <select value={newLocRisk} onChange={e => setNewLocRisk(e.target.value)} className="bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white">
                                            <option value="Düşük">Düşük</option>
                                            <option value="Orta">Orta</option>
                                            <option value="Yüksek">Yüksek</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[10px] text-slate-500">Ödül Çarpanı</label>
                                        <input type="number" step="0.1" value={newLocReward} onChange={e => setNewLocReward(Number(e.target.value))} className="bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"/>
                                    </div>
                                </div>
                                <button onClick={handleAddLoc} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded text-sm mt-2">Lokasyonu Ekle</button>
                             </div>
                         </div>
                     </div>
                )}

                {/* MOBS TAB */}
                {activeTab === 'mobs' && currentUserRole === 'admin' && (
                    <div className="bg-slate-800 p-4 rounded border border-slate-700">
                        <h3 className="font-bold text-white mb-4">Kayıtlı Yaratık Şablonları</h3>
                        <p className="text-slate-500 text-sm">Oyun şu anda dinamik yaratık üretim sistemi kullanıyor. Şablon ekleme özelliği yakında gelecek.</p>
                        <div className="mt-4 p-4 bg-slate-900 rounded border border-slate-700 border-dashed text-center">
                            <Skull size={32} className="mx-auto text-slate-600 mb-2"/>
                            <span className="text-slate-500">Yaratık editörü geliştirme aşamasında.</span>
                        </div>
                    </div>
                )}

                {/* GLOBAL CONFIG TAB */}
                {activeTab === 'config' && currentUserRole === 'admin' && (
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <h3 className="font-bold text-white mb-6 border-b border-slate-600 pb-2">Yeni Üye Başlangıç Ayarları</h3>
                        
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Başlangıç Altını</label>
                                <input type="number" value={globalConfig.startingGold} onChange={e => setGlobalConfig({...globalConfig, startingGold: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Başlangıç Seviyesi</label>
                                <input type="number" value={globalConfig.startingLevel} onChange={e => setGlobalConfig({...globalConfig, startingLevel: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Stat Puanları</label>
                                <input type="number" value={globalConfig.startingStatPoints} onChange={e => setGlobalConfig({...globalConfig, startingStatPoints: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs text-slate-400 mb-2 uppercase font-bold">Başlangıç Statları</label>
                            <div className="grid grid-cols-5 gap-2">
                                {(['STR','AGI','VIT','INT','LUK'] as StatType[]).map(stat => (
                                    <div key={stat}>
                                        <span className="text-xs text-slate-500 block text-center mb-1">{stat}</span>
                                        <input type="number" value={globalConfig.startingStats[stat]} onChange={e => setGlobalConfig({...globalConfig, startingStats: {...globalConfig.startingStats, [stat]: Number(e.target.value)}})} className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-center text-white" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-slate-400 mb-2 uppercase font-bold">Başlangıç Eşyaları (ID Listesi)</label>
                            <div className="bg-slate-900 p-2 rounded border border-slate-600 mb-2 min-h-[50px] flex flex-wrap gap-2">
                                {globalConfig.startingInventory.map((itemId, idx) => (
                                    <span key={idx} className="bg-slate-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                                        {baseItems.find(i => i.id === itemId)?.name || itemId}
                                        <button onClick={() => setGlobalConfig({...globalConfig, startingInventory: globalConfig.startingInventory.filter((_, i) => i !== idx)})} className="text-red-400 hover:text-white"><X size={12}/></button>
                                    </span>
                                ))}
                            </div>
                            <select 
                                onChange={e => {
                                    if(e.target.value) setGlobalConfig({...globalConfig, startingInventory: [...globalConfig.startingInventory, e.target.value]});
                                }}
                                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                            >
                                <option value="">Eşya Ekle...</option>
                                {baseItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {/* SYSTEM TAB (Events) */}
                {activeTab === 'system' && currentUserRole === 'admin' && (
                    <div className="space-y-8">
                        {/* Active Event Card */}
                        <div className={`p-6 rounded-xl border-2 ${activeEvent ? 'bg-gradient-to-r from-red-900/50 to-slate-900 border-red-500 animate-pulse-slow' : 'bg-slate-800 border-slate-700'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Zap className={activeEvent ? 'text-yellow-400' : 'text-slate-500'} />
                                    {activeEvent ? `AKTİF ETKİNLİK: ${activeEvent.title}` : 'Etkinlik Planlayıcısı'}
                                </h3>
                                {activeEvent ? (
                                    <button onClick={stopEvent} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-bold">Bitir / İptal</button>
                                ) : (
                                    <button onClick={startEvent} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold">Planla & Kaydet</button>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="col-span-2">
                                    <label className="text-xs text-slate-400 block mb-1">Etkinlik Adı</label>
                                    <input value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} disabled={!!activeEvent} className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-white text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Başlangıç Tarihi</label>
                                    <input type="datetime-local" value={evtStart} onChange={e => setEvtStart(e.target.value)} disabled={!!activeEvent} className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-white text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Bitiş Tarihi</label>
                                    <input type="datetime-local" value={evtEnd} onChange={e => setEvtEnd(e.target.value)} disabled={!!activeEvent} className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-white text-sm" />
                                </div>
                                
                                <div className="border-t border-slate-700 col-span-4 my-2"></div>

                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">XP Çarpanı</label>
                                    <input type="number" step="0.1" value={evtXp} onChange={e => setEvtXp(Number(e.target.value))} disabled={!!activeEvent} className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-white text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Altın Çarpanı</label>
                                    <input type="number" step="0.1" value={evtGold} onChange={e => setEvtGold(Number(e.target.value))} disabled={!!activeEvent} className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-white text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Drop Şansı (x)</label>
                                    <input type="number" step="0.1" value={evtDrop} onChange={e => setEvtDrop(Number(e.target.value))} disabled={!!activeEvent} className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-white text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Sefer Süresi (x)</label>
                                    <input type="number" step="0.1" value={evtTime} onChange={e => setEvtTime(Number(e.target.value))} disabled={!!activeEvent} className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-white text-sm" title="Daha düşük = Daha hızlı" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Parşömen Şansı (+)</label>
                                    <input type="number" step="0.05" value={evtScroll} onChange={e => setEvtScroll(Number(e.target.value))} disabled={!!activeEvent} className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-white text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Eritme Verimi (x)</label>
                                    <input type="number" step="0.1" value={evtSalvage} onChange={e => setEvtSalvage(Number(e.target.value))} disabled={!!activeEvent} className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-white text-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Announcements (Existing Logic) */}
                        <div className="bg-slate-800 p-4 rounded border border-slate-700">
                            <h3 className="font-bold text-white mb-2">Duyuru Yap</h3>
                            {/* ... announcement form inputs reuse logic ... */}
                            <button onClick={() => onAddAnnouncement({id: Date.now().toString(), title: 'Test', content: 'Test', timestamp: Date.now(), type: 'general'})} className="bg-slate-700 text-white px-4 py-2 rounded text-sm">Hızlı Duyuru (Test)</button>
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
