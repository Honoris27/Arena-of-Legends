
import { Player, Enemy, Stats, Item, ItemType, ItemRarity, BaseItem, ItemMaterial, ItemModifier, StatType, ModifierBonus } from '../types';

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
  
  Object.values(player.equipment).forEach((item) => {
    if (item) {
        // Add basic stats
        if (item.stats.STR) totalStats.STR += item.stats.STR;
        if (item.stats.AGI) totalStats.AGI += item.stats.AGI;
        if (item.stats.VIT) totalStats.VIT += item.stats.VIT;
        if (item.stats.INT) totalStats.INT += item.stats.INT;
        if (item.stats.LUK) totalStats.LUK += item.stats.LUK;
        
        // Add Bonus Stats (Flat only for basic view, percentages applied in combat calc)
        if (item.bonuses) {
            item.bonuses.forEach(b => {
                if (b.mode === 'GLOBAL' && b.type === 'FLAT' && ['STR','AGI','VIT','INT','LUK'].includes(b.stat)) {
                     totalStats[b.stat as StatType] += b.value;
                }
            });
        }
    }
  });

  return totalStats;
};

export const canEquipItem = (player: Player, item: Item): { can: boolean, reason?: string } => {
    if (item.reqLevel && player.level < item.reqLevel) {
        return { can: false, reason: `Gereken Seviye: ${item.reqLevel}` };
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

// --- DATA ---

export const INITIAL_BASE_ITEMS: BaseItem[] = [
    { id: 'bi1', name: 'Kılıç', type: 'weapon', minLevel: 1, baseStats: { STR: 5 } },
    { id: 'bi2', name: 'Balta', type: 'weapon', minLevel: 3, baseStats: { STR: 8 } },
    { id: 'bi10', name: 'Deri Zırh', type: 'armor', minLevel: 1, baseStats: { VIT: 4 } },
    { id: 'bi11', name: 'Bronz Zırh', type: 'armor', minLevel: 5, baseStats: { VIT: 8 } },
    { id: 'bi40', name: 'Bronz Yüzük', type: 'ring', minLevel: 1, baseStats: { LUK: 2 } },
];

export const INITIAL_MATERIALS: ItemMaterial[] = [
    { id: 'mat1', name: 'Deri', levelReq: 1, statMultiplier: 1.0, rarity: 'common' },
    { id: 'mat2', name: 'Bronz', levelReq: 5, statMultiplier: 1.2, rarity: 'common' },
    { id: 'mat3', name: 'Demir', levelReq: 10, statMultiplier: 1.5, rarity: 'uncommon' },
    { id: 'mat4', name: 'Çelik', levelReq: 15, statMultiplier: 1.8, rarity: 'uncommon' },
    { id: 'mat5', name: 'Mithril', levelReq: 25, statMultiplier: 2.5, rarity: 'rare' },
];

export const INITIAL_MODIFIERS: ItemModifier[] = [
    { 
        id: 'mod1', name: 'Güçlü', type: 'prefix', minLevel: 1, rarity: 'common', allowedTypes: ['weapon'], 
        isActive: true, fragmentCost: 20,
        bonuses: [{ stat: 'STR', value: 3, type: 'FLAT', mode: 'GLOBAL' }]
    },
    { 
        id: 'mod2', name: 'Arenanın', type: 'suffix', minLevel: 5, rarity: 'rare', allowedTypes: 'ALL', 
        isActive: true, fragmentCost: 50,
        bonuses: [
            { stat: 'STR', value: 2, type: 'FLAT', mode: 'GLOBAL' },
            { stat: 'CRIT_CHANCE', value: 5, type: 'PERCENT', mode: 'ARENA' }
        ]
    }
];

// --- GENERATOR LOGIC ---

export const generateDynamicItem = (
    targetLevel: number, 
    baseItems: BaseItem[], 
    materials: ItemMaterial[], 
    modifiers: ItemModifier[],
    forceRarity?: ItemRarity,
    fixedPrefix?: ItemModifier,
    fixedSuffix?: ItemModifier
): Item => {
    
    // 1. Determine Rarity
    let rarity: ItemRarity = forceRarity || 'common';
    if (!forceRarity) {
        const roll = Math.random();
        if (roll > 0.98) rarity = 'legendary';
        else if (roll > 0.90) rarity = 'epic';
        else if (roll > 0.75) rarity = 'rare';
        else if (roll > 0.50) rarity = 'uncommon';
    }

    // 2. Select Base Item (+/- 5 levels)
    const validBaseItems = baseItems.filter(i => Math.abs(i.minLevel - targetLevel) < 10);
    const baseItem = validBaseItems.length > 0 
        ? validBaseItems[Math.floor(Math.random() * validBaseItems.length)]
        : baseItems[Math.floor(Math.random() * baseItems.length)];

    // 3. Select Material
    const validMaterials = materials.filter(m => m.levelReq <= targetLevel + 5);
    const material = validMaterials.length > 0
        ? validMaterials[Math.floor(Math.random() * validMaterials.length)]
        : materials[0];

    // 4. Select Modifiers
    const validPrefixes = modifiers.filter(m => m.isActive && m.type === 'prefix' && (m.allowedTypes === 'ALL' || m.allowedTypes.includes(baseItem.type)) && !m.isAiOnly);
    const validSuffixes = modifiers.filter(m => m.isActive && m.type === 'suffix' && (m.allowedTypes === 'ALL' || m.allowedTypes.includes(baseItem.type)) && !m.isAiOnly);

    let prefix: ItemModifier | null = fixedPrefix || null;
    let suffix: ItemModifier | null = fixedSuffix || null;

    if (!fixedPrefix && !fixedSuffix) {
        if (rarity === 'uncommon' && Math.random() > 0.5) prefix = validPrefixes[Math.floor(Math.random() * validPrefixes.length)];
        else if (rarity === 'rare') {
            prefix = validPrefixes[Math.floor(Math.random() * validPrefixes.length)];
            if (Math.random() > 0.5) suffix = validSuffixes[Math.floor(Math.random() * validSuffixes.length)];
        } else if (rarity === 'epic' || rarity === 'legendary') {
            prefix = validPrefixes[Math.floor(Math.random() * validPrefixes.length)];
            suffix = validSuffixes[Math.floor(Math.random() * validSuffixes.length)];
        }
    }

    // 5. Calculate Stats & Bonuses
    const finalStats: Partial<Stats> = {};
    const finalBonuses: ModifierBonus[] = [];
    const matMult = material.statMultiplier;

    // Base Stats
    Object.entries(baseItem.baseStats).forEach(([key, val]) => {
        const k = key as StatType;
        if (typeof val === 'number') {
            finalStats[k] = Math.ceil(val * matMult);
        }
    });

    // Apply Modifiers
    [prefix, suffix].forEach(mod => {
        if (!mod) return;
        mod.bonuses.forEach(bonus => {
            // Flatten basic stats into the item stats for easier reading, keep complex ones in bonus array
            if (bonus.type === 'FLAT' && bonus.mode === 'GLOBAL' && ['STR','AGI','VIT','INT','LUK'].includes(bonus.stat)) {
                 const current = finalStats[bonus.stat as StatType] || 0;
                 finalStats[bonus.stat as StatType] = current + bonus.value;
            }
            finalBonuses.push(bonus);
        });
    });

    // 6. Name
    let fullName = "";
    if (material.name !== 'Deri' || baseItem.type !== 'weapon') fullName += material.name + " ";
    if (prefix) fullName += prefix.name + " ";
    fullName += baseItem.name;
    if (suffix) fullName += " " + suffix.name;

    if (material.rarity === 'legendary' || material.rarity === 'epic') {
        if (rarity !== 'legendary') rarity = material.rarity;
    }

    return {
        id: Math.random().toString(36).substr(2, 9),
        templateId: baseItem.id,
        name: fullName.trim(),
        type: baseItem.type,
        rarity: rarity,
        stats: finalStats,
        bonuses: finalBonuses,
        value: Math.floor((targetLevel * 50) * matMult * (rarity === 'legendary' ? 5 : 1)),
        description: `${rarity.toUpperCase()} ${baseItem.type} - Lv.${targetLevel}`,
        upgradeLevel: 0,
        reqLevel: Math.max(1, Math.floor(targetLevel * 0.8)),
        count: 1
    };
};

export const generateScroll = (modifier: ItemModifier): Item => {
    return {
        id: Math.random().toString(36).substr(2, 9),
        name: `${modifier.name} Parşömeni`,
        type: 'scroll',
        rarity: 'rare',
        stats: {},
        value: 100,
        description: `Bu parşömeni okuyarak '${modifier.name}' özelliğini demircide kullanmayı öğrenebilirsin.`,
        upgradeLevel: 0,
        linkedModifierId: modifier.id,
        count: 1
    };
};

export const generateFragment = (type: 'prefix' | 'suffix', amount: number): Item => {
    return {
        id: type === 'prefix' ? 'frag_prefix' : 'frag_suffix',
        name: type === 'prefix' ? 'Ön Ek Parçacığı' : 'Son Ek Parçacığı',
        type: 'material',
        rarity: 'common',
        stats: {},
        value: 10,
        description: 'Demircide yeni özellikler eklemek için kullanılır.',
        upgradeLevel: 0,
        count: amount
    };
};

export const addToInventory = (inventory: Item[], newItem: Item): Item[] => {
    const updated = [...inventory];
    if (newItem.type === 'material' || newItem.type === 'consumable') {
        const existingIdx = updated.findIndex(i => i.name === newItem.name && i.rarity === newItem.rarity);
        if (existingIdx > -1) {
            updated[existingIdx].count += newItem.count;
            return updated;
        }
    }
    updated.push(newItem);
    return updated;
};

export const removeFromInventory = (inventory: Item[], itemId: string, amount: number = 1): Item[] => {
    const updated = [];
    for (const item of inventory) {
        if (item.id === itemId) {
            if (item.count > amount) {
                updated.push({ ...item, count: item.count - amount });
            } else if (item.count === amount) {
                // Remove entirely
            } else {
                 // Not enough, but logic typically checks beforehand. Just remove.
            }
        } else {
            updated.push(item);
        }
    }
    return updated;
};

export const getFragmentCount = (inventory: Item[], type: 'prefix' | 'suffix'): number => {
    const id = type === 'prefix' ? 'frag_prefix' : 'frag_suffix';
    const item = inventory.find(i => i.id === id);
    return item ? item.count : 0;
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
    return Math.max(1, Math.floor(item.value * 0.4)) * item.count;
};

export const upgradeItem = (item: Item): Item => {
    const newStats = { ...item.stats };
    (Object.keys(newStats) as Array<keyof Stats>).forEach(key => {
        if (newStats[key]) {
            newStats[key] = Math.ceil(newStats[key]! * 1.1) + 1;
        }
    });
    return { ...item, stats: newStats, upgradeLevel: item.upgradeLevel + 1, value: Math.floor(item.value * 1.2) };
};

export const calculateSalvageReturn = (item: Item): { prefixFrag: number, suffixFrag: number } => {
    const base = item.rarity === 'legendary' ? 10 : item.rarity === 'epic' ? 5 : item.rarity === 'rare' ? 3 : 1;
    return { 
        prefixFrag: Math.floor(base + Math.random() * 3), 
        suffixFrag: Math.floor(base + Math.random() * 3) 
    };
};

export const getBlacksmithTime = (type: 'upgrade' | 'salvage' | 'craft', itemLevel: number): number => {
    // Returns MS
    const baseTime = type === 'craft' ? 10000 : type === 'salvage' ? 5000 : 3000;
    return baseTime + (itemLevel * 500);
};
