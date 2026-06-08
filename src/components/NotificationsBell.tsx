import React, { useState, useEffect } from 'react';
import { Bell, X, BellRing, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export default function NotificationsBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // We only attach listener if user exists
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (!user) return;
      
      const q = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snap) => {
        const userEmail = user.email || '';
        const notifs = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((n: any) => n.target === 'all' || n.target === userEmail);
        
        setNotifications(notifs);
        
        const readNotifs = JSON.parse(localStorage.getItem('readNotifications') || '[]');
        const unread = notifs.filter(n => !readNotifs.includes(n.id)).length;
        setUnreadCount(unread);
      });

      return () => unsubscribe();
    });

    return () => unsubscribeAuth();
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    // Mark all currently fetched notifications as read
    if (notifications.length > 0) {
      const allIds = notifications.map(n => n.id);
      localStorage.setItem('readNotifications', JSON.stringify(allIds));
      setUnreadCount(0);
    }
  };

  const closeModal = () => setIsOpen(false);

  return (
    <>
      <button 
        onClick={handleOpen}
        className="relative text-white hover:text-slate-200 transition-colors p-1.5 rounded-full hover:bg-slate-800"
      >
        {unreadCount > 0 ? <BellRing size={18} className="animate-pulse text-amber-400" /> : <Bell size={18} />}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-bold flex items-center justify-center border-2 border-slate-900 shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="fixed top-16 right-4 left-4 sm:left-auto sm:w-80 max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell size={16} className="text-indigo-500" />
                  Notifications
                </h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
                  <X size={16} />
                </button>
              </div>
              
              <div className="overflow-y-auto flex-1 p-2 space-y-2 pointer-events-auto max-h-[60vh]">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center">
                    <Bell className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-xs font-medium">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition duration-200">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full shrink-0 ${
                          notif.type === 'update' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                          notif.type === 'system' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}>
                          <Info size={14} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">{notif.title}</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-1.5">{notif.message}</p>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                            {notif.createdAt?.seconds ? new Date(notif.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
