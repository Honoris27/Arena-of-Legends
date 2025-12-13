import React, { useState, useEffect, useRef } from 'react';
import { Player, StatType, GameLog, ExpeditionDuration, Item, Equipment, ExpeditionLocation, MarketItem } from './types';
import { calculateMaxHp, calculateMaxXp, calculateMaxMp, generateRandomItem, generateEnemy, calculateDamage, upgradeItem, calculateSellPrice } from './services/gameLogic';
import { generateExpeditionStory } from './services/geminiService';
import { supabase, savePlayerProfile, loadPlayerProfile } from './services/supabase';
import CharacterProfile from './components/CharacterProfile';
import Expedition from './components/Expedition';
import Arena from './components/Arena';
import Inventory from './components/Inventory';
import AdminPanel from './components/AdminPanel';
import LoginScreen from './components/LoginScreen';
import Blacksmith from './components/Blacksmith';
import Leaderboard from './components/Leaderboard';
import Market from './components/Market';
import Guide from './components/Guide';
import { User, Map, Swords, Backpack, Coins, ScrollText, Settings, Hammer, Trophy, ShoppingBag, HelpCircle, LogOut } from 'lucide-react';

// DEFAULT LOCATIONS
const INITIAL_LOCATIONS: ExpeditionLocation[] = [
  { id: 'l1', name: "Karanlık Orman", duration: ExpeditionDuration.SHORT, desc: "Kısa bir keşif gezisi.", risk: "Düşük", reward: "Az" },
  { id: 'l2', name: "Lanetli Harabeler", duration: ExpeditionDuration.MEDIUM, desc: "Tehlikeli antik kalıntılar.", risk: "Orta", reward: "Orta" },
  { id: 'l3', name: "Buzlu Vadi", duration: ExpeditionDuration.MEDIUM, desc: "Dondurucu soğuklar.", risk: "Orta", reward: "Orta" },
  { id: 'l4', name: "Volkanik Zirve", duration: ExpeditionDuration.LONG, desc: "Ateş elementalleri diyarı.", risk: "Yüksek", reward: "Yüksek" },
  { id: 'l5', name: "Ölüler Şehri", duration: ExpeditionDuration.EPIC, desc: "Sadece efsaneler dönebilir.", risk: "Ölümcül", reward: "Efsanevi" },
];

const DEFAULT_PLAYER: Player = {
  id: '',
  name: "Bilinmeyen",
  level: 1,
  currentXp: 0,
  maxXp: 100,
  gold: 50,
  stats: { STR: 10, AGI: 5, VIT: 10, INT: 5, LUK: 5 },
  statPoints: 5,
  hp: 120, maxHp: 120, mp: 50, maxMp: 50,
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Spartacus",
  equipment: { weapon: null, helmet: null, armor: null, gloves: null, boots: null },
  inventory: []
};

type View = 'character' | 'expedition' | 'arena' | 'inventory' | 'blacksmith' | 'leaderboard' | 'market';

function App() {
  const [session, setSession] = useState<any>(null);
  const [player, setPlayer] = useState<Player>(DEFAULT_PLAYER);
  const [wins, setWins] = useState(0); // Track wins for leaderboard sync
  const [currentView, setCurrentView] = useState<View>('character');
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [locations, setLocations] = useState<ExpeditionLocation[]>(INITIAL_LOCATIONS);
  
  // Use a ref to debounce saves
  const saveTimeout = useRef<any>(null);

  // AUTH & INIT
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) initPlayer(session.user);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) initPlayer(session.user);
      else {
          setPlayer(DEFAULT_PLAYER);
          setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const initPlayer = async (user: any) => {
      setLoading(true);
      const profile = await loadPlayerProfile(user.id);
      
      if (profile) {
          setPlayer(profile);
          addLog(`Hoş geldin, ${profile.name}!`, 'system');
      } else {
          // If no profile (first login after register), initialize
          const meta = user.user_metadata;
          const newPlayer = {
              ...DEFAULT_PLAYER,
              id: user.id,
              name: meta.full_name || 'Gladyatör',
              avatarUrl: meta.avatar_url || DEFAULT_PLAYER.avatarUrl
          };
          setPlayer(newPlayer);
          await savePlayerProfile(newPlayer, 0);
          addLog("Yeni profil oluşturuldu.", 'system');
      }
      setLoading(false);
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
  };

  // AUTO SAVE LOGIC
  useEffect(() => {
      if (!session || loading) return;

      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      
      saveTimeout.current = setTimeout(() => {
          savePlayerProfile(player, wins);
      }, 2000); // Save 2 seconds after last state change

      return () => clearTimeout(saveTimeout.current);
  }, [player, wins, session, loading]);

  // Game Logic Handlers
  const addLog = (message: string, type: GameLog['type']) => {
    const newLog: GameLog = {
      id: Date.now().toString() + Math.random(),
      timestamp: Date.now(),
      message,
      type
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const handleStatUpgrade = (stat: StatType) => {
    if (player.statPoints <= 0) return;
    setPlayer(prev => {
      const newStats = { ...prev.stats, [stat]: prev.stats[stat] + 1 };
      const newMaxHp = calculateMaxHp(newStats.VIT, prev.level);
      const newMaxMp = calculateMaxMp(newStats.INT, prev.level);
      return {
        ...prev,
        stats: newStats,
        statPoints: prev.statPoints - 1,
        maxHp: newMaxHp,
        maxMp: newMaxMp
      };
    });
  };

  const handleExpeditionComplete = async (duration: ExpeditionDuration, locationName: string, isBoss: boolean = false) => {
    let xpGain = 0;
    let goldGain = 0;
    let storyOutcome: 'success' | 'failure' = 'success';
    let droppedItem: Item | null = null;
    let rewardMsg = "";
    let winCount = 0;

    if (isBoss) {
        const winChance = 0.5 + (player.level * 0.05);
        const win = Math.random() < winChance;

        if (win) {
            xpGain = 500;
            goldGain = 1000;
            droppedItem = generateRandomItem(player.level + 5, 'epic');
            rewardMsg = `MAĞARA EJDERHASINI YENDİN! ${xpGain} EXP, ${goldGain} Altın`;
            winCount = 10; // Boss worth more ranking
        } else {
            storyOutcome = 'failure';
            setPlayer(prev => ({ ...prev, hp: 1 }));
            rewardMsg = "Ejderha seni ağır yaraladı. Kaçtın.";
        }
    } else {
        xpGain = duration * 10 + Math.floor(Math.random() * 10);
        goldGain = duration * 5 + Math.floor(Math.random() * 15);
        if (Math.random() < 0.20) {
            droppedItem = generateRandomItem(player.level);
        }
        rewardMsg = `${xpGain} EXP, ${goldGain} Altın` + (droppedItem ? `, [${droppedItem.name}]` : '');
    }

    setPlayer(prev => ({
        ...prev,
        currentXp: prev.currentXp + xpGain,
        gold: prev.gold + goldGain,
        inventory: droppedItem ? [...prev.inventory, droppedItem] : prev.inventory
    }));
    setWins(w => w + winCount);

    if (!isBoss) {
        const story = await generateExpeditionStory(locationName, storyOutcome, rewardMsg);
        addLog(story, 'expedition');
    } else {
        addLog(rewardMsg, storyOutcome === 'success' ? 'loot' : 'combat');
    }

    if (droppedItem) addLog(`${droppedItem.name} buldun!`, 'loot');
  };

  const handleArenaWin = (gold: number, xp: number) => {
    let droppedItem: Item | null = null;
    if (Math.random() > 0.8) {
        droppedItem = generateRandomItem(player.level);
    }

    setPlayer(prev => ({
        ...prev,
        gold: prev.gold + gold,
        currentXp: prev.currentXp + xp,
        inventory: droppedItem ? [...prev.inventory, droppedItem] : prev.inventory
    }));
    setWins(w => w + 1);
    addLog(`Arena zaferi! ${gold} altın ve ${xp} EXP kazandın.`, 'combat');
    if (droppedItem) addLog(`Rakibinin üzerinden [${droppedItem.name}] düştü!`, 'loot');
  };

  const handleArenaLoss = () => {
    setPlayer(prev => ({ ...prev, hp: 1 })); 
    addLog(`Arenada yenildin. Yaralarını sarman gerek.`, 'combat');
  };

  const handleEquipItem = (item: Item) => {
      if (item.type === 'material' || item.type === 'consumable') return;
      setPlayer(prev => {
          const slot = item.type as keyof Equipment;
          const currentEquipped = prev.equipment[slot];
          const newInventory = prev.inventory.filter(i => i.id !== item.id);
          if (currentEquipped) newInventory.push(currentEquipped);

          addLog(`${item.name} kuşandın.`, 'system');
          return {
              ...prev,
              equipment: { ...prev.equipment, [slot]: item },
              inventory: newInventory
          };
      });
  };

  const handleUnequipItem = (slot: keyof Equipment) => {
      setPlayer(prev => {
          const item = prev.equipment[slot];
          if (!item) return prev;
          addLog(`${item.name} çıkardın.`, 'system');
          return {
              ...prev,
              equipment: { ...prev.equipment, [slot]: null },
              inventory: [...prev.inventory, item]
          };
      });
  };

  const handleDeleteItem = (item: Item) => {
      if(confirm(`${item.name} eşyasını silmek istediğine emin misin?`)) {
          setPlayer(prev => ({
              ...prev,
              inventory: prev.inventory.filter(i => i.id !== item.id)
          }));
      }
  };

  const handleSellItem = (item: Item) => {
      const sellPrice = calculateSellPrice(item);
      if(confirm(`${item.name} eşyasını ${sellPrice} altına satmak istiyor musun?`)) {
           setPlayer(prev => ({
              ...prev,
              gold: prev.gold + sellPrice,
              inventory: prev.inventory.filter(i => i.id !== item.id)
           }));
           addLog(`${item.name} satıldı. +${sellPrice} Altın`, 'market');
      }
  };

  const handleUseItem = (item: Item) => {
      if(item.type !== 'consumable') return;

      setPlayer(prev => {
          let newHp = prev.hp;
          let newInventory = prev.inventory.filter(i => i.id !== item.id); // Consumed
          let logMsg = "";

          // Potion Logic
          if (item.name.includes("Can İksiri")) {
              newHp = prev.maxHp;
              logMsg = "Can iksiri içildi. Sağlık yenilendi.";
          } 
          // Box Logic
          else if (item.name.includes("Sandık")) {
              const rarity = item.name.includes("Usta") ? 'rare' : 'common';
              const loot = generateRandomItem(prev.level, rarity === 'rare' ? 'rare' : undefined);
              newInventory.push(loot);
              logMsg = `Sandık açıldı! İçinden ${loot.name} çıktı.`;
          } else {
              logMsg = "Eşya kullanıldı.";
          }

          addLog(logMsg, 'system');
          return { ...prev, hp: newHp, inventory: newInventory };
      });
  };

  const handleUpgradeItem = (item: Item, cost: number, useLuck: boolean) => {
      if (!item) return; 
      if (player.gold < cost) return;

      let updatedInventory = [...player.inventory];
      if (useLuck) {
          const luckItemIdx = updatedInventory.findIndex(i => i.name === 'Şans Tozu');
          if (luckItemIdx === -1) {
              alert("Şans Tozu bulunamadı!");
              return;
          }
          updatedInventory.splice(luckItemIdx, 1);
      }

      const baseChance = Math.max(10, 100 - (item.upgradeLevel * 10));
      const finalChance = Math.min(100, baseChance + (useLuck ? 20 : 0));
      const roll = Math.random() * 100;
      const success = roll < finalChance;

      if (success) {
        const upgradedItem = upgradeItem(item);
        setPlayer(prev => ({
            ...prev,
            gold: prev.gold - cost,
            inventory: updatedInventory.map(i => i.id === item.id ? upgradedItem : i)
        }));
        addLog(`BAŞARILI! ${item.name} +${upgradedItem.upgradeLevel} oldu!`, 'upgrade');
      } else {
          setPlayer(prev => ({
            ...prev,
            gold: prev.gold - cost,
            inventory: updatedInventory
        }));
        addLog(`BAŞARISIZ! ${item.name} geliştirilemedi. (Altın harcandı)`, 'upgrade');
      }
  };

  const handleMarketBuy = (marketItem: MarketItem) => {
      if (player.gold < marketItem.price) return;

      setPlayer(prev => {
          let newInventory = [...prev.inventory];
          let hp = prev.hp;
          let gold = prev.gold - marketItem.price;

          if (marketItem.type === 'material') {
              newInventory.push({
                  id: Date.now().toString(),
                  name: marketItem.name,
                  type: 'material',
                  rarity: 'common',
                  stats: {},
                  value: Math.floor(marketItem.price / 2),
                  description: marketItem.description,
                  upgradeLevel: 0
              });
          } else if (marketItem.type === 'consumable') {
              newInventory.push({
                  id: Date.now().toString(),
                  name: marketItem.name,
                  type: 'consumable',
                  rarity: 'common',
                  stats: {},
                  value: Math.floor(marketItem.price / 2),
                  description: marketItem.description,
                  upgradeLevel: 0
              });
          }

          addLog(`${marketItem.name} satın alındı.`, 'market');
          return { ...prev, gold, hp, inventory: newInventory };
      });
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-yellow-500 font-cinzel text-xl animate-pulse">Arena Yükleniyor...</div>;
  if (!session) return <LoginScreen onLoginSuccess={() => {}} />;
  if (player.isBanned) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-red-500 font-bold text-3xl">BU HESAP YASAKLANDI.</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 pb-20 md:pb-0 font-sans selection:bg-yellow-500/30">
      <AdminPanel 
        isOpen={showAdmin} 
        onClose={() => setShowAdmin(false)}
        users={[player]} // Simplified for demo as we don't fetch all users for admin yet in this version
        onBanUser={() => {}}
        onDeleteUser={() => {}}
        onEditUser={() => {}}
        onAddItemToPlayer={(id, item) => setPlayer(p => ({...p, inventory: [...p.inventory, item]}))}
        locations={locations}
        onAddLocation={(loc) => setLocations(p => [...p, loc])}
        onDeleteLocation={(id) => setLocations(p => p.filter(l => l.id !== id))}
        currentPlayerId={player.id}
        onAddGold={() => setPlayer(p => ({ ...p, gold: p.gold + 1000 }))}
        onLevelUp={() => setPlayer(p => ({ ...p, currentXp: p.maxXp }))}
        onHeal={() => setPlayer(p => ({ ...p, hp: p.maxHp, mp: p.maxMp }))}
      />

      <Guide isOpen={showGuide} onClose={() => setShowGuide(false)} />

      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700 h-16 flex items-center justify-between px-4 md:px-8 shadow-lg">
        <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold cinzel bg-gradient-to-r from-yellow-500 to-amber-700 bg-clip-text text-transparent">
                Arena of Legends
            </h1>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6">
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                <Coins size={16} className="text-yellow-500" />
                <span className="font-mono font-bold text-yellow-100">{player.gold}</span>
            </div>
            <button onClick={() => setShowGuide(true)} className="text-slate-400 hover:text-white"><HelpCircle size={24}/></button>
            <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-xs text-slate-400">Gladyatör</span>
                <span className="font-bold text-sm">{player.name}</span>
            </div>
             <button onClick={handleLogout} className="text-red-400 hover:text-red-300" title="Çıkış Yap">
                <LogOut size={20} />
            </button>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto h-[calc(100vh-64px)] overflow-hidden">
        
        {/* Desktop Sidebar */}
        <nav className="hidden md:flex w-64 flex-col border-r border-slate-700 bg-slate-800/50 p-4 gap-2">
            {[
                { id: 'character', icon: User, label: 'Karakter' },
                { id: 'expedition', icon: Map, label: 'Sefer' },
                { id: 'arena', icon: Swords, label: 'Arena' },
                { id: 'market', icon: ShoppingBag, label: 'Pazar' },
                { id: 'blacksmith', icon: Hammer, label: 'Demirci' },
                { id: 'leaderboard', icon: Trophy, label: 'Sıralama' },
                { id: 'inventory', icon: Backpack, label: 'Çanta', badge: player.inventory.length }
            ].map(item => (
                <button 
                    key={item.id}
                    onClick={() => setCurrentView(item.id as View)}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${currentView === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-400'}`}
                >
                    <item.icon size={20} /> {item.label}
                    {item.badge && item.badge > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{item.badge}</span>
                    )}
                </button>
            ))}
            
            <div className="mt-4 pt-4 border-t border-slate-700">
                 <button onClick={() => setShowAdmin(true)} className="flex items-center gap-3 p-3 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 w-full">
                    <Settings size={20} /> Yönetici
                </button>
            </div>

            <div className="mt-auto border-t border-slate-700 pt-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                    <ScrollText size={12} /> Son Olaylar
                </h3>
                <div className="text-xs space-y-2 h-40 overflow-y-auto pr-2 custom-scrollbar opacity-70">
                    {logs.map(log => (
                        <div key={log.id} className="mb-2">
                            <span className={`font-bold block mb-0.5 ${
                                log.type === 'combat' ? 'text-red-400' :
                                log.type === 'expedition' ? 'text-green-400' : 
                                log.type === 'loot' ? 'text-yellow-400' : 
                                log.type === 'market' ? 'text-purple-400' :
                                log.type === 'upgrade' ? 'text-orange-400' : 'text-blue-400'
                            }`}>
                                {log.type === 'combat' ? '⚔️' : log.type === 'expedition' ? '🌲' : log.type === 'loot' ? '🎁' : log.type === 'market' ? '🛒' : log.type === 'upgrade' ? '⚒️' : 'ℹ️'} {log.type.toUpperCase()}
                            </span>
                            <span className="text-slate-300 leading-tight">{log.message}</span>
                        </div>
                    ))}
                </div>
            </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
            {currentView === 'character' && <CharacterProfile player={player} onUpgradeStat={handleStatUpgrade} onUnequip={handleUnequipItem} />}
            {currentView === 'expedition' && <Expedition locations={locations} onComplete={handleExpeditionComplete} isBusy={isBusy} />}
            {currentView === 'arena' && <Arena player={player} onWin={handleArenaWin} onLoss={handleArenaLoss} isBusy={isBusy} setBusy={setIsBusy} />}
            {currentView === 'market' && <Market playerGold={player.gold} onBuy={handleMarketBuy} />}
            {currentView === 'inventory' && (
                <Inventory 
                    items={player.inventory} 
                    onEquip={handleEquipItem} 
                    onDelete={handleDeleteItem} 
                    onSell={handleSellItem}
                    onUse={handleUseItem}
                />
            )}
            {currentView === 'blacksmith' && <Blacksmith inventory={player.inventory} playerGold={player.gold} onUpgrade={handleUpgradeItem} />}
            {currentView === 'leaderboard' && <Leaderboard />}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 flex justify-around p-3 z-50 overflow-x-auto">
         {[User, Map, Swords, ShoppingBag, Hammer, Backpack].map((Icon, idx) => {
             const views: View[] = ['character', 'expedition', 'arena', 'market', 'blacksmith', 'inventory'];
             return (
                <button key={idx} onClick={() => setCurrentView(views[idx])} className={`flex flex-col items-center gap-1 text-xs min-w-[50px] ${currentView === views[idx] ? 'text-indigo-400' : 'text-slate-500'}`}>
                    <Icon size={20} />
                </button>
             );
         })}
      </nav>
    </div>
  );
}

export default App;