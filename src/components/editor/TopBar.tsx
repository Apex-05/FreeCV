import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, RotateCcw, FileText, Check, Loader2, ArrowDownToLine,
  Eye, EyeOff, AlertTriangle, Undo2, Redo2, Save,
  CloudCheck, CloudOff,
} from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import { useSaveStore } from '../../store/saveStore';
import { usePDFEditorStore } from '../../store/pdfEditorStore';
import { ExportMenu } from './ExportMenu';
import { useUnsavedGuard } from './UnsavedModal';
import toast from 'react-hot-toast';

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
          resetResume, setPreviewMode, undo, redo, clearDirty } = useResumeStore();
  const { status: saveStatus, manualSave } = useSaveStore();
  const { setPdfFile } = usePDFEditorStore();

  const [showReset, setShowReset]           = useState(false);
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
      toast.success('Version saved!', { icon: '✅', duration: 2000 });
    } catch {
      toast.error('Save failed — check browser storage settings.');
    } finally {
      setManuallySaving(false);
    }
  };

  // ── import (PDF only → PDF editor) ─────────────────────────────────────────
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (importRef.current) importRef.current.value = '';
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large. Maximum 20 MB.');
      return;
    }
    const ok = await guardAsync();
    if (!ok) return;
    setPdfFile(file);
    navigate('/pdf-editor');
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
            onClick={() => { undo(); toast('Undone', { duration: 1000, icon: '✅' }); }}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
            className={`p-1.5 rounded-lg transition-all ${canUndo ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={() => { redo(); toast('Redone', { duration: 1000, icon: '✅' }); }}
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

        {/* Upload PDF → opens PDF editor */}
        <input ref={importRef} type="file" accept=".pdf" onChange={handleImport} className="hidden" aria-hidden="true" />
        <button
          onClick={() => importRef.current?.click()}
          aria-label="Upload PDF"
          title="Upload a PDF — opens in PDF text editor (text editing only)"
          className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-all flex-shrink-0"
        >
          <ArrowDownToLine size={13} />
          <span className="hidden sm:inline">Upload</span>
        </button>

        {/* Export dropdown */}
        <ExportMenu />
      </header>
    </>
  );
};
