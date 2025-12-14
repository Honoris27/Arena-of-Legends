
import { createClient } from '@supabase/supabase-js';
import { Player, RankEntry, Enemy, Message, BaseItem, ItemModifier, MarketItem, GameEvent } from '../types';

const SUPABASE_URL = 'https://cjubtpdwxczahrwvkziv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdWJ0cGR3eGN6YWhyd3Zreml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MDczNzgsImV4cCI6MjA4MTI4MzM3OH0.TSGlGqJWF_5c4GlXXbe5PSXOgrVdEZPIwJsd4P4T6po';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Circuit breaker to prevent endless error loops if DB schema is wrong
let criticalSchemaError = false;

// --- GAME DATA SYNC (ADMIN) ---

export const fetchGameSystemData = async () => {
    if (criticalSchemaError) return null;
    try {
        const [items, mods, market, events] = await Promise.all([
            supabase.from('game_items').select('*'),
            supabase.from('game_modifiers').select('*'),
            supabase.from('market_items').select('*'),
            supabase.from('game_events').select('*')
        ]);

        return {
            baseItems: items.data?.map((i:any) => ({
                id: i.id, name: i.name, type: i.type, minLevel: i.min_level, baseStats: i.base_stats
            })) as BaseItem[] || [],
            modifiers: mods.data?.map((m:any) => ({
                id: m.id, name: m.name, type: m.type, minLevel: m.min_level, rarity: m.rarity,
                allowedTypes: m.allowed_types, bonuses: m.bonuses, fragmentCost: m.fragment_cost,
                isAiOnly: m.is_ai_only, isActive: m.is_active
            })) as ItemModifier[] || [],
            marketItems: market.data as MarketItem[] || [],
            activeEvent: events.data && events.data.length > 0 ? {
                id: events.data[0].id,
                title: events.data[0].title,
                isActive: events.data[0].is_active,
                startTime: events.data[0].start_time,
                endTime: events.data[0].end_time,
                xpMultiplier: events.data[0].xp_multiplier,
                goldMultiplier: events.data[0].gold_multiplier,
                dropRateMultiplier: events.data[0].drop_rate_multiplier,
                expeditionTimeMultiplier: events.data[0].expedition_time_multiplier,
                scrollDropChance: events.data[0].scroll_drop_chance,
                salvageYieldMultiplier: events.data[0].salvage_yield_multiplier
            } as GameEvent : null
        };
    } catch (e) {
        console.error("Error fetching system data:", e);
        return null;
    }
}

export const saveSystemData = async (type: 'item'|'modifier'|'market'|'event'|'delete_item'|'delete_market'|'delete_modifier', data: any) => {
    try {
        if(type === 'item') {
            await supabase.from('game_items').upsert({
                id: data.id, name: data.name, type: data.type, min_level: data.minLevel, base_stats: data.baseStats
            });
        } else if (type === 'delete_item') {
            await supabase.from('game_items').delete().eq('id', data);
        } else if (type === 'modifier') {
            await supabase.from('game_modifiers').upsert({
                id: data.id, name: data.name, type: data.type, min_level: data.minLevel, rarity: data.rarity,
                allowed_types: data.allowedTypes, bonuses: data.bonuses, fragment_cost: data.fragmentCost,
                is_ai_only: data.isAiOnly, is_active: data.isActive
            });
        } else if (type === 'delete_modifier') {
            await supabase.from('game_modifiers').delete().eq('id', data);
        } else if (type === 'market') {
            await supabase.from('market_items').upsert(data);
        } else if (type === 'delete_market') {
            await supabase.from('market_items').delete().eq('id', data);
        } else if (type === 'event') {
            if (data === null) {
                // Delete all events for now (single event system)
                await supabase.from('game_events').delete().neq('id', '0');
            } else {
                await supabase.from('game_events').upsert({
                    id: data.id, title: data.title, start_time: data.startTime, end_time: data.endTime,
                    is_active: data.isActive, xp_multiplier: data.xpMultiplier, gold_multiplier: data.goldMultiplier,
                    drop_rate_multiplier: data.dropRateMultiplier, expedition_time_multiplier: data.expeditionTimeMultiplier,
                    scroll_drop_chance: data.scrollDropChance, salvage_yield_multiplier: data.salvageYieldMultiplier
                });
            }
        }
    } catch (e) {
        console.error("Admin save error:", e);
    }
}

// --- PLAYER PROFILES ---

export const savePlayerProfile = async (player: Player, wins: number = 0) => {
    if (criticalSchemaError) return;

    try {
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: player.id,
                name: player.name,
                avatar_url: player.avatarUrl,
                level: player.level,
                gold: player.gold,
                wins: wins,
                honor: player.honor, 
                victory_points: player.victoryPoints, 
                piggy_bank: player.piggyBank,
                rank: player.rank,
                last_income_time: player.lastIncomeTime,
                role: player.role, // Save role explicitly
                updated_at: new Date().toISOString(),
                data: player // Store full player object json as backup/flexible storage
            });

        if (error) {
            if (error.code === '42703' || error.code === 'PGRST204') {
                criticalSchemaError = true;
                console.error("🚨 CRITICAL DATABASE ERROR: Column missing. Run the SQL script!");
            } else {
                console.error('Error saving profile:', JSON.stringify(error, null, 2));
            }
        }
    } catch (err) {
        console.error('Exception saving profile:', err);
    }
};

export const updateProfile = async (playerId: string, updates: Partial<Player>) => {
    // Direct update wrapper for atomic operations
    try {
        const dbUpdates: any = {};
        if (updates.gold !== undefined) dbUpdates.gold = updates.gold;
        if (updates.wins !== undefined) dbUpdates.wins = updates.wins;
        if (updates.rank !== undefined) dbUpdates.rank = updates.rank;
        if (updates.piggyBank !== undefined) dbUpdates.piggy_bank = updates.piggyBank;
        if (updates.lastIncomeTime !== undefined) dbUpdates.last_income_time = updates.lastIncomeTime;
        if (updates.role !== undefined) dbUpdates.role = updates.role;
        
        if(Object.keys(dbUpdates).length > 0) {
            await supabase.from('profiles').update(dbUpdates).eq('id', playerId);
        }
    } catch(e) { console.error(e); }
};

export const loadPlayerProfile = async (userId: string): Promise<Player | null> => {
    try {
        // Select all columns explicitly to ensure we get the separate stats columns
        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, level, gold, wins, honor, victory_points, piggy_bank, rank, last_income_time, role, data')
            .eq('id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // User not found
            if (error.code === '42703' || error.code === 'PGRST204') {
                 criticalSchemaError = true;
            }
            console.error("Error loading profile:", error);
            return null;
        }

        if (!data) return null;

        // Merge JSONB data with Column data. Columns take precedence for synchronized stats.
        const mergedPlayer: Player = {
            ...data.data, // Load JSON structure first (inventory, equipment, stats, etc.)
            id: data.id,
            name: data.name || data.data?.name,
            role: data.role || data.data?.role || 'player', // Database role has precedence
            avatarUrl: data.avatar_url || data.data?.avatarUrl,
            level: data.level ?? data.data?.level ?? 1,
            gold: data.gold ?? data.data?.gold ?? 50,
            wins: data.wins ?? 0,
            honor: data.honor ?? 0,
            victoryPoints: data.victory_points ?? 0,
            piggyBank: data.piggy_bank ?? 0,
            rank: data.rank ?? 9999,
            lastIncomeTime: data.last_income_time ?? 0,
            // Ensure essential objects exist even if JSON is partial
            equipment: data.data?.equipment || { 
                weapon: null, shield: null, helmet: null, armor: null, 
                gloves: null, boots: null, necklace: null, ring: null, 
                earring: null, belt: null 
            },
            inventory: data.data?.inventory || [],
            stats: data.data?.stats || { STR: 10, AGI: 5, VIT: 10, INT: 5, LUK: 5 },
            bankDeposits: data.data?.bankDeposits || [],
            messages: data.data?.messages || [],
            reports: data.data?.reports || [],
            learnedModifiers: data.data?.learnedModifiers || [],
            blacksmithQueue: data.data?.blacksmithQueue || []
        };

        return mergedPlayer;
    } catch (err) {
        console.error('Exception loading profile:', err);
        return null;
    }
};

export const fetchLeaderboard = async (): Promise<RankEntry[]> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, level, wins, honor, victory_points, avatar_url, data')
            .order('wins', { ascending: false })
            .limit(20);

        if (error) throw error;

        return data.map((entry: any, index: number) => ({
            id: entry.id, // Ensure ID is passed for messaging/attacks
            rank: index + 1,
            name: entry.name,
            level: entry.level,
            wins: entry.wins || 0,
            honor: entry.honor || 0,
            victoryPoints: entry.victory_points || 0,
            avatar: entry.avatar_url,
            bio: entry.data?.bio,
            stats: entry.data?.stats,
            equipment: entry.data?.equipment // Pass equipment for inspection
        }));
    } catch (err) {
        console.error('Error fetching leaderboard:', err);
        return [];
    }
};

export const fetchPvpOpponents = async (minLevel: number, maxLevel: number, currentRank: number, playerId: string): Promise<Enemy[]> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, level, rank, piggy_bank, gold, data')
            .gte('level', minLevel)
            .lte('level', maxLevel)
            .lt('rank', currentRank) 
            .neq('id', playerId) 
            .order('rank', { ascending: false }) 
            .limit(5);

        if (error) throw error;

        return data.map((p: any) => ({
            id: p.id,
            name: p.name,
            level: p.level,
            rank: p.rank,
            piggyBank: p.piggy_bank,
            gold: p.gold,
            hp: p.data?.maxHp || 100,
            maxHp: p.data?.maxHp || 100,
            stats: p.data?.stats || { STR:10, AGI:5, VIT:10, INT:5, LUK:5 },
            description: `Lig Sırası: #${p.rank}`,
            isPlayer: true,
            avatarUrl: p.data?.avatarUrl || p.avatar_url
        })).reverse();
    } catch (err) {
        console.error("Error fetching PvP opponents:", err);
        return [];
    }
};

export const sendMessage = async (senderId: string, senderName: string, recipientId: string, recipientName: string, subject: string, content: string): Promise<boolean> => {
    try {
        const msgId = Date.now().toString() + Math.random().toString();
        const now = Date.now();

        // 1. Create message for Recipient (Inbox)
        const inboxMessage: Message = {
            id: msgId,
            senderId: senderId,
            sender: senderName,
            recipientId: recipientId,
            recipientName: recipientName,
            subject: subject,
            content: content,
            timestamp: now,
            read: false,
            type: 'inbox'
        };

        // 2. Create message for Sender (Sent Box)
        const sentMessage: Message = {
            ...inboxMessage,
            type: 'sent',
            read: true
        };

        // 3. Send to Recipient via RPC
        const { error: errorInbox } = await supabase.rpc('send_message', {
            recipient_id: recipientId,
            message_obj: inboxMessage
        });

        if(errorInbox) {
            console.error("RPC Error (Inbox):", errorInbox);
            throw errorInbox;
        }

        // 4. Save to Sender via RPC (Targeting self)
        const { error: errorSent } = await supabase.rpc('send_message', {
            recipient_id: senderId, // Sending to self to save in sent box
            message_obj: sentMessage
        });

        if(errorSent) {
             console.error("RPC Error (Sent):", errorSent);
             // Non-critical if sent box fails, but good to know
        }

        return true;

    } catch (e) {
        console.error("Error sending message:", e);
        return false;
    }
};