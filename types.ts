
export type StatType = 'STR' | 'AGI' | 'VIT' | 'INT' | 'LUK';

export interface Stats {
  STR: number;
  AGI: number;
  VIT: number;
  INT: number;
  LUK: number;
}

export type ItemType = 'weapon' | 'armor' | 'helmet' | 'boots' | 'gloves' | 'material' | 'consumable';
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
}

export interface Equipment {
  weapon: Item | null;
  helmet: Item | null;
  armor: Item | null;
  gloves: Item | null;
  boots: Item | null;
}

export interface Player {
  id: string;
  name: string;
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
  
  // New Expedition System Fields
  expeditionPoints: number;
  maxExpeditionPoints: number;
  nextPointRegenTime: number; // Timestamp for next point
  nextExpeditionTime: number; // Timestamp for cooldown end
  
  // Premium System
  premiumUntil: number; // Timestamp. 0 if not premium.
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
    duration: number; // In seconds (base duration)
    desc: string;
    risk: string;
    rewardRate: number; // Multiplier for gold/xp
}

export interface RankEntry {
    rank: number;
    name: string;
    level: number;
    wins: number;
    avatar: string;
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
