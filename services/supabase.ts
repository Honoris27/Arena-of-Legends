import { createClient } from '@supabase/supabase-js';
import { Player, RankEntry } from '../types';

const SUPABASE_URL = 'https://kxgwqcgaoeurrgrpjpcf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Z3dxY2dhb2V1cnJncnBqcGNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2Mzg3NzUsImV4cCI6MjA4MTIxNDc3NX0.K8ao8kwQ3ojejUssw2mUipbFehOHwKaBrKHsZuHTMdQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const savePlayerProfile = async (player: Player, wins: number = 0) => {
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
            console.error('Error saving profile:', error);
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

        if (error || !data) {
            return null;
        }

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
