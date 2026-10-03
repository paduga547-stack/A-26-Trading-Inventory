import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
      {toasts.map((toast) => {
        let borderClass = 'border-emerald-500 bg-slate-900 text-white';
        let icon = <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />;

        if (toast.type === 'error') {
          borderClass = 'border-rose-500 bg-slate-900 text-white';
          icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
        } else if (toast.type === 'warning') {
          borderClass = 'border-amber-500 bg-slate-900 text-white';
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
        } else if (toast.type === 'info') {
          borderClass = 'border-sky-500 bg-slate-900 text-white';
          icon = <Info className="w-5 h-5 text-sky-400 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-lg border-l-4 shadow-xl transition-all animate-in fade-in slide-in-from-right-5 ${borderClass}`}
          >
            <div className="flex items-center gap-2.5 text-xs font-medium">
              {icon}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
