

import { Player, Enemy, Stats, Item, ItemType, ItemRarity, BaseItem, ItemMaterial, ItemModifier, StatType, ModifierBonus, GameEvent, MarketItem, GlobalConfig } from '../types';

export const isPremium = (player: Player): boolean => {
    return player.premiumUntil > Date.now();
};

export const checkEventStatus = (event: GameEvent | null): GameEvent | null => {
    if (!event) return null;
    const now = Date.now();
    
    // If it has dates, control isActive automatically
    if (event.startTime && event.endTime) {
        if (now >= event.startTime && now <= event.endTime) {
            return { ...event, isActive: true };
        } else {
            return { ...event, isActive: false };
        }
    }
    
    return event;
};

export const getExpeditionConfig = (player: Player, activeEvent?: GameEvent | null) => {
    const premium = isPremium(player);
    // Only apply multipliers if event is active
    const eventTimeMult = (activeEvent && activeEvent.isActive) ? activeEvent.expeditionTimeMultiplier : 1.0;
    
    const baseCooldown = premium ? 60 : 120;
    const finalCooldown = Math.max(10, Math.floor(baseCooldown * eventTimeMult));

    return {
        maxPoints: premium ? 23 : 15, 
        cooldownSeconds: finalCooldown, 
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
        if (item.stats.STR) totalStats.STR += item.stats.STR;
        if (item.stats.AGI) totalStats.AGI += item.stats.AGI;
        if (item.stats.VIT) totalStats.VIT += item.stats.VIT;
        if (item.stats.INT) totalStats.INT += item.stats.INT;
        if (item.stats.LUK) totalStats.LUK += item.stats.LUK;
        
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
    // 1.1 Weapons
    { id: 'w1', name: 'Kılıç', type: 'weapon', minLevel: 1, baseStats: { STR: 5 } },
    { id: 'w2', name: 'Balta', type: 'weapon', minLevel: 3, baseStats: { STR: 8 } },
    { id: 'w3', name: 'Mızrak', type: 'weapon', minLevel: 5, baseStats: { STR: 7, AGI: 2 } },
    { id: 'w4', name: 'Hançer', type: 'weapon', minLevel: 2, baseStats: { STR: 3, AGI: 5 } },
    { id: 'w5', name: 'Topuz', type: 'weapon', minLevel: 4, baseStats: { STR: 10 } },
    { id: 'w6', name: 'Çekiç', type: 'weapon', minLevel: 6, baseStats: { STR: 12 } },
    { id: 'w7', name: 'Gladyatör Kılıcı', type: 'weapon', minLevel: 10, baseStats: { STR: 15, VIT: 2 } },
    { id: 'w8', name: 'Roma Kılıcı', type: 'weapon', minLevel: 15, baseStats: { STR: 20, AGI: 5 } },

    // 1.2 Helmets
    { id: 'h1', name: 'Deri Başlık', type: 'helmet', minLevel: 1, baseStats: { VIT: 2 } },
    { id: 'h2', name: 'Bronz Miğfer', type: 'helmet', minLevel: 5, baseStats: { VIT: 5 } },
    { id: 'h3', name: 'Demir Miğfer', type: 'helmet', minLevel: 10, baseStats: { VIT: 8, STR: 1 } },
    { id: 'h4', name: 'Çelik Miğfer', type: 'helmet', minLevel: 15, baseStats: { VIT: 12, STR: 2 } },
    { id: 'h5', name: 'Gladyatör Miğferi', type: 'helmet', minLevel: 20, baseStats: { VIT: 18, STR: 4 } },

    // 1.3 Armors
    { id: 'a1', name: 'Deri Zırh', type: 'armor', minLevel: 1, baseStats: { VIT: 4 } },
    { id: 'a2', name: 'Bronz Zırh', type: 'armor', minLevel: 5, baseStats: { VIT: 8 } },
    { id: 'a3', name: 'Demir Zırh', type: 'armor', minLevel: 10, baseStats: { VIT: 12 } },
    { id: 'a4', name: 'Zincir Zırh', type: 'armor', minLevel: 12, baseStats: { VIT: 15, AGI: -1 } },
    { id: 'a5', name: 'Çelik Zırh', type: 'armor', minLevel: 15, baseStats: { VIT: 20 } },
    { id: 'a6', name: 'Gladyatör Zırhı', type: 'armor', minLevel: 20, baseStats: { VIT: 30, STR: 5 } },

    // 1.4 Shields
    { id: 's1', name: 'Tahta Kalkan', type: 'shield', minLevel: 1, baseStats: { VIT: 3 } },
    { id: 's2', name: 'Deri Kalkan', type: 'shield', minLevel: 3, baseStats: { VIT: 5 } },
    { id: 's3', name: 'Bronz Kalkan', type: 'shield', minLevel: 5, baseStats: { VIT: 8 } },
    { id: 's4', name: 'Demir Kalkan', type: 'shield', minLevel: 10, baseStats: { VIT: 12 } },
    { id: 's5', name: 'Çelik Kalkan', type: 'shield', minLevel: 15, baseStats: { VIT: 18 } },
    { id: 's6', name: 'Gladyatör Kalkanı', type: 'shield', minLevel: 20, baseStats: { VIT: 25, STR: 2 } },

    // 1.5 Gloves
    { id: 'g1', name: 'Deri Eldiven', type: 'gloves', minLevel: 1, baseStats: { AGI: 1, VIT: 1 } },
    { id: 'g2', name: 'Bronz Eldiven', type: 'gloves', minLevel: 5, baseStats: { AGI: 2, VIT: 2 } },
    { id: 'g3', name: 'Demir Eldiven', type: 'gloves', minLevel: 10, baseStats: { AGI: 3, VIT: 4 } },
    { id: 'g4', name: 'Çelik Eldiven', type: 'gloves', minLevel: 15, baseStats: { AGI: 5, VIT: 6 } },
    { id: 'g5', name: 'Savaş Eldiveni', type: 'gloves', minLevel: 20, baseStats: { AGI: 8, STR: 2 } },

    // 1.6 Boots
    { id: 'b1', name: 'Deri Çizme', type: 'boots', minLevel: 1, baseStats: { AGI: 2 } },
    { id: 'b2', name: 'Bronz Çizme', type: 'boots', minLevel: 5, baseStats: { AGI: 4, VIT: 1 } },
    { id: 'b3', name: 'Demir Çizme', type: 'boots', minLevel: 10, baseStats: { AGI: 6, VIT: 2 } },
    { id: 'b4', name: 'Çelik Çizme', type: 'boots', minLevel: 15, baseStats: { AGI: 8, VIT: 3 } },
    { id: 'b5', name: 'Gladyatör Sandalı', type: 'boots', minLevel: 20, baseStats: { AGI: 12 } },

    // 1.7 Rings
    { id: 'r1', name: 'Bronz Yüzük', type: 'ring', minLevel: 1, baseStats: { LUK: 1 } },
    { id: 'r2', name: 'Demir Yüzük', type: 'ring', minLevel: 5, baseStats: { LUK: 2, STR: 1 } },
    { id: 'r3', name: 'Gümüş Yüzük', type: 'ring', minLevel: 10, baseStats: { LUK: 4, INT: 2 } },
    { id: 'r4', name: 'Altın Yüzük', type: 'ring', minLevel: 15, baseStats: { LUK: 6, STR: 2 } },
    { id: 'r5', name: 'Arena Yüzüğü', type: 'ring', minLevel: 20, baseStats: { LUK: 10, STR: 5 } },

    // 1.8 Necklaces
    { id: 'n1', name: 'Deri Kolye', type: 'necklace', minLevel: 1, baseStats: { INT: 1 } },
    { id: 'n2', name: 'Bronz Kolye', type: 'necklace', minLevel: 5, baseStats: { INT: 2, VIT: 1 } },
    { id: 'n3', name: 'Gümüş Kolye', type: 'necklace', minLevel: 10, baseStats: { INT: 4, VIT: 2 } },
    { id: 'n4', name: 'Altın Kolye', type: 'necklace', minLevel: 15, baseStats: { INT: 6, LUK: 2 } },
    { id: 'n5', name: 'Arena Kolyesi', type: 'necklace', minLevel: 20, baseStats: { INT: 10, VIT: 5 } },

    // 1.9 Belts
    { id: 'bl1', name: 'Deri Kemer', type: 'belt', minLevel: 1, baseStats: { VIT: 2 } },
    { id: 'bl2', name: 'Bronz Kemer', type: 'belt', minLevel: 5, baseStats: { VIT: 4, STR: 1 } },
    { id: 'bl3', name: 'Demir Kemer', type: 'belt', minLevel: 10, baseStats: { VIT: 6, STR: 2 } },
    { id: 'bl4', name: 'Çelik Kemer', type: 'belt', minLevel: 15, baseStats: { VIT: 8, STR: 3 } },
    { id: 'bl5', name: 'Gladyatör Kemeri', type: 'belt', minLevel: 20, baseStats: { VIT: 12, STR: 5 } },
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

export const INITIAL_MARKET_ITEMS: MarketItem[] = [
    { id: 'p1', name: "PREMIUM (15 Gün)", type: 'premium', price: 5000, description: "+%50 Sefer Puanı, -%50 Bekleme Süresi.", icon: "👑" },
    { id: 'm1', name: "Şans Tozu", type: 'material', price: 250, description: "Demirci başarı şansını %20 artırır.", icon: "✨" },
    { id: 'm2', name: "Can İksiri", type: 'consumable', price: 100, description: "Canını tamamen yeniler.", effect: 'heal', icon: "🍷" },
    { id: 'm3', name: "Acemi Sandığı", type: 'consumable', price: 500, description: "Rastgele Common/Uncommon eşya içerir.", effect: 'box_common', icon: "📦" },
    { id: 'm4', name: "Usta Sandığı", type: 'consumable', price: 2000, description: "Rastgele Rare+ eşya içerir.", effect: 'box_rare', icon: "🎁" },
];

export const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
    startingLevel: 1,
    startingGold: 50,
    startingStatPoints: 0,
    startingStats: { STR: 10, AGI: 5, VIT: 10, INT: 5, LUK: 5 },
    startingInventory: ['w1', 'a1'] // Start with simple sword and leather armor
};

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

export const calculateSalvageReturn = (item: Item, activeEvent?: GameEvent | null): { prefixFrag: number, suffixFrag: number } => {
    const base = item.rarity === 'legendary' ? 10 : item.rarity === 'epic' ? 5 : item.rarity === 'rare' ? 3 : 1;
    // Check if event is strictly active
    const mult = (activeEvent && activeEvent.isActive) ? activeEvent.salvageYieldMultiplier : 1.0;
    
    return { 
        prefixFrag: Math.floor((base + Math.random() * 3) * mult), 
        suffixFrag: Math.floor((base + Math.random() * 3) * mult) 
    };
};

export const getBlacksmithTime = (type: 'upgrade' | 'salvage' | 'craft', itemLevel: number): number => {
    // Returns MS
    const baseTime = type === 'craft' ? 10000 : type === 'salvage' ? 5000 : 3000;
    return baseTime + (itemLevel * 500);
};