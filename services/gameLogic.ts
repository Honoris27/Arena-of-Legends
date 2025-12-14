
import { Player, Enemy, Stats, Item, ItemType, ItemRarity, BaseItem, ItemMaterial, ItemModifier, StatType, ModifierBonus, GameEvent, MarketItem, GlobalConfig, LeagueInfo, Equipment } from '../types';

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

// --- LEAGUE LOGIC ---
export const getLeagueInfo = (level: number): LeagueInfo => {
    if (level < 10) return { id: 'l1', name: "1-9 Seviye Ligi", minLevel: 1, maxLevel: 9, passiveGold: 10 };
    if (level < 20) return { id: 'l2', name: "10-19 Seviye Ligi", minLevel: 10, maxLevel: 19, passiveGold: 20 };
    
    const tier = Math.floor((level - 20) / 20); 
    const min = 20 + (tier * 20);
    const max = min + 19;
    const gold = 50 + (tier * 50);

    return {
        id: `l${tier + 3}`,
        name: `${min}-${max} Seviye Ligi`,
        minLevel: min,
        maxLevel: max,
        passiveGold: gold
    };
};

export const getExpeditionConfig = (player: Player, activeEvent?: GameEvent | null) => {
    const premium = isPremium(player);
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
  return Math.floor(100 * Math.pow(1.2, level - 1) + (level * 50));
};

export const calculateMaxHp = (vit: number, level: number): number => {
  return 100 + (vit * 10) + (level * 20);
};

export const calculateMaxMp = (int: number, level: number): number => {
  return 50 + (int * 5) + (level * 10);
};

export const getPlayerTotalStats = (player: Player): Stats => {
  const totalStats = { ...player.stats };
  
  // Iterate through all possible equipment slots including new ones
  const slots: (keyof Equipment)[] = ['weapon', 'shield', 'helmet', 'armor', 'gloves', 'boots', 'necklace', 'ring', 'ring2', 'earring', 'earring2', 'belt'];

  slots.forEach(slot => {
      const item = player.equipment[slot];
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

export const getEquipmentBonuses = (equipment?: Equipment) => {
    let defense = 0;
    let critRes = 0;
    let critChanceBonus = 0;

    if (!equipment) return { defense, critRes, critChanceBonus };

    Object.values(equipment).forEach(item => {
        if (item && item.bonuses) {
            item.bonuses.forEach((b: ModifierBonus) => {
                if (b.type === 'FLAT') {
                    if (b.stat === 'DEFENSE') defense += b.value;
                    if (b.stat === 'CRIT_RESISTANCE') critRes += b.value;
                    if (b.stat === 'CRIT_CHANCE') critChanceBonus += b.value;
                }
            });
        }
    });
    return { defense, critRes, critChanceBonus };
};

export const getStatDescription = (stat: StatType, value: number, level: number): string => {
    switch (stat) {
        case 'STR':
            return `Fiziksel Hasar: ~${Math.floor(value * 1.5)}`;
        case 'AGI':
            return `Kritik Şansı: %${(value * 0.05).toFixed(2)}`;
        case 'VIT':
            return `Can (HP): +${value * 10}\nDefans (Doğal): +${Math.floor(value * 0.5)}`;
        case 'INT':
            return `Mana (MP): +${value * 5}\nHP Yenileme: +${Math.max(1, Math.floor(value / 10))}/5sn`;
        case 'LUK':
            return `Eşya Düşürme & Kritik Şans Bonusu`;
        default:
            return '';
    }
};

export const canEquipItem = (player: Player, item: Item): { can: boolean, reason?: string } => {
    if (item.reqLevel && player.level < item.reqLevel) {
        return { can: false, reason: `Gereken Seviye: ${item.reqLevel}` };
    }
    return { can: true };
};

export const calculateDamage = (attackerStats: Stats, defenderStats: Stats, attackerEquip?: Equipment, defenderEquip?: Equipment): number => {
  // 1. Base Damage Calculation
  const baseDamage = attackerStats.STR * 1.5;
  
  // 2. Defensive Stats Calculation
  const { defense: defBonus, critRes: critResBonus } = getEquipmentBonuses(defenderEquip);
  const { critChanceBonus } = getEquipmentBonuses(attackerEquip);

  // VIT gives natural defense (0.5 per VIT) + Item Defense Bonus
  const totalDefense = (defenderStats.VIT * 0.5) + defBonus;
  
  // 3. Crit Calculation
  // Base crit from LUK/AGI + Item Bonus - Defender Res
  let critChance = ((attackerStats.LUK * 0.5 + attackerStats.AGI * 0.5) * 0.05) + critChanceBonus;
  critChance -= critResBonus; // Reduce chance by resistance %
  
  // Cap/Floor
  critChance = Math.max(0, Math.min(75, critChance)); // Max 75% crit chance

  const isCrit = Math.random() * 100 < critChance;

  // 4. Final Damage
  const variation = Math.random() * 0.2 + 0.9; 
  let damage = Math.max(1, (baseDamage - totalDefense) * variation);
  
  if (isCrit) damage *= 2; // Critical Hit

  return Math.floor(damage);
};

// --- LEVEL UP LOGIC ---
export const processLevelUp = (player: Player): { updatedPlayer: Player, leveledUp: boolean, levelsGained: number } => {
    let p = { ...player };
    let levelsGained = 0;
    
    while (p.currentXp >= p.maxXp) {
        p.currentXp -= p.maxXp;
        p.level += 1;
        p.maxXp = calculateMaxXp(p.level);
        p.statPoints += 5;
        p.maxHp = calculateMaxHp(p.stats.VIT, p.level);
        p.maxMp = calculateMaxMp(p.stats.INT, p.level);
        p.hp = p.maxHp;
        p.mp = p.maxMp;
        levelsGained++;
    }

    return { updatedPlayer: p, leveledUp: levelsGained > 0, levelsGained };
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

  const monsterNames = ["Vahşi Goblin", "Karanlık Ork", "Zindan İskeleti", "Mağara Örümceği", "Kayıp Ruh", "Taş Golem", "Kuduz Kurt", "Hırsız Kobold", "Mezar Bekçisi", "Kanlı Yarasa"];
  const bossNames = ["MAĞARA EJDERHASI", "KRAL ORK", "ÖLÜMSÜZ LICH", "DEV GOLEM", "KARANLIK LORD"];

  return {
    name: isBoss ? bossNames[Math.floor(Math.random() * bossNames.length)] : monsterNames[Math.floor(Math.random() * monsterNames.length)],
    level,
    stats,
    maxHp,
    hp: maxHp,
    isBoss,
    isPlayer: false
  };
};

// --- DATA ---

export const INITIAL_BASE_ITEMS: BaseItem[] = [
    { id: 'w1', name: 'Kılıç', type: 'weapon', minLevel: 1, baseStats: { STR: 5 } },
    { id: 'w2', name: 'Balta', type: 'weapon', minLevel: 3, baseStats: { STR: 8 } },
    { id: 'a1', name: 'Deri Zırh', type: 'armor', minLevel: 1, baseStats: { VIT: 4 } },
    { id: 'h1', name: 'Deri Başlık', type: 'helmet', minLevel: 1, baseStats: { VIT: 2 } },
    { id: 's1', name: 'Tahta Kalkan', type: 'shield', minLevel: 1, baseStats: { VIT: 3 } },
    { id: 'g1', name: 'Deri Eldiven', type: 'gloves', minLevel: 1, baseStats: { AGI: 1 } },
    { id: 'b1', name: 'Deri Çizme', type: 'boots', minLevel: 1, baseStats: { AGI: 2 } },
    { id: 'r1', name: 'Bronz Yüzük', type: 'ring', minLevel: 1, baseStats: { LUK: 1 } },
    { id: 'n1', name: 'Deri Kolye', type: 'necklace', minLevel: 1, baseStats: { INT: 1 } },
    { id: 'bl1', name: 'Deri Kemer', type: 'belt', minLevel: 1, baseStats: { VIT: 2 } },
    { id: 'e1', name: 'Bakır Küpe', type: 'earring', minLevel: 1, baseStats: { INT: 1 } },
];

export const INITIAL_MATERIALS: ItemMaterial[] = [
    { id: 'mat1', name: 'Deri', levelReq: 1, statMultiplier: 1.0, rarity: 'common' },
    { id: 'mat2', name: 'Bronz', levelReq: 5, statMultiplier: 1.2, rarity: 'common' },
    { id: 'mat3', name: 'Demir', levelReq: 10, statMultiplier: 1.5, rarity: 'uncommon' },
    { id: 'mat4', name: 'Çelik', levelReq: 15, statMultiplier: 1.8, rarity: 'uncommon' },
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
    },
    {
        id: 'mod3', name: 'Kaya Gibi', type: 'prefix', minLevel: 5, rarity: 'uncommon', allowedTypes: ['armor', 'shield'],
        isActive: true, fragmentCost: 30,
        bonuses: [{ stat: 'DEFENSE', value: 5, type: 'FLAT', mode: 'GLOBAL' }]
    },
    {
        id: 'mod4', name: 'Dengeli', type: 'suffix', minLevel: 10, rarity: 'rare', allowedTypes: ['helmet', 'boots'],
        isActive: true, fragmentCost: 40,
        bonuses: [{ stat: 'CRIT_RESISTANCE', value: 3, type: 'PERCENT', mode: 'GLOBAL' }]
    }
];

export const INITIAL_MARKET_ITEMS: MarketItem[] = [
    { id: 'p1', name: "PREMIUM (15 Gün)", type: 'premium', price: 5000, description: "+%50 Sefer Puanı, -%50 Bekleme Süresi.", icon: "👑" },
    { id: 'm1', name: "Şans Tozu", type: 'material', price: 250, description: "Demirci başarı şansını %20 artırır.", icon: "✨" },
    { id: 'm2', name: "Can İksiri", type: 'consumable', price: 100, description: "Canını tamamen yeniler.", effect: 'heal', icon: "🍷" },
];

export const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
    startingLevel: 1,
    startingGold: 50,
    startingStatPoints: 0,
    startingStats: { STR: 10, AGI: 5, VIT: 10, INT: 5, LUK: 5 },
    startingInventory: ['w1', 'a1'] 
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

    const validBaseItems = baseItems.filter(i => Math.abs(i.minLevel - targetLevel) < 10);
    const baseItem = validBaseItems.length > 0 
        ? validBaseItems[Math.floor(Math.random() * validBaseItems.length)]
        : baseItems[Math.floor(Math.random() * baseItems.length)];

    const validMaterials = materials.filter(m => m.levelReq <= targetLevel + 5);
    const material = validMaterials.length > 0
        ? validMaterials[Math.floor(Math.random() * validMaterials.length)]
        : materials[0];

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

    const finalStats: Partial<Stats> = {};
    const finalBonuses: ModifierBonus[] = [];
    const matMult = material.statMultiplier;

    Object.entries(baseItem.baseStats).forEach(([key, val]) => {
        const k = key as StatType;
        if (typeof val === 'number') {
            finalStats[k] = Math.ceil(val * matMult);
        }
    });

    [prefix, suffix].forEach(mod => {
        if (!mod) return;
        mod.bonuses.forEach(bonus => {
            if (bonus.type === 'FLAT' && bonus.mode === 'GLOBAL' && ['STR','AGI','VIT','INT','LUK'].includes(bonus.stat)) {
                 const current = finalStats[bonus.stat as StatType] || 0;
                 finalStats[bonus.stat as StatType] = current + bonus.value;
            }
            finalBonuses.push(bonus);
        });
    });

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
    const mult = (activeEvent && activeEvent.isActive) ? activeEvent.salvageYieldMultiplier : 1.0;
    
    return { 
        prefixFrag: Math.floor((base + Math.random() * 3) * mult), 
        suffixFrag: Math.floor((base + Math.random() * 3) * mult) 
    };
};

export const getBlacksmithTime = (type: 'upgrade' | 'salvage' | 'craft', itemLevel: number): number => {
    const baseTime = type === 'craft' ? 10000 : type === 'salvage' ? 5000 : 3000;
    return baseTime + (itemLevel * 500);
};
