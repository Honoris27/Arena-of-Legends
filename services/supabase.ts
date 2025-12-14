
import { createClient } from '@supabase/supabase-js';
import { Player, RankEntry } from '../types';

const SUPABASE_URL = 'https://kojxppjyhfhskbxhgfyr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvanhwcGp5aGZoc2tieGhnZnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTMzNDgsImV4cCI6MjA4MTIyOTM0OH0.NLSShPbLcdHXlxSLsKbLTRhmvdeBjccxf_CGoQ7OBbc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Circuit breaker to prevent endless error loops if DB schema is wrong
let criticalSchemaError = false;

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
                updated_at: new Date().toISOString(),
                data: player // Store full player object json
            });

        if (error) {
            // 42703: undefined_column, PGRST204: column not found in cache
            if (error.code === '42703' || error.code === 'PGRST204') {
                criticalSchemaError = true;
                console.error("🚨 CRITICAL DATABASE ERROR 🚨");
                console.error("The 'data' column is missing in the 'profiles' table.");
                console.error("👉 PLEASE RUN THE CONTENT OF 'database_schema.sql' IN YOUR SUPABASE SQL EDITOR TO FIX THIS.");
            } else {
                console.error('Error saving profile:', JSON.stringify(error, null, 2));
            }
        }
    } catch (err) {
        console.error('Exception saving profile:', err);
    }
};

export const loadPlayerProfile = async (userId: string): Promise<Player | null> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('data')
            .eq('id', userId)
            .single();

        if (error) {
            // If error code is PGRST116, it means no rows returned (new user), which is fine.
            if (error.code === 'PGRST116') {
                return null;
            }
            
            if (error.code === '42703' || error.code === 'PGRST204') {
                 criticalSchemaError = true;
                 console.error("🚨 CRITICAL DATABASE ERROR 🚨");
                 console.error("The 'data' column is missing in the 'profiles' table.");
                 console.error("👉 PLEASE RUN THE CONTENT OF 'database_schema.sql' IN YOUR SUPABASE SQL EDITOR TO FIX THIS.");
            } else {
                 console.error('Error loading profile:', JSON.stringify(error, null, 2));
            }
            return null;
        }

        if (!data) return null;

        return data.data as Player;
    } catch (err) {
        console.error('Exception loading profile:', err);
        return null;
    }
};

export const fetchLeaderboard = async (): Promise<RankEntry[]> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('name, level, wins, avatar_url')
            .order('wins', { ascending: false })
            .limit(10);

        if (error) throw error;

        return data.map((entry: any, index: number) => ({
            rank: index + 1,
            name: entry.name,
            level: entry.level,
            wins: entry.wins || 0,
            avatar: entry.avatar_url
        }));
    } catch (err) {
        console.error('Error fetching leaderboard:', err);
        return [];
    }
};
