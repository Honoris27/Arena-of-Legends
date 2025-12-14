
import React, { useState } from 'react';
import { Mail, ShieldAlert, Megaphone, X, MessageSquare, Trash2, Check, Clock, CheckSquare, Send, Reply } from 'lucide-react';
import { Player, Message, CombatReport, Announcement, RankEntry } from '../types';
import { sendMessage, fetchLeaderboard } from '../services/supabase';

interface MailboxProps {
    isOpen: boolean;
    onClose: () => void;
    player: Player;
    onDeleteMessage: (id: string) => void;
    onDeleteReport: (id: string) => void;
    onBatchDeleteMessages: (ids: string[]) => void;
    onBatchDeleteReports: (ids: string[]) => void;
    announcements: Announcement[];
}

const Mailbox: React.FC<MailboxProps> = ({ 
    isOpen, onClose, player, 
    onDeleteMessage, onDeleteReport, 
    onBatchDeleteMessages, onBatchDeleteReports,
    announcements 
}) => {
    const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'reports' | 'announcements'>('inbox');
    const [selectedReport, setSelectedReport] = useState<CombatReport | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    
    // Compose State
    const [isComposing, setIsComposing] = useState(false);
    const [recipientName, setRecipientName] = useState("");
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");
    const [sendError, setSendError] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [recipientList, setRecipientList] = useState<RankEntry[]>([]);

    if (!isOpen) return null;

    const inboxMessages = player.messages.filter(m => !m.type || m.type === 'inbox');
    const sentMessages = player.messages.filter(m => m.type === 'sent');

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedItems(newSet);
    };

    const toggleSelectAll = () => {
        let items: string[] = [];
        if (activeTab === 'inbox') items = inboxMessages.map(m => m.id);
        else if (activeTab === 'sent') items = sentMessages.map(m => m.id);
        else if (activeTab === 'reports') items = player.reports.map(r => r.id);

        if (selectedItems.size === items.length) setSelectedItems(new Set());
        else setSelectedItems(new Set(items));
    };

    const handleDeleteSelected = () => {
        if (selectedItems.size === 0) return;
        if (confirm(`${selectedItems.size} öğeyi silmek istediğine emin misin?`)) {
            if (activeTab === 'inbox' || activeTab === 'sent') onBatchDeleteMessages(Array.from(selectedItems));
            else if (activeTab === 'reports') onBatchDeleteReports(Array.from(selectedItems));
            setSelectedItems(new Set());
            setSelectedReport(null);
        }
    };

    const handleDeleteAll = () => {
        let items: string[] = [];
        if (activeTab === 'inbox') items = inboxMessages.map(m => m.id);
        else if (activeTab === 'sent') items = sentMessages.map(m => m.id);
        else if (activeTab === 'reports') items = player.reports.map(r => r.id);

        if (items.length > 0 && confirm("TÜM listelenen öğeleri silmek istediğine emin misin?")) {
            if (activeTab === 'reports') {
                onBatchDeleteReports(items);
                setSelectedReport(null);
            } else {
                onBatchDeleteMessages(items);
            }
            setSelectedItems(new Set());
        }
    };

    const handleOpenCompose = async (replyTo?: Message) => {
        setIsComposing(true);
        // Load potential recipients for auto-complete/validation (simple version: top 20)
        const users = await fetchLeaderboard();
        setRecipientList(users);

        if (replyTo) {
            setRecipientName(replyTo.sender);
            setSubject(replyTo.subject.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`);
            setContent(`\n\n--- ${replyTo.sender} yazdı: ---\n${replyTo.content}`);
        } else {
            setRecipientName("");
            setSubject("");
            setContent("");
        }
    };

    const handleSend = async () => {
        if (!recipientName || !subject || !content) {
            setSendError("Lütfen tüm alanları doldur.");
            return;
        }

        const targetUser = recipientList.find(u => u.name.toLowerCase() === recipientName.toLowerCase());
        
        // In a real app, we'd need a better way to find users by name if they aren't in leaderboard
        if (!targetUser && !confirm("Kullanıcı sıralamada bulunamadı. İsmin doğru olduğundan emin misin? Yine de gönderilsin mi?")) {
             return;
        }
        
        // If we can't find ID, we can't send via RPC safely without looking up ID first.
        // For this demo, assume we must pick from known list or if replying we use hidden ID.
        // Let's rely on finding ID from list for new messages.
        
        let targetId = targetUser?.id;
        
        // Fallback: If replying, we might store senderId in Message (requires update to Message type).
        // Assuming we rely on name matching for now or added senderId to Message type.
        
        if (!targetId) {
             // Try to fetch specific user by name? Not implemented in Supabase service easily.
             // For now, restrict to known users or require ID.
             // Hack: If replying, we ideally need the sender's ID.
             // Updated Message Type has senderId!
             setSendError("Kullanıcı bulunamadı.");
             return;
        }

        setIsSending(true);
        const success = await sendMessage(player.id, player.name, targetId, recipientName, subject, content);
        setIsSending(false);

        if (success) {
            setIsComposing(false);
            setActiveTab('sent');
            alert("Mesaj gönderildi!");
        } else {
            setSendError("Gönderim başarısız.");
        }
    };

    const handleReply = (msg: Message) => {
        // We need the sender's ID to reply. 
        // If msg.senderId exists use it.
        // If not, we have to search the list.
        setIsComposing(true);
        setRecipientName(msg.sender);
        setSubject(msg.subject.startsWith('Re:') ? msg.subject : `Re: ${msg.subject}`);
        setContent(`\n\n--- ${formatDate(msg.timestamp)} tarihinde ${msg.sender} yazdı: ---\n${msg.content}`);
        
        // Background fetch for ID resolution
        fetchLeaderboard().then(users => {
            setRecipientList(users);
            // If message has senderId, we are good. If not, we hope they are in leaderboard.
            // The updated Message type has senderId, ensuring this works.
            if(msg.senderId) {
                // Manually inject into list if not present to ensure ID lookup works
                if(!users.find(u => u.id === msg.senderId)) {
                    setRecipientList(prev => [...prev, { id: msg.senderId, name: msg.sender } as any]);
                }
            }
        });
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

                {/* Compose Modal Overlay */}
                {isComposing && (
                    <div className="absolute inset-0 z-50 bg-slate-900/95 flex items-center justify-center p-4">
                        <div className="bg-slate-800 border border-slate-600 rounded-xl w-full max-w-lg p-6 shadow-2xl">
                            <div className="flex justify-between mb-4">
                                <h3 className="text-white font-bold flex items-center gap-2"><Send size={18}/> Yeni Mesaj</h3>
                                <button onClick={() => setIsComposing(false)}><X className="text-slate-400"/></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Kime</label>
                                    <input 
                                        type="text" 
                                        value={recipientName}
                                        onChange={e => setRecipientName(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                        placeholder="Oyuncu Adı..."
                                        list="players"
                                    />
                                    <datalist id="players">
                                        {recipientList.map(u => <option key={u.id} value={u.name} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Konu</label>
                                    <input 
                                        type="text" 
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                                        placeholder="Konu..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Mesaj</label>
                                    <textarea 
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white h-32 resize-none"
                                        placeholder="Mesajını yaz..."
                                    />
                                </div>
                                {sendError && <p className="text-red-500 text-xs">{sendError}</p>}
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setIsComposing(false)} className="px-4 py-2 rounded bg-slate-700 text-white text-sm">İptal</button>
                                    <button onClick={handleSend} disabled={isSending} className="px-4 py-2 rounded bg-green-600 text-white text-sm font-bold flex items-center gap-2">
                                        {isSending ? 'Gönderiliyor...' : <><Send size={14}/> Gönder</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex bg-slate-800/50 border-b border-slate-700 overflow-x-auto">
                    <button 
                        onClick={() => handleOpenCompose()}
                        className="px-6 py-3 flex items-center justify-center gap-2 text-sm font-bold bg-green-900/50 text-green-400 hover:bg-green-900/80 border-r border-slate-700"
                    >
                        <Send size={16} /> Yeni Yaz
                    </button>
                    <button 
                        onClick={() => { setActiveTab('inbox'); setSelectedItems(new Set()); setSelectedReport(null); }}
                        className={`flex-1 min-w-[100px] py-3 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${activeTab === 'inbox' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                    >
                        <MessageSquare size={16} /> Gelen ({inboxMessages.length})
                    </button>
                    <button 
                        onClick={() => { setActiveTab('sent'); setSelectedItems(new Set()); setSelectedReport(null); }}
                        className={`flex-1 min-w-[100px] py-3 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${activeTab === 'sent' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                    >
                        <Send size={16} /> Giden ({sentMessages.length})
                    </button>
                    <button 
                        onClick={() => { setActiveTab('reports'); setSelectedItems(new Set()); setSelectedReport(null); }}
                        className={`flex-1 min-w-[100px] py-3 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${activeTab === 'reports' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                    >
                        <ShieldAlert size={16} /> Raporlar ({player.reports.length})
                    </button>
                    <button 
                        onClick={() => { setActiveTab('announcements'); setSelectedItems(new Set()); setSelectedReport(null); }}
                        className={`flex-1 min-w-[100px] py-3 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${activeTab === 'announcements' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                    >
                        <Megaphone size={16} /> Duyurular
                    </button>
                </div>

                {/* Bulk Actions Toolbar */}
                {activeTab !== 'announcements' && (
                    <div className="bg-slate-800 p-2 flex gap-2 items-center border-b border-slate-700">
                        <button onClick={toggleSelectAll} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white flex items-center gap-2">
                            <CheckSquare size={14} /> Tümünü Seç
                        </button>
                        <button onClick={handleDeleteSelected} disabled={selectedItems.size === 0} className="px-3 py-1 bg-red-900/50 hover:bg-red-800 text-red-200 disabled:opacity-50 rounded text-xs flex items-center gap-2">
                            <Trash2 size={14} /> Seçilileri Sil ({selectedItems.size})
                        </button>
                        <button onClick={handleDeleteAll} className="px-3 py-1 bg-red-900 hover:bg-red-800 text-white rounded text-xs flex items-center gap-2 ml-auto">
                            <Trash2 size={14} /> Tümünü Sil
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-900/50 p-4">
                    
                    {/* INBOX TAB */}
                    {activeTab === 'inbox' && (
                        <div className="space-y-3">
                            {inboxMessages.length === 0 ? (
                                <div className="text-center text-slate-500 mt-10">Gelen kutusu boş.</div>
                            ) : (
                                inboxMessages.slice().reverse().map(msg => (
                                    <div key={msg.id} className={`bg-slate-800 border ${selectedItems.has(msg.id) ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-700'} p-4 rounded-lg relative hover:bg-slate-800/80 transition-colors group`}>
                                        <div className="absolute top-4 left-4">
                                            <div 
                                                onClick={() => toggleSelect(msg.id)}
                                                className={`w-5 h-5 border rounded cursor-pointer flex items-center justify-center ${selectedItems.has(msg.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-500 hover:border-white'}`}
                                            >
                                                {selectedItems.has(msg.id) && <Check size={12} className="text-white"/>}
                                            </div>
                                        </div>
                                        <div className="pl-10">
                                            <div className="flex justify-between mb-2">
                                                <span className="font-bold text-yellow-500 flex items-center gap-2"><UserIcon/> {msg.sender}</span>
                                                <span className="text-xs text-slate-500">{formatDate(msg.timestamp)}</span>
                                            </div>
                                            <h4 className="font-bold text-white mb-1">{msg.subject}</h4>
                                            <p className="text-slate-300 text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                        <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleReply(msg)}
                                                className="p-2 bg-blue-900/50 text-blue-400 hover:text-white rounded"
                                                title="Cevapla"
                                            >
                                                <Reply size={16} />
                                            </button>
                                            <button 
                                                onClick={() => onDeleteMessage(msg.id)}
                                                className="p-2 bg-red-900/50 text-red-400 hover:text-white rounded"
                                                title="Sil"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* SENT TAB */}
                    {activeTab === 'sent' && (
                        <div className="space-y-3">
                            {sentMessages.length === 0 ? (
                                <div className="text-center text-slate-500 mt-10">Giden kutusu boş.</div>
                            ) : (
                                sentMessages.slice().reverse().map(msg => (
                                    <div key={msg.id} className={`bg-slate-800 border ${selectedItems.has(msg.id) ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-700'} p-4 rounded-lg relative hover:bg-slate-800/80 transition-colors`}>
                                        <div className="absolute top-4 left-4">
                                            <div 
                                                onClick={() => toggleSelect(msg.id)}
                                                className={`w-5 h-5 border rounded cursor-pointer flex items-center justify-center ${selectedItems.has(msg.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-500 hover:border-white'}`}
                                            >
                                                {selectedItems.has(msg.id) && <Check size={12} className="text-white"/>}
                                            </div>
                                        </div>
                                        <div className="pl-10">
                                            <div className="flex justify-between mb-2">
                                                <span className="font-bold text-blue-400 flex items-center gap-2">Kime: {msg.recipientName || "Bilinmiyor"}</span>
                                                <span className="text-xs text-slate-500">{formatDate(msg.timestamp)}</span>
                                            </div>
                                            <h4 className="font-bold text-white mb-1">{msg.subject}</h4>
                                            <p className="text-slate-300 text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>
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
                                            className={`p-3 pl-10 relative rounded border cursor-pointer transition-colors ${
                                                selectedReport?.id === rep.id 
                                                ? 'bg-indigo-900/30 border-indigo-500' 
                                                : selectedItems.has(rep.id) ? 'bg-slate-800 border-indigo-500' : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                                            }`}
                                        >
                                            <div className="absolute top-3 left-3" onClick={(e) => { e.stopPropagation(); toggleSelect(rep.id); }}>
                                                <div 
                                                    className={`w-4 h-4 border rounded cursor-pointer flex items-center justify-center ${selectedItems.has(rep.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-500 hover:border-white'}`}
                                                >
                                                    {selectedItems.has(rep.id) && <Check size={10} className="text-white"/>}
                                                </div>
                                            </div>

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

                            {/* Report Details */}
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

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
)

export default Mailbox;
