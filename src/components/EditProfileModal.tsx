import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { X, UploadCloud, Check, Loader2, Camera, Smile } from 'lucide-react';
import { useToast } from '../lib/toast';

interface EditProfileModalProps {
  onClose: () => void;
  currentUserName: string;
  currentAvatarUrl?: string;
  userId: string;
}

const PRESET_AVATARS = [
  { id: 'p1', value: '📈', label: 'Dynamic Investor', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'p2', value: '💰', label: 'Wealth Builder', gradient: 'from-amber-400 to-amber-600' },
  { id: 'p3', value: '💎', label: 'Elite Client', gradient: 'from-blue-500 to-indigo-600' },
  { id: 'p4', value: '👑', label: 'VIP Premium', gradient: 'from-purple-500 to-fuchsia-600' },
  { id: 'p5', value: '🦁', label: 'Golden Lion', gradient: 'from-orange-500 to-red-600' },
  { id: 'p6', value: '🚀', label: 'Mars Portfolio', gradient: 'from-red-500 to-rose-600' },
];

export default function EditProfileModal({ onClose, currentUserName, currentAvatarUrl, userId }: EditProfileModalProps) {
  const { success, error: toastError } = useToast();
  const [userName, setUserName] = useState(currentUserName);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || '');
  const [activeTab, setActiveTab] = useState<'preset' | 'upload'>('preset');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize inputs if they change externally
  useEffect(() => {
    setUserName(currentUserName);
    setAvatarUrl(currentAvatarUrl || '');
  }, [currentUserName, currentAvatarUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toastError('Invalid File Type', 'Please select an image file (PNG, JPG, or JPEG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Let's crop/resize to a nice 150x150 square profile avatar
        const size = 150;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Centered cover cropping logic
          const sourceSize = Math.min(img.width, img.height);
          const sourceX = (img.width - sourceSize) / 2;
          const sourceY = (img.height - sourceSize) / 2;
          
          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceSize,
            sourceSize,
            0,
            0,
            size,
            size
          );
          
          // Compress carefully to keep under Firestore rules size limit (400KB)
          // 150x150 at 0.75 quality is typically ~10KB-15KB, which is extremely lightweight!
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setAvatarUrl(compressedDataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (preset: typeof PRESET_AVATARS[0]) => {
    // Generate an inline svg or beautiful colored dynamic avatar string or simply pass a data: URL representation of selection
    // In our case, to make it 100% compliant with standard string URLs, we can construct an elegant inline Canvas avatar,
    // or store a special custom protocol string like 'preset:p1:📈' which can be decoded dynamically.
    // However, saving it as a lightweight base64 DataURL represents maximum compatibility and zero custom decoding complexity throughout the app!
    // Let's programmatically generate a canvas-based data URL for the chosen preset.
    
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw gradient
      const grad = ctx.createLinearGradient(0, 0, 120, 120);
      if (preset.id === 'p1') { grad.addColorStop(0, '#10b981'); grad.addColorStop(1, '#0d9488'); }
      else if (preset.id === 'p2') { grad.addColorStop(0, '#f59e0b'); grad.addColorStop(1, '#d97706'); }
      else if (preset.id === 'p3') { grad.addColorStop(0, '#3b82f6'); grad.addColorStop(1, '#4f46e5'); }
      else if (preset.id === 'p4') { grad.addColorStop(0, '#a855f7'); grad.addColorStop(1, '#c084fc'); }
      else if (preset.id === 'p5') { grad.addColorStop(0, '#f97316'); grad.addColorStop(1, '#ea580c'); }
      else { grad.addColorStop(0, '#ef4444'); grad.addColorStop(1, '#f43f5e'); }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(60, 60, 60, 0, Math.PI * 2);
      ctx.fill();

      // Draw Emoji
      ctx.font = '54px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(preset.value, 60, 64);

      setAvatarUrl(canvas.toDataURL('image/png'));
    }
  };

  const handleSave = async () => {
    if (!userName.trim()) {
      toastError('Validation Failed', 'Please enter a valid display name.');
      return;
    }
    if (userName.trim().length > 50) {
      toastError('Limit Exceeded', 'Display name must not exceed 50 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        userName: userName.trim(),
        avatarUrl: avatarUrl
      });
      success('Profile Updated!', 'Your new display name and avatar were saved successfully.');
      onClose();
    } catch (err: any) {
      console.error("Failed to update profile details:", err);
      toastError('Update Failed', 'Missing permissions or database slow. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
      id="edit-profile-backdrop"
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800/80"
        id="edit-profile-container"
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center" id="edit-profile-header">
          <div>
            <h2 className="text-base font-bold">Edit Profile Detail</h2>
            <p className="text-xs text-slate-400">Personalize your OneFundz dashboard identity</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition text-xs p-1 rounded-lg hover:bg-slate-800"
            id="edit-profile-close-btn"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto" id="edit-profile-body">
          {/* Avatar Preview Section */}
          <div className="flex flex-col items-center justify-center py-2 space-y-3" id="edit-profile-preview-section">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-400/30 flex items-center justify-center bg-slate-100 dark:bg-slate-800 shadow-md">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    id="edit-profile-avatar-preview-img"
                  />
                ) : (
                  <span className="text-3xl font-extrabold text-slate-400 dark:text-slate-500 uppercase">
                    {userName ? userName.charAt(0) : '?'}
                  </span>
                )}
              </div>
              <div className="absolute right-0 bottom-0 bg-indigo-600 text-white p-1.5 rounded-full border border-white dark:border-slate-900 shadow-sm">
                <Camera size={14} />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">Preview of your profile avatar</p>
          </div>

          {/* Form: Display Name */}
          <div className="space-y-1.5" id="edit-profile-username-group">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block" htmlFor="edit-profile-display-name">
              Display Name / UserName
            </label>
            <input
              id="edit-profile-display-name"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your display name"
              maxLength={50}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-205 dark:border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white text-xs font-medium outline-none transition"
            />
          </div>

          <hr className="border-slate-100 dark:border-slate-800/60" />

          {/* Selection Tabs: Presets vs Upload */}
          <div className="space-y-3.5" id="edit-profile-selector-group">
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('preset')}
                className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'preset'
                    ? 'bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-250'
                }`}
                id="edit-profile-tab-preset"
              >
                <Smile size={14} /> Recommended Presets
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-250'
                }`}
                id="edit-profile-tab-upload"
              >
                <UploadCloud size={14} /> Upload Custom Photo
              </button>
            </div>

            {/* Tab Panel: Recommended Presets */}
            {activeTab === 'preset' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3 gap-3 pt-1"
                id="edit-profile-presets-panel"
              >
                {PRESET_AVATARS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-400/40 hover:bg-slate-50 dark:hover:bg-slate-950/40 active:scale-95 transition"
                    id={`preset-avatar-btn-${preset.id}`}
                  >
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-tr ${preset.gradient} flex items-center justify-center text-lg mb-1 shadow-inner`}>
                      {preset.value}
                    </div>
                    <span className="text-[9px] text-slate-400 text-center font-medium leading-tight">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}

            {/* Tab Panel: Custom Photo Upload */}
            {activeTab === 'upload' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-1"
                id="edit-profile-upload-panel"
              >
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) { processFile(e.dataTransfer.files[0]); } }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                    dragging
                      ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-900/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-705 hover:bg-slate-50 dark:hover:bg-slate-950/40'
                  }`}
                  id="edit-profile-upload-dropzone"
                >
                  <UploadCloud size={28} className="text-indigo-500 dark:text-indigo-400 animate-pulse" />
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Click or Drag profile image</p>
                    <p className="text-[10px] text-slate-400 mt-1">Accepts PNG, JPG, or JPEG formats</p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 flex gap-3 border-t border-slate-100 dark:border-slate-800/50" id="edit-profile-modal-footer">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
            id="edit-profile-cancel-btn"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || !userName.trim()}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl text-white shadow-sm transition flex items-center justify-center gap-1.5 ${
              isSubmitting || !userName.trim()
                ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                : 'bg-indigo-650 hover:bg-indigo-700'
            }`}
            id="edit-profile-save-btn"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check size={13} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
