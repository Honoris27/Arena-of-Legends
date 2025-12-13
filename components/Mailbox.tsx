
import React, { useState } from 'react';
import { Mail, ShieldAlert, Megaphone, X, MessageSquare, Trash2, Check, Clock } from 'lucide-react';
import { Player, Message, CombatReport, Announcement } from '../types';
import { formatTime } from '../services/gameLogic';

interface MailboxProps {
    isOpen: boolean;
    onClose: () => void;
    player: Player;
    onDeleteMessage: (id: string) => void;
    onDeleteReport: (id: string) => void;
    announcements: Announcement[];
}

const Mailbox: React.FC<MailboxProps> = ({ isOpen, onClose, player, onDeleteMessage, onDeleteReport, announcements }) => {
    const [activeTab, setActiveTab] = useState<'messages' | 'reports' | 'announcements'>('messages');
    const [selectedReport, setSelectedReport] = useState<CombatReport | null>(null);

    if (!isOpen) return null;

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-2 md:p-4">
            <div className="bg-slate-900 border border-slate-600 rounded-2xl w-full max-w-4xl h-[85vh] shadow-2xl flex flex-col overflow-hidden relative">
                
                {/* Header */}
                <div className="flex justify-between items-center p-4 bg-slate-800 border-b border-slate-700">
                    <h2 className="text-xl font-bold cinzel text-white flex items-center gap-2">
                        <Mail size={24} /> Posta Kutusu
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-800/50 border-b border-slate-700">
                    <button 
                        onClick={() => setActiveTab('messages')}
                        className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${activeTab === 'messages' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                    >
                        <MessageSquare size={16} /> Mesajlar ({player.messages.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('reports')}
                        className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${activeTab === 'reports' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                    >
                        <ShieldAlert size={16} /> Savaş Raporları ({player.reports.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('announcements')}
                        className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${activeTab === 'announcements' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                    >
                        <Megaphone size={16} /> Duyurular
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-900/50 p-4">
                    
                    {/* MESSAGES TAB */}
                    {activeTab === 'messages' && (
                        <div className="space-y-3">
                            {player.messages.length === 0 ? (
                                <div className="text-center text-slate-500 mt-10">Hiç mesajın yok.</div>
                            ) : (
                                player.messages.slice().reverse().map(msg => (
                                    <div key={msg.id} className="bg-slate-800 border border-slate-700 p-4 rounded-lg relative hover:bg-slate-800/80 transition-colors">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-bold text-yellow-500">{msg.sender}</span>
                                            <span className="text-xs text-slate-500">{formatDate(msg.timestamp)}</span>
                                        </div>
                                        <h4 className="font-bold text-white mb-1">{msg.subject}</h4>
                                        <p className="text-slate-300 text-sm">{msg.content}</p>
                                        <button 
                                            onClick={() => onDeleteMessage(msg.id)}
                                            className="absolute bottom-2 right-2 p-2 text-slate-600 hover:text-red-500"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* REPORTS TAB */}
                    {activeTab === 'reports' && (
                        <div className="flex h-full gap-4">
                            {/* Reports List */}
                            <div className={`flex-1 overflow-y-auto space-y-2 ${selectedReport ? 'hidden md:block' : ''}`}>
                                {player.reports.length === 0 ? (
                                    <div className="text-center text-slate-500 mt-10">Henüz savaş raporu yok.</div>
                                ) : (
                                    player.reports.slice().reverse().map(rep => (
                                        <div 
                                            key={rep.id} 
                                            onClick={() => setSelectedReport(rep)}
                                            className={`p-3 rounded border cursor-pointer transition-colors ${
                                                selectedReport?.id === rep.id 
                                                ? 'bg-indigo-900/30 border-indigo-500' 
                                                : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className={`font-bold text-sm ${rep.outcome === 'victory' ? 'text-green-400' : 'text-red-400'}`}>
                                                    {rep.outcome === 'victory' ? 'ZAFER' : 'YENİLGİ'}
                                                </span>
                                                <span className="text-[10px] text-slate-500">{formatDate(rep.timestamp)}</span>
                                            </div>
                                            <div className="text-slate-200 text-sm font-bold truncate">{rep.title}</div>
                                            <div className="text-xs text-yellow-600 truncate">{rep.rewards}</div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Report Details (Right side or overlay on mobile) */}
                            {selectedReport && (
                                <div className="flex-[2] bg-slate-950 border border-slate-700 rounded p-6 overflow-y-auto relative h-full">
                                    <button 
                                        onClick={() => setSelectedReport(null)}
                                        className="md:hidden absolute top-2 right-2 bg-slate-800 p-2 rounded"
                                    >
                                        <X size={16} />
                                    </button>

                                    <div className="mb-4 border-b border-slate-800 pb-4">
                                        <h3 className={`text-2xl font-bold cinzel mb-1 ${selectedReport.outcome === 'victory' ? 'text-green-500' : 'text-red-500'}`}>
                                            {selectedReport.title}
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs text-slate-400">
                                            <span className="flex items-center gap-1"><Clock size={12}/> {formatDate(selectedReport.timestamp)}</span>
                                            <span className="uppercase tracking-wider">{selectedReport.type}</span>
                                        </div>
                                    </div>

                                    {selectedReport.rewards && (
                                        <div className="bg-yellow-900/10 border border-yellow-900/30 p-3 rounded mb-4">
                                            <h4 className="text-yellow-500 text-sm font-bold mb-1">Kazanımlar</h4>
                                            <p className="text-yellow-100/80 text-sm">{selectedReport.rewards}</p>
                                        </div>
                                    )}

                                    <div className="space-y-1 font-mono text-xs text-slate-300 bg-black/20 p-4 rounded h-64 overflow-y-auto border border-slate-800">
                                        {selectedReport.details.map((line, idx) => (
                                            <div key={idx} className="border-b border-slate-800/50 pb-1 mb-1 last:border-0">
                                                {line}
                                            </div>
                                        ))}
                                    </div>

                                    <button 
                                        onClick={() => { onDeleteReport(selectedReport.id); setSelectedReport(null); }}
                                        className="mt-4 w-full py-2 bg-red-900/20 text-red-500 border border-red-900/50 rounded hover:bg-red-900/40"
                                    >
                                        Raporu Sil
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ANNOUNCEMENTS TAB */}
                    {activeTab === 'announcements' && (
                        <div className="space-y-4">
                            {announcements.map(ann => (
                                <div key={ann.id} className="bg-slate-800 border-l-4 border-indigo-500 p-4 rounded shadow-lg">
                                    <h3 className="text-lg font-bold text-white mb-2">{ann.title}</h3>
                                    <p className="text-slate-300 text-sm whitespace-pre-line">{ann.content}</p>
                                    <div className="mt-2 text-xs text-slate-500 text-right">{formatDate(ann.timestamp)}</div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Mailbox;
