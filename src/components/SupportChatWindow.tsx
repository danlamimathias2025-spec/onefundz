import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { db, auth } from '@/src/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, getDocs, where } from 'firebase/firestore';

export default function SupportChatWindow({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);

  useEffect(() => {
    const initChat = async () => {
      const user = auth.currentUser;
      if (!user || !user.email) return;
      
      const q = query(collection(db, 'supportChats'), where('userId', '==', user.email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      let id;
      if (querySnapshot.empty) {
        const docRef = await addDoc(collection(db, 'supportChats'), {
          userId: user.email.toLowerCase(),
          createdAt: serverTimestamp(),
          status: 'open'
        });
        id = docRef.id;
      } else {
        id = querySnapshot.docs[0].id;
      }
      setChatId(id);
    };
    initChat();
  }, []);

  useEffect(() => {
    if (!chatId) return;
    const q = query(collection(db, `supportChats/${chatId}/messages`), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [chatId]);

  const handleSend = async () => {
    if (!text.trim() || !chatId || !auth.currentUser?.email) return;
    await addDoc(collection(db, `supportChats/${chatId}/messages`), {
      senderId: auth.currentUser.email.toLowerCase(),
      userId: auth.currentUser.email.toLowerCase(),
      text,
      createdAt: serverTimestamp()
    });
    setText('');
  };

  return (
    <div className="fixed bottom-24 left-6 z-50 w-80 h-96 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col">
      <div className="p-3 bg-indigo-600 text-white rounded-t-lg flex justify-between items-center">
        <h3 className="font-bold">Support Chat</h3>
        <button onClick={onClose}><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map(m => (
          <div key={m.id} className={`p-2 rounded ${m.senderId === auth.currentUser?.email ? 'bg-indigo-100 dark:bg-indigo-900 ml-auto' : 'bg-slate-100 dark:bg-slate-700'} w-max`}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="p-3 border-t flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)} className="flex-1 border p-1 rounded" placeholder="Type a message..." />
        <button onClick={handleSend} className="bg-indigo-600 text-white p-2 rounded"><Send size={16} /></button>
      </div>
    </div>
  );
}
