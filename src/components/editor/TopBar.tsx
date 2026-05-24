import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, RotateCcw, FileText, Check, Loader2, ArrowDownToLine,
  Eye, EyeOff, AlertTriangle, X, Undo2, Redo2, Save,
  CloudCheck, CloudOff, CheckCircle2,
} from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import { useSaveStore } from '../../store/saveStore';
import { usePDFEditorStore } from '../../store/pdfEditorStore';
import { parseDocx, parseText } from '../../utils/resumeParser';
import { ExportMenu } from './ExportMenu';
import { useUnsavedGuard } from './UnsavedModal';
import toast from 'react-hot-toast';

interface ImportOptions {
  file: File;
  parsedData: import('../../types/resume').ResumeData;
  hasPhoto: boolean;
  quality: number;
}

// ── save status indicator ─────────────────────────────────────────────────────

const SaveStatusBadge: React.FC = () => {
  const status = useSaveStore(s => s.status);

  const cfg = {
    idle:    { icon: null,         text: '',          cls: 'text-gray-300' },
    saving:  { icon: Loader2,      text: 'Saving…',   cls: 'text-gray-400' },
    saved:   { icon: CloudCheck,   text: 'Saved',     cls: 'text-green-600' },
    unsaved: { icon: AlertTriangle, text: 'Unsaved',  cls: 'text-amber-500' },
    failed:  { icon: CloudOff,     text: 'Save failed', cls: 'text-red-500' },
  }[status];

  if (status === 'idle') return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={`hidden sm:flex items-center gap-1.5 text-xs font-medium ${cfg.cls}`}
      >
        {cfg.icon && (
          <cfg.icon
            size={12}
            className={status === 'saving' ? 'animate-spin' : undefined}
          />
        )}
        <span className="hidden md:inline">{cfg.text}</span>
      </motion.div>
    </AnimatePresence>
  );
};

// ── main component ────────────────────────────────────────────────────────────

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const { guardAsync } = useUnsavedGuard();

  const { lastSaved, isPrinting, isPreviewMode, isDirty, history, future,
          resetResume, loadFromData, setPreviewMode, undo, redo, clearDirty } = useResumeStore();
  const { status: saveStatus, manualSave, saveImportSnapshot } = useSaveStore();
  const { setPdfFile } = usePDFEditorStore();

  const [showReset, setShowReset]       = useState(false);
  const [importOpts, setImportOpts]     = useState<ImportOptions | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [manuallySaving, setManuallySaving] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const canUndo = history.length > 0;
  const canRedo = future.length > 0;

  // ── manual save ─────────────────────────────────────────────────────────────
  const handleManualSave = async () => {
    if (manuallySaving) return;
    setManuallySaving(true);
    try {
      const resume = useResumeStore.getState().resume;
      await manualSave(resume);
      clearDirty();
      toast.success('Version saved!', { icon: '💾', duration: 2000 });
    } finally {
      setManuallySaving(false);
    }
  };

  // ── import ──────────────────────────────────────────────────────────────────
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (importRef.current) importRef.current.value = '';

    // Validate file size (20 MB limit)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large. Maximum 20 MB.');
      return;
    }

    // PDFs go directly to the PDF Direct Editor
    if (file.name.toLowerCase().endsWith('.pdf')) {
      const ok = await guardAsync();
      if (!ok) return;
      setPdfFile(file);
      navigate('/pdf-editor');
      return;
    }

    // Check for unsaved changes first (for non-PDF)
    const ok = await guardAsync();
    if (!ok) return;

    setImportLoading(true);
    const toastId = toast.loading('Parsing resume…');
    try {
      let data;
      let quality = 50;
      if (file.name.endsWith('.docx')) {
        const result = await parseDocx(file);
        data    = result.data;
        quality = result.quality ?? 75;
      } else if (file.name.endsWith('.txt') || file.type === 'text/plain') {
        const text   = await file.text();
        const result = parseText(text);
        data    = result.data;
        quality = result.quality ?? 55;
      } else {
        throw new Error('Unsupported file type. Use PDF, DOCX, or TXT.');
      }
      toast.dismiss(toastId);
      setImportOpts({ file, parsedData: data, hasPhoto: !!data.personalInfo.photo, quality });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not parse file.';
      toast.error(msg, { id: toastId });
    } finally {
      setImportLoading(false);
    }
  };

  const confirmImport = async (keepPhoto: boolean) => {
    if (!importOpts) return;
    const data = { ...importOpts.parsedData };
    if (!keepPhoto) data.personalInfo = { ...data.personalInfo, photo: null };
    loadFromData(data, true);
    await saveImportSnapshot(data, importOpts.file.name);
    setImportOpts(null);
    toast.success('Resume imported! Review and edit the content.', { icon: '✅' });
  };

  // ── reset ────────────────────────────────────────────────────────────────────
  const handleReset = async () => {
    const ok = await guardAsync();
    if (!ok) return;
    resetResume();
    setShowReset(false);
    toast.success('Reset to default resume');
  };

  // ── back ─────────────────────────────────────────────────────────────────────
  const handleBack = async () => {
    const ok = await guardAsync();
    if (!ok) return;
    navigate('/');
  };

  const saveLabel = () => {
    if (!lastSaved) return null;
    const d = Date.now() - lastSaved.getTime();
    if (d < 5_000)  return 'Saved just now';
    if (d < 60_000) return `Saved ${Math.floor(d / 1000)}s ago`;
    return `Saved ${Math.floor(d / 60_000)}m ago`;
  };

  const qualityColor = (q: number) =>
    q >= 80 ? 'text-green-700 bg-green-50 border-green-200'
    : q >= 60 ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-red-700 bg-red-50 border-red-200';

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-100 flex items-center px-3 gap-2 flex-shrink-0 z-30" role="banner">
        {/* Back */}
        <button
          onClick={handleBack}
          aria-label="Back to home"
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium group flex-shrink-0"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="h-6 w-px bg-gray-200 flex-shrink-0" />

        {/* Title */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <FileText size={16} className="text-indigo-500" aria-hidden="true" />
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 leading-none">Resume Editor</p>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">Click any text to edit</p>
          </div>
        </div>

        <div className="flex-1" />

        {/* Undo / Redo */}
        <div className="hidden sm:flex items-center gap-0.5">
          <button
            onClick={() => { undo(); toast('Undone', { duration: 1000, icon: '↩' }); }}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
            className={`p-1.5 rounded-lg transition-all ${canUndo ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={() => { redo(); toast('Redone', { duration: 1000, icon: '↪' }); }}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
            className={`p-1.5 rounded-lg transition-all ${canRedo ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
          >
            <Redo2 size={14} />
          </button>
        </div>

        <div className="h-6 w-px bg-gray-200 hidden sm:block" />

        {/* Save status */}
        <SaveStatusBadge />

        {/* Save timestamp */}
        {saveLabel() && (
          <AnimatePresence mode="wait">
            <motion.div key={saveLabel()} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="hidden lg:flex items-center gap-1.5 text-xs text-gray-400">
              <Check size={11} className="text-green-500" />
              {saveLabel()}
            </motion.div>
          </AnimatePresence>
        )}

        <div className="h-6 w-px bg-gray-200 hidden sm:block" />

        {/* PDF Preview */}
        <button
          onClick={() => setPreviewMode(!isPreviewMode)}
          aria-label="Toggle PDF preview"
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ${isPreviewMode ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200'}`}
        >
          {isPreviewMode ? <EyeOff size={13} /> : <Eye size={13} />}
          <span className="hidden sm:inline">Preview</span>
        </button>

        {/* Manual Save */}
        <button
          onClick={handleManualSave}
          disabled={manuallySaving || saveStatus === 'saving'}
          title="Save a version to history"
          aria-label="Save version"
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ${isDirty ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          {manuallySaving
            ? <Loader2 size={13} className="animate-spin" />
            : isDirty
              ? <AlertTriangle size={13} />
              : <Save size={13} />}
          <span className="hidden md:inline">Save</span>
        </button>

        {/* Import */}
        <input ref={importRef} type="file" accept=".docx,.txt,.pdf" onChange={handleImport} className="hidden" aria-hidden="true" />
        <button
          onClick={() => importRef.current?.click()}
          disabled={importLoading}
          aria-label="Import resume"
          className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-all disabled:opacity-60 flex-shrink-0"
        >
          {importLoading ? <Loader2 size={13} className="animate-spin" /> : <ArrowDownToLine size={13} />}
          <span className="hidden sm:inline">Import</span>
        </button>

        {/* Reset */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowReset(v => !v)}
            aria-label="Reset resume"
            aria-expanded={showReset}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-all"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <AnimatePresence>
            {showReset && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-60 z-50"
                role="dialog"
                aria-label="Reset confirmation"
              >
                <p className="text-sm font-semibold text-gray-800 mb-1">Reset resume?</p>
                <p className="text-xs text-gray-500 mb-3">All content will be replaced with the default demo resume.</p>
                <div className="flex gap-2">
                  <button onClick={handleReset} className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">Reset</button>
                  <button onClick={() => setShowReset(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-1.5 rounded-lg transition-colors">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Export dropdown */}
        <ExportMenu />
      </header>

      {/* Import confirmation modal */}
      <AnimatePresence>
        {importOpts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setImportOpts(null); }}
            role="dialog"
            aria-modal="true"
            aria-label="Import confirmation"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <ArrowDownToLine size={16} className="text-indigo-500" />
                  <h2 className="text-sm font-semibold text-gray-800">Import Resume</h2>
                </div>
                <button onClick={() => setImportOpts(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400" aria-label="Close">
                  <X size={15} />
                </button>
              </div>

              <div className="p-5 space-y-3">
                {/* Success */}
                <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
                  <CheckCircle2 size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">Parsed successfully</p>
                    <p className="text-xs text-green-600 mt-0.5">{importOpts.file.name}</p>
                  </div>
                </div>

                {/* Import quality */}
                <div className={`border rounded-xl p-3 ${qualityColor(importOpts.quality)}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold">Import quality</p>
                    <span className="text-sm font-bold">{importOpts.quality}%</span>
                  </div>
                  <div className="w-full bg-white/50 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${importOpts.quality}%`, background: 'currentColor', opacity: 0.7 }}
                    />
                  </div>
                  <p className="text-[10px] mt-1.5 opacity-80">
                    {importOpts.quality >= 80 ? 'Excellent - most content detected'
                    : importOpts.quality >= 60 ? 'Good - review and fill any missing fields'
                    : 'Partial - manual cleanup recommended'}
                  </p>
                </div>

                {/* Warning */}
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700">This replaces your current resume. A snapshot of your current data has been saved to version history.</p>
                </div>

                {/* Photo choice */}
                {importOpts.hasPhoto ? (
                  <div>
                    <p className="text-sm font-semibold text-gray-800 mb-3">A photo was detected. Include it?</p>
                    <div className="flex gap-3">
                      <button onClick={() => confirmImport(true)} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
                        ✓ Keep Photo
                      </button>
                      <button onClick={() => confirmImport(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors">
                        ✗ Skip Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => confirmImport(false)} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                    <Check size={14} /> Import & Start Editing
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
