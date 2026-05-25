/**
 * ExportMenu — unified export dropdown button.
 * Replaces the separate "Download PDF" and "Save PDF" buttons.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ChevronDown, Loader2, FileJson, FileOutput } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import { downloadPDF } from '../../utils/pdfGenerator';
import toast from 'react-hot-toast';

type ExportState = 'idle' | 'pdf' | 'json';

const ITEMS = [
  {
    id: 'pdf' as const,
    icon: FileOutput,
    label: 'Download PDF',
    sub:   'Opens print dialog → Save as PDF',
  },
  {
    id: 'json' as const,
    icon: FileJson,
    label: 'Export JSON backup',
    sub:   'Portable data backup',
  },
];

export const ExportMenu: React.FC = () => {
  const { isPrinting, resume } = useResumeStore();
  const [open, setOpen]         = useState(false);
  const [busy, setBusy]         = useState<ExportState>('idle');
  const menuRef                 = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const run = async (id: ExportState) => {
    if (busy !== 'idle' || isPrinting) return;
    setOpen(false);
    setBusy(id);
    try {
      if (id === 'pdf') {
        await downloadPDF('resume.pdf');
      } else if (id === 'json') {
        const json = JSON.stringify(resume, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = Object.assign(document.createElement('a'), {
          href:     url,
          download: `freecv-backup-${new Date().toISOString().slice(0, 10)}.json`,
        });
        a.click();
        URL.revokeObjectURL(url);
        toast.success('JSON backup downloaded!', { icon: '✅' });
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        toast.error('Export failed - please try again.');
      }
    } finally {
      setBusy('idle');
    }
  };

  const isLoading = busy !== 'idle';

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={isLoading || isPrinting}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md select-none"
      >
        {isLoading
          ? <Loader2 size={14} className="animate-spin" />
          : <ArrowUp size={14} />}
        <span className="hidden sm:inline">
          {isLoading ? 'Exporting…' : 'Export'}
        </span>
        {!isLoading && <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 2 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden"
            style={{ minWidth: 220 }}
            role="menu"
          >
            {ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => run(item.id as ExportState)}
                role="menuitem"
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <item.icon size={15} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 leading-tight">{item.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{item.sub}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
