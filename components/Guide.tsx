import React from 'react';
import { X, Sword, Shield, Hammer, Map } from 'lucide-react';

interface GuideProps {
    isOpen: boolean;
    onClose: () => void;
}

const Guide: React.FC<GuideProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-slate-900 border border-slate-600 rounded-2xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800 rounded-t-2xl">
                    <h2 className="text-2xl font-bold cinzel text-white">Oyun Rehberi</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    <section>
                        <h3 className="flex items-center gap-2 text-xl font-bold text-yellow-500 mb-2">
                            <Sword size={20} /> İstatistikler ve Savaş
                        </h3>
                        <ul className="list-disc list-inside text-slate-300 space-y-1 ml-2 text-sm">
                            <li><strong>STR (Güç):</strong> Fiziksel hasarını artırır.</li>
                            <li><strong>AGI (Çeviklik):</strong> Kritik vuruş şansını artırır.</li>
                            <li><strong>VIT (Dayanıklılık):</strong> Can puanını (HP) ve savunmanı artırır.</li>
                            <li><strong>INT (Zeka):</strong> Mana (MP) kapasiteni artırır.</li>
                            <li><strong>LUK (Şans):</strong> Kritik şansı ve eşya düşürme şansını etkiler.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="flex items-center gap-2 text-xl font-bold text-green-500 mb-2">
                            <Map size={20} /> Seferler ve Boss Savaşları
                        </h3>
                        <p className="text-slate-300 text-sm mb-2">
                            Seferlere çıkarak EXP ve Altın kazanabilirsin. %20 şansla eşya düşer.
                            Sefer bölgeleri zorlaştıkça ödüller artar.
                        </p>
                        <p className="text-slate-300 text-sm">
                            <strong>Boss Savaşları:</strong> Mağara Ejderhası gibi güçlü düşmanlar yüksek risk içerir ancak efsanevi ödüller verebilir.
                        </p>
                    </section>

                    <section>
                        <h3 className="flex items-center gap-2 text-xl font-bold text-orange-500 mb-2">
                            <Hammer size={20} /> Demirci ve Geliştirme
                        </h3>
                        <p className="text-slate-300 text-sm">
                            Eşyalarını +1, +2 seviyelerine yükseltebilirsin. Seviye arttıkça başarı şansı düşer.
                            Başarısız olursan eşya kırılmaz ama altının yanar.
                            <strong>Şans Tozu (Lucky Powder)</strong> kullanarak başarı şansını artırabilirsin.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Guide;