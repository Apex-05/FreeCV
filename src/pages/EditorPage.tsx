import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TopBar } from '../components/editor/TopBar';
import { Sidebar } from '../components/editor/Sidebar';
import { ResumePreview } from '../components/editor/preview/ResumePreview';
import { PhotoEditorModal } from '../components/editor/PhotoEditorModal';
import { PDFPreviewModal } from '../components/editor/PDFPreviewModal';
import { UnsavedGuardProvider } from '../components/editor/UnsavedModal';
import { useResumeStore } from '../store/resumeStore';
import { useSaveStore } from '../store/saveStore';
import toast from 'react-hot-toast';

const STORAGE_INFO_KEY = 'freecv_storage_info_shown';

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
    const handler = () => {
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
              <button onClick={() => toast.dismiss(t.id)} className="text-xs text-gray-400 hover:text-gray-600">
                Dismiss
              </button>
            </div>
          </div>
        ),
        { duration: 12000, icon: '⚠️' },
      );
    };
    window.addEventListener('freecv:external-update', handler);
    return () => window.removeEventListener('freecv:external-update', handler);
  }, []);

  // ── Global undo/redo keyboard shortcuts ────────────────────────────────────
  const handleUndoRedo = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
    if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
      e.preventDefault();
      useResumeStore.getState().undo();
      toast('Undone', { duration: 1000, icon: '↩' });
    } else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
      e.preventDefault();
      useResumeStore.getState().redo();
      toast('Redone', { duration: 1000, icon: '↪' });
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleUndoRedo);
    return () => window.removeEventListener('keydown', handleUndoRedo);
  }, [handleUndoRedo]);

  // ── First-visit info toast ─────────────────────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem(STORAGE_INFO_KEY)) {
      setTimeout(() => {
        toast(
          '💾 Auto-saves every 5s. Use "Save" to create named versions, or "History" tab to restore them.',
          { duration: 8000, style: { maxWidth: 400, fontSize: 13 } },
        );
        localStorage.setItem(STORAGE_INFO_KEY, '1');
      }, 2500);
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
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
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
