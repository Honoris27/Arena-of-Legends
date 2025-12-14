

export type StatType = 'STR' | 'AGI' | 'VIT' | 'INT' | 'LUK';

export interface Stats {
  STR: number;
  AGI: number;
  VIT: number;
  INT: number;
  LUK: number;
}

export type Role = 'admin' | 'moderator' | 'player';

export type ItemType = 'weapon' | 'armor' | 'helmet' | 'boots' | 'gloves' | 'shield' | 'ring' | 'necklace' | 'earring' | 'belt' | 'material' | 'consumable' | 'scroll';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type BonusType = 'FLAT' | 'PERCENT' | 'MULTIPLIER';
export type GameMode = 'GLOBAL' | 'ARENA' | 'EXPEDITION' | 'BOSS';

// --- GLOBAL CONFIG (NEW) ---
export interface GlobalConfig {
    startingLevel: number;
    startingGold: number;
    startingStatPoints: number;
    startingStats: Stats;
    startingInventory: string[]; // IDs of BaseItems
}

// --- COMPLEX MODIFIER TYPES (GDD) ---

export interface ModifierBonus {
    stat: StatType | 'CRIT_CHANCE' | 'CRIT_DAMAGE' | 'ARMOR_PEN' | 'LIFESTEAL' | 'DODGE' | 'DAMAGE_REDUCTION' | 'GOLD_GAIN' | 'XP_GAIN' | 'DROP_CHANCE';
    value: number;
    type: BonusType;
    mode: GameMode;
}

export interface ItemModifier {
    id: string;
    name: string; // e.g. "Arenanın"
    type: 'prefix' | 'suffix';
    minLevel: number;
    rarity: ItemRarity;
    allowedTypes: ItemType[] | 'ALL';
    bonuses: ModifierBonus[]; // List of bonuses
    fragmentCost: number;
    isAiOnly?: boolean;
    isActive: boolean;
}

export interface BaseItem {
    id: string;
    name: string;
    type: ItemType;
    minLevel: number;
    baseStats: Partial<Stats>;
}

export interface ItemMaterial {
    id: string;
    name: string;
    levelReq: number;
    statMultiplier: number;
    rarity: ItemRarity;
}

// --- EVENT SYSTEM ---
export interface GameEvent {
    id: string;
    title: string;
    isActive: boolean;
    startTime?: number; // Timestamp
    endTime?: number;   // Timestamp
    // Multipliers (1.0 = normal)
    xpMultiplier: number;
    goldMultiplier: number;
    dropRateMultiplier: number;
    expeditionTimeMultiplier: number; // e.g. 0.5 for half time
    scrollDropChance: number; // Bonus probability e.g. 0.1 for +10%
    salvageYieldMultiplier: number; 
    color?: string;
}

// -------------------------------------

export interface Item {
  id: string; // Unique instance ID
  templateId?: string; // ID of the base/template if applicable
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  stats: Partial<Stats>;
  bonuses?: ModifierBonus[]; // Calculated final bonuses
  value: number;
  description?: string;
  upgradeLevel: number;
  
  // Stacking Logic
  count: number;
  
  // Requirements
  reqLevel?: number;
  reqStat?: { stat: StatType, value: number };
  
  // Metadata for scrolls/crafting
  linkedModifierId?: string; 
}

export interface Equipment {
  weapon: Item | null;
  shield: Item | null; 
  helmet: Item | null;
  armor: Item | null;
  gloves: Item | null;
  boots: Item | null;
  necklace: Item | null; 
  ring: Item | null; 
  earring: Item | null; 
  belt: Item | null; 
}

export interface BlacksmithJob {
    id: string;
    type: 'upgrade' | 'salvage' | 'craft';
    startTime: number;
    duration: number; // in ms
    item?: Item; // Item being worked on
    resultItem?: Item; // The item to claim
    rewards?: { gold?: number, items?: Item[] }; // For salvage rewards
    status: 'working' | 'completed';
}

export interface Message {
    id: string;
    senderId: string;
    sender: string;
    recipientId?: string; // Optional for compatibility with old msgs
    recipientName?: string;
    subject: string;
    content: string;
    timestamp: number;
    read: boolean;
    type?: 'inbox' | 'sent'; // New field to distinguish
}

export interface CombatReport {
    id: string;
    title: string;
    details: string[]; 
    rewards: string;
    timestamp: number;
    type: 'expedition' | 'arena' | 'defense';
    outcome: 'victory' | 'defeat';
    read: boolean;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    timestamp: number;
    type: 'event' | 'update' | 'general';
}

export interface ActiveExpedition {
    locationId: string;
    locationName: string;
    startTime: number;
    endTime: number;
    isBoss: boolean;
    rewardMultiplier: number;
}

export interface BankDeposit {
    id: string;
    amount: number;
    startTime: number;
    endTime: number; // 7 days later
    interestRate: number; // e.g. 0.10 for 10%
    status: 'active' | 'completed' | 'cancelled';
}

export interface Player {
  id: string;
  name: string;
  role: Role; 
  bio?: string;
  level: number;
  currentXp: number;
  maxXp: number;
  gold: number;
  wins: number;
  stats: Stats;
  statPoints: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  avatarUrl: string;
  equipment: Equipment;
  inventory: Item[];
  isBanned?: boolean;
  
  // New PvP Stats
  honor: number;
  victoryPoints: number;
  piggyBank: number; // For League Leader mechanic
  rank: number; // League Rank (1 is best)
  lastIncomeTime: number; // Timestamp for 10min passive income
  
  // Resources
  expeditionPoints: number;
  maxExpeditionPoints: number;
  nextPointRegenTime: number; 
  nextExpeditionTime: number; 
  
  // Active Action State (Persisted)
  activeExpedition: ActiveExpedition | null;

  // Crafting
  learnedModifiers: string[]; 
  blacksmithQueue: BlacksmithJob[];
  blacksmithSlots: number;

  // Banking
  bankDeposits: BankDeposit[];

  premiumUntil: number;

  messages: Message[];
  reports: CombatReport[];
}

export interface EnemyTemplate {
    id: string;
    name: string;
    minLevel: number;
    maxLevel: number;
    statsMultiplier: number;
    isBoss: boolean;
    description: string;
}

export interface Enemy {
  id?: string; // Optional ID if it's a real player
  name: string;
  level: number;
  stats: Stats;
  maxHp: number;
  hp: number;
  description?: string;
  isBoss?: boolean;
  gold?: number; // For stealing
  isPlayer?: boolean; // Flag to differentiate mobs from players
  piggyBank?: number;
  rank?: number; // PvP Rank
  avatarUrl?: string;
}

export interface Region {
    id: string;
    name: string;
    minLevel: number;
    description: string;
    imageUrl?: string;
}

export interface ExpeditionLocation {
    id: string;
    regionId: string;
    name: string;
    minLevel: number;
    duration: number; 
    desc: string;
    risk: string;
    rewardRate: number; 
    difficultyScore: number; // 1-5 for Victory Points
}

export interface RankEntry {
    id?: string;
    rank: number;
    name: string;
    level: number;
    wins: number;
    honor: number;
    victoryPoints: number;
    avatar: string;
    bio?: string;
    stats?: Stats;
    equipment?: Equipment; // Added for inspection
}

export interface MarketItem {
    id: string;
    name: string;
    type: ItemType | 'premium';
    price: number;
    description: string;
    effect?: string;
    icon?: string;
}

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'loot';
    duration?: number;
}

export interface ArenaBattleState {
    mode: 'pve' | 'pvp'; 
    enemy: Enemy | null;
    logs: string[];
    isFighting: boolean;
    round: number;
}

export interface LeagueInfo {
    id: string;
    name: string;
    minLevel: number;
    maxLevel: number;
    passiveGold: number;
}