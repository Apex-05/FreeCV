/**
 * UnsavedModal — custom modal that replaces the browser's beforeunload popup.
 *
 * Usage:
 *   const { guardAsync } = useUnsavedGuard();
 *   const proceed = await guardAsync();   // true = user said go ahead, false = cancelled
 *
 * Render <UnsavedModal /> once anywhere inside EditorPage.
 */

import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Save, Trash2, X } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import { useSaveStore } from '../../store/saveStore';
import toast from 'react-hot-toast';

// ── context ───────────────────────────────────────────────────────────────────

interface GuardCtx {
  guardAsync: () => Promise<boolean>;
}

const Ctx = createContext<GuardCtx>({ guardAsync: async () => true });

export const useUnsavedGuard = () => useContext(Ctx);

// ── provider + modal ──────────────────────────────────────────────────────────

export const UnsavedGuardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen]   = useState(false);
  const resolveRef        = useRef<((v: boolean) => void) | null>(null);
  const [saving, setSaving] = useState(false);

  const guardAsync = useCallback((): Promise<boolean> => {
    const { isDirty } = useResumeStore.getState();
    if (!isDirty) return Promise.resolve(true);
    return new Promise(res => {
      resolveRef.current = res;
      setOpen(true);
    });
  }, []);

  const finish = (v: boolean) => {
    setOpen(false);
    resolveRef.current?.(v);
    resolveRef.current = null;
  };

  const handleSaveAndContinue = async () => {
    setSaving(true);
    try {
      const { resume, clearDirty } = useResumeStore.getState();
      await useSaveStore.getState().manualSave(resume, 'Before leaving');
      clearDirty();
      finish(true);
    } catch {
      toast.error('Save failed. You can still leave or try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => finish(true);
  const handleCancel  = () => finish(false);

  return (
    <Ctx.Provider value={{ guardAsync }}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) handleCancel(); }}
          >
            <motion.div
              initial={{ scale: 0.93, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.93, y: 8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 26 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="unsaved-title"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                    <AlertTriangle size={16} className="text-amber-500" />
                  </div>
                  <h2 id="unsaved-title" className="text-sm font-semibold text-gray-900">Unsaved changes</h2>
                </div>
                <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors" aria-label="Cancel">
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-4 space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  You have edits that have not been manually saved as a version. What would you like to do?
                </p>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 leading-relaxed">
                  Your resume is always auto-saved locally in your browser - your content will not be lost. This only affects your version history.
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 space-y-2">
                <button
                  onClick={handleSaveAndContinue}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <Save size={14} />
                  {saving ? 'Saving…' : 'Save version & continue'}
                </button>
                <button
                  onClick={handleDiscard}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
                >
                  <Trash2 size={14} />
                  Discard & continue
                </button>
                <button
                  onClick={handleCancel}
                  className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancel - keep editing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
};
