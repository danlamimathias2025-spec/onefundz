import React, { useState, useEffect } from 'react';
import { Newspaper, RefreshCw, ChevronDown, ChevronUp, Clock, Sparkles, Radio, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Article {
  title: string;
  summary: string;
  sourceName: string;
  category: string;
  publishedTime: string;
}

export default function FinanceNews() {
  const [news, setNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/news');
      if (!resp.ok) {
        throw new Error('Could not retrieve latest announcements');
      }
      const data = await resp.json();
      if (data && Array.isArray(data.articles)) {
        setNews(data.articles);
      } else {
        throw new Error('Invalid server data format');
      }
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e: any) {
      console.error(e);
      setError('Market broadcast stream offline. Click refresh to retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const getCategoryColor = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'currency':
        return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/20';
      case 'policy':
        return 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/20';
      case 'stock market':
        return 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/20';
      case 'inflation':
        return 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/20';
      default:
        return 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/20';
    }
  };

  return (
    <div id="financial-market-news-card" className="p-5 bg-white dark:bg-slate-900 border border-slate-200/65 dark:border-slate-800/40 rounded-2xl mx-4 mt-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/40">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
            <Radio size={16} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">Daily Economic Feed</h3>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1 mt-0.5">
              <Sparkles size={10} className="text-yellow-500" /> Grounded with Google Search
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

      {loading ? (
        <div className="py-8 space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="space-y-2 animate-pulse">
              <div className="h-3 bg-slate-200 dark:bg-slate-850 rounded-md w-3/4"></div>
              <div className="h-2 bg-slate-100 dark:bg-slate-850/60 rounded-md w-1/2"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-6 text-center text-xs text-rose-500 flex flex-col items-center gap-2">
          <p>{error}</p>
          <button 
            onClick={fetchNews} 
            className="text-[10px] bg-purple-600 text-white rounded-lg px-3 py-1.5 font-bold hover:bg-purple-750 transition"
          >
            Retry Streaming Connection
          </button>
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs">
          No economic intelligence broadcasts found.
        </div>
      ) : (
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
                  <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-100 leading-snug group-hover:text-purple-650 dark:group-hover:text-purple-400 transition">
                    {art.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-550 line-clamp-1">
                    {art.summary}
                  </p>
                </div>
                
                <div className="text-slate-400 dark:text-slate-650 group-hover:text-purple-650 transition self-center text-xs border border-transparent group-hover:border-purple-100 dark:group-hover:border-purple-950 px-2 py-1 rounded-lg">
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
      )}

      {/* DETAILED ARTICLE OVERLAY MODAL */}
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
                  className="px-5 py-2.5 text-xs font-bold rounded-xl text-slate-755 bg-slate-100 dark:bg-slate-800 dark:text-slate-250 hover:bg-slate-200 dark:hover:bg-slate-750 transition active:scale-95"
                >
                  Close Headlines details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
