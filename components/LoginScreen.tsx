
import React, { useState } from 'react';
import { User, Lock, ArrowRight, Mail, AlertCircle, CheckCircle, Database, Copy, Check, X } from 'lucide-react';
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

-- Eksik kolonları ekle (Zaten varsa hata vermez)
alter table public.profiles add column if not exists honor int default 0;
alter table public.profiles add column if not exists victory_points int default 0;
alter table public.profiles add column if not exists piggy_bank int default 0;
alter table public.profiles add column if not exists rank int default 9999;
alter table public.profiles add column if not exists last_income_time bigint default 0;

-- 2. Güvenlik Ayarları (RLS)
alter table public.profiles enable row level security;

-- Politikaları yenile
drop policy if exists "Herkes profilleri görebilir." on public.profiles;
drop policy if exists "Kullanıcı kendi profilini ekleyebilir." on public.profiles;
drop policy if exists "Kullanıcı kendi profilini güncelleyebilir." on public.profiles;

create policy "Herkes profilleri görebilir." on public.profiles for select using (true);
create policy "Kullanıcı kendi profilini ekleyebilir." on public.profiles for insert with check (auth.uid() = id);
create policy "Kullanıcı kendi profilini güncelleyebilir." on public.profiles for update using (auth.uid() = id);

-- 3. Yeni Üye Fonksiyonu (TÜM KOLONLARLA)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id, name, avatar_url, level, gold, wins, 
    honor, victory_points, piggy_bank, rank, last_income_time, data
  )
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    1,
    50,
    0,
    0, 0, 0, 9999, 0, -- Varsayılan değerler
    jsonb_build_object(
      'stats', jsonb_build_object('STR', 10, 'AGI', 5, 'VIT', 10, 'INT', 5, 'LUK', 5),
      'statPoints', 0,
      'hp', 120, 'maxHp', 120, 'mp', 50, 'maxMp', 50,
      'expeditionPoints', 15, 'maxExpeditionPoints', 15,
      'inventory', '[]'::jsonb,
      'bankDeposits', '[]'::jsonb,
      'equipment', jsonb_build_object(
          'weapon', null, 'shield', null, 'helmet', null, 'armor', null, 
          'gloves', null, 'boots', null, 'necklace', null, 'ring', null, 
          'earring', null, 'belt', null
      )
    )
  );
  return new;
end;
$$ language plpgsql security definer;

-- 4. Tetikleyiciyi Yenile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();`;

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // SQL Modal State
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>

      {/* SQL Button */}
      <button 
        onClick={() => setShowSql(true)}
        className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-slate-800/80 backdrop-blur border border-slate-600 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:border-yellow-500 transition-all text-sm font-bold shadow-lg"
      >
        <Database size={16} className="text-yellow-500" />
        DB Kurulumu
      </button>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-8 animate-fade-in">
        <div className="text-center mb-8">
            <h1 className="text-4xl cinzel font-bold bg-gradient-to-r from-yellow-500 to-amber-700 bg-clip-text text-transparent mb-2">Arena of Legends</h1>
            <p className="text-slate-400 text-sm">Efsaneni yazmaya başla.</p>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 bg-slate-800 rounded-lg p-1">
            <button 
                onClick={() => { setIsRegister(false); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${!isRegister ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Giriş Yap
            </button>
            <button 
                onClick={() => { setIsRegister(true); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${isRegister ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Kayıt Ol
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
                <div className="bg-red-900/50 border border-red-500/50 text-red-200 text-xs p-3 rounded flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {success && (
                <div className="bg-green-900/50 border border-green-500/50 text-green-200 text-xs p-3 rounded flex items-center gap-2">
                    <CheckCircle size={16} /> {success}
                </div>
            )}

            <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">E-Posta</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 transition-colors"
                        placeholder="ornek@email.com"
                    />
                </div>
            </div>

            <div>
                 <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Şifre</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                    <input 
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 transition-colors"
                        placeholder="••••••"
                    />
                </div>
            </div>

            {isRegister && (
                <>
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Kahraman Adı</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-slate-500" size={18} />
                        <input 
                            type="text" 
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 transition-colors"
                            placeholder="Adını gir..."
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Avatar Seç</label>
                    <div className="flex justify-between gap-2">
                        {AVATARS.map((av, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedAvatar(av)}
                                className={`w-12 h-12 rounded-full border-2 overflow-hidden transition-all ${selectedAvatar === av ? 'border-yellow-500 scale-110 shadow-lg shadow-yellow-500/20' : 'border-slate-700 opacity-50 hover:opacity-100'}`}
                            >
                                <img src={av} alt="avatar" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>
                </>
            )}

            <button 
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 mt-6 transition-all ${
                    !loading 
                    ? 'bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white shadow-lg shadow-amber-900/30 transform hover:-translate-y-0.5' 
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
            >
                {loading ? 'İşlem yapılıyor...' : (isRegister ? 'Maceraya Başla' : 'Arenaya Dön')} <ArrowRight size={18} />
            </button>
        </form>
      </div>

      {/* SQL MODAL */}
      {showSql && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-slate-900 border border-slate-600 rounded-xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl">
                  <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800 rounded-t-xl">
                      <div className="flex items-center gap-3">
                        <Database className="text-yellow-500" />
                        <h3 className="text-lg font-bold text-white">Supabase SQL Kurulumu</h3>
                      </div>
                      <button onClick={() => setShowSql(false)} className="text-slate-400 hover:text-white"><X /></button>
                  </div>
                  
                  <div className="flex-1 p-4 overflow-hidden relative">
                      <textarea 
                        readOnly 
                        value={SQL_SETUP_CODE} 
                        className="w-full h-full bg-slate-950 text-green-400 font-mono text-xs p-4 rounded border border-slate-700 resize-none focus:outline-none custom-scrollbar"
                      />
                  </div>

                  <div className="p-4 border-t border-slate-700 bg-slate-800 rounded-b-xl flex justify-between items-center">
                      <p className="text-xs text-slate-400">
                          Bu kodu Supabase projenizdeki <strong>SQL Editor</strong> bölümüne yapıştırıp çalıştırın.
                      </p>
                      <button 
                        onClick={handleCopySql}
                        className={`px-4 py-2 rounded font-bold text-sm flex items-center gap-2 transition-all ${copied ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
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
