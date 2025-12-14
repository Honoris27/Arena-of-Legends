
import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Trash2, Edit, Save, Map, Gift, Megaphone, Skull, Users, Package, Database, Hammer, Eye, Check, RefreshCw, Zap, Clock, Coins, FileText, Ban, ShoppingBag, Settings, Shield, MessageSquare, AlertTriangle, Calendar, Send } from 'lucide-react';
import { Player, Item, ExpeditionLocation, Region, ItemType, Role, Announcement, StatType, EnemyTemplate, BaseItem, ItemMaterial, ItemModifier, ModifierBonus, BonusType, GameMode, GameEvent, ItemRarity, MarketItem, GlobalConfig, SupportTicket } from '../types';
import { generateDynamicItem, INITIAL_BASE_ITEMS, INITIAL_MATERIALS, INITIAL_MODIFIERS } from '../services/gameLogic';
import { saveSystemData } from '../services/supabase';
import ItemTooltip from './ItemTooltip';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: Role; 
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
  users: Player[];
  onAddItemToPlayer: (playerId: string, item: Item) => void;
  onBanUser: (id: string) => void;
  onEditUser: (id: string, updates: Partial<Player>) => void;
  onGivePremium: (id: string, days: number) => void;
  regions: Region[];
  onAddRegion: (region: Region) => void;
  locations: ExpeditionLocation[];
  onAddLocation: (loc: ExpeditionLocation) => void;
  onDeleteLocation: (id: string) => void;
  enemyTemplates: EnemyTemplate[];
  currentPlayerId: string;
  onAddAnnouncement: (ann: Announcement) => void;
  onAddEnemyTemplate: (tpl: EnemyTemplate) => void;
  onDeleteEnemyTemplate: (id: string) => void;
  activeEvent: GameEvent | null;
  onUpdateEvent: (event: GameEvent | null) => void;
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
  const [activeTab, setActiveTab] = useState<'users' | 'items' | 'modifiers' | 'world' | 'mobs' | 'system' | 'market' | 'config' | 'support'>('users');
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
  const [modName, setModName] = useState("");
  const [modType, setModType] = useState<'prefix' | 'suffix'>('prefix');
  const [modMinLvl, setModMinLvl] = useState(1);
  const [modCost, setModCost] = useState(20);
  const [modIsAi, setModIsAi] = useState(false);
  const [modRarity, setModRarity] = useState<ItemRarity>('common');
  const [modAllowed, setModAllowed] = useState<string>('ALL');
  const [modBonuses, setModBonuses] = useState<ModifierBonus[]>([]);
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

  // --- MOB EDITOR HANDLER ---
  const [mobName, setMobName] = useState("");
  const [mobLvl, setMobLvl] = useState(1);
  const [mobDesc, setMobDesc] = useState("");
  const [isMobSupportOpen, setIsMobSupportOpen] = useState(false); // New Modal state for Mob Editor Support
  const [mobSupportMsg, setMobSupportMsg] = useState("");

  useEffect(() => {
    if (currentUserRole === 'moderator' && activeTab !== 'users') {
        setActiveTab('users');
    }
  }, [currentUserRole, activeTab]);

  if (!isOpen) return null;
  if (currentUserRole === 'player') return null;

  // --- LOGIC FUNCTIONS (Restored) ---

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
      saveSystemData('item', newItem);
      alert(`${newBaseName} veritabanına eklendi!`);
      setNewBaseName("");
  };

  const deleteBaseItem = (id: string) => {
      if(confirm('Silmek istediğine emin misin?')) {
          setBaseItems(baseItems.filter(i => i.id !== id));
          saveSystemData('delete_item', id);
      }
  };

  const handlePreviewItem = () => {
      const forcedBase = baseItems.find(i => i.id === selBase);
      const forcedMat = materials.find(i => i.id === selMat);
      setPreviewItem(generateDynamicItem(targetLvl, forcedBase ? [forcedBase] : baseItems, forcedMat ? [forcedMat] : materials, modifiers));
  };

  const handleAddMarketItem = () => {
      if(!newMarketName) return;
      const newItem: MarketItem = { id: Date.now().toString(), name: newMarketName, price: newMarketPrice, type: newMarketType as any, description: newMarketDesc, icon: newMarketIcon };
      setMarketItems([...marketItems, newItem]);
      saveSystemData('market', newItem);
      setNewMarketName("");
  };
  const handleDeleteMarketItem = (id: string) => {
      setMarketItems(marketItems.filter(m => m.id !== id));
      saveSystemData('delete_market', id);
  };

  const openModEditor = (mod?: ItemModifier) => {
      if (mod) {
          setEditingModId(mod.id); setModName(mod.name); setModType(mod.type); setModMinLvl(mod.minLevel); setModCost(mod.fragmentCost); setModIsAi(mod.isAiOnly || false); setModRarity(mod.rarity); setModAllowed(Array.isArray(mod.allowedTypes) ? mod.allowedTypes.join(',') : 'ALL'); setModBonuses(mod.bonuses);
      } else {
          setEditingModId(null); setModName(""); setModType('prefix'); setModMinLvl(1); setModCost(20); setModIsAi(false); setModRarity('common'); setModAllowed('ALL'); setModBonuses([]);
      }
      setModEditorOpen(true);
  };
  const saveModifier = () => {
      const allowed = modAllowed === 'ALL' ? 'ALL' : modAllowed.split(',').map(s => s.trim() as ItemType);
      const newMod: ItemModifier = { id: editingModId || Date.now().toString(), name: modName, type: modType, minLevel: modMinLvl, rarity: modRarity, allowedTypes: allowed, isActive: true, fragmentCost: modCost, isAiOnly: modIsAi, bonuses: modBonuses };
      if (editingModId) setModifiers(modifiers.map(m => m.id === editingModId ? newMod : m));
      else setModifiers([...modifiers, newMod]);
      saveSystemData('modifier', newMod);
      setModEditorOpen(false);
  };
  const deleteModifier = (id: string) => {
      if(confirm("Silmek istediğine emin misin?")) { setModifiers(modifiers.filter(m => m.id !== id)); saveSystemData('delete_modifier', id); }
  };
  const addBonusToMod = () => setModBonuses([...modBonuses, { stat: tempStat as any, value: tempVal, type: tempType, mode: tempMode }]);
  const removeBonusFromMod = (idx: number) => setModBonuses(modBonuses.filter((_, i) => i !== idx));

  const handleAddRegion = () => {
      if(!newRegionName) return;
      onAddRegion({ id: 'r' + Date.now().toString(), name: newRegionName, minLevel: newRegionLevel, description: newRegionDesc });
      setNewRegionName(''); setNewRegionDesc(''); setNewRegionLevel(1);
  }
  const handleAddLoc = () => {
      if(!newLocName || !newLocRegion) return;
      onAddLocation({ id: 'l' + Date.now().toString(), regionId: newLocRegion, name: newLocName, minLevel: newLocLevel, duration: newLocDuration, desc: 'Yeni Alan', risk: newLocRisk, rewardRate: newLocReward, difficultyScore: Math.ceil(newLocReward * 2) });
      setNewLocName('');
  }

  const startEvent = () => {
      const sTime = evtStart ? new Date(evtStart).getTime() : Date.now();
      const eTime = evtEnd ? new Date(evtEnd).getTime() : undefined;
      const evt: GameEvent = {
          id: Date.now().toString(), title: newEventTitle, isActive: true, startTime: sTime, endTime: eTime,
          xpMultiplier: evtXp, goldMultiplier: evtGold, dropRateMultiplier: evtDrop, expeditionTimeMultiplier: evtTime,
          scrollDropChance: evtScroll, salvageYieldMultiplier: evtSalvage
      };
      onUpdateEvent(evt); saveSystemData('event', evt);
      onAddAnnouncement({ id: Date.now().toString(), title: "📢 YENİ ETKİNLİK: " + newEventTitle, content: `${newEventTitle} başladı!`, timestamp: Date.now(), type: 'event' });
      alert("Etkinlik planlandı.");
  };
  const stopEvent = () => { onUpdateEvent(null); saveSystemData('event', null); };

  const closeTicket = (ticketId: string) => {
      const updated = globalConfig.supportTickets.map(t => t.id === ticketId ? { ...t, status: 'closed' } : t);
      setGlobalConfig({ ...globalConfig, supportTickets: updated as any });
  };

  const handleGiftSubmit = () => {
      if (!giftModalUser) return;
      if (giftType === 'gold') onEditUser(giftModalUser.id, { gold: giftModalUser.gold + giftAmount });
      else if (giftType === 'level') onEditUser(giftModalUser.id, { level: giftModalUser.level + giftAmount });
      else if (giftType === 'premium') onGivePremium(giftModalUser.id, giftAmount);
      else if (giftType === 'item') { const item = generateDynamicItem(giftModalUser.level, baseItems, materials, modifiers, 'legendary'); onAddItemToPlayer(giftModalUser.id, item); }
      setGiftModalUser(null); alert("Hediye gönderildi.");
  };
  const handleChangeRole = (u: Player) => {
      const newRole = u.role === 'admin' ? 'player' : 'admin';
      if(confirm(`${u.name} kullanıcısını ${newRole === 'admin' ? 'YÖNETİCİ' : 'OYUNCU'} yapmak istediğine emin misin?`)) onEditUser(u.id, { role: newRole });
  };
  const handleAddMob = () => { alert(`Yaratık Eklendi (Simülasyon): ${mobName}`); setMobName(""); setMobDesc(""); };

  const submitInternalSupport = () => {
      if(!mobSupportMsg) return;
      const ticket: SupportTicket = {
          id: Date.now().toString(),
          senderId: currentPlayerId,
          senderName: "Admin/Dev",
          category: 'bug',
          subject: 'Admin Panelden Bildirim (Yaratık Editörü)',
          message: mobSupportMsg,
          timestamp: Date.now(),
          status: 'open'
      };
      const updatedTickets = [...(globalConfig.supportTickets || []), ticket];
      setGlobalConfig({ ...globalConfig, supportTickets: updatedTickets });
      alert("Destek kaydı oluşturuldu.");
      setMobSupportMsg("");
      setIsMobSupportOpen(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-600 rounded-2xl w-full max-w-7xl h-[95vh] shadow-2xl flex flex-col overflow-hidden">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-800">
            <h2 className="text-2xl font-bold cinzel text-white">Yönetici Paneli {currentUserRole === 'moderator' && '(Moderatör)'}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col p-2 gap-1 overflow-y-auto">
                <button onClick={() => setActiveTab('users')} className={`p-3 rounded text-left font-bold text-sm ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}><Users size={16} className="inline mr-2"/> Kullanıcılar</button>
                <button onClick={() => setActiveTab('support')} className={`p-3 rounded text-left font-bold text-sm ${activeTab === 'support' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>
                    <MessageSquare size={16} className="inline mr-2"/> Destek & Ticket
                    {globalConfig.supportTickets?.filter(t => t.status === 'open').length > 0 && <span className="ml-2 bg-red-600 text-[10px] px-1.5 py-0.5 rounded-full text-white">{globalConfig.supportTickets.filter(t => t.status === 'open').length}</span>}
                </button>
                
                {currentUserRole === 'admin' && (
                    <>
                    <div className="my-2 border-t border-slate-700"></div>
                    <button onClick={() => setActiveTab('system')} className={`p-3 rounded text-left font-bold text-sm ${activeTab === 'system' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}><Zap size={16} className="inline mr-2"/> Event & Duyuru</button>
                    <button onClick={() => setActiveTab('world')} className={`p-3 rounded text-left font-bold text-sm ${activeTab === 'world' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}><Map size={16} className="inline mr-2"/> Sefer & Bölgeler</button>
                    <button onClick={() => setActiveTab('items')} className={`p-3 rounded text-left font-bold text-sm ${activeTab === 'items' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}><Package size={16} className="inline mr-2"/> Eşyalar</button>
                    <button onClick={() => setActiveTab('modifiers')} className={`p-3 rounded text-left font-bold text-sm ${activeTab === 'modifiers' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}><Hammer size={16} className="inline mr-2"/> Bonuslar</button>
                    <button onClick={() => setActiveTab('market')} className={`p-3 rounded text-left font-bold text-sm ${activeTab === 'market' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}><ShoppingBag size={16} className="inline mr-2"/> Pazar</button>
                    <button onClick={() => setActiveTab('mobs')} className={`p-3 rounded text-left font-bold text-sm ${activeTab === 'mobs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}><Skull size={16} className="inline mr-2"/> Yaratıklar</button>
                    <button onClick={() => setActiveTab('config')} className={`p-3 rounded text-left font-bold text-sm ${activeTab === 'config' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}><Settings size={16} className="inline mr-2"/> Genel Ayarlar</button>
                    
                    <div className="mt-auto pt-4 border-t border-slate-700">
                         <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Hızlı Hileler</h4>
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
            <div className="flex-1 overflow-y-auto p-6 bg-slate-950/80">
                
                {/* USERS TAB */}
                {activeTab === 'users' && (
                    <div>
                        <h3 className="font-bold text-white mb-4">Kullanıcı Yönetimi</h3>
                        <div className="overflow-x-auto">
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
                                            {currentUserRole === 'admin' && (
                                                <>
                                                    <button onClick={() => handleChangeRole(u)} className="p-1.5 bg-indigo-900/50 text-indigo-400 rounded hover:bg-indigo-800" title="Rol Değiştir"><Shield size={16}/></button>
                                                    <button onClick={() => setGiftModalUser(u)} className="p-1.5 bg-green-900/50 text-green-400 rounded hover:bg-green-800" title="Hediye Ver"><Gift size={16}/></button>
                                                    <button onClick={() => { const name = prompt("Yeni İsim:", u.name); if(name) onEditUser(u.id, { name }); }} className="p-1.5 bg-blue-900/50 text-blue-400 rounded hover:bg-blue-800" title="Düzenle"><Edit size={16}/></button>
                                                </>
                                            )}
                                            <button onClick={() => onBanUser(u.id)} className="p-1.5 bg-red-900/50 text-red-400 rounded hover:bg-red-800" title="Banla/Sil"><Ban size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
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

                {/* SUPPORT TAB */}
                {activeTab === 'support' && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-white text-xl border-b border-slate-700 pb-2">Destek Biletleri</h3>
                        {globalConfig.supportTickets?.length === 0 ? (
                            <div className="text-slate-500 italic">Henüz bir destek talebi yok.</div>
                        ) : (
                            <div className="grid gap-4">
                                {globalConfig.supportTickets?.slice().reverse().map(ticket => (
                                    <div key={ticket.id} className={`p-4 rounded-lg border ${ticket.status === 'open' ? 'bg-slate-800 border-yellow-600/50' : 'bg-slate-900 border-slate-700 opacity-60'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                                                        ticket.category === 'bug' ? 'bg-red-900 text-red-300' :
                                                        ticket.category === 'cheat' ? 'bg-purple-900 text-purple-300' :
                                                        ticket.category === 'complaint' ? 'bg-orange-900 text-orange-300' :
                                                        'bg-blue-900 text-blue-300'
                                                    }`}>{ticket.category}</span>
                                                    <span className="font-bold text-white">{ticket.subject}</span>
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1">Gönderen: {ticket.senderName} • {new Date(ticket.timestamp).toLocaleString()}</div>
                                            </div>
                                            {ticket.status === 'open' ? (
                                                <button onClick={() => closeTicket(ticket.id)} className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded">Çözüldü / Kapat</button>
                                            ) : (
                                                <span className="text-xs text-green-500 font-bold flex items-center gap-1"><Check size={12}/> Kapandı</span>
                                            )}
                                        </div>
                                        <div className="bg-black/30 p-3 rounded text-sm text-slate-300 whitespace-pre-wrap border border-slate-700/50">
                                            {ticket.message}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* SYSTEM TAB (Events) */}
                {activeTab === 'system' && currentUserRole === 'admin' && (
                    <div className="space-y-8">
                        <div className={`p-6 rounded-xl border-2 ${activeEvent ? 'bg-gradient-to-r from-red-900/50 to-slate-900 border-red-500 animate-pulse-slow' : 'bg-slate-800 border-slate-700'}`}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Zap className={activeEvent ? 'text-yellow-400' : 'text-slate-500'} />
                                    {activeEvent ? `AKTİF ETKİNLİK: ${activeEvent.title}` : 'Yeni Etkinlik Planla'}
                                </h3>
                                {activeEvent ? (
                                    <button onClick={stopEvent} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded font-bold shadow-lg">ETKİNLİĞİ BİTİR</button>
                                ) : (
                                    <button onClick={startEvent} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold shadow-lg">BAŞLAT & DUYUR</button>
                                )}
                            </div>
                            
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-3">
                                        <label className="text-xs text-slate-400 block mb-1 font-bold">ETKİNLİK BAŞLIĞI</label>
                                        <input value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} disabled={!!activeEvent} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-bold" placeholder="Ör: Haftasonu XP Şöleni" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1 font-bold flex items-center gap-1"><Calendar size={12}/> BAŞLANGIÇ (Opsiyonel)</label>
                                        <input type="datetime-local" value={evtStart} onChange={e => setEvtStart(e.target.value)} disabled={!!activeEvent} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-xs" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1 font-bold flex items-center gap-1"><Calendar size={12}/> BİTİŞ (Opsiyonel)</label>
                                        <input type="datetime-local" value={evtEnd} onChange={e => setEvtEnd(e.target.value)} disabled={!!activeEvent} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-xs" />
                                    </div>
                                </div>

                                <div className="bg-black/20 p-4 rounded-lg border border-slate-700">
                                    <h4 className="text-sm font-bold text-yellow-500 mb-3 uppercase tracking-widest">Bonus Çarpanları</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div><label className="text-xs text-slate-400 block mb-1">XP Çarpanı</label><input type="number" step="0.1" value={evtXp} onChange={e => setEvtXp(Number(e.target.value))} disabled={!!activeEvent} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm" /></div>
                                        <div><label className="text-xs text-slate-400 block mb-1">Altın Çarpanı</label><input type="number" step="0.1" value={evtGold} onChange={e => setEvtGold(Number(e.target.value))} disabled={!!activeEvent} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm" /></div>
                                        <div><label className="text-xs text-slate-400 block mb-1">Eşya Düşme</label><input type="number" step="0.1" value={evtDrop} onChange={e => setEvtDrop(Number(e.target.value))} disabled={!!activeEvent} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm" /></div>
                                        <div><label className="text-xs text-slate-400 block mb-1">Sefer Süresi</label><input type="number" step="0.1" value={evtTime} onChange={e => setEvtTime(Number(e.target.value))} disabled={!!activeEvent} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm" /></div>
                                        <div><label className="text-xs text-slate-400 block mb-1">Parşömen Şansı</label><input type="number" step="0.05" value={evtScroll} onChange={e => setEvtScroll(Number(e.target.value))} disabled={!!activeEvent} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm" /></div>
                                        <div><label className="text-xs text-slate-400 block mb-1">Parçalama Verimi</label><input type="number" step="0.1" value={evtSalvage} onChange={e => setEvtSalvage(Number(e.target.value))} disabled={!!activeEvent} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm" /></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-800 p-6 rounded border border-slate-700">
                            <h3 className="font-bold text-white mb-4">Genel Duyuru Yap</h3>
                            <button onClick={() => onAddAnnouncement({id: Date.now().toString(), title: 'Sistem Duyurusu', content: 'Bakım çalışması tamamlandı. İyi oyunlar!', timestamp: Date.now(), type: 'general'})} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-sm">Hızlı Duyuru (Örnek)</button>
                        </div>
                    </div>
                )}

                {/* ITEMS TAB */}
                {activeTab === 'items' && currentUserRole === 'admin' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="flex flex-col gap-6">
                             <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
                                 <h3 className="font-bold text-white mb-6 border-b border-slate-600 pb-2">Yeni Eşya Ekle</h3>
                                 <div className="space-y-4">
                                     <input placeholder="Eşya Adı" value={newBaseName} onChange={e => setNewBaseName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"/>
                                     <div className="flex gap-2">
                                         <select value={newBaseType} onChange={e => setNewBaseType(e.target.value as any)} className="bg-slate-900 border border-slate-600 rounded p-2 text-white flex-1"><option value="weapon">Silah</option><option value="armor">Zırh</option><option value="helmet">Kask</option><option value="shield">Kalkan</option><option value="gloves">Eldiven</option><option value="boots">Bot</option><option value="ring">Yüzük</option><option value="necklace">Kolye</option><option value="earring">Küpe</option><option value="belt">Kemer</option></select>
                                         <input type="number" placeholder="Min Lvl" value={newBaseMinLvl} onChange={e => setNewBaseMinLvl(Number(e.target.value))} className="bg-slate-900 border border-slate-600 rounded p-2 text-white w-24"/>
                                     </div>
                                     <div className="flex gap-2 items-center bg-slate-900 p-2 rounded">
                                         <span className="text-xs text-slate-400">Stat:</span>
                                         <select value={newBaseStat} onChange={e => setNewBaseStat(e.target.value as any)} className="bg-slate-800 border border-slate-600 rounded p-1 text-white text-xs"><option value="STR">STR</option><option value="AGI">AGI</option><option value="VIT">VIT</option><option value="INT">INT</option><option value="LUK">LUK</option></select>
                                         <input type="number" placeholder="Değer" value={newBaseVal} onChange={e => setNewBaseVal(Number(e.target.value))} className="bg-slate-800 border border-slate-600 rounded p-1 text-white text-xs w-20"/>
                                     </div>
                                     <button onClick={handleAddBaseItem} className="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-2 rounded">Ekle</button>
                                 </div>
                             </div>
                             <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex-1 overflow-hidden flex flex-col">
                                 <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-white">Eşyalar</h3><select value={itemsFilter} onChange={e => setItemsFilter(e.target.value as any)} className="bg-slate-900 text-xs p-1 rounded border border-slate-600 text-white"><option value="ALL">Tümü</option><option value="weapon">Silahlar</option><option value="armor">Zırhlar</option></select></div>
                                 <div className="overflow-y-auto max-h-[300px] space-y-1">{baseItems.filter(i => itemsFilter === 'ALL' || i.type === itemsFilter).map(item => (<div key={item.id} className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-700"><div><div className="text-sm font-bold text-slate-200">{item.name}</div><div className="text-xs text-slate-500 uppercase">{item.type} | Lvl {item.minLevel}</div></div><button onClick={() => deleteBaseItem(item.id)} className="text-red-500 hover:text-red-400"><Trash2 size={14}/></button></div>))}</div>
                             </div>
                         </div>
                         <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
                            <h3 className="font-bold text-white mb-6 border-b border-slate-600 pb-2">Simülasyon</h3>
                            <div className="space-y-4">
                                <input type="number" placeholder="Hedef Seviye" value={targetLvl} onChange={e => setTargetLvl(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
                                <select value={selBase} onChange={e => setSelBase(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"><option value="">Rastgele Base</option>{baseItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
                                <button onClick={handlePreviewItem} className="w-full bg-blue-600 hover:bg-blue-500 text-white p-2 rounded font-bold">Önizle</button>
                                {previewItem && <div className="mt-4 flex flex-col items-center"><div className="transform scale-110 mb-2"><ItemTooltip item={previewItem} fixed /></div></div>}
                            </div>
                         </div>
                    </div>
                )}

                {/* MODIFIERS TAB */}
                {activeTab === 'modifiers' && currentUserRole === 'admin' && (
                    <div className="h-full flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white">Modifier Yönetimi</h3>
                            <button onClick={() => openModEditor()} className="bg-indigo-600 text-white px-4 py-2 rounded font-bold"><PlusCircle size={16} className="inline mr-1"/> Yeni Ekle</button>
                        </div>
                        {modEditorOpen ? (
                            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                                <div className="flex justify-between mb-4">
                                    <h4 className="font-bold text-white">{editingModId ? 'Düzenle' : 'Yeni'}</h4>
                                    <button onClick={() => setModEditorOpen(false)}><X/></button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <input placeholder="Adı" value={modName} onChange={e => setModName(e.target.value)} className="bg-slate-900 border border-slate-600 rounded p-2 text-white" />
                                    <div className="flex gap-2"><select value={modType} onChange={e => setModType(e.target.value as any)} className="bg-slate-900 border border-slate-600 rounded p-2 text-white flex-1"><option value="prefix">Ön Ek</option><option value="suffix">Son Ek</option></select><input type="number" placeholder="Min Lvl" value={modMinLvl} onChange={e => setModMinLvl(Number(e.target.value))} className="bg-slate-900 border border-slate-600 rounded p-2 text-white w-20" /></div>
                                </div>
                                <div className="mb-4"><h5 className="text-xs font-bold text-slate-400 mb-2">Bonuslar</h5>{modBonuses.map((b, idx) => (<div key={idx} className="flex justify-between bg-slate-900 p-2 rounded mb-1"><span className="text-sm text-slate-200">{b.stat} +{b.value}</span><button onClick={() => removeBonusFromMod(idx)} className="text-red-500"><X size={14}/></button></div>))}<div className="flex gap-2 mt-2"><select value={tempStat} onChange={e => setTempStat(e.target.value)} className="bg-slate-900 border border-slate-600 rounded p-1 text-white flex-1"><option value="STR">STR</option><option value="AGI">AGI</option><option value="VIT">VIT</option><option value="INT">INT</option><option value="LUK">LUK</option></select><input type="number" value={tempVal} onChange={e => setTempVal(Number(e.target.value))} className="bg-slate-900 border border-slate-600 rounded p-1 text-white w-20" /><button onClick={addBonusToMod} className="bg-green-600 text-white px-2 rounded"><PlusCircle size={16}/></button></div></div>
                                <button onClick={saveModifier} className="w-full bg-blue-600 text-white py-2 rounded">Kaydet</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-4 overflow-y-auto">{modifiers.map(m => (<div key={m.id} className="bg-slate-800 p-3 rounded border border-slate-700 relative group"><div className="absolute top-2 right-2 hidden group-hover:flex gap-1"><button onClick={() => openModEditor(m)} className="p-1 bg-blue-900 text-blue-400 rounded"><Edit size={14}/></button><button onClick={() => deleteModifier(m.id)} className="p-1 bg-red-900 text-red-400 rounded"><Trash2 size={14}/></button></div><div className="font-bold text-white">{m.name}</div><div className="text-xs text-slate-500">{m.type}</div></div>))}</div>
                        )}
                    </div>
                )}

                {/* WORLD TAB */}
                {activeTab === 'world' && currentUserRole === 'admin' && (
                     <div className="grid grid-cols-2 gap-8 h-full">
                         <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col">
                             <h3 className="font-bold text-white mb-2">Bölgeler</h3>
                             <div className="flex-1 overflow-y-auto space-y-2 mb-4">{regions.map(r => (<div key={r.id} className="p-3 bg-slate-900 rounded border border-slate-700"><div className="font-bold text-white">{r.name}</div><div className="text-xs text-slate-500">Min Lvl {r.minLevel}</div></div>))}</div>
                             <div className="border-t border-slate-700 pt-2 space-y-2"><input placeholder="Bölge Adı" value={newRegionName} onChange={e => setNewRegionName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"/><input type="number" placeholder="Min Lvl" value={newRegionLevel} onChange={e => setNewRegionLevel(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"/><button onClick={handleAddRegion} className="w-full bg-green-600 text-white py-2 rounded">Ekle</button></div>
                         </div>
                         <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col">
                             <h3 className="font-bold text-white mb-2">Lokasyonlar</h3>
                             <div className="flex-1 overflow-y-auto space-y-2 mb-4">{locations.map(l => (<div key={l.id} className="p-3 bg-slate-900 rounded border border-slate-700 flex justify-between"><div><div className="font-bold text-white">{l.name}</div><div className="text-xs text-slate-500">{l.risk} Risk</div></div><button onClick={() => onDeleteLocation(l.id)} className="text-red-500"><Trash2 size={14}/></button></div>))}</div>
                             <div className="border-t border-slate-700 pt-2 space-y-2"><select value={newLocRegion} onChange={e => setNewLocRegion(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"><option value="">Bölge Seç</option>{regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select><input placeholder="Ad" value={newLocName} onChange={e => setNewLocName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"/><div className="flex gap-2"><input placeholder="Süre" type="number" value={newLocDuration} onChange={e => setNewLocDuration(Number(e.target.value))} className="bg-slate-900 border border-slate-600 rounded p-2 text-white w-20"/><input placeholder="Lvl" type="number" value={newLocLevel} onChange={e => setNewLocLevel(Number(e.target.value))} className="bg-slate-900 border border-slate-600 rounded p-2 text-white w-20"/></div><button onClick={handleAddLoc} className="w-full bg-green-600 text-white py-2 rounded">Ekle</button></div>
                         </div>
                     </div>
                )}

                {/* MARKET TAB */}
                {activeTab === 'market' && currentUserRole === 'admin' && (
                    <div className="grid grid-cols-2 gap-8">
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                            <h3 className="font-bold text-white mb-4">Yeni Ürün Ekle</h3>
                            <div className="space-y-4"><input placeholder="Ürün Adı" value={newMarketName} onChange={e => setNewMarketName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"/><input placeholder="Açıklama" value={newMarketDesc} onChange={e => setNewMarketDesc(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"/><div className="flex gap-2"><input type="number" placeholder="Fiyat" value={newMarketPrice} onChange={e => setNewMarketPrice(Number(e.target.value))} className="bg-slate-900 border border-slate-600 rounded p-2 text-white"/><input placeholder="İkon" value={newMarketIcon} onChange={e => setNewMarketIcon(e.target.value)} className="bg-slate-900 border border-slate-600 rounded p-2 text-white w-16"/></div><button onClick={handleAddMarketItem} className="w-full bg-green-600 text-white py-2 rounded">Ekle</button></div>
                        </div>
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 max-h-[500px] overflow-y-auto">
                            <h3 className="font-bold text-white mb-4">Mevcut Ürünler</h3>
                            <div className="space-y-2">{marketItems.map(m => (<div key={m.id} className="flex justify-between items-center bg-slate-900 p-3 rounded border border-slate-700"><span>{m.icon} {m.name} ({m.price})</span><button onClick={() => handleDeleteMarketItem(m.id)} className="text-red-500"><Trash2 size={16}/></button></div>))}</div>
                        </div>
                    </div>
                )}

                {/* CONFIG TAB */}
                {activeTab === 'config' && currentUserRole === 'admin' && (
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <h3 className="font-bold text-white mb-6 border-b border-slate-600 pb-2">Başlangıç Ayarları</h3>
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div><label className="text-xs text-slate-400">Başlangıç Altını</label><input type="number" value={globalConfig.startingGold} onChange={e => setGlobalConfig({...globalConfig, startingGold: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" /></div>
                            <div><label className="text-xs text-slate-400">Başlangıç Seviyesi</label><input type="number" value={globalConfig.startingLevel} onChange={e => setGlobalConfig({...globalConfig, startingLevel: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" /></div>
                        </div>
                        <button onClick={() => alert("Ayarlar Kaydedildi")} className="w-full bg-blue-600 text-white py-2 rounded">Kaydet</button>
                    </div>
                )}

                {/* MOBS TAB (Updated with Support Button) */}
                {activeTab === 'mobs' && currentUserRole === 'admin' && (
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 relative">
                        {/* HEADER WITH SUPPORT BUTTON */}
                        <div className="flex justify-between items-center mb-6 border-b border-slate-600 pb-2">
                            <h3 className="font-bold text-white flex items-center gap-2"><Skull size={20}/> Yaratık Editörü (Basit)</h3>
                            <button 
                                onClick={() => setIsMobSupportOpen(true)}
                                className="flex items-center gap-2 bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-500 border border-yellow-700/50 px-3 py-1.5 rounded text-xs transition-colors"
                            >
                                <AlertTriangle size={14} /> Hata/İstek Bildir
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div><label className="text-xs text-slate-400 block mb-1">Yaratık Adı</label><input placeholder="Ör: Kara Ejderha" value={mobName} onChange={e => setMobName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" /></div>
                                <div><label className="text-xs text-slate-400 block mb-1">Seviye</label><input type="number" value={mobLvl} onChange={e => setMobLvl(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" /></div>
                                <div><label className="text-xs text-slate-400 block mb-1">Açıklama</label><textarea value={mobDesc} onChange={e => setMobDesc(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white resize-none h-24" /></div>
                                <button onClick={handleAddMob} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded">Şablon Olarak Ekle (Simülasyon)</button>
                            </div>
                            <div className="bg-slate-900 p-4 rounded border border-slate-700 flex flex-col items-center justify-center text-slate-500 text-sm"><Skull size={48} className="mb-2 opacity-50"/><p className="text-center">Şu an için dinamik yaratık sistemi kullanılıyor.<br/>Burada oluşturulan şablonlar ileride Boss savaşları için kullanılacak.</p></div>
                        </div>

                        {/* Internal Mob Support Modal */}
                        {isMobSupportOpen && (
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 rounded-xl">
                                <div className="bg-stone-900 border border-stone-600 rounded-lg p-6 w-full max-w-md shadow-2xl relative">
                                    <button onClick={() => setIsMobSupportOpen(false)} className="absolute top-3 right-3 text-stone-400 hover:text-white"><X size={18}/></button>
                                    <h4 className="text-lg font-bold text-amber-500 mb-4 flex items-center gap-2"><MessageSquare size={18}/> Destek Bildirimi</h4>
                                    <p className="text-xs text-stone-400 mb-4">Yaratık editörü ile ilgili yaşadığınız sorunları veya önerilerinizi geliştirici ekibine iletin.</p>
                                    <textarea 
                                        value={mobSupportMsg}
                                        onChange={e => setMobSupportMsg(e.target.value)}
                                        className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-stone-200 h-32 resize-none focus:border-amber-600 outline-none mb-4 text-sm"
                                        placeholder="Sorun veya önerinizi yazın..."
                                    />
                                    <button onClick={submitInternalSupport} className="w-full bg-indigo-700 hover:bg-indigo-600 text-white font-bold py-2 rounded flex items-center justify-center gap-2">
                                        <Send size={16}/> Gönder
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
