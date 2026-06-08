import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X, Sparkles } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastMessage, 'id'>) => void;
  success: (title: string, description: string) => void;
  info: (title: string, description: string) => void;
  error: (title: string, description: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback(({ type, title, description, duration = 5000 }: Omit<ToastMessage, 'id'>) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, description, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const success = useCallback((title: string, description: string) => {
    toast({ type: 'success', title, description });
  }, [toast]);

  const info = useCallback((title: string, description: string) => {
    toast({ type: 'info', title, description });
  }, [toast]);

  const error = useCallback((title: string, description: string) => {
    toast({ type: 'error', title, description });
  }, [toast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, success, info, error }}>
      {children}
      
      {/* Toast Render Node */}
      <div id="toast-notifications-portal" className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none p-4 sm:p-0">
        <AnimatePresence>
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-2xl border shadow-xl bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md ${
                item.type === 'success'
                  ? 'border-emerald-500/30 text-emerald-100 shadow-emerald-900/10'
                  : item.type === 'error'
                  ? 'border-rose-500/30 text-rose-100 shadow-rose-900/10'
                  : 'border-purple-500/30 text-purple-100 shadow-purple-900/10'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {item.type === 'success' && (
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                    <CheckCircle2 size={15} className="text-emerald-400 animate-pulse" />
                  </div>
                )}
                {item.type === 'error' && (
                  <div className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-400/40 flex items-center justify-center">
                    <AlertCircle size={15} className="text-rose-400" />
                  </div>
                )}
                {item.type === 'info' && (
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center">
                    <Sparkles size={14} className="text-purple-400" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-350 dark:text-slate-400 leading-relaxed mt-1">
                  {item.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(item.id)}
                className="shrink-0 self-start text-slate-450 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
