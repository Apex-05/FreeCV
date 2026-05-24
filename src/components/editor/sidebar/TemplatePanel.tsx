import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, FilePlus, AlertTriangle, Download, X } from 'lucide-react';
import { templateConfigs } from '../../../data/templateConfigs';
import { useResumeStore } from '../../../store/resumeStore';
import { downloadPDF } from '../../../utils/pdfGenerator';
import toast from 'react-hot-toast';

const CATEGORY_LABEL: Record<string, string> = {
  professional: 'Professional',
  creative:     'Creative',
  academic:     'Academic',
};

export const TemplatePanel: React.FC = () => {
  const template     = useResumeStore(s => s.resume.settings.template);
  const resume       = useResumeStore(s => s.resume);
  const setTemplate  = useResumeStore(s => s.setTemplate);
  const resetResume  = useResumeStore(s => s.resetResume);

  const [showWarning, setShowWarning] = useState(false);

  const handleSavePDF = async () => {
    try {
      await downloadPDF('resume-backup.pdf');
      toast.success('PDF saved!');
    } catch {
      toast.error('Could not save PDF.');
    }
  };

  const handleSaveJSON = () => {
    const blob = new Blob([JSON.stringify(resume, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href:     url,
      download: `resume-backup-${new Date().toISOString().slice(0, 10)}.json`,
    });
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON backup saved!');
  };

  const handleConfirmReset = () => {
    resetResume();
    setShowWarning(false);
    toast.success('Started a new blank resume.');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.15 }}
      className="p-3 flex flex-col gap-2"
    >
      {/* ── Start something new ─────────────────────────────────────────── */}
      <div className="mb-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1 pt-1 mb-2">
          Start something new
        </p>

        <button
          onClick={() => setShowWarning(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/40 transition-all text-xs font-medium"
        >
          <FilePlus size={13} />
          New blank resume
        </button>

        <AnimatePresence>
          {showWarning && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 flex flex-col gap-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-semibold text-amber-800 leading-snug mb-0.5">
                      Your current resume will be cleared
                    </p>
                    <p className="text-[10px] text-amber-700 leading-snug">
                      Save a copy to your device first so you don't lose your work.
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowWarning(false)} className="text-amber-400 hover:text-amber-600 flex-shrink-0 mt-0.5">
                  <X size={12} />
                </button>
              </div>

              {/* Save options */}
              <div className="flex gap-2">
                <button
                  onClick={handleSavePDF}
                  className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-amber-800 bg-white hover:bg-amber-50 border border-amber-200 rounded-lg py-1.5 transition-colors"
                >
                  <Download size={10} /> Save PDF
                </button>
                <button
                  onClick={handleSaveJSON}
                  className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-amber-800 bg-white hover:bg-amber-50 border border-amber-200 rounded-lg py-1.5 transition-colors"
                >
                  <Download size={10} /> Save JSON
                </button>
              </div>

              {/* Confirm / Cancel */}
              <div className="flex gap-2 pt-0.5 border-t border-amber-200">
                <button
                  onClick={handleConfirmReset}
                  className="flex-1 text-[10px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg py-1.5 transition-colors"
                >
                  Yes, start fresh
                </button>
                <button
                  onClick={() => setShowWarning(false)}
                  className="flex-1 text-[10px] font-medium text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg py-1.5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-100 pt-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-1">
          Switch Template
        </p>
        <p className="text-[10px] text-gray-400 px-1 pb-2 leading-relaxed">
          All your content carries over automatically.
        </p>

        {/* ── Template list ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          {templateConfigs.map(cfg => {
            const active = template === cfg.id;
            return (
              <button
                key={cfg.id}
                onClick={() => setTemplate(cfg.id as Parameters<typeof setTemplate>[0])}
                className={`w-full text-left rounded-xl border transition-all duration-150 px-3 py-2.5 flex items-center gap-3 ${
                  active
                    ? 'border-indigo-400 bg-indigo-50/60 shadow-sm'
                    : 'border-gray-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/30'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                  style={{ background: cfg.accentColor }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-semibold truncate ${active ? 'text-indigo-700' : 'text-gray-800'}`}>
                      {cfg.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium flex-shrink-0">
                      {CATEGORY_LABEL[cfg.category] ?? cfg.category}
                    </span>
                  </div>
                </div>
                {active && (
                  <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                    <Check size={9} strokeWidth={3} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
