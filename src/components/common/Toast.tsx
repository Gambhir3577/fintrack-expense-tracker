import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useSettingsStore();

  if (!toast.show) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
  };

  const borderMap = {
    success: 'border-emerald-500/30 bg-slate-900/95 text-slate-100',
    error: 'border-rose-500/30 bg-slate-900/95 text-slate-100',
    warning: 'border-amber-500/30 bg-slate-900/95 text-slate-100',
    info: 'border-blue-500/30 bg-slate-900/95 text-slate-100',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md max-w-md ${borderMap[toast.type]}`}
      >
        {iconMap[toast.type]}
        <p className="text-sm font-medium text-slate-200">{toast.message}</p>
        <button
          onClick={hideToast}
          className="ml-auto p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
