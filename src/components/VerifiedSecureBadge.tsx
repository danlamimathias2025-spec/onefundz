import React, { useState } from 'react';
import { ShieldCheck, Lock, CheckCircle2, Server, Eye, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function VerifiedSecureBadge() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setShowDetails(true)}
        className="mx-4 my-2 p-2.5 rounded-xl bg-slate-900/90 dark:bg-slate-900/90 border border-emerald-500/30 backdrop-blur-md shadow-sm hover:border-emerald-500/50 transition-all cursor-pointer group flex items-center justify-between"
      >
        <div className="flex items-center space-x-2.5">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold tracking-tight text-white flex items-center gap-1">
                Verified Secure
              </span>
              <span className="px-1.5 py-0.2 text-[8px] font-semibold tracking-wider uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                256-Bit SSL
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-normal leading-tight">
              Bank-Grade Encryption & Isolated Account Safeguards
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 text-slate-400 group-hover:text-emerald-400 transition-colors">
          <span className="text-[10px] font-medium hidden sm:inline">Details</span>
          <ChevronRight size={14} />
        </div>
      </motion.div>

      <AnimatePresence>
        {showDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl text-slate-100"
            >
              <button
                onClick={() => setShowDetails(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    Verified Security Protocol
                  </h3>
                  <p className="text-[11px] text-emerald-400 font-medium">
                    Active & Encrypted Connection
                  </p>
                </div>
              </div>

              <div className="space-y-3 my-4">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start space-x-2.5">
                  <Lock size={15} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[11px] font-semibold text-slate-200">256-Bit SSL Encryption</div>
                    <div className="text-[10px] text-slate-400 leading-snug">
                      All data transactions and sessions are protected with military-grade AES-256 encryption.
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start space-x-2.5">
                  <Server size={15} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[11px] font-semibold text-slate-200">Isolated Cloud Infrastructure</div>
                    <div className="text-[10px] text-slate-400 leading-snug">
                      User balances and subscription ledgers are segregated in secure Google Cloud Firestore nodes.
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start space-x-2.5">
                  <CheckCircle2 size={15} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[11px] font-semibold text-slate-200">Real-Time Integrity Audit</div>
                    <div className="text-[10px] text-slate-400 leading-snug">
                      Automated server-side validation guarantees balance integrity and fraud protection.
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Eye size={12} className="text-emerald-400" /> System Status: Normal
                </span>
                <span className="font-mono text-slate-500">ID: 256-VERIFIED</span>
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="w-full mt-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-lg shadow-emerald-500/10"
              >
                Close Audit Summary
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
