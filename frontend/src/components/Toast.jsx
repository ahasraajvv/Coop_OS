import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isInfo = toast.type === 'info';

  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-top duration-200 no-print">
      <div
        className={`p-4 rounded-2xl shadow-xl border flex items-center justify-between text-xs font-semibold ${
          isError
            ? 'bg-rose-600 text-white border-rose-700'
            : isInfo
            ? 'bg-sky-600 text-white border-sky-700'
            : 'bg-emerald-600 text-white border-emerald-700'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isError ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : isInfo ? (
            <Info className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/10 transition ml-2 text-white/80 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
