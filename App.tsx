
import React, { useState, useEffect, useRef } from 'react';
import { Player, StatType, ExpeditionDuration, Item, Equipment, ExpeditionLocation, MarketItem, Region, Announcement, Role, EnemyTemplate, CombatReport } from './types';
import { calculateMaxHp, calculateMaxXp, calculateMaxMp, generateRandomItem, calculateSellPrice, upgradeItem, getExpeditionConfig, canEquipItem } from './services/gameLogic';
import { generateExpeditionStory } from './services/geminiService';
import { supabase, savePlayerProfile, loadPlayerProfile } from './services/supabase';
import CharacterProfile from './components/CharacterProfile';
import Expedition from './components/Expedition';
import Arena from './components/Arena';
// Inventory merged into CharacterProfile, so removing separate import if not used elsewhere, but keeping import clean
import AdminPanel from './components/AdminPanel';
import LoginScreen from './components/LoginScreen';
import Blacksmith from './components/Blacksmith';
import Leaderboard from './components/Leaderboard';
import Market from './components/Market';
import Guide from './components/Guide';
import Mailbox from './components/Mailbox';
import { User, Map, Swords, Backpack, Coins, ScrollText, Settings, Hammer, Trophy, ShoppingBag, HelpCircle, LogOut, Crown, Mail } from 'lucide-react';

// INITIAL DATA
const INITIAL_REGIONS: Region[] = [
    { id: 'r1', name: "Karanlık Orman", minLevel: 1, description: "Acemi gladyatörlerin ilk durağı." },
    { id: 'r2', name: "Lanetli Harabeler", minLevel: 5, description: "Eski bir krallığın kalıntıları." },
    { id: 'r3', name: "Volkanik Zirve", minLevel: 10, description: "Ateş elementalleri ile dolu." }
];

const INITIAL_LOCATIONS: ExpeditionLocation[] = [
    { id: 'l1', regionId: 'r1', name: "Orman Girişi", minLevel: 1, duration: 1, risk: "Düşük", rewardRate: 1, desc: "Basit yaratıklar." },
    { id: 'l2', regionId: 'r1', name: "Kurt İni", minLevel: 2, duration: 2, risk: "Düşük", rewardRate: 1.2, desc: "Kurt sürüleri." },
    { id: 'l3', regionId: 'r2', name: "Yıkık Tapınak", minLevel: 5, duration: 3, risk: "Orta", rewardRate: 2, desc: "Tuzaklara dikkat et." }
];

const DEFAULT_PLAYER: Player = {
  id: '',
  name: "Bilinmeyen",
  role: 'player',
  level: 1,
  currentXp: 0,
  maxXp: 100,
  gold: 50,
  stats: { STR: 10, AGI: 5, VIT: 10, INT: 5, LUK: 5 },
  statPoints: 5,
  hp: 120, maxHp: 120, mp: 50, maxMp: 50,
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Spartacus",
  equipment: { weapon: null, shield: null, helmet: null, armor: null, gloves: null, boots: null, necklace: null, ring: null, earring: null, belt: null },
  inventory: [],
  expeditionPoints: 15,
  maxExpeditionPoints: 15,
  nextPointRegenTime: Date.now() + (15 * 60 * 1000), 
  nextExpeditionTime: 0,
  premiumUntil: 0,
  messages: [],
  reports: []
};

type View = 'character' | 'expedition' | 'arena' | 'inventory' | 'blacksmith' | 'leaderboard' | 'market';

function App() {
  const [session, setSession] = useState<any>(null);
  const [player, setPlayer] = useState<Player>(DEFAULT_PLAYER);
  const [wins, setWins] = useState(0); 
  const [currentView, setCurrentView] = useState<View>('character');
  const [isBusy, setIsBusy] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showMailbox, setShowMailbox] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [regions, setRegions] = useState<Region[]>(INITIAL_REGIONS);
  const [locations, setLocations] = useState<ExpeditionLocation[]>(INITIAL_LOCATIONS);
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    { id: 'a1', title: "Arena of Legends Başladı!", content: "Tüm gladyatörlere başarılar. Arena kapıları açıldı.", timestamp: Date.now(), type: 'general' }
  ]);
  const [enemyTemplates, setEnemyTemplates] = useState<EnemyTemplate[]>([]);
  
  const saveTimeout = useRef<any>(null);

  // AUTH & INIT
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) initPlayer(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
          // Merge allowing for new fields like role and new equipment slots
          setPlayer(prev => ({
              ...DEFAULT_PLAYER,
              ...profile,
              // Ensure critical fields exist and merge equipment for new slots
              equipment: { ...DEFAULT_PLAYER.equipment, ...profile.equipment },
              expeditionPoints: profile.expeditionPoints ?? 15,
              maxExpeditionPoints: profile.maxExpeditionPoints ?? 15,
              nextPointRegenTime: profile.nextPointRegenTime ?? (Date.now() + 15*60*1000),
              nextExpeditionTime: profile.nextExpeditionTime ?? 0,
              premiumUntil: profile.premiumUntil ?? 0,
              messages: profile.messages || [],
              reports: profile.reports || [],
              role: profile.role || 'player'
          }));
      } else {
          const meta = user.user_metadata;
          const newPlayer: Player = {
              ...DEFAULT_PLAYER,
              id: user.id,
              name: meta.full_name || 'Gladyatör',
              avatarUrl: meta.avatar_url || DEFAULT_PLAYER.avatarUrl,
              messages: [{
                  id: 'welcome',
                  sender: 'Sistem',
                  subject: 'Hoş Geldin!',
                  content: 'Arena of Legends\'a hoş geldin gladyatör. Efsaneni yazmaya başla.',
                  timestamp: Date.now(),
                  read: false
              }],
              role: 'player'
          };
          setPlayer(newPlayer);
          await savePlayerProfile(newPlayer, 0);
      }
      setLoading(false);
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
  };

  // REGEN LOOP
  useEffect(() => {
    if (!session || loading) return;

    const interval = setInterval(() => {
        setPlayer(prev => {
            const now = Date.now();
            const config = getExpeditionConfig(prev);
            
            if (prev.maxExpeditionPoints !== config.maxPoints) {
                 return { ...prev, maxExpeditionPoints: config.maxPoints };
            }

            if (prev.expeditionPoints < prev.maxExpeditionPoints) {
                if (now >= prev.nextPointRegenTime) {
                    const newPoints = prev.expeditionPoints + 1;
                    const nextRegen = now + (config.regenSeconds * 1000);
                    return {
                        ...prev,
                        expeditionPoints: newPoints,
                        nextPointRegenTime: nextRegen
                    };
                }
            }
            return prev;
        });
    }, 1000);

    return () => clearInterval(interval);
  }, [session, loading]);

  // AUTO SAVE
  useEffect(() => {
      if (!session || loading) return;
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
          savePlayerProfile(player, wins);
      }, 2000); 
      return () => clearTimeout(saveTimeout.current);
  }, [player, wins, session, loading]);


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

  // Level Up Helper
  const checkLevelUp = (p: Player): Player => {
      if (p.currentXp >= p.maxXp) {
          const newLevel = p.level + 1;
          const newMaxXp = calculateMaxXp(newLevel);
          const newMaxHp = calculateMaxHp(p.stats.VIT, newLevel);
          const newMaxMp = calculateMaxMp(p.stats.INT, newLevel);
          
          alert("TEBRİKLER! Seviye Atladın! Sefer Puanların yenilendi.");

          return {
              ...p,
              level: newLevel,
              currentXp: p.currentXp - p.maxXp,
              maxXp: newMaxXp,
              maxHp: newMaxHp,
              maxMp: newMaxMp,
              hp: newMaxHp, // Heal on level up
              mp: newMaxMp,
              statPoints: p.statPoints + 5,
              expeditionPoints: p.maxExpeditionPoints // REFILL POINTS
          };
      }
      return p;
  };

  // HP Check
  const checkHealth = (): boolean => {
      if (player.hp < player.maxHp * 0.25) {
          alert("Canın çok az! (%25'in altında). Savaşamazsın.");
          return false;
      }
      return true;
  }

  const handleExpeditionComplete = async (rewardMultiplier: number, locationName: string, isBoss: boolean = false) => {
    if (!checkHealth()) return;

    let xpGain = 0;
    let goldGain = 0;
    let storyOutcome: 'success' | 'failure' = 'success';
    let droppedItem: Item | null = null;
    let rewardMsg = "";
    
    const config = getExpeditionConfig(player);

    if (isBoss) {
        const winChance = 0.5 + (player.level * 0.05);
        if (Math.random() < winChance) {
            xpGain = 1000 * rewardMultiplier;
            goldGain = 2000 * rewardMultiplier;
            droppedItem = generateRandomItem(player.level + 5, 'epic');
            rewardMsg = `EJDERHA YENİLDİ! ${xpGain} XP, ${goldGain} Altın`;
        } else {
            storyOutcome = 'failure';
            rewardMsg = "Ejderha seni yendi.";
        }
    } else {
        xpGain = Math.floor((10 + Math.random() * 10) * rewardMultiplier);
        goldGain = Math.floor((5 + Math.random() * 10) * rewardMultiplier);
        
        if (Math.random() < 0.20) droppedItem = generateRandomItem(player.level);
        rewardMsg = `${xpGain} EXP, ${goldGain} Altın` + (droppedItem ? `, [${droppedItem.name}]` : '');
    }

    // Generate Story
    let reportLog = [`Konum: ${locationName}`];
    if (!isBoss) {
        const story = await generateExpeditionStory(locationName, storyOutcome, rewardMsg);
        reportLog.push(story);
    } else {
        reportLog.push(rewardMsg);
    }

    setPlayer(prev => {
        const newPoints = prev.expeditionPoints - 1;
        const newRegenTime = prev.expeditionPoints === prev.maxExpeditionPoints 
            ? Date.now() + (config.regenSeconds * 1000) 
            : prev.nextPointRegenTime;
        const cooldownEnd = Date.now() + (config.cooldownSeconds * 1000);

        // Deduct HP logic
        let newHp = prev.hp;
        if (storyOutcome === 'success') {
            // Success takes some toll (5-15% damage)
            const dmg = Math.floor(prev.maxHp * (0.05 + Math.random() * 0.1));
            newHp = Math.max(1, prev.hp - dmg);
            reportLog.push(`Savaşta ${dmg} hasar aldın.`);
        } else {
            newHp = 1;
            reportLog.push(`Ağır yaralandın.`);
        }

        let p: Player = {
            ...prev,
            currentXp: prev.currentXp + xpGain,
            gold: prev.gold + goldGain,
            inventory: droppedItem ? [...prev.inventory, droppedItem] : prev.inventory,
            expeditionPoints: Math.max(0, newPoints),
            nextPointRegenTime: newRegenTime,
            nextExpeditionTime: cooldownEnd,
            hp: newHp,
            reports: [...prev.reports, {
                id: Date.now().toString(),
                title: isBoss ? "Boss Savaşı" : "Sefer Raporu",
                details: reportLog,
                rewards: rewardMsg,
                timestamp: Date.now(),
                type: 'expedition',
                outcome: storyOutcome === 'success' ? 'victory' : 'defeat',
                read: false
            }]
        };
        
        p = checkLevelUp(p);
        return p;
    });
  };

  const handleArenaWin = (gold: number, xp: number) => {
    // Arena damage (10-20%)
    const dmg = Math.floor(player.maxHp * (0.1 + Math.random() * 0.1));
    
    let droppedItem: Item | null = null;
    if (Math.random() > 0.8) {
        droppedItem = generateRandomItem(player.level);
    }

    setPlayer(prev => {
        let p: Player = {
            ...prev,
            gold: prev.gold + gold,
            currentXp: prev.currentXp + xp,
            hp: Math.max(1, prev.hp - dmg),
            inventory: droppedItem ? [...prev.inventory, droppedItem] : prev.inventory,
            reports: [...prev.reports, {
                id: Date.now().toString(),
                title: "Arena Zaferi",
                details: ["Rakibini arenada mağlup ettin.", `Kazanılan: ${gold} Altın, ${xp} EXP`, `Alınan Hasar: ${dmg}`],
                rewards: `${gold} Altın, ${xp} XP` + (droppedItem ? `, ${droppedItem.name}` : ''),
                timestamp: Date.now(),
                type: 'arena',
                outcome: 'victory',
                read: false
            }]
        };
        p = checkLevelUp(p);
        return p;
    });
    setWins(w => w + 1);
  };

  const handleArenaLoss = () => {
    setPlayer(prev => ({ 
        ...prev, 
        hp: 1,
        reports: [...prev.reports, {
            id: Date.now().toString(),
            title: "Arena Yenilgisi",
            details: ["Rakibine yenildin. Yaralarını sarman gerek."],
            rewards: "Yok",
            timestamp: Date.now(),
            type: 'arena',
            outcome: 'defeat',
            read: false
        }]
    })); 
  };

  const handleEquipItem = (item: Item) => {
      const check = canEquipItem(player, item);
      if (!check.can) {
          alert(`Bu eşyayı kuşanamazsın: ${check.reason}`);
          return;
      }
      
      setPlayer(prev => {
          const slot = item.type as keyof Equipment;
          const currentEquipped = prev.equipment[slot];
          const newInventory = prev.inventory.filter(i => i.id !== item.id);
          if (currentEquipped) newInventory.push(currentEquipped);
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
      }
  };

  const handleUseItem = (item: Item) => {
      if(item.type !== 'consumable') return;

      setPlayer(prev => {
          let newHp = prev.hp;
          let newInventory = prev.inventory.filter(i => i.id !== item.id);
          
          if (item.name.includes("Can İksiri")) {
              newHp = prev.maxHp;
          } else if (item.name.includes("Sandık")) {
              const rarity = item.name.includes("Usta") ? 'rare' : 'common';
              const loot = generateRandomItem(prev.level, rarity === 'rare' ? 'rare' : undefined);
              newInventory.push(loot);
          }
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
      } else {
          setPlayer(prev => ({
            ...prev,
            gold: prev.gold - cost,
            inventory: updatedInventory
        }));
      }
  };

  const handleMarketBuy = (marketItem: MarketItem) => {
      if (player.gold < marketItem.price) return;

      if (marketItem.type === 'premium') {
          const days = 15;
          const millis = days * 24 * 60 * 60 * 1000;
          setPlayer(prev => ({
              ...prev,
              gold: prev.gold - marketItem.price,
              premiumUntil: (prev.premiumUntil > Date.now() ? prev.premiumUntil : Date.now()) + millis,
              maxExpeditionPoints: 23 
          }));
          return;
      }

      setPlayer(prev => {
          let newInventory = [...prev.inventory];
          let gold = prev.gold - marketItem.price;

          if (marketItem.type === 'material' || marketItem.type === 'consumable') {
              newInventory.push({
                  id: Date.now().toString(),
                  name: marketItem.name,
                  type: marketItem.type,
                  rarity: 'common',
                  stats: {},
                  value: Math.floor(marketItem.price / 2),
                  description: marketItem.description,
                  upgradeLevel: 0
              });
          }
          return { ...prev, gold, inventory: newInventory };
      });
  };

  const handleDeleteMessage = (id: string) => {
      setPlayer(prev => ({...prev, messages: prev.messages.filter(m => m.id !== id)}));
  }

  const handleDeleteReport = (id: string) => {
      setPlayer(prev => ({...prev, reports: prev.reports.filter(r => r.id !== id)}));
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-yellow-500 font-cinzel text-xl animate-pulse">Arena Yükleniyor...</div>;
  if (!session) return <LoginScreen onLoginSuccess={() => {}} />;
  if (player.isBanned) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-red-500 font-bold text-3xl">BU HESAP YASAKLANDI.</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 pb-20 md:pb-0 font-sans selection:bg-yellow-500/30">
      <AdminPanel 
        isOpen={showAdmin} 
        onClose={() => setShowAdmin(false)}
        users={[player]} 
        onBanUser={() => {}}
        onEditUser={(id, name, gold, role) => setPlayer(p => ({...p, name, gold, role}))}
        onGivePremium={(id, days) => setPlayer(p => ({...p, premiumUntil: Date.now() + (days * 86400000)}))}
        onAddItemToPlayer={(id, item) => setPlayer(p => ({...p, inventory: [...p.inventory, item]}))}
        regions={regions}
        onAddRegion={r => setRegions(prev => [...prev, r])}
        onDeleteRegion={id => setRegions(prev => prev.filter(r => r.id !== id))}
        locations={locations}
        onAddLocation={(loc) => setLocations(p => [...p, loc])}
        onDeleteLocation={(id) => setLocations(p => p.filter(l => l.id !== id))}
        onAddAnnouncement={(ann) => setAnnouncements(prev => [ann, ...prev])}
        enemyTemplates={enemyTemplates}
        onAddEnemyTemplate={(tpl) => setEnemyTemplates(prev => [...prev, tpl])}
        onDeleteEnemyTemplate={(id) => setEnemyTemplates(prev => prev.filter(e => e.id !== id))}
        currentPlayerId={player.id}
        onAddGold={() => setPlayer(p => ({ ...p, gold: p.gold + 1000 }))}
        onLevelUp={() => setPlayer(p => ({ ...p, currentXp: p.maxXp }))}
        onHeal={() => setPlayer(p => ({ ...p, hp: p.maxHp, mp: p.maxMp, expeditionPoints: p.maxExpeditionPoints }))}
      />

      <Guide isOpen={showGuide} onClose={() => setShowGuide(false)} />
      
      <Mailbox 
        isOpen={showMailbox} 
        onClose={() => setShowMailbox(false)}
        player={player}
        onDeleteMessage={handleDeleteMessage}
        onDeleteReport={handleDeleteReport}
        announcements={announcements}
      />

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
            
            <button onClick={() => setShowMailbox(true)} className="relative text-slate-400 hover:text-white">
                <Mail size={24}/>
                {(player.messages.length > 0 || player.reports.length > 0) && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                )}
            </button>

            <button onClick={() => setShowGuide(true)} className="text-slate-400 hover:text-white"><HelpCircle size={24}/></button>
            
            <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-xs text-slate-400">Gladyatör</span>
                <span className="font-bold text-sm flex items-center gap-1">
                    {player.name}
                    {player.premiumUntil > Date.now() && <Crown size={12} className="text-yellow-500 fill-current"/>}
                </span>
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
            ].map(item => (
                <button 
                    key={item.id}
                    onClick={() => setCurrentView(item.id as View)}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${currentView === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-400'}`}
                >
                    <item.icon size={20} /> {item.label}
                </button>
            ))}
            
            {/* Admin Button only for Admins/Mods */}
            {(player.role === 'admin' || player.role === 'moderator') && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                     <button onClick={() => setShowAdmin(true)} className="flex items-center gap-3 p-3 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 w-full">
                        <Settings size={20} /> Yönetici
                    </button>
                </div>
            )}
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
            {currentView === 'character' && (
                <CharacterProfile 
                    player={player} 
                    onUpgradeStat={handleStatUpgrade} 
                    onEquip={handleEquipItem} 
                    onUnequip={handleUnequipItem}
                    onDelete={handleDeleteItem}
                    onSell={handleSellItem}
                    onUse={handleUseItem}
                />
            )}
            {currentView === 'expedition' && (
                <Expedition 
                    player={player}
                    regions={regions}
                    locations={locations}
                    onComplete={handleExpeditionComplete} 
                    isBusy={isBusy} 
                />
            )}
            {currentView === 'arena' && (
                <Arena 
                    player={player} 
                    onWin={handleArenaWin} 
                    onLoss={handleArenaLoss} 
                    isBusy={isBusy} 
                    setBusy={setIsBusy} 
                    // Pass templates later if Arena is updated to use them
                />
            )}
            {currentView === 'market' && <Market playerGold={player.gold} onBuy={handleMarketBuy} />}
            {/* Inventory view removed from nav, integrated into Character */}
            {currentView === 'blacksmith' && <Blacksmith inventory={player.inventory} playerGold={player.gold} onUpgrade={handleUpgradeItem} />}
            {currentView === 'leaderboard' && <Leaderboard />}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 flex justify-around p-3 z-50 overflow-x-auto">
         {[User, Map, Swords, ShoppingBag, Hammer, Trophy].map((Icon, idx) => {
             const views: View[] = ['character', 'expedition', 'arena', 'market', 'blacksmith', 'leaderboard'];
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
