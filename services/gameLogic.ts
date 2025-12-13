
import { Player, Enemy, Stats, Item, ItemType, ItemRarity } from '../types';

export const isPremium = (player: Player): boolean => {
    return player.premiumUntil > Date.now();
};

export const getExpeditionConfig = (player: Player) => {
    const premium = isPremium(player);
    return {
        maxPoints: premium ? 23 : 15, 
        cooldownSeconds: premium ? 60 : 120, 
        regenSeconds: 15 * 60 
    };
};

export const formatTime = (ms: number): string => {
    if (ms <= 0) return "00:00";
    const totalSeconds = Math.ceil(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const calculateMaxXp = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

export const calculateMaxHp = (vit: number, level: number): number => {
  return 100 + (vit * 10) + (level * 20);
};

export const calculateMaxMp = (int: number, level: number): number => {
  return 50 + (int * 5) + (level * 10);
};

export const getPlayerTotalStats = (player: Player): Stats => {
  const totalStats = { ...player.stats };
  
  // Add equipment stats
  Object.values(player.equipment).forEach((item) => {
    if (item && item.stats) {
      if (item.stats.STR) totalStats.STR += item.stats.STR;
      if (item.stats.AGI) totalStats.AGI += item.stats.AGI;
      if (item.stats.VIT) totalStats.VIT += item.stats.VIT;
      if (item.stats.INT) totalStats.INT += item.stats.INT;
      if (item.stats.LUK) totalStats.LUK += item.stats.LUK;
    }
  });

  return totalStats;
};

export const canEquipItem = (player: Player, item: Item): { can: boolean, reason?: string } => {
    if (item.reqLevel && player.level < item.reqLevel) {
        return { can: false, reason: `Gereken Seviye: ${item.reqLevel}` };
    }
    if (item.reqStat) {
        const currentStat = player.stats[item.reqStat.stat];
        if (currentStat < item.reqStat.value) {
             return { can: false, reason: `Gereken ${item.reqStat.stat}: ${item.reqStat.value}` };
        }
    }
    return { can: true };
};

export const calculateDamage = (attackerStats: Stats, defenderStats: Stats): number => {
  const baseDamage = attackerStats.STR * 1.5;
  const mitigation = defenderStats.VIT * 0.5;
  const variation = Math.random() * 0.2 + 0.9; 

  const critChance = (attackerStats.LUK + attackerStats.AGI) * 0.01;
  const isCrit = Math.random() < critChance;

  let damage = Math.max(1, (baseDamage - mitigation) * variation);
  if (isCrit) damage *= 2;

  return Math.floor(damage);
};

export const generateEnemy = (playerLevel: number, isBoss: boolean = false): Enemy => {
  const levelVariation = isBoss ? 5 : Math.floor(Math.random() * 3) - 1; 
  const level = Math.max(1, playerLevel + levelVariation);
  
  const multiplier = isBoss ? 5 : 3;
  const baseStat = level * multiplier;
  
  const stats: Stats = {
    STR: Math.floor(baseStat + Math.random() * baseStat * 0.5),
    AGI: Math.floor(baseStat + Math.random() * baseStat * 0.5),
    VIT: Math.floor(baseStat + Math.random() * baseStat * 0.5),
    INT: Math.floor(baseStat + Math.random() * baseStat * 0.5),
    LUK: Math.floor(baseStat + Math.random() * baseStat * 0.5),
  };

  const maxHp = calculateMaxHp(stats.VIT, level) * (isBoss ? 3 : 1);

  return {
    name: isBoss ? "MAĞARA EJDERHASI (BOSS)" : "Bilinmeyen Düşman",
    level,
    stats,
    maxHp,
    hp: maxHp,
    isBoss
  };
};

const ITEM_TYPES: ItemType[] = ['weapon', 'shield', 'helmet', 'armor', 'gloves', 'boots', 'ring', 'necklace', 'earring', 'belt'];

export const generateRandomItem = (level: number, forceRarity?: ItemRarity): Item => {
  const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
  
  // Rarity calculation
  let rarity: ItemRarity = 'common';
  if (forceRarity) {
      rarity = forceRarity;
  } else {
      const roll = Math.random();
      if (roll > 0.98) rarity = 'legendary';
      else if (roll > 0.90) rarity = 'epic';
      else if (roll > 0.75) rarity = 'rare';
      else if (roll > 0.50) rarity = 'uncommon';
  }

  const multiplierMap = { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 };
  const multiplier = multiplierMap[rarity];
  
  // Base stat value heavily influenced by level
  const baseStatVal = Math.max(1, Math.floor((level * 0.5 + Math.random() * 2) * multiplier));

  const stats: Partial<Stats> = {};
  
  // Primary Stats per Type
  if (type === 'weapon') stats.STR = baseStatVal;
  if (type === 'shield') { stats.VIT = baseStatVal; stats.STR = Math.floor(baseStatVal * 0.3); }
  if (type === 'armor') stats.VIT = baseStatVal;
  if (type === 'helmet') stats.VIT = Math.max(1, Math.floor(baseStatVal * 0.7));
  if (type === 'gloves') stats.AGI = Math.max(1, Math.floor(baseStatVal * 0.7));
  if (type === 'boots') stats.AGI = Math.max(1, Math.floor(baseStatVal * 0.7));
  if (type === 'belt') { stats.VIT = Math.floor(baseStatVal * 0.5); stats.STR = Math.floor(baseStatVal * 0.3); }
  if (type === 'ring') { stats.LUK = Math.floor(baseStatVal * 0.8); stats.STR = Math.floor(baseStatVal * 0.2); }
  if (type === 'necklace') { stats.INT = Math.floor(baseStatVal * 0.8); stats.VIT = Math.floor(baseStatVal * 0.2); }
  if (type === 'earring') { stats.INT = Math.floor(baseStatVal * 0.5); stats.AGI = Math.floor(baseStatVal * 0.5); }

  // Add random secondary stat for higher rarities (Drop Quality)
  if (rarity !== 'common' && rarity !== 'uncommon') {
     const secondary = ['STR', 'AGI', 'VIT', 'INT', 'LUK'][Math.floor(Math.random() * 5)] as keyof Stats;
     stats[secondary] = (stats[secondary] || 0) + Math.floor(baseStatVal * 0.5);
  }

  const namePrefixes: Record<string, string[]> = {
    weapon: ['Kılıç', 'Balta', 'Mızrak', 'Gürz'],
    shield: ['Kalkan', 'Siper'],
    armor: ['Zırh', 'Göğüslük', 'Cübbe'],
    helmet: ['Miğfer', 'Başlık', 'Kukuleta'],
    gloves: ['Eldiven', 'Elcik'],
    boots: ['Çizme', 'Ayakkabı'],
    belt: ['Kemer', 'Kuşak'],
    ring: ['Yüzük', 'Halka'],
    necklace: ['Kolye', 'Tılsım'],
    earring: ['Küpe'],
    material: [],
    consumable: []
  };

  const rarityPrefixes = {
    common: 'Eski',
    uncommon: 'Sağlam',
    rare: 'Büyülü',
    epic: 'Kadim',
    legendary: 'Efsanevi'
  };

  const baseName = namePrefixes[type] 
    ? namePrefixes[type][Math.floor(Math.random() * namePrefixes[type].length)] 
    : 'Eşya';
    
  const fullName = `${rarityPrefixes[rarity]} ${baseName}`;

  // Requirements logic: Higher rarity/level items need more stats
  let reqLevel = Math.max(1, level - 2);
  if (rarity === 'epic') reqLevel = level;
  if (rarity === 'legendary') reqLevel = level + 2;

  return {
    id: Math.random().toString(36).substr(2, 9),
    name: fullName,
    type,
    rarity,
    stats,
    value: baseStatVal * 10 * multiplier,
    description: `${rarity.toUpperCase()} ${type}`,
    upgradeLevel: 0,
    reqLevel
  };
};

export const calculateUpgradeCost = (item: Item): number => {
    const rarityMult = { common: 1, uncommon: 1.2, rare: 1.5, epic: 2, legendary: 3 };
    const baseCost = Math.max(50, Math.floor(item.value / 2));
    return Math.floor(baseCost * (item.upgradeLevel + 1) * rarityMult[item.rarity]);
};

export const calculateSuccessRate = (item: Item, bonus: number = 0): number => {
    const baseRate = Math.max(10, 100 - (item.upgradeLevel * 10));
    return Math.min(100, baseRate + bonus);
};

export const calculateSellPrice = (item: Item): number => {
    return Math.max(1, Math.floor(item.value * 0.4));
};

export const upgradeItem = (item: Item): Item => {
    const newStats = { ...item.stats };
    
    (Object.keys(newStats) as Array<keyof Stats>).forEach(key => {
        if (newStats[key]) {
            newStats[key] = Math.ceil(newStats[key]! * 1.1) + 1;
        }
    });

    return {
        ...item,
        stats: newStats,
        upgradeLevel: item.upgradeLevel + 1,
        value: Math.floor(item.value * 1.2) 
    };
};
