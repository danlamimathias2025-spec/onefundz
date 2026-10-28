import React, { useState, useEffect } from 'react';
import { Newspaper, RefreshCw, Clock, Sparkles, Radio, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Article {
  title: string;
  summary: string;
  sourceName: string;
  category: string;
  publishedTime: string;
}

export default function FinanceNews() {
  const [news, setNews] = useState<Article[]>([
    {
      title: "OneFundz Wealth Management Expands High-Yield Savings Vaults",
      summary: "Cooperative members enjoy automated daily compounding yields and secure subscription-locked liquidity.",
      sourceName: "Financial Times",
      category: "Vault Yield",
      publishedTime: "1 hour ago"
    },
    {
      title: "Automated Daily Payouts Streamline Member Cooperative Returns",
      summary: "Our server-authoritative settlement ledger guarantees instant automated profit crediting every 24 hours.",
      sourceName: "Bloomberg Africa",
      category: "Compound Payouts",
      publishedTime: "3 hours ago"
    },
    {
      title: "Ambassador Referral Program Awards ₦500 Cash Bonuses Across Networks",
      summary: "Growing the OneFundz community yields immediate cash bonuses credited directly to your liquid balance.",
      sourceName: "Nairametrics",
      category: "Ambassador Rewards",
      publishedTime: "Today"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');

  const fetchNews = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 600);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'vault yield':
        return 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/20';
      case 'compound payouts':
        return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/20';
      case 'ambassador rewards':
        return 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/20';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200/50 dark:border-slate-700/40';
    }
  };

  return (
    <div id="financial-market-news-card" className="p-5 bg-white dark:bg-slate-900 border border-slate-200/65 dark:border-slate-800/40 rounded-2xl mx-4 mt-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/40">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-yellow-50 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400">
            <Radio size={16} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">Wealth & Market Intelligence</h3>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1 mt-0.5">
              <Sparkles size={10} className="text-yellow-500" /> OneFundz Cooperative Dispatch
            </span>
          </div>
        </div>

        <button
          onClick={fetchNews}
          disabled={loading}
          className="p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] items-center gap-1.5 flex transition active:scale-95 disabled:opacity-40"
          title="Refresh headlines"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="space-y-3">
        {news.map((art, idx) => (
          <div 
            key={idx}
            className="group border-b border-slate-50 last:border-0 dark:border-slate-800/20 pb-2.5 last:pb-0 transition"
          >
            <div 
              onClick={() => setSelectedArticle(art)}
              className="flex items-start justify-between gap-3 cursor-pointer select-none"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap font-sans">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getCategoryColor(art.category)}`}>
                    {art.category}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                    {art.sourceName}
                  </span>
                  <span className="text-[9px] text-slate-400 flex items-center gap-1">
                    <Clock size={8} /> {art.publishedTime}
                  </span>
                </div>
                <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-100 leading-snug group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition">
                  {art.title}
                </h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-550 line-clamp-1">
                  {art.summary}
                </p>
              </div>
              
              <div className="text-slate-400 dark:text-slate-650 group-hover:text-yellow-500 transition self-center text-xs border border-transparent group-hover:border-yellow-200 dark:group-hover:border-yellow-900 px-2 py-1 rounded-lg">
                Read
              </div>
            </div>
          </div>
        ))}

        {lastRefreshed && (
          <div className="text-right pt-2 border-t border-slate-50 dark:border-slate-800/10">
            <span className="text-[8px] text-slate-400 font-mono">Last verified: {lastRefreshed} Today</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedArticle && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[150] flex items-center justify-center p-4"
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={16} />
              </button>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCategoryColor(selectedArticle.category)}`}>
                    {selectedArticle.category}
                  </span>
                  <span className="font-bold text-slate-600 dark:text-slate-300 font-mono text-xs">
                    {selectedArticle.sourceName}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px] flex items-center gap-1">
                    <Clock size={10} /> {selectedArticle.publishedTime}
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                  {selectedArticle.title}
                </h3>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {selectedArticle.summary}
                </p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-750 transition active:scale-95"
                >
                  Close Dispatch
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
