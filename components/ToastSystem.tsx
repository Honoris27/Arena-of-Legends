
import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, Gift } from 'lucide-react';
import { Toast } from '../types';

interface ToastSystemProps {
    toasts: Toast[];
    removeToast: (id: string) => void;
}

const ToastSystem: React.FC<ToastSystemProps> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-20 md:bottom-10 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: Toast, onRemove: () => void }> = ({ toast, onRemove }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(onRemove, 300); // Allow animation to finish
        }, toast.duration || 3000);
        return () => clearTimeout(timer);
    }, [toast, onRemove]);

    const icons = {
        success: <CheckCircle size={20} className="text-green-500" />,
        error: <AlertCircle size={20} className="text-red-500" />,
        info: <Info size={20} className="text-blue-500" />,
        loot: <Gift size={20} className="text-yellow-500" />
    };

    const bgColors = {
        success: 'bg-green-900/90 border-green-500/50',
        error: 'bg-red-900/90 border-red-500/50',
        info: 'bg-slate-800/90 border-slate-500/50',
        loot: 'bg-yellow-900/90 border-yellow-500/50'
    };

    return (
        <div 
            className={`
                pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl backdrop-blur-md text-sm text-white min-w-[300px] transition-all duration-300 transform
                ${bgColors[toast.type]}
                ${isExiting ? 'opacity-0 translate-x-10' : 'opacity-100 translate-x-0 animate-pop-in'}
            `}
        >
            {icons[toast.type]}
            <span className="flex-1 font-medium">{toast.message}</span>
            <button onClick={() => { setIsExiting(true); setTimeout(onRemove, 300); }} className="text-white/50 hover:text-white">
                <X size={16} />
            </button>
        </div>
    );
};

export default ToastSystem;
