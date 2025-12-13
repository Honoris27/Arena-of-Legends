import React, { useState } from 'react';
import { User, Lock, ArrowRight, Mail, AlertCircle } from 'lucide-react';
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

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
            // Auto login usually happens, or handled by App session listener
        } else {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (signInError) throw signInError;
        }
        // Success handled by Auth State Listener in App.tsx
    } catch (err: any) {
        console.error(err);
        setError(err.message || "Bir hata oluştu.");
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>

      <div className="relative z-10 w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-8 animate-fade-in">
        <div className="text-center mb-8">
            <h1 className="text-4xl cinzel font-bold bg-gradient-to-r from-yellow-500 to-amber-700 bg-clip-text text-transparent mb-2">Arena of Legends</h1>
            <p className="text-slate-400 text-sm">Efsaneni yazmaya başla.</p>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 bg-slate-800 rounded-lg p-1">
            <button 
                onClick={() => { setIsRegister(false); setError(null); }}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${!isRegister ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Giriş Yap
            </button>
            <button 
                onClick={() => { setIsRegister(true); setError(null); }}
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
    </div>
  );
};

export default LoginScreen;