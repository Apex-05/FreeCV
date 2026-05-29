import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import { TopBar } from '../components/editor/TopBar';
import { Sidebar } from '../components/editor/Sidebar';
import { ResumePreview } from '../components/editor/preview/ResumePreview';
import { PhotoEditorModal } from '../components/editor/PhotoEditorModal';
import { PDFPreviewModal } from '../components/editor/PDFPreviewModal';
import { UnsavedGuardProvider } from '../components/editor/UnsavedModal';
import { useResumeStore } from '../store/resumeStore';
import { useSaveStore } from '../store/saveStore';
import toast from 'react-hot-toast';
import { CloudCheck, X } from 'lucide-react';

const STORAGE_INFO_KEY = 'freecv_storage_info_shown';

const PREVIEW_INITIAL    = { opacity: 0, y: 16 };
const PREVIEW_ANIMATE    = { opacity: 1, y: 0 };
const PREVIEW_TRANSITION: Transition = { duration: 0.4, ease: 'easeOut' };

const EditorPageInner: React.FC = () => {
  const { isPrinting, resume } = useResumeStore();
  const { triggerAutoSave, checkCrashRecovery } = useSaveStore();
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);

  // ── Crash recovery check on mount ─────────────────────────────────────────
  useEffect(() => {
    checkCrashRecovery();
  }, [checkCrashRecovery]);

  // ── Auto-save whenever resume content changes ──────────────────────────────
  useEffect(() => {
    triggerAutoSave(resume);
  }, [resume, triggerAutoSave]);

  // ── Multi-tab conflict detection ───────────────────────────────────────────
  useEffect(() => {
    const TOAST_ID = 'freecv-external-update';
    const COOLDOWN_MS = 60_000;
    let lastShownAt = 0;

    const handler = () => {
      const now = Date.now();
      if (now - lastShownAt < COOLDOWN_MS) return; // already showing / shown recently
      lastShownAt = now;

      // Use a fixed ID so react-hot-toast replaces the existing toast
      // instead of stacking a new one on top
      toast(
        t => (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold">Another tab modified your resume</p>
            <p className="text-xs text-gray-500">Your edits here may overwrite it. Reload to sync.</p>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => { toast.dismiss(t.id); window.location.reload(); }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Reload
              </button>
              <button onClick={() => { toast.dismiss(t.id); lastShownAt = 0; }} className="text-xs text-gray-400 hover:text-gray-600">
                Dismiss
              </button>
            </div>
          </div>
        ),
        { id: TOAST_ID, duration: 12000, icon: '⚠️' },
      );
    };
    window.addEventListener('freecv:external-update', handler);
    return () => window.removeEventListener('freecv:external-update', handler);
  }, []);

  // ── Storage quota warning ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => toast(
      '⚠️ Storage almost full — your profile photo was removed from the save to free space. Export a JSON backup to preserve it.',
      { duration: 10000, style: { maxWidth: 420, fontSize: 13 } },
    );
    window.addEventListener('freecv:quota-exceeded', handler);
    return () => window.removeEventListener('freecv:quota-exceeded', handler);
  }, []);

  // ── Global undo/redo keyboard shortcuts ────────────────────────────────────
  const handleUndoRedo = useCallback((e: KeyboardEvent) => {
    if (!e.ctrlKey) return;
    const key = e.key.toLowerCase();
    const isUndo = !e.shiftKey && key === 'z';
    const isRedo = key === 'y' || (e.shiftKey && key === 'z');
    if (!isUndo && !isRedo) return;

    const target = e.target as HTMLElement;
    // Leave native undo/redo alone inside sidebar inputs
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
    // If a resume field is active, blur it first so its value commits to the store
    if (target.isContentEditable) target.blur();

    e.preventDefault();
    const s = useResumeStore.getState();
    if (isUndo && s.history.length > 0) { s.undo(); toast('Undone', { duration: 1000, icon: '✅' }); }
    else if (isRedo && s.future.length > 0) { s.redo(); toast('Redone', { duration: 1000, icon: '✅' }); }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleUndoRedo);
    return () => window.removeEventListener('keydown', handleUndoRedo);
  }, [handleUndoRedo]);

  // ── First-visit info toast ─────────────────────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem(STORAGE_INFO_KEY)) {
      const id = setTimeout(() => {
        toast(t => (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: 320 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(99,102,241,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              <CloudCheck size={16} style={{ color: '#a5b4fc' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#f9fafb', lineHeight: 1.3 }}>Auto-save is on</p>
              <p style={{ margin: '5px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>
                Saves every 5 seconds. Use{' '}
                <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Save</span>
                {' '}for named versions, or the{' '}
                <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>History</span>
                {' '}tab to restore any point.
              </p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'rgba(255,255,255,0.28)', flexShrink: 0, lineHeight: 1, marginTop: 2 }}
            >
              <X size={14} />
            </button>
          </div>
        ), { duration: 10000, style: { padding: '12px 14px', maxWidth: 380 } });
        localStorage.setItem(STORAGE_INFO_KEY, '1');
      }, 2500);
      return () => clearTimeout(id);
    }
  }, []);

  // ── Native beforeunload as last-resort fallback for tab close ──────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (useResumeStore.getState().isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // ── Photo editor event (from ContactPanel) ─────────────────────────────────
  useEffect(() => {
    const handler = () => setShowPhotoEditor(true);
    window.addEventListener('freecv:open-photo-editor', handler);
    return () => window.removeEventListener('freecv:open-photo-editor', handler);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        {!isPrinting && <Sidebar />}
        <main className="flex-1 overflow-auto bg-gray-100 flex items-start justify-center py-8 px-4">
          <motion.div initial={PREVIEW_INITIAL} animate={PREVIEW_ANIMATE} transition={PREVIEW_TRANSITION}>
            <ResumePreview />
          </motion.div>
        </main>
      </div>
      <PDFPreviewModal />
      {showPhotoEditor && resume.personalInfo.photo && (
        <PhotoEditorModal onClose={() => setShowPhotoEditor(false)} />
      )}
    </div>
  );
};

export const EditorPage: React.FC = () => (
  <UnsavedGuardProvider>
    <EditorPageInner />
  </UnsavedGuardProvider>
);
