
import React, { useState, useEffect, useRef } from 'react';
import { Player, Item, Equipment, ExpeditionLocation, MarketItem, Region, Announcement, EnemyTemplate, BaseItem, ItemMaterial, ItemModifier, Toast, BlacksmithJob, ItemRarity, ItemType, GameEvent, GlobalConfig, CombatReport, ArenaBattleState, Enemy, SupportTicket } from './types';
import { calculateMaxHp, calculateMaxXp, calculateMaxMp, calculateSellPrice, upgradeItem, getExpeditionConfig, canEquipItem, generateDynamicItem, generateScroll, generateFragment, addToInventory, removeFromInventory, INITIAL_BASE_ITEMS, INITIAL_MATERIALS, INITIAL_MODIFIERS, calculateSalvageReturn, checkEventStatus, INITIAL_MARKET_ITEMS, DEFAULT_GLOBAL_CONFIG, formatTime, generateEnemy, calculateDamage, getPlayerTotalStats, getLeagueInfo, processLevelUp } from './services/gameLogic';
import { supabase, savePlayerProfile, loadPlayerProfile, updateProfile, fetchGameSystemData, saveSystemData } from './services/supabase';
import { generateExpeditionStory, generateEnemyNameAndDescription } from './services/geminiService';
import CharacterProfile from './components/CharacterProfile';
import Expedition from './components/Expedition';
import Arena from './components/Arena';
import PvpArena from './components/PvpArena';
import AdminPanel from './components/AdminPanel';
import LoginScreen from './components/LoginScreen';
import Blacksmith from './components/Blacksmith';
import Leaderboard from './components/Leaderboard';
import Market from './components/Market';
import Guide from './components/Guide';
import Mailbox from './components/Mailbox';
import Bank from './components/Bank';
import ToastSystem from './components/ToastSystem';
import EventBanner from './components/EventBanner';
import { User, Map, Swords, Coins, Settings, Hammer, Trophy, ShoppingBag, HelpCircle, LogOut, Crown, Mail, Landmark, Skull, MessageSquare, AlertCircle, Send, X, Menu, Shield, Zap, Diamond, Flame, Star, Scroll, BookOpen, Briefcase } from 'lucide-react';

// ... (CONSTANTS - Keep existing)
const INITIAL_REGIONS: Region[] = [
    { id: 'r1', name: "Karanlık Orman", minLevel: 1, description: "Acemi gladyatörlerin ilk durağı." },
    { id: 'r2', name: "Lanetli Harabeler", minLevel: 5, description: "Eski bir krallığın kalıntıları." },
    { id: 'r3', name: "Volkanik Zirve", minLevel: 10, description: "Ateş elementalleri ile dolu." }
];

const INITIAL_LOCATIONS: ExpeditionLocation[] = [
    { id: 'l1', regionId: 'r1', name: "Orman Girişi", minLevel: 1, duration: 1, risk: "Düşük", rewardRate: 1, desc: "Basit yaratıklar.", difficultyScore: 1 },
    { id: 'l2', regionId: 'r1', name: "Kurt İni", minLevel: 2, duration: 2, risk: "Düşük", rewardRate: 1.2, desc: "Kurt sürüleri.", difficultyScore: 1 },
    { id: 'l3', regionId: 'r2', name: "Hayaletli Mahzen", minLevel: 5, duration: 3, risk: "Orta", rewardRate: 1.5, desc: "Ruhlar tarafından korunuyor.", difficultyScore: 2 },
    { id: 'l4', regionId: 'r3', name: "Lav Nehri", minLevel: 10, duration: 5, risk: "Yüksek", rewardRate: 2, desc: "Aşırı sıcak.", difficultyScore: 3 },
];

const DEFAULT_PLAYER_TEMPLATE: Player = {
  id: '',
  name: "Bilinmeyen",
  role: 'player',
  level: 1,
  currentXp: 0,
  maxXp: 100,
  gold: 50,
  wins: 0,
  stats: { STR: 10, AGI: 5, VIT: 10, INT: 5, LUK: 5 },
  statPoints: 0,
  hp: 120, maxHp: 120, mp: 50, maxMp: 50,
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Spartacus",
  equipment: { weapon: null, shield: null, helmet: null, armor: null, gloves: null, boots: null, necklace: null, ring: null, ring2: null, earring: null, earring2: null, belt: null },
  inventory: [],
  expeditionPoints: 15,
  maxExpeditionPoints: 15,
  nextPointRegenTime: Date.now() + (15 * 60 * 1000), 
  nextExpeditionTime: 0,
  activeExpedition: null, 
  premiumUntil: 0,
  honor: 0,
  victoryPoints: 0,
  piggyBank: 0,
  rank: 9999,
  lastIncomeTime: 0,
  bankDeposits: [],
  messages: [],
  reports: [],
  learnedModifiers: [],
  blacksmithQueue: [],
  blacksmithSlots: 2
};

type View = 'character' | 'expedition' | 'arena' | 'pvp' | 'blacksmith' | 'leaderboard' | 'market' | 'bank';

function App() {
  const [session, setSession] = useState<any>(null);
  const [player, setPlayer] = useState<Player>(DEFAULT_PLAYER_TEMPLATE);
  const [wins, setWins] = useState(0); 
  const [currentView, setCurrentView] = useState<View>('character');
  const [isBusy, setIsBusy] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showMailbox, setShowMailbox] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [regions, setRegions] = useState<Region[]>(INITIAL_REGIONS);
  const [locations, setLocations] = useState<ExpeditionLocation[]>(INITIAL_LOCATIONS);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [enemyTemplates, setEnemyTemplates] = useState<EnemyTemplate[]>([]);
  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);
  
  // Support Form
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportCategory, setSupportCategory] = useState<'bug' | 'cheat' | 'suggestion' | 'complaint' | 'other'>('bug');

  const [arenaBattle, setArenaBattle] = useState<ArenaBattleState>({
      mode: 'pve',
      enemy: null,
      logs: [],
      isFighting: false,
      round: 0
  });

  const [baseItems, setBaseItems] = useState<BaseItem[]>(INITIAL_BASE_ITEMS);
  const [materials, setMaterials] = useState<ItemMaterial[]>(INITIAL_MATERIALS);
  const [modifiers, setModifiers] = useState<ItemModifier[]>(INITIAL_MODIFIERS);
  const [marketItems, setMarketItems] = useState<MarketItem[]>(INITIAL_MARKET_ITEMS);
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>(DEFAULT_GLOBAL_CONFIG);

  const saveTimeout = useRef<any>(null);
  const hpRegenTick = useRef<number>(0);
  const prevLevelRef = useRef<number>(1);

  // ... (Logic Handlers - Reused)
  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'loot' | 'levelup' = 'info', duration = 3000) => {
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
      else { setPlayer(DEFAULT_PLAYER_TEMPLATE); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const initPlayer = async (user: any) => {
      setLoading(true);
      const sysData = await fetchGameSystemData();
      if(sysData) {
          if(sysData.baseItems.length > 0) setBaseItems(sysData.baseItems);
          if(sysData.modifiers.length > 0) setModifiers(sysData.modifiers);
          if(sysData.marketItems.length > 0) setMarketItems(sysData.marketItems);
          if(sysData.activeEvent) setActiveEvent(sysData.activeEvent);
      }
      const localKey = `aol_save_${user.id}`;
      let loadedFromLocal = false;
      const localData = localStorage.getItem(localKey);
      if (localData) {
          try {
              const parsed = JSON.parse(localData);
              if (parsed && parsed.id === user.id) {
                  const mergedLocal = { ...DEFAULT_PLAYER_TEMPLATE, ...parsed, equipment: { ...DEFAULT_PLAYER_TEMPLATE.equipment, ...parsed.equipment } };
                  setPlayer(mergedLocal);
                  if (parsed.wins) setWins(parsed.wins);
                  prevLevelRef.current = mergedLocal.level; 
                  loadedFromLocal = true;
                  setLoading(false);
              }
          } catch (e) {}
      }
      const profile = await loadPlayerProfile(user.id);
      if (profile) {
          const merged = { ...DEFAULT_PLAYER_TEMPLATE, ...profile, equipment: { ...DEFAULT_PLAYER_TEMPLATE.equipment, ...profile.equipment } };
          setPlayer(merged);
          setWins(merged.wins || 0);
          prevLevelRef.current = merged.level; 
          localStorage.setItem(localKey, JSON.stringify(merged));
      } else if (!loadedFromLocal) {
          const meta = user.user_metadata;
          const startingItems: Item[] = globalConfig.startingInventory.map(baseId => {
              const base = baseItems.find(b => b.id === baseId);
              if(base) return generateDynamicItem(1, [base], materials, modifiers);
              return null;
          }).filter(i => i !== null) as Item[];
          const newPlayer: Player = {
              ...DEFAULT_PLAYER_TEMPLATE, id: user.id, name: meta.full_name || 'Gladyatör', avatarUrl: meta.avatar_url || DEFAULT_PLAYER_TEMPLATE.avatarUrl,
              gold: globalConfig.startingGold, level: globalConfig.startingLevel, statPoints: globalConfig.startingStatPoints, stats: { ...globalConfig.startingStats }, inventory: startingItems
          };
          setPlayer(newPlayer);
          prevLevelRef.current = newPlayer.level;
          localStorage.setItem(localKey, JSON.stringify(newPlayer));
          await savePlayerProfile(newPlayer, 0);
      }
      setLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  useEffect(() => {
    if (!session || loading) return;
    const interval = setInterval(() => {
        const now = Date.now();
        setActiveEvent(prev => checkEventStatus(prev));
        hpRegenTick.current += 1;
        setPlayer(prev => {
            const config = getExpeditionConfig(prev, activeEvent);
            let updated = { ...prev };
            let changed = false;
            if (prev.expeditionPoints < prev.maxExpeditionPoints && now >= prev.nextPointRegenTime) {
                updated.expeditionPoints += 1;
                updated.nextPointRegenTime = now + (config.regenSeconds * 1000);
                changed = true;
            }
            if (hpRegenTick.current % 5 === 0 && updated.hp < updated.maxHp && !arenaBattle.isFighting) {
                const totalStats = getPlayerTotalStats(prev);
                const regenAmount = Math.max(1, Math.floor(totalStats.INT / 10));
                updated.hp = Math.min(updated.maxHp, updated.hp + regenAmount);
                changed = true;
            }
            if (prev.rank === 1 && (now - (prev.lastIncomeTime || 0) > 10 * 60 * 1000)) {
                const league = getLeagueInfo(prev.level);
                updated.gold += league.passiveGold;
                updated.piggyBank += Math.floor(league.passiveGold * 0.2); 
                updated.lastIncomeTime = now;
                changed = true;
            }
            const lvlCheck = processLevelUp(updated);
            if (lvlCheck.leveledUp) { updated = lvlCheck.updatedPlayer; changed = true; }
            return changed ? updated : prev;
        });
    }, 1000);
    return () => clearInterval(interval);
  }, [session, loading, activeEvent, arenaBattle.isFighting]); 

  // Battle Logic (Same)
  useEffect(() => {
      if (!arenaBattle.isFighting || !arenaBattle.enemy) return;
      const battleTimer = setInterval(() => {
          let newPlayerHp = player.hp;
          let newEnemy = { ...arenaBattle.enemy! };
          let newLogs = [...arenaBattle.logs];
          let round = arenaBattle.round + 1;
          const dmgToEnemy = calculateDamage(player.stats, newEnemy.stats, player.equipment, newEnemy.equipment);
          newEnemy.hp -= dmgToEnemy;
          newLogs.push(`Raunt ${round}: ${player.name}, ${newEnemy.name}'a ${dmgToEnemy} hasar verdi!`);
          if (newEnemy.hp <= 0) {
              newLogs.push(`${newEnemy.name} yere yığıldı! KAZANDIN!`);
              let goldReward = 0; let xpReward = 0; let honorReward = 0; let vpReward = 0; let extraMsg = ""; let newRank = player.rank;
              if (arenaBattle.mode === 'pvp') {
                  const stealAmount = newEnemy.gold ? Math.floor(newEnemy.gold * 0.05) : 0;
                  const piggySteal = (newEnemy.rank === 1 && newEnemy.piggyBank) ? newEnemy.piggyBank : 0;
                  goldReward = stealAmount + piggySteal; xpReward = (newEnemy.level * 30); honorReward = 2; vpReward = 3;
                  if(stealAmount > 0) extraMsg += ` ${stealAmount} Altın çaldın!`;
                  if(piggySteal > 0) extraMsg += ` ŞAMPİYON KUMBARASI! (+${piggySteal})`;
                  if(newEnemy.rank && newEnemy.rank < player.rank) {
                      newRank = newEnemy.rank; extraMsg += ` Sıralaman Yükseldi: #${newRank}`;
                      updateProfile(newEnemy.id!, { rank: player.rank, gold: Math.max(0, (newEnemy.gold || 0) - stealAmount), piggyBank: 0 });
                  }
              } else {
                  goldReward = (newEnemy.level * 10) + Math.floor(Math.random() * 20); xpReward = (newEnemy.level * 20) + Math.floor(Math.random() * 10); vpReward = 1; extraMsg = ` +${vpReward} Zafer Puanı`;
              }
              setPlayer(prev => ({ ...prev, gold: prev.gold + goldReward, currentXp: prev.currentXp + xpReward, honor: prev.honor + honorReward, victoryPoints: prev.victoryPoints + vpReward, rank: newRank, piggyBank: newRank === 1 ? 0 : prev.piggyBank }));
              setWins(w => w + 1); addToast(`Zafer! +${goldReward} Altın, +${xpReward} XP` + extraMsg, 'success'); if(honorReward > 0) addToast(`+${honorReward} Onur`, 'info');
              setArenaBattle(prev => ({ ...prev, enemy: newEnemy, logs: newLogs, isFighting: false, round })); setIsBusy(false);
          } else {
               const dmgToPlayer = calculateDamage(newEnemy.stats, player.stats, newEnemy.equipment, player.equipment);
               newPlayerHp -= dmgToPlayer;
               newLogs.push(`Raunt ${round}: ${newEnemy.name}, sana ${dmgToPlayer} hasar verdi!`);
               if (newPlayerHp <= 0) {
                   newLogs.push(`Ağır yaralandın... KAYBETTİN.`);
                   setPlayer(prev => {
                       let lossMsg = ""; let newGold = prev.gold;
                       if(arenaBattle.mode === 'pvp') { const stolen = Math.floor(prev.gold * 0.05); newGold = Math.max(0, prev.gold - stolen); lossMsg = ` ${stolen} Altın çaldırdın!`; addToast(`Yenildin!${lossMsg}`, 'error'); }
                       return { ...prev, hp: 1, gold: newGold };
                   });
                   setArenaBattle(prev => ({ ...prev, enemy: newEnemy, logs: newLogs, isFighting: false, round })); setIsBusy(false);
               } else {
                   setPlayer(prev => ({ ...prev, hp: newPlayerHp })); setArenaBattle(prev => ({ ...prev, enemy: newEnemy, logs: newLogs, round }));
               }
          }
      }, 800);
      return () => clearInterval(battleTimer);
  }, [arenaBattle.isFighting, arenaBattle.enemy, arenaBattle.mode, player.stats, player.hp, player.name]);

  const handlePveSearch = async (levelOffset: number = 0) => { if (isBusy) return; const baseEnemy = generateEnemy(player.level + levelOffset); const flavor = await generateEnemyNameAndDescription(baseEnemy.level); setArenaBattle({ mode: 'pve', enemy: { ...baseEnemy, name: flavor.name, description: flavor.description, isPlayer: false }, logs: [], isFighting: false, round: 0 }); };
  const handlePvpStart = async (selectedEnemy: Enemy) => { if (isBusy) return; setCurrentView('pvp'); setArenaBattle({ mode: 'pvp', enemy: selectedEnemy, logs: [], isFighting: false, round: 0 }); };
  const handleArenaStart = () => { if (!arenaBattle.enemy) return; setIsBusy(true); setArenaBattle(prev => ({ ...prev, isFighting: true, logs: [`${player.name} vs ${prev.enemy?.name}! Savaş başlıyor!`], round: 0 })); };
  const handleArenaReset = () => { if(arenaBattle.isFighting) return; setArenaBattle({ mode: 'pve', enemy: null, logs: [], isFighting: false, round: 0 }); };
  const handleViewChange = (newView: View) => { if (currentView === 'arena' || currentView === 'pvp') { handleArenaReset(); } setCurrentView(newView); setMobileMenuOpen(false); }

  useEffect(() => { if (!player.activeExpedition) return; const checkCompletion = async () => { const now = Date.now(); if (now >= player.activeExpedition!.endTime) { await resolveExpedition(player.activeExpedition!); } }; const timer = setInterval(checkCompletion, 1000); return () => clearInterval(timer); }, [player.activeExpedition]); 
  useEffect(() => { if (!session || loading || !player.id) return; localStorage.setItem(`aol_save_${player.id}`, JSON.stringify(player)); if (saveTimeout.current) clearTimeout(saveTimeout.current); saveTimeout.current = setTimeout(() => { savePlayerProfile(player, wins); }, 2000); return () => clearTimeout(saveTimeout.current); }, [player, wins, session, loading]);

  const handleStartExpedition = (location: ExpeditionLocation, isBoss: boolean) => { if (player.expeditionPoints <= 0) { addToast("Yetersiz Sefer Puanı", "error"); return; } if (player.hp < player.maxHp * 0.25) { addToast("Canın çok az! (%25'in altında).", "error"); return; } const config = getExpeditionConfig(player, activeEvent); const durationMs = (location.duration * 5000) / (activeEvent?.expeditionTimeMultiplier || 1); const newExpedition = { locationId: location.id, locationName: isBoss ? "Ejderha Mağarası" : location.name, startTime: Date.now(), endTime: Date.now() + durationMs, isBoss: isBoss, rewardMultiplier: isBoss ? 50 : location.rewardRate }; setPlayer(prev => ({ ...prev, expeditionPoints: prev.expeditionPoints - 1, nextExpeditionTime: Date.now() + (config.cooldownSeconds * 1000), activeExpedition: newExpedition })); localStorage.setItem(`aol_save_${player.id}`, JSON.stringify({ ...player, expeditionPoints: player.expeditionPoints - 1, activeExpedition: newExpedition })); addToast(`${newExpedition.locationName} seferi başladı!`, "info"); };
  const resolveExpedition = async (expedition: any) => { const evt = checkEventStatus(activeEvent); const xpMult = (evt && evt.isActive) ? evt.xpMultiplier : 1.0; const goldMult = (evt && evt.isActive) ? evt.goldMultiplier : 1.0; const dropMult = (evt && evt.isActive) ? evt.dropRateMultiplier : 1.0; const scrollBonus = (evt && evt.isActive) ? evt.scrollDropChance : 0; const loc = locations.find(l => l.id === expedition.locationId); const vpGain = loc ? loc.difficultyScore : 1; let xpGain = Math.floor(((10 + Math.random() * 10) * expedition.rewardMultiplier) * xpMult); let goldGain = Math.floor(((5 + Math.random() * 10) * expedition.rewardMultiplier) * goldMult); const earnedItems: Item[] = []; const roll = Math.random(); if (roll < (0.25 * dropMult)) { const dropLvl = Math.max(1, player.level + Math.floor(Math.random() * 5) - 2); earnedItems.push(generateDynamicItem(dropLvl, baseItems, materials, modifiers)); } else if (roll < (0.35 * dropMult + scrollBonus)) { const randMod = modifiers[Math.floor(Math.random() * modifiers.length)]; earnedItems.push(generateScroll(randMod)); } else if (roll < (0.60 * dropMult)) { if (Math.random() > 0.5) earnedItems.push(generateFragment('prefix', Math.floor(Math.random() * 2) + 1)); else earnedItems.push(generateFragment('suffix', Math.floor(Math.random() * 2) + 1)); } const dmg = Math.floor(player.maxHp * (0.05 + Math.random() * 0.1)); const storyPromise = generateExpeditionStory(expedition.locationName, 'success', `${goldGain} Altın, ${xpGain} XP`); const report: CombatReport = { id: Date.now().toString(), title: `Sefer Raporu: ${expedition.locationName}`, type: 'expedition', outcome: 'victory', rewards: `${goldGain} Altın, ${xpGain} XP, +${vpGain} Zafer Puanı ${earnedItems.length > 0 ? ', ' + earnedItems.length + ' Eşya' : ''}`, timestamp: Date.now(), read: false, details: [`Süre: ${formatTime(expedition.endTime - expedition.startTime)}`, `Hasar: ${dmg}`, "Sefer başarıyla tamamlandı."] }; setPlayer(prev => { let newInv = [...prev.inventory]; earnedItems.forEach(i => newInv = addToInventory(newInv, i)); return { ...prev, activeExpedition: null, currentXp: prev.currentXp + xpGain, gold: prev.gold + goldGain, victoryPoints: prev.victoryPoints + vpGain, inventory: newInv, hp: Math.max(1, prev.hp - dmg), reports: [...prev.reports, report] }; }); addToast(`Sefer Tamamlandı! +${goldGain} Altın`, "loot"); storyPromise.then(story => { setPlayer(p => ({ ...p, reports: p.reports.map(r => r.id === report.id ? { ...r, details: [story, ...r.details] } : r) })); }); };
  const handleStartJob = (job: BlacksmithJob, cost: number) => { if (player.blacksmithQueue.length >= player.blacksmithSlots) { addToast("Demirci dolu! Slot boşalmasını bekle.", "error"); return; } setPlayer(prev => { let newInv = [...prev.inventory]; if (job.type === 'upgrade' || job.type === 'salvage') { if (job.item) newInv = removeFromInventory(newInv, job.item.id); } return { ...prev, gold: prev.gold - cost, inventory: newInv, blacksmithQueue: [...prev.blacksmithQueue, job] }; }); addToast("İşlem sıraya alındı.", "info"); };
  const handleClaimJob = (jobId: string) => { const job = player.blacksmithQueue.find(j => j.id === jobId); if (!job) return; let newItem: Item | null = null; let frags: {prefix: number, suffix: number} | null = null; if (job.type === 'upgrade' && job.item) { newItem = upgradeItem(job.item); addToast("Eşya geliştirildi!", "success"); } else if (job.type === 'salvage' && job.item) { const r = calculateSalvageReturn(job.item, activeEvent); frags = { prefix: r.prefixFrag, suffix: r.suffixFrag }; addToast(`Kazanıldı: ${r.prefixFrag} Ön Ek, ${r.suffixFrag} Son Ek Parçası`, "success"); } else if (job.type === 'craft' && job.resultItem) { newItem = job.resultItem; addToast("Eşya üretildi!", "success"); } setPlayer(prev => { let newInv = [...prev.inventory]; if (newItem) newInv = addToInventory(newInv, newItem); if (frags) { if(frags.prefix > 0) newInv = addToInventory(newInv, generateFragment('prefix', frags.prefix)); if(frags.suffix > 0) newInv = addToInventory(newInv, generateFragment('suffix', frags.suffix)); } return { ...prev, inventory: newInv, blacksmithQueue: prev.blacksmithQueue.filter(j => j.id !== jobId) }; }); };
  const handleEquipItem = (item: Item) => { const check = canEquipItem(player, item); if (!check.can) { addToast(check.reason!, "error"); return; } setPlayer(prev => { let slot = item.type as keyof Equipment; if (item.type === 'ring' && prev.equipment.ring && !prev.equipment.ring2) { slot = 'ring2'; } else if (item.type === 'earring' && prev.equipment.earring && !prev.equipment.earring2) { slot = 'earring2'; } const old = prev.equipment[slot]; let inv = removeFromInventory(prev.inventory, item.id); if (old) inv = addToInventory(inv, old); return { ...prev, equipment: { ...prev.equipment, [slot]: item }, inventory: inv }; }); };
  const handleUnequipItem = (slot: keyof Equipment) => { setPlayer(prev => { const item = prev.equipment[slot]; if (!item) return prev; return { ...prev, equipment: { ...prev.equipment, [slot]: null }, inventory: addToInventory(prev.inventory, item) }; }); };
  const handleUseItem = (item: Item) => { if (item.type === 'scroll' && item.linkedModifierId) { if (player.learnedModifiers.includes(item.linkedModifierId)) { addToast("Bunu zaten biliyorsun.", "error"); return; } setPlayer(p => ({ ...p, learnedModifiers: [...p.learnedModifiers, item.linkedModifierId!], inventory: removeFromInventory(p.inventory, item.id) })); addToast("Yeni özellik öğrenildi!", "success"); } else if (item.type === 'consumable') { setPlayer(p => ({...p, hp: p.maxHp, inventory: removeFromInventory(p.inventory, item.id)})); addToast("İksir kullanıldı.", "success"); } };
  const handleMarketBuy = (item: MarketItem) => { if (player.gold < item.price) { addToast("Yetersiz altın!", "error"); return; } let newInv = [...player.inventory]; let newHp = player.hp; let newPremium = player.premiumUntil; let msg = "Satın alındı."; if (item.type === 'premium') { newPremium = Math.max(Date.now(), player.premiumUntil) + (15 * 86400000); } else if (item.effect === 'heal') { newHp = player.maxHp; } else if (item.effect?.startsWith('box')) { const item = generateDynamicItem(player.level, baseItems, materials, modifiers); newInv = addToInventory(newInv, item); msg = `Kazanıldı: ${item.name}`; } else { const i: Item = { id: Date.now().toString(), name: item.name, type: item.type as ItemType, rarity: 'common', stats: {}, value: 10, count: 1, upgradeLevel: 0 }; newInv = addToInventory(newInv, i); } setPlayer(p => ({...p, gold: p.gold - item.price, inventory: newInv, hp: newHp, premiumUntil: newPremium})); addToast(msg, "success"); };
  const submitSupportTicket = () => { if(!supportSubject || !supportMessage) { addToast("Lütfen konu ve mesajı doldurun.", "error"); return; } const ticket: SupportTicket = { id: Date.now().toString(), senderId: player.id, senderName: player.name, category: supportCategory, subject: supportSubject, message: supportMessage, timestamp: Date.now(), status: 'open' }; const updatedTickets = [...(globalConfig.supportTickets || []), ticket]; setGlobalConfig({ ...globalConfig, supportTickets: updatedTickets }); addToast("Destek bileti gönderildi.", "success"); setSupportSubject(""); setSupportMessage(""); setShowSupport(false); };

  const notificationCount = player.messages.filter(m => !m.read && m.type !== 'sent').length + player.reports.filter(r => !r.read).length + announcements.length;
  const reportCount = player.reports.filter(r => !r.read).length;
  const msgCount = player.messages.filter(m => !m.read && m.type !== 'inbox').length;

  if (loading) return <div className="min-h-screen bg-stone-900 flex items-center justify-center text-[#c5a059] font-cinzel text-xl animate-pulse bg-[url('https://www.transparenttextures.com/patterns/dark-stone.png')]">Arena Yükleniyor...</div>;
  if (!session) return <LoginScreen onLoginSuccess={() => {}} />;

  return (
    <div className="flex h-screen overflow-hidden">
      <ToastSystem toasts={toasts} removeToast={removeToast} />
      {activeEvent && activeEvent.isActive && <div className="fixed top-0 w-full z-[60]"><EventBanner event={activeEvent} /></div>}

      <AdminPanel 
        isOpen={showAdmin} onClose={() => setShowAdmin(false)} currentUserRole={player.role}
        users={[player]} onAddItemToPlayer={(id, item) => setPlayer(p => ({...p, inventory: addToInventory(p.inventory, item)}))}
        baseItems={baseItems} setBaseItems={(items) => { setBaseItems(items); const newItem = items[items.length - 1]; if(newItem) saveSystemData('item', newItem); }}
        materials={materials} setMaterials={setMaterials} modifiers={modifiers} setModifiers={(mods) => { setModifiers(mods); }}
        marketItems={marketItems} setMarketItems={setMarketItems} globalConfig={globalConfig} setGlobalConfig={setGlobalConfig}
        regions={regions} onAddRegion={r => setRegions(prev => [...prev, r])} locations={locations} onAddLocation={l => setLocations(p => [...p, l])} onDeleteLocation={id => setLocations(p => p.filter(l => l.id !== id))}
        onBanUser={() => setPlayer(DEFAULT_PLAYER_TEMPLATE)} onEditUser={(id, updates) => { setPlayer(p => ({...p, ...updates})); updateProfile(id, updates); }} 
        onGivePremium={(id, days) => setPlayer(p => ({...p, premiumUntil: Date.now() + days*86400000}))} onAddAnnouncement={(ann) => setAnnouncements(prev => [ann, ...prev])}
        enemyTemplates={enemyTemplates} onAddEnemyTemplate={() => {}} onDeleteEnemyTemplate={() => {}} currentPlayerId={player.id} 
        activeEvent={activeEvent} onUpdateEvent={(e) => { setActiveEvent(e); saveSystemData('event', e); }}
        onAddGold={() => setPlayer(p => ({...p, gold: p.gold + 1000}))} onLevelUp={() => setPlayer(p => ({...p, currentXp: p.maxXp}))} onHeal={() => setPlayer(p => ({...p, hp: p.maxHp}))}
      />

      <Guide isOpen={showGuide} onClose={() => setShowGuide(false)} />
      <Mailbox isOpen={showMailbox} onClose={() => setShowMailbox(false)} player={player} onDeleteMessage={id => setPlayer(p => ({...p, messages: p.messages.filter(m => m.id !== id)}))} onDeleteReport={id => setPlayer(p => ({...p, reports: p.reports.filter(r => r.id !== id)}))} onBatchDeleteMessages={ids => setPlayer(p => ({...p, messages: p.messages.filter(m => !ids.includes(m.id))}))} onBatchDeleteReports={ids => setPlayer(p => ({...p, reports: p.reports.filter(r => !ids.includes(r.id))}))} announcements={announcements} />

      {/* SUPPORT MODAL */}
      {showSupport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="parchment-panel p-6 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.8)] relative rounded animate-fade-in">
                  <button onClick={() => setShowSupport(false)} className="absolute top-3 right-3 text-[#8b5a2b] hover:text-red-700"><X size={24}/></button>
                  <h3 className="text-2xl font-bold text-[#5e3b1f] mb-4 flex items-center gap-2 cinzel border-b border-[#8b5a2b] pb-2">
                      <MessageSquare size={24}/> Destek & Bildirim
                  </h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold block mb-1 text-[#2c1810] uppercase">Kategori</label>
                          <select value={supportCategory} onChange={e => setSupportCategory(e.target.value as any)} className="w-full bg-[#f3e5ab] border-2 border-[#8b5a2b] rounded p-2 outline-none text-[#2c1810] font-serif shadow-inner">
                              <option value="bug">Hata / Bug</option>
                              <option value="cheat">Hile Bildirimi</option>
                              <option value="suggestion">Öneri</option>
                              <option value="complaint">Şikayet</option>
                              <option value="other">Diğer</option>
                          </select>
                      </div>
                      <div>
                          <label className="text-xs font-bold block mb-1 text-[#2c1810] uppercase">Konu</label>
                          <input type="text" value={supportSubject} onChange={e => setSupportSubject(e.target.value)} className="w-full bg-[#f3e5ab] border-2 border-[#8b5a2b] rounded p-2 outline-none text-[#2c1810] font-serif shadow-inner" placeholder="Konu başlığı..." />
                      </div>
                      <div>
                          <label className="text-xs font-bold block mb-1 text-[#2c1810] uppercase">Mesajınız</label>
                          <textarea value={supportMessage} onChange={e => setSupportMessage(e.target.value)} className="w-full bg-[#f3e5ab] border-2 border-[#8b5a2b] rounded p-2 h-32 resize-none outline-none text-[#2c1810] font-serif shadow-inner" placeholder="Detaylı açıklama..."></textarea>
                      </div>
                      <button onClick={submitSupportTicket} className="roman-btn w-full py-3 rounded flex items-center justify-center gap-2 font-bold text-sm">
                          <Send size={16}/> Gönder
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- SIDEBAR: ROMAN COLUMN --- */}
      <aside className={`fixed inset-y-0 left-0 w-56 bg-[#1a1008] border-r-4 border-[#3e2714] transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-50 flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.8)] bg-[url('https://www.transparenttextures.com/patterns/dark-stone.png')]`}>
          {/* Sidebar Top / Logo Area */}
          <div className="p-4 flex flex-col items-center border-b-4 border-[#3e2714] bg-black/30 relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-[#c5a059]"></div>
              <div className="w-20 h-20 rounded-full border-4 border-[#c5a059] overflow-hidden mb-2 shadow-[0_0_20px_rgba(197,160,89,0.4)] bg-black">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Spartacus" className="w-full h-full object-cover" />
              </div>
              <h1 className="cinzel font-black text-xl text-[#c5a059] text-shadow text-center leading-none tracking-widest drop-shadow-md">
                  ARENA<br/><span className="text-xs text-[#8b5a2b]">OF LEGENDS</span>
              </h1>
          </div>

          {/* Navigation Buttons */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {[
                  { id: 'character', icon: User, label: 'Genel Durum' },
                  { id: 'expedition', icon: Map, label: 'Seferler' },
                  { id: 'arena', icon: Skull, label: 'Arena' },
                  { id: 'pvp', icon: Swords, label: 'Sirk Turma' },
                  { id: 'blacksmith', icon: Hammer, label: 'Demirci' },
                  { id: 'market', icon: ShoppingBag, label: 'Pazar Yeri' },
                  { id: 'bank', icon: Landmark, label: 'Kasa' },
                  { id: 'leaderboard', icon: Trophy, label: 'Yüksek Skor' }
              ].map(item => (
                  <button 
                      key={item.id} 
                      onClick={() => handleViewChange(item.id as View)} 
                      className={`
                          w-full flex items-center gap-2 p-2 rounded-sm border-2 transition-all duration-150 group relative overflow-hidden font-bold cinzel text-xs
                          ${currentView === item.id 
                              ? 'bg-[#5e3b1f] border-[#c5a059] text-[#f3e5ab] shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]' 
                              : 'bg-[#2b1d12] border-[#5e3b1f] text-[#a08b75] hover:text-[#f3e5ab] hover:border-[#8b5a2b] hover:bg-[#3e2714]'}
                      `}
                  >
                      <item.icon size={16} className={`ml-1 transition-transform group-hover:scale-110 ${currentView === item.id ? 'text-[#c5a059]' : 'text-[#705030]'}`} /> 
                      <span className="tracking-wide z-10 text-shadow">{item.label}</span>
                  </button>
              ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t-4 border-[#3e2714] space-y-1 bg-black/40">
              <button onClick={() => setShowGuide(true)} className="w-full flex items-center gap-2 p-1.5 hover:text-[#f3e5ab] text-[#8b5a2b] text-[10px] transition-colors font-bold cinzel">
                  <HelpCircle size={12}/> Oyun Rehberi
              </button>
              <button onClick={() => setShowSupport(true)} className="w-full flex items-center gap-2 p-1.5 hover:text-[#f3e5ab] text-[#8b5a2b] text-[10px] transition-colors font-bold cinzel">
                  <AlertCircle size={12}/> Destek
              </button>
              <button onClick={handleLogout} className="w-full flex items-center gap-2 p-1.5 hover:text-red-400 text-red-700 text-[10px] mt-1 transition-colors font-bold cinzel">
                  <LogOut size={12}/> Çıkış
              </button>
          </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 md:ml-56 flex flex-col h-full relative bg-[#0c0a09]">
          
          {/* --- ORNATE HEADER (GLADIATUS STYLE) --- */}
          <header className="h-20 bg-[#2b1d12] border-b-4 border-[#c5a059] flex items-center px-4 z-40 relative shadow-2xl bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]">
              
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-[#c5a059] mr-4"><Menu/></button>

              <div className="flex flex-1 items-center justify-between">
                  {/* Left: Quick Actions */}
                  <div className="flex gap-2">
                      <button onClick={() => setShowMailbox(true)} className="relative group bg-[#1a0f0a] border border-[#5e3b1f] p-1.5 rounded hover:border-[#c5a059]">
                          <Scroll size={20} className="text-[#c5a059]" />
                          {reportCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-black">{reportCount}</span>}
                      </button>
                      <button onClick={() => setShowMailbox(true)} className="relative group bg-[#1a0f0a] border border-[#5e3b1f] p-1.5 rounded hover:border-[#c5a059]">
                          <Mail size={20} className="text-[#c5a059]" />
                          {msgCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-black">{msgCount}</span>}
                      </button>
                      <button onClick={() => handleViewChange('character')} className="relative group bg-[#1a0f0a] border border-[#5e3b1f] p-1.5 rounded hover:border-[#c5a059]">
                          <Briefcase size={20} className="text-[#c5a059]" />
                      </button>
                  </div>

                  {/* Center: Stats & Resources */}
                  <div className="flex items-center gap-6 bg-[#1a0f0a]/50 p-2 rounded-xl border border-[#3e2714]">
                      {/* Gold */}
                      <div className="flex flex-col items-center leading-none">
                          <div className="flex items-center gap-1 text-[#f3e5ab] font-bold text-sm drop-shadow-md">
                              <Coins size={14} className="text-[#c5a059]"/> {player.gold.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1 text-red-400 text-xs font-bold drop-shadow-md">
                              <Diamond size={10}/> 5
                          </div>
                      </div>

                      {/* Level & HP */}
                      <div className="flex flex-col min-w-[120px]">
                          <div className="flex justify-between text-[9px] font-bold text-[#c5a059] uppercase mb-0.5">
                              <span>Can</span> <span>{Math.floor((player.hp/player.maxHp)*100)}%</span>
                          </div>
                          <div className="h-2 bg-black border border-[#5e3b1f] rounded-full overflow-hidden mb-1">
                              <div className="h-full bg-red-700" style={{width: `${Math.max(0, (player.hp/player.maxHp)*100)}%`}}></div>
                          </div>
                          <div className="flex justify-between text-[9px] font-bold text-[#c5a059] uppercase mb-0.5">
                              <span>Tecrübe</span> <span>{Math.floor((player.currentXp/player.maxXp)*100)}%</span>
                          </div>
                          <div className="h-2 bg-black border border-[#5e3b1f] rounded-full overflow-hidden">
                              <div className="h-full bg-yellow-600" style={{width: `${Math.min(100, (player.currentXp/player.maxXp)*100)}%`}}></div>
                          </div>
                      </div>
                  </div>

                  {/* Right: Points */}
                  <div className="flex gap-4">
                      {/* Expedition */}
                      <div className="bg-[#1a0f0a] border border-[#5e3b1f] rounded px-3 py-1 flex flex-col items-center min-w-[80px]">
                          <div className="flex items-center gap-1 text-[#c5a059]">
                              <Swords size={14}/> 
                              <span className="font-bold text-sm text-white">{player.expeditionPoints} / {player.maxExpeditionPoints}</span>
                          </div>
                          <button onClick={() => handleViewChange('expedition')} className="text-[9px] text-[#2e7d32] font-bold hover:underline">Sefer'e Geç</button>
                      </div>
                      
                      {/* Arena */}
                      <div className="bg-[#1a0f0a] border border-[#5e3b1f] rounded px-3 py-1 flex flex-col items-center min-w-[80px]">
                          <div className="flex items-center gap-1 text-[#c5a059]">
                              <Skull size={14}/> 
                              <span className="font-bold text-sm text-white">Hazır</span>
                          </div>
                          <button onClick={() => handleViewChange('arena')} className="text-[9px] text-[#2e7d32] font-bold hover:underline">Arena'ya Geç</button>
                      </div>
                  </div>

                  {(player.role === 'admin' || player.role === 'moderator') && (
                      <button onClick={() => setShowAdmin(true)} className="text-[#a08b75] hover:text-[#f3e5ab] transition-colors"><Settings size={20} /></button>
                  )}
              </div>
          </header>

          {/* Sub Menu (Visual only for now) */}
          <div className="h-8 bg-[#3e2714] border-b-2 border-[#5e3b1f] flex items-center justify-center gap-1 px-4 shadow-inner">
              <button className="px-4 h-full text-[#f3e5ab] text-[10px] font-bold uppercase hover:bg-[#5e3b1f] border-r border-[#5e3b1f]">Genel Durum</button>
              <button className="px-4 h-full text-[#a08b75] text-[10px] font-bold uppercase hover:bg-[#5e3b1f] hover:text-[#f3e5ab] border-r border-[#5e3b1f]">İstatistikler</button>
              <button className="px-4 h-full text-[#a08b75] text-[10px] font-bold uppercase hover:bg-[#5e3b1f] hover:text-[#f3e5ab] border-r border-[#5e3b1f]">Zaferler</button>
              <button className="px-4 h-full text-[#a08b75] text-[10px] font-bold uppercase hover:bg-[#5e3b1f] hover:text-[#f3e5ab]">Aile</button>
          </div>

          {/* VIEWPORT (Parchment Background) */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative z-10 bg-[url('https://www.transparenttextures.com/patterns/parchment.png')] bg-[#eaddcf]">
                <div className="max-w-6xl mx-auto">
                    {currentView === 'character' && (
                        <CharacterProfile 
                            player={player} onUpgradeStat={(stat) => { if(player.statPoints > 0) { setPlayer(p => ({...p, statPoints: p.statPoints - 1, stats: {...p.stats, [stat]: p.stats[stat] + 1}})); } }} 
                            onEquip={handleEquipItem} onUnequip={handleUnequipItem} onDelete={item => setPlayer(p => ({...p, inventory: removeFromInventory(p.inventory, item.id)}))}
                            onSell={item => { setPlayer(p => ({...p, gold: p.gold + calculateSellPrice(item), inventory: removeFromInventory(p.inventory, item.id)})); addToast("Satıldı", "success"); }}
                            onUse={handleUseItem} onUpdateBio={bio => { setPlayer(p => ({...p, bio})); addToast("Biyografi güncellendi", "success"); }}
                        />
                    )}
                    {currentView === 'expedition' && (
                        <Expedition player={player} regions={regions} locations={locations} onStartExpedition={handleStartExpedition} isBusy={!!player.activeExpedition} />
                    )}
                    {currentView === 'blacksmith' && (
                        <Blacksmith inventory={player.inventory} playerGold={player.gold} jobs={player.blacksmithQueue} learnedModifiers={player.learnedModifiers} onStartJob={handleStartJob} onClaimJob={handleClaimJob} />
                    )}
                    {currentView === 'arena' && (
                        <Arena player={player} isBusy={isBusy} battleState={arenaBattle} onSearch={handlePveSearch} onStart={handleArenaStart} onReset={handleArenaReset} />
                    )}
                    {currentView === 'pvp' && (
                        <PvpArena player={player} isBusy={isBusy} battleState={arenaBattle} onSearch={handlePvpStart} onStart={handleArenaStart} onReset={handleArenaReset} />
                    )}
                    {currentView === 'bank' && (
                        <Bank player={player} onDeposit={(amount) => { if(player.gold < amount) return; const deposit = { id: Date.now().toString(), amount: Math.floor(amount * 0.98), startTime: Date.now(), endTime: Date.now() + (7 * 24 * 60 * 60 * 1000), interestRate: 0, status: 'active' as const }; setPlayer(p => ({ ...p, gold: p.gold - amount, bankDeposits: [...p.bankDeposits, deposit] })); addToast(`%2 komisyonla ${amount} kasaya kaldırıldı.`, "success"); }} onCancelDeposit={(id) => { const deposit = player.bankDeposits.find(d => d.id === id); if(!deposit) return; setPlayer(p => ({ ...p, gold: p.gold + deposit.amount, bankDeposits: p.bankDeposits.filter(d => d.id !== id) })); addToast("Kasa kilidi açıldı, altın iade edildi.", "info"); }} onClaimDeposit={(id) => { const deposit = player.bankDeposits.find(d => d.id === id); if(!deposit) return; if(Date.now() < deposit.endTime) return; setPlayer(p => ({ ...p, gold: p.gold + deposit.amount, bankDeposits: p.bankDeposits.filter(d => d.id !== id) })); addToast(`Kasa süresi doldu! ${deposit.amount} Altın alındı.`, "success"); }} />
                    )}
                    {currentView === 'market' && <Market playerGold={player.gold} items={marketItems} onBuy={handleMarketBuy} />}
                    {currentView === 'leaderboard' && (
                        <Leaderboard currentUser={player} onAttack={handlePvpStart} />
                    )}
                </div>
          </div>
      </main>
    </div>
  );
}

export default App;
