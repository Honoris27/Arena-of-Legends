
import React, { useState, useEffect, useRef } from 'react';
import { Player, StatType, Item, Equipment, ExpeditionLocation, MarketItem, Region, Announcement, EnemyTemplate, BaseItem, ItemMaterial, ItemModifier, Toast, BlacksmithJob, ItemRarity, ItemType, GameEvent, GlobalConfig, CombatReport } from './types';
import { calculateMaxHp, calculateMaxXp, calculateMaxMp, calculateSellPrice, upgradeItem, getExpeditionConfig, canEquipItem, generateDynamicItem, generateScroll, generateFragment, addToInventory, removeFromInventory, INITIAL_BASE_ITEMS, INITIAL_MATERIALS, INITIAL_MODIFIERS, calculateSalvageReturn, checkEventStatus, INITIAL_MARKET_ITEMS, DEFAULT_GLOBAL_CONFIG, formatTime } from './services/gameLogic';
import { supabase, savePlayerProfile, loadPlayerProfile } from './services/supabase';
import { generateExpeditionStory } from './services/geminiService';
import CharacterProfile from './components/CharacterProfile';
import Expedition from './components/Expedition';
import Arena from './components/Arena';
import AdminPanel from './components/AdminPanel';
import LoginScreen from './components/LoginScreen';
import Blacksmith from './components/Blacksmith';
import Leaderboard from './components/Leaderboard';
import Market from './components/Market';
import Guide from './components/Guide';
import Mailbox from './components/Mailbox';
import ToastSystem from './components/ToastSystem';
import EventBanner from './components/EventBanner';
import { User, Map, Swords, Coins, Settings, Hammer, Trophy, ShoppingBag, HelpCircle, LogOut, Crown, Mail } from 'lucide-react';

const INITIAL_REGIONS: Region[] = [
    { id: 'r1', name: "Karanlık Orman", minLevel: 1, description: "Acemi gladyatörlerin ilk durağı." },
    { id: 'r2', name: "Lanetli Harabeler", minLevel: 5, description: "Eski bir krallığın kalıntıları." },
    { id: 'r3', name: "Volkanik Zirve", minLevel: 10, description: "Ateş elementalleri ile dolu." }
];

const INITIAL_LOCATIONS: ExpeditionLocation[] = [
    { id: 'l1', regionId: 'r1', name: "Orman Girişi", minLevel: 1, duration: 1, risk: "Düşük", rewardRate: 1, desc: "Basit yaratıklar." },
    { id: 'l2', regionId: 'r1', name: "Kurt İni", minLevel: 2, duration: 2, risk: "Düşük", rewardRate: 1.2, desc: "Kurt sürüleri." },
];

const DEFAULT_PLAYER_TEMPLATE: Player = {
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
  activeExpedition: null, // New field for persistence
  premiumUntil: 0,
  messages: [],
  reports: [],
  learnedModifiers: [],
  blacksmithQueue: [],
  blacksmithSlots: 2
};

type View = 'character' | 'expedition' | 'arena' | 'blacksmith' | 'leaderboard' | 'market';

function App() {
  const [session, setSession] = useState<any>(null);
  const [player, setPlayer] = useState<Player>(DEFAULT_PLAYER_TEMPLATE);
  const [wins, setWins] = useState(0); 
  const [currentView, setCurrentView] = useState<View>('character');
  const [isBusy, setIsBusy] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showMailbox, setShowMailbox] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const [regions, setRegions] = useState<Region[]>(INITIAL_REGIONS);
  const [locations, setLocations] = useState<ExpeditionLocation[]>(INITIAL_LOCATIONS);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [enemyTemplates, setEnemyTemplates] = useState<EnemyTemplate[]>([]);
  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);
  
  // Game Data State
  const [baseItems, setBaseItems] = useState<BaseItem[]>(INITIAL_BASE_ITEMS);
  const [materials, setMaterials] = useState<ItemMaterial[]>(INITIAL_MATERIALS);
  const [modifiers, setModifiers] = useState<ItemModifier[]>(INITIAL_MODIFIERS);
  const [marketItems, setMarketItems] = useState<MarketItem[]>(INITIAL_MARKET_ITEMS);
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>(DEFAULT_GLOBAL_CONFIG);

  const saveTimeout = useRef<any>(null);

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'loot' = 'info', duration = 3000) => {
      const id = Date.now().toString() + Math.random();
      setToasts(prev => [...prev, { id, message, type, duration }]);
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

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
          setPlayer(DEFAULT_PLAYER_TEMPLATE);
          setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const initPlayer = async (user: any) => {
      setLoading(true);
      const profile = await loadPlayerProfile(user.id);
      
      if (profile) {
          setPlayer(prev => ({
              ...DEFAULT_PLAYER_TEMPLATE,
              ...profile,
              equipment: { ...DEFAULT_PLAYER_TEMPLATE.equipment, ...profile.equipment },
              inventory: profile.inventory || [],
              blacksmithQueue: profile.blacksmithQueue || []
          }));
      } else {
          // Initialize New Player
          const meta = user.user_metadata;
          const startingItems: Item[] = globalConfig.startingInventory.map(baseId => {
              const base = baseItems.find(b => b.id === baseId);
              if(base) return generateDynamicItem(1, [base], materials, modifiers);
              return null;
          }).filter(i => i !== null) as Item[];

          const newPlayer: Player = {
              ...DEFAULT_PLAYER_TEMPLATE,
              id: user.id,
              name: meta.full_name || 'Gladyatör',
              avatarUrl: meta.avatar_url || DEFAULT_PLAYER_TEMPLATE.avatarUrl,
              gold: globalConfig.startingGold,
              level: globalConfig.startingLevel,
              statPoints: globalConfig.startingStatPoints,
              stats: { ...globalConfig.startingStats },
              inventory: startingItems
          };
          setPlayer(newPlayer);
          await savePlayerProfile(newPlayer, 0);
      }
      setLoading(false);
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
  };

  // --- CENTRAL GAME LOOP ---
  useEffect(() => {
    if (!session || loading) return;
    
    const interval = setInterval(() => {
        const now = Date.now();
        setActiveEvent(prev => checkEventStatus(prev));

        setPlayer(prev => {
            // 1. Process Active Expedition
            if (prev.activeExpedition && now >= prev.activeExpedition.endTime) {
                // Determine Success (Logic moved here from frontend)
                // Assuming success for simplicity or add RNG check based on level/stats
                const success = prev.hp > 0; // Simplified
                
                // Trigger resolution logic
                // We cannot use async/await here easily inside setState, 
                // so we will just mark it null here and trigger a side effect or 
                // call a function that handles the logic and updates state.
                
                // To avoid complex state updates in loop, we'll flag it to be resolved.
                // However, better approach: Check condition, if met, call a handler function OUTSIDE this setPlayer.
                // But setPlayer is the only way to get 'prev'.
                // Strategy: Just handle Regen here. Handle completion in a separate check below.
            }

            // 2. Regen Points
            const config = getExpeditionConfig(prev, activeEvent);
            let updated = { ...prev };
            
            if (prev.expeditionPoints < prev.maxExpeditionPoints && now >= prev.nextPointRegenTime) {
                updated.expeditionPoints += 1;
                updated.nextPointRegenTime = now + (config.regenSeconds * 1000);
            }
            return updated;
        });

        // Check for Expedition Completion (Side Effect free from the update above)
        // We use the reference to 'player' state which might be stale in interval, 
        // so we use a functional update or rely on a separate useEffect on [player.activeExpedition]
    }, 1000);
    return () => clearInterval(interval);
  }, [session, loading, activeEvent]); 

  // --- EXPEDITION COMPLETION CHECKER ---
  useEffect(() => {
      if (!player.activeExpedition) return;
      
      const checkCompletion = async () => {
          const now = Date.now();
          if (now >= player.activeExpedition!.endTime) {
              await resolveExpedition(player.activeExpedition!);
          }
      };

      const timer = setInterval(checkCompletion, 1000);
      return () => clearInterval(timer);
  }, [player.activeExpedition]); // Re-binds when activeExpedition changes


  // --- SAVE LOOP ---
  useEffect(() => {
      if (!session || loading) return;
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
          savePlayerProfile(player, wins);
      }, 2000); 
      return () => clearTimeout(saveTimeout.current);
  }, [player, wins, session, loading]);


  // --- EXPEDITION HANDLERS ---

  const handleStartExpedition = (location: ExpeditionLocation, isBoss: boolean) => {
      if (player.expeditionPoints <= 0) {
          addToast("Yetersiz Sefer Puanı", "error");
          return;
      }
      if (player.hp < player.maxHp * 0.25) {
          addToast("Canın çok az! (%25'in altında).", "error");
          return;
      }

      // Calculate Duration
      const config = getExpeditionConfig(player, activeEvent);
      // Simulate duration logic (e.g. 10s for testing, real game might be minutes)
      // For this game: location.duration is multiplier of config base cooldown? 
      // Let's use logic from previous Expedition.tsx but make it persistent.
      // Previous: setTimeout(800ms) - That was instant combat.
      // Let's make it a real "Idle" task. 
      // If duration in location is 1 (multiplier), let's say base is 10 seconds for UX.
      const durationMs = (location.duration * 5000) / (activeEvent?.expeditionTimeMultiplier || 1); 

      const newExpedition = {
          locationId: location.id,
          locationName: isBoss ? "Ejderha Mağarası" : location.name,
          startTime: Date.now(),
          endTime: Date.now() + durationMs,
          isBoss: isBoss,
          rewardMultiplier: isBoss ? 50 : location.rewardRate
      };

      setPlayer(prev => ({
          ...prev,
          expeditionPoints: prev.expeditionPoints - 1,
          nextExpeditionTime: Date.now() + (config.cooldownSeconds * 1000),
          activeExpedition: newExpedition
      }));
      
      // Force Save immediately to prevent state loss on refresh
      savePlayerProfile({
          ...player,
          expeditionPoints: player.expeditionPoints - 1,
          activeExpedition: newExpedition
      }, wins);

      addToast(`${newExpedition.locationName} seferi başladı!`, "info");
  };

  const resolveExpedition = async (expedition: any) => {
      // 1. Calculate Rewards
      const evt = checkEventStatus(activeEvent);
      const xpMult = (evt && evt.isActive) ? evt.xpMultiplier : 1.0;
      const goldMult = (evt && evt.isActive) ? evt.goldMultiplier : 1.0;
      const dropMult = (evt && evt.isActive) ? evt.dropRateMultiplier : 1.0;
      const scrollBonus = (evt && evt.isActive) ? evt.scrollDropChance : 0;

      let xpGain = Math.floor(((10 + Math.random() * 10) * expedition.rewardMultiplier) * xpMult);
      let goldGain = Math.floor(((5 + Math.random() * 10) * expedition.rewardMultiplier) * goldMult);
      const earnedItems: Item[] = [];

      // Drop Logic
      const roll = Math.random();
      if (roll < (0.25 * dropMult)) {
          const dropLvl = Math.max(1, player.level + Math.floor(Math.random() * 5) - 2);
          earnedItems.push(generateDynamicItem(dropLvl, baseItems, materials, modifiers));
      } else if (roll < (0.35 * dropMult + scrollBonus)) {
          const randMod = modifiers[Math.floor(Math.random() * modifiers.length)];
          earnedItems.push(generateScroll(randMod));
      } else if (roll < (0.60 * dropMult)) {
          if (Math.random() > 0.5) earnedItems.push(generateFragment('prefix', Math.floor(Math.random() * 2) + 1));
          else earnedItems.push(generateFragment('suffix', Math.floor(Math.random() * 2) + 1));
      }

      // Damage Logic
      const dmg = Math.floor(player.maxHp * (0.05 + Math.random() * 0.1));
      const outcome = "success"; // Simple logic for now
      
      // AI Story Generation (Optional/Background)
      const storyPromise = generateExpeditionStory(expedition.locationName, outcome, `${goldGain} Altın, ${xpGain} XP`);

      // 2. Create Report
      const report: CombatReport = {
          id: Date.now().toString(),
          title: `Sefer Raporu: ${expedition.locationName}`,
          type: 'expedition',
          outcome: 'victory',
          rewards: `${goldGain} Altın, ${xpGain} XP ${earnedItems.length > 0 ? ', ' + earnedItems.length + ' Eşya' : ''}`,
          timestamp: Date.now(),
          read: false,
          details: [`Süre: ${formatTime(expedition.endTime - expedition.startTime)}`, `Hasar: ${dmg}`, "Sefer başarıyla tamamlandı."]
      };

      // 3. Update Player State
      setPlayer(prev => {
          let newInv = [...prev.inventory];
          earnedItems.forEach(i => newInv = addToInventory(newInv, i));
          
          return {
              ...prev,
              activeExpedition: null, // Clear active state
              currentXp: prev.currentXp + xpGain,
              gold: prev.gold + goldGain,
              inventory: newInv,
              hp: Math.max(1, prev.hp - dmg),
              reports: [...prev.reports, report]
          };
      });

      // 4. Notify User
      addToast(`Sefer Tamamlandı! +${goldGain} Altın`, "loot");
      
      // Force save to ensure rewards aren't lost if they close tab immediately
      // Note: We use the *calculated* values, can't use 'player' state here as it's stale
      // So we rely on the setPlayer + the debounced save, OR force save a partial update.
      // Ideally, rely on the debounce which is 2s, but setPlayer triggers it.
      
      // Fetch AI story and update report later (optional)
      storyPromise.then(story => {
          setPlayer(p => ({
              ...p,
              reports: p.reports.map(r => r.id === report.id ? { ...r, details: [story, ...r.details] } : r)
          }));
      });
  };

  // --- BLACKSMITH JOB HANDLERS ---
  const handleStartJob = (job: BlacksmithJob, cost: number) => {
      if (player.blacksmithQueue.length >= player.blacksmithSlots) {
          addToast("Demirci dolu! Slot boşalmasını bekle.", "error");
          return;
      }
      setPlayer(prev => {
          let newInv = [...prev.inventory];
          if (job.type === 'upgrade' || job.type === 'salvage') {
              if (job.item) newInv = removeFromInventory(newInv, job.item.id);
          }
          
          const newPlayer = {
              ...prev,
              gold: prev.gold - cost,
              inventory: newInv,
              blacksmithQueue: [...prev.blacksmithQueue, job]
          };
          
          // Force Save
          savePlayerProfile(newPlayer, wins);
          return newPlayer;
      });
      addToast("İşlem sıraya alındı.", "info");
  };

  const handleClaimJob = (jobId: string) => {
      const job = player.blacksmithQueue.find(j => j.id === jobId);
      if (!job) return;

      let newItem: Item | null = null;
      let frags: {prefix: number, suffix: number} | null = null;

      if (job.type === 'upgrade' && job.item) {
          newItem = upgradeItem(job.item);
          addToast("Eşya geliştirildi!", "success");
      } else if (job.type === 'salvage' && job.item) {
           // Apply Event Salvage Multiplier
           const r = calculateSalvageReturn(job.item, activeEvent);
           frags = { prefix: r.prefixFrag, suffix: r.suffixFrag };
           addToast(`Kazanıldı: ${r.prefixFrag} Ön Ek, ${r.suffixFrag} Son Ek Parçası`, "success");
      } else if (job.type === 'craft' && job.resultItem) {
          newItem = job.resultItem;
          addToast("Eşya üretildi!", "success");
      }

      setPlayer(prev => {
          let newInv = [...prev.inventory];
          if (newItem) newInv = addToInventory(newInv, newItem);
          if (frags) {
              if(frags.prefix > 0) newInv = addToInventory(newInv, generateFragment('prefix', frags.prefix));
              if(frags.suffix > 0) newInv = addToInventory(newInv, generateFragment('suffix', frags.suffix));
          }
          
          const newPlayer = {
              ...prev,
              inventory: newInv,
              blacksmithQueue: prev.blacksmithQueue.filter(j => j.id !== jobId)
          };
          
          savePlayerProfile(newPlayer, wins); // Force Save
          return newPlayer;
      });
  };

  // --- GENERIC HANDLERS ---
  const handleEquipItem = (item: Item) => {
      const check = canEquipItem(player, item);
      if (!check.can) { addToast(check.reason!, "error"); return; }
      setPlayer(prev => {
          const slot = item.type as keyof Equipment;
          const old = prev.equipment[slot];
          let inv = removeFromInventory(prev.inventory, item.id);
          if (old) inv = addToInventory(inv, old);
          return { ...prev, equipment: { ...prev.equipment, [slot]: item }, inventory: inv };
      });
  };

  const handleUnequipItem = (slot: keyof Equipment) => {
      setPlayer(prev => {
          const item = prev.equipment[slot];
          if (!item) return prev;
          return { ...prev, equipment: { ...prev.equipment, [slot]: null }, inventory: addToInventory(prev.inventory, item) };
      });
  };

  const handleUseItem = (item: Item) => {
      if (item.type === 'scroll' && item.linkedModifierId) {
          if (player.learnedModifiers.includes(item.linkedModifierId)) {
              addToast("Bunu zaten biliyorsun.", "error"); return;
          }
          setPlayer(p => ({ ...p, learnedModifiers: [...p.learnedModifiers, item.linkedModifierId!], inventory: removeFromInventory(p.inventory, item.id) }));
          addToast("Yeni özellik öğrenildi!", "success");
      } else if (item.type === 'consumable') {
          // Placeholder for potions
          setPlayer(p => ({...p, hp: p.maxHp, inventory: removeFromInventory(p.inventory, item.id)}));
          addToast("İksir kullanıldı.", "success");
      }
  };

  const handleMarketBuy = (item: MarketItem) => {
    if (player.gold < item.price) {
        addToast("Yetersiz altın!", "error");
        return;
    }
    // ... (rest of market buy logic unchanged) ...
    // Simplifying duplication here for the patch
    let newInv = [...player.inventory];
    let newHp = player.hp;
    let newPremium = player.premiumUntil;
    let msg = "Satın alındı.";

    if (item.type === 'premium') {
        newPremium = Math.max(Date.now(), player.premiumUntil) + (15 * 86400000);
    } else if (item.effect === 'heal') {
        newHp = player.maxHp;
    } else if (item.effect?.startsWith('box')) {
        const item = generateDynamicItem(player.level, baseItems, materials, modifiers);
        newInv = addToInventory(newInv, item);
        msg = `Kazanıldı: ${item.name}`;
    } else {
        const i: Item = { id: Date.now().toString(), name: item.name, type: item.type as ItemType, rarity: 'common', stats: {}, value: 10, count: 1, upgradeLevel: 0 };
        newInv = addToInventory(newInv, i);
    }

    setPlayer(p => ({...p, gold: p.gold - item.price, inventory: newInv, hp: newHp, premiumUntil: newPremium}));
    addToast(msg, "success");
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-yellow-500 font-cinzel text-xl animate-pulse">Arena Yükleniyor...</div>;
  if (!session) return <LoginScreen onLoginSuccess={() => {}} />;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 pb-20 md:pb-0 font-sans selection:bg-yellow-500/30">
      <ToastSystem toasts={toasts} removeToast={removeToast} />
      
      {activeEvent && activeEvent.isActive && <EventBanner event={activeEvent} />}

      <AdminPanel 
        isOpen={showAdmin} 
        onClose={() => setShowAdmin(false)}
        currentUserRole={player.role} // Pass role to Admin Panel
        users={[player]} 
        onAddItemToPlayer={(id, item) => setPlayer(p => ({...p, inventory: addToInventory(p.inventory, item)}))}
        baseItems={baseItems} setBaseItems={setBaseItems}
        materials={materials} setMaterials={setMaterials}
        modifiers={modifiers} setModifiers={setModifiers}
        marketItems={marketItems} setMarketItems={setMarketItems}
        globalConfig={globalConfig} setGlobalConfig={setGlobalConfig}
        regions={regions} onAddRegion={r => setRegions(prev => [...prev, r])}
        locations={locations} onAddLocation={l => setLocations(p => [...p, l])} onDeleteLocation={id => setLocations(p => p.filter(l => l.id !== id))}
        onBanUser={() => setPlayer(DEFAULT_PLAYER_TEMPLATE)} 
        onEditUser={(id, updates) => setPlayer(p => ({...p, ...updates}))} 
        onGivePremium={(id, days) => setPlayer(p => ({...p, premiumUntil: Date.now() + days*86400000}))} 
        onAddAnnouncement={(ann) => setAnnouncements(prev => [ann, ...prev])}
        enemyTemplates={enemyTemplates} onAddEnemyTemplate={() => {}} onDeleteEnemyTemplate={() => {}}
        currentPlayerId={player.id} 
        activeEvent={activeEvent} onUpdateEvent={setActiveEvent}
        onAddGold={() => setPlayer(p => ({...p, gold: p.gold + 1000}))} onLevelUp={() => setPlayer(p => ({...p, currentXp: p.maxXp}))} onHeal={() => setPlayer(p => ({...p, hp: p.maxHp}))}
      />

      <Guide isOpen={showGuide} onClose={() => setShowGuide(false)} />
      
      <Mailbox 
        isOpen={showMailbox} 
        onClose={() => setShowMailbox(false)}
        player={player}
        onDeleteMessage={id => setPlayer(p => ({...p, messages: p.messages.filter(m => m.id !== id)}))}
        onDeleteReport={id => setPlayer(p => ({...p, reports: p.reports.filter(r => r.id !== id)}))}
        announcements={announcements}
      />

      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700 h-16 flex items-center justify-between px-4 md:px-8 shadow-lg">
        <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold cinzel bg-gradient-to-r from-yellow-500 to-amber-700 bg-clip-text text-transparent">
                Arena of Legends
            </h1>
        </div>
        <div className="flex items-center gap-4">
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

             {/* Admin Panel Button: Only visible to Admin or Moderator */}
             {(player.role === 'admin' || player.role === 'moderator') && (
                 <button onClick={() => setShowAdmin(true)} className="text-slate-400 hover:text-white"><Settings size={20} /></button>
             )}
             
             <button onClick={handleLogout} className="text-red-400 hover:text-red-300"><LogOut size={20} /></button>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto h-[calc(100vh-64px-40px)] overflow-hidden"> 
        {/* Adjusted height to account for banner if present, though banner is sticky/relative above header usually */}
        <nav className="hidden md:flex w-64 flex-col border-r border-slate-700 bg-slate-800/50 p-4 gap-2">
            {[{ id: 'character', icon: User, label: 'Karakter' }, { id: 'expedition', icon: Map, label: 'Sefer' }, { id: 'arena', icon: Swords, label: 'Arena' }, { id: 'blacksmith', icon: Hammer, label: 'Demirci' }, { id: 'market', icon: ShoppingBag, label: 'Pazar' }, { id: 'leaderboard', icon: Trophy, label: 'Sıralama' }].map(item => (
                <button key={item.id} onClick={() => setCurrentView(item.id as View)} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${currentView === item.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700 text-slate-400'}`}>
                    <item.icon size={20} /> {item.label}
                </button>
            ))}
        </nav>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
            {currentView === 'character' && (
                <CharacterProfile 
                    player={player} 
                    onUpgradeStat={() => {}} 
                    onEquip={handleEquipItem} 
                    onUnequip={handleUnequipItem}
                    onDelete={item => setPlayer(p => ({...p, inventory: removeFromInventory(p.inventory, item.id)}))}
                    onSell={item => { setPlayer(p => ({...p, gold: p.gold + calculateSellPrice(item), inventory: removeFromInventory(p.inventory, item.id)})); addToast("Satıldı", "success"); }}
                    onUse={handleUseItem}
                />
            )}
            {currentView === 'expedition' && (
                <Expedition 
                    player={player}
                    regions={regions}
                    locations={locations}
                    onStartExpedition={handleStartExpedition} 
                    isBusy={!!player.activeExpedition} 
                />
            )}
            {currentView === 'blacksmith' && (
                <Blacksmith 
                    inventory={player.inventory}
                    playerGold={player.gold}
                    jobs={player.blacksmithQueue}
                    learnedModifiers={player.learnedModifiers}
                    onStartJob={handleStartJob}
                    onClaimJob={handleClaimJob}
                />
            )}
            {currentView === 'arena' && (
                <Arena 
                    player={player} 
                    onWin={(g, x) => { setPlayer(p => ({...p, gold: p.gold + g, currentXp: p.currentXp + x})); setWins(w => w+1); }}
                    onLoss={() => setPlayer(p => ({...p, hp: 1}))}
                    isBusy={isBusy} 
                    setBusy={setIsBusy} 
                />
            )}
            {currentView === 'market' && <Market playerGold={player.gold} items={marketItems} onBuy={handleMarketBuy} />}
            {currentView === 'leaderboard' && <Leaderboard />}
        </main>
      </div>
      
      {/* Mobile Nav */}
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
