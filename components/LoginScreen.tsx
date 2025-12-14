
import React, { useState } from 'react';
import { User, Lock, ArrowRight, Mail, AlertCircle, CheckCircle, Database, Copy, Check, X, Scroll } from 'lucide-react';
import { supabase } from '../services/supabase';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const AVATARS = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Spartacus",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Crixus",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Gannicus",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Naevia"
];

const SQL_SETUP_CODE = `-- 1. Profiles Tablosunu GÜNCELLE
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  name text,
  avatar_url text,
  level int default 1,
  gold int default 50,
  wins int default 0,
  honor int default 0,
  victory_points int default 0,
  piggy_bank int default 0,
  rank int default 9999,
  last_income_time bigint default 0,
  data jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Eksik kolonları ekle (ROLE eklendi!)
alter table public.profiles add column if not exists honor int default 0;
alter table public.profiles add column if not exists victory_points int default 0;
alter table public.profiles add column if not exists piggy_bank int default 0;
alter table public.profiles add column if not exists rank int default 9999;
alter table public.profiles add column if not exists last_income_time bigint default 0;
alter table public.profiles add column if not exists role text default 'player';

-- 2. OYUN SİSTEM TABLOLARI (ADMİN PANELİ İÇİN)
create table if not exists public.game_items ( id text primary key, name text, type text, min_level int, base_stats jsonb );
create table if not exists public.game_modifiers ( id text primary key, name text, type text, min_level int, rarity text, allowed_types jsonb, bonuses jsonb, fragment_cost int, is_ai_only boolean default false, is_active boolean default true );
create table if not exists public.market_items ( id text primary key, name text, type text, price int, description text, icon text, effect text );
create table if not exists public.game_events ( id text primary key, title text, start_time bigint, end_time bigint, is_active boolean default true, xp_multiplier float default 1.0, gold_multiplier float default 1.0, drop_rate_multiplier float default 1.0, expedition_time_multiplier float default 1.0, scroll_drop_chance float default 0.0, salvage_yield_multiplier float default 1.0 );

-- 3. Güvenlik Ayarları (RLS)
alter table public.profiles enable row level security;
alter table public.game_items enable row level security;
alter table public.game_modifiers enable row level security;
alter table public.market_items enable row level security;
alter table public.game_events enable row level security;

create policy "Herkes okuyabilir" on public.profiles for select using (true);
create policy "Kullanıcı kendi profilini ekler" on public.profiles for insert with check (auth.uid() = id);
create policy "Kullanıcı kendi profilini günceller" on public.profiles for update using (auth.uid() = id);
create policy "Items Read" on public.game_items for select using (true);
create policy "Items Write" on public.game_items for all using (auth.role() = 'authenticated');
create policy "Mods Read" on public.game_modifiers for select using (true);
create policy "Mods Write" on public.game_modifiers for all using (auth.role() = 'authenticated');
create policy "Market Read" on public.market_items for select using (true);
create policy "Market Write" on public.market_items for all using (auth.role() = 'authenticated');
create policy "Events Read" on public.game_events for select using (true);
create policy "Events Write" on public.game_events for all using (auth.role() = 'authenticated');

-- 4. Yeni Üye Fonksiyonu
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id, name, avatar_url, level, gold, wins, 
    honor, victory_points, piggy_bank, rank, last_income_time, role, data
  )
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    1,
    50,
    0,
    0, 0, 0, 9999, 0, 'player',
    jsonb_build_object('stats', jsonb_build_object('STR', 10, 'AGI', 5, 'VIT', 10, 'INT', 5, 'LUK', 5), 'statPoints', 0, 'hp', 120, 'maxHp', 120, 'mp', 50, 'maxMp', 50, 'expeditionPoints', 15, 'maxExpeditionPoints', 15, 'inventory', '[]'::jsonb, 'bankDeposits', '[]'::jsonb, 'equipment', jsonb_build_object('weapon', null, 'shield', null, 'helmet', null, 'armor', null, 'gloves', null, 'boots', null, 'necklace', null, 'ring', null, 'earring', null, 'belt', null))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- 5. Mesajlaşma RPC
create or replace function public.send_message(recipient_id uuid, message_obj jsonb) returns void language plpgsql security definer as $$
declare current_data jsonb;
begin
  select data into current_data from public.profiles where id = recipient_id;
  if current_data is null then return; end if;
  update public.profiles set data = jsonb_set(current_data, '{messages}', coalesce(current_data->'messages', '[]'::jsonb) || message_obj) where id = recipient_id;
end;
$$;

-- 6. ADMİN EKLEME KODU (ID ile)
-- Aşağıdaki 'KULLANICI_ID_BURAYA' kısmını, admin yapmak istediğiniz kullanıcının ID'si ile değiştirin.
-- ID'yi Admin Panelindeki kullanıcı listesinden veya veritabanından bulabilirsiniz.
-- update public.profiles set role = 'admin' where id = 'KULLANICI_ID_BURAYA';
`;

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
        if (isRegister) {
            if (!name) throw new Error("İsim gerekli.");
            
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        avatar_url: selectedAvatar
                    }
                }
            });

            if (signUpError) throw signUpError;
            
            if (data.user && !data.session) {
                setLoading(false);
                setSuccess("Kayıt başarılı! Giriş yapabilmek için lütfen e-postanızı onaylayın.");
                return;
            }
        } else {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (signInError) throw signInError;
        }
    } catch (err: any) {
        console.error(err);
        setError(err.message || "Bir hata oluştu. Veritabanı kurulumunu yaptınız mı?");
        setLoading(false);
    }
  };

  const handleCopySql = () => {
      navigator.clipboard.writeText(SQL_SETUP_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4 relative overflow-hidden font-serif">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1564357643329-371dad70d779?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-30 blur-[2px]"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent"></div>

      <button 
        onClick={() => setShowSql(true)}
        className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-stone-800/90 border-2 border-amber-700 px-3 py-2 rounded text-amber-500 hover:text-amber-300 hover:border-amber-500 transition-all text-xs font-bold shadow-lg uppercase tracking-widest"
      >
        <Database size={16} />
        DB Kurulumu
      </button>

      <div className="relative z-10 w-full max-w-md bg-stone-900/95 border-2 border-amber-700/50 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] p-8 animate-fade-in relative overflow-hidden">
        {/* Ornamental Corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-600"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-600"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-600"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-600"></div>

        <div className="text-center mb-8">
            <h1 className="text-4xl cinzel font-black bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 bg-clip-text text-transparent mb-2 drop-shadow-md">
                ARENA OF LEGENDS
            </h1>
            <p className="text-stone-400 text-sm font-serif italic border-t border-b border-stone-700 py-1 inline-block px-4">Kaderini kumların üzerinde yaz.</p>
        </div>

        <div className="flex mb-6 bg-stone-950 rounded border border-stone-700 p-1">
            <button 
                onClick={() => { setIsRegister(false); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 rounded font-bold text-sm transition-all cinzel ${!isRegister ? 'bg-amber-900 text-amber-100 shadow-inner' : 'text-stone-500 hover:text-stone-300'}`}
            >
                GİRİŞ YAP
            </button>
            <button 
                onClick={() => { setIsRegister(true); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 rounded font-bold text-sm transition-all cinzel ${isRegister ? 'bg-amber-900 text-amber-100 shadow-inner' : 'text-stone-500 hover:text-stone-300'}`}
            >
                KAYIT OL
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <div className="bg-red-900/40 border border-red-800 text-red-300 text-xs p-3 rounded flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}
            {success && (
                <div className="bg-green-900/40 border border-green-800 text-green-300 text-xs p-3 rounded flex items-center gap-2">
                    <CheckCircle size={16} /> {success}
                </div>
            )}

            <div>
                <label className="block text-xs font-bold text-amber-700 mb-1 uppercase tracking-widest">E-Posta</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 text-stone-500" size={18} />
                    <input 
                        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-700 rounded py-2.5 pl-10 pr-4 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
                        placeholder="gladyator@roma.com"
                    />
                </div>
            </div>

            <div>
                 <label className="block text-xs font-bold text-amber-700 mb-1 uppercase tracking-widest">Şifre</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 text-stone-500" size={18} />
                    <input 
                        type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-700 rounded py-2.5 pl-10 pr-4 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
                        placeholder="••••••"
                    />
                </div>
            </div>

            {isRegister && (
                <>
                <div>
                    <label className="block text-xs font-bold text-amber-700 mb-1 uppercase tracking-widest">Kahraman Adı</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-stone-500" size={18} />
                        <input 
                            type="text" required value={name} onChange={(e) => setName(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-700 rounded py-2.5 pl-10 pr-4 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-600 transition-colors"
                            placeholder="Maximus"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-amber-700 mb-1 uppercase tracking-widest">Avatar Seç</label>
                    <div className="flex justify-between gap-2">
                        {AVATARS.map((av, idx) => (
                            <button
                                key={idx} type="button" onClick={() => setSelectedAvatar(av)}
                                className={`w-12 h-12 rounded-full border-2 overflow-hidden transition-all ${selectedAvatar === av ? 'border-amber-500 scale-110 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'border-stone-700 opacity-50 hover:opacity-100'}`}
                            >
                                <img src={av} alt="avatar" className="w-full h-full object-cover bg-stone-800" />
                            </button>
                        ))}
                    </div>
                </div>
                </>
            )}

            <button 
                type="submit" disabled={loading}
                className={`w-full py-3 rounded border-t border-b border-amber-500/50 font-bold flex items-center justify-center gap-2 mt-6 transition-all cinzel text-lg tracking-widest ${
                    !loading 
                    ? 'bg-gradient-to-r from-amber-800 to-amber-700 hover:from-amber-700 hover:to-amber-600 text-amber-100 shadow-lg transform hover:-translate-y-0.5' 
                    : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                }`}
            >
                {loading ? 'YÜKLENİYOR...' : (isRegister ? 'MACERAYA BAŞLA' : 'ARENAYA DÖN')} <ArrowRight size={18} />
            </button>
        </form>
      </div>

      {showSql && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-stone-900 border border-stone-600 rounded-xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl">
                  <div className="flex justify-between items-center p-4 border-b border-stone-700 bg-stone-800 rounded-t-xl">
                      <div className="flex items-center gap-3">
                        <Database className="text-amber-500" />
                        <h3 className="text-lg font-bold text-stone-200">Supabase SQL Kurulumu</h3>
                      </div>
                      <button onClick={() => setShowSql(false)} className="text-stone-400 hover:text-white"><X /></button>
                  </div>
                  
                  <div className="flex-1 p-4 overflow-hidden relative bg-stone-950">
                      <textarea 
                        readOnly 
                        value={SQL_SETUP_CODE} 
                        className="w-full h-full bg-stone-950 text-amber-600 font-mono text-xs p-4 rounded border border-stone-800 resize-none focus:outline-none custom-scrollbar"
                      />
                  </div>

                  <div className="p-4 border-t border-stone-700 bg-stone-800 rounded-b-xl flex justify-between items-center">
                      <p className="text-xs text-stone-400">
                          Bu kodu Supabase <strong>SQL Editor</strong> bölümüne yapıştırın. <br/>
                          <span className="text-amber-500">Admin ekleme kodu en alttadır.</span>
                      </p>
                      <button 
                        onClick={handleCopySql}
                        className={`px-4 py-2 rounded font-bold text-sm flex items-center gap-2 transition-all ${copied ? 'bg-green-700 text-white' : 'bg-amber-700 hover:bg-amber-600 text-white'}`}
                      >
                          {copied ? <Check size={16}/> : <Copy size={16}/>}
                          {copied ? 'Kopyalandı!' : 'Kodu Kopyala'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default LoginScreen;
