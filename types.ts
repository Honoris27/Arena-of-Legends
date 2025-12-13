
export type StatType = 'STR' | 'AGI' | 'VIT' | 'INT' | 'LUK';

export interface Stats {
  STR: number;
  AGI: number;
  VIT: number;
  INT: number;
  LUK: number;
}

export type Role = 'admin' | 'moderator' | 'player';

export type ItemType = 'weapon' | 'armor' | 'helmet' | 'boots' | 'gloves' | 'shield' | 'ring' | 'necklace' | 'earring' | 'belt' | 'material' | 'consumable';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  stats: Partial<Stats>;
  value: number;
  description?: string;
  upgradeLevel: number;
  // Requirements
  reqLevel?: number;
  reqStat?: { stat: StatType, value: number };
}

export interface Equipment {
  weapon: Item | null;
  shield: Item | null; // Added
  helmet: Item | null;
  armor: Item | null;
  gloves: Item | null;
  boots: Item | null;
  necklace: Item | null; // Added
  ring: Item | null; // Added
  earring: Item | null; // Added
  belt: Item | null; // Added
}

export interface Message {
    id: string;
    sender: string;
    subject: string;
    content: string;
    timestamp: number;
    read: boolean;
}

export interface CombatReport {
    id: string;
    title: string;
    details: string[]; // Array of log lines
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

export interface Player {
  id: string;
  name: string;
  role: Role; // Added Role
  bio?: string;
  level: number;
  currentXp: number;
  maxXp: number;
  gold: number;
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
  
  expeditionPoints: number;
  maxExpeditionPoints: number;
  nextPointRegenTime: number; 
  nextExpeditionTime: number; 
  
  premiumUntil: number;

  messages: Message[];
  reports: CombatReport[];
}

export interface Enemy {
  name: string;
  level: number;
  stats: Stats;
  maxHp: number;
  hp: number;
  description?: string;
  isBoss?: boolean;
}

export interface GameLog {
  id: string;
  timestamp: number;
  message: string;
  type: 'combat' | 'expedition' | 'system' | 'loot' | 'upgrade' | 'market';
}

export enum ExpeditionDuration {
  SHORT = 1,
  MEDIUM = 5,
  LONG = 15,
  EPIC = 60
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
}

export interface RankEntry {
    id?: string;
    rank: number;
    name: string;
    level: number;
    wins: number;
    avatar: string;
    bio?: string;
    stats?: Stats;
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
