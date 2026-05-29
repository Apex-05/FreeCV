import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  MousePointer, List, GripVertical, Save, Lightbulb, ChevronRight,
  Undo2, Redo2, Trash2, Download, ArrowDownToLine, History,
  Keyboard, FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useResumeStore } from '../../../store/resumeStore';
import { useSaveStore } from '../../../store/saveStore';
import { usePDFEditorStore } from '../../../store/pdfEditorStore';
import { downloadPDF } from '../../../utils/pdfGenerator';
import toast from 'react-hot-toast';


// ── How-to steps ───────────────────────────────────────────────────────────────

const STEPS = [
  { icon: MousePointer, color: '#6366f1', title: 'Click to edit',     desc: 'Click any text on the resume to edit it directly.' },
  { icon: List,         color: '#06b6d4', title: 'Manage bullets',    desc: 'Hover bullets to remove. Click "+ Add point" to add more.' },
  { icon: GripVertical, color: '#10b981', title: 'Reorder sections',  desc: 'Sections tab: drag to reorder, toggle visibility, or delete.' },
  { icon: Trash2,       color: '#ef4444', title: 'Delete sections',   desc: 'Hover any section in the Sections tab and click the trash icon.' },
  { icon: Undo2,        color: '#8b5cf6', title: 'Undo / Redo',       desc: 'Ctrl+Z to undo · Ctrl+Y to redo any change.' },
  { icon: History,      color: '#f59e0b', title: 'Version history',   desc: 'History tab: restore, rename, or delete saved snapshots.' },
  { icon: FileText,     color: '#14b8a6', title: 'Import resume',     desc: 'Use the Import button to parse PDF, DOCX, or plain text.' },
  { icon: Save,         color: '#22c55e', title: 'Auto-saves',        desc: 'Every 5 s a snapshot is saved. Manual saves go to History.' },
];

// ── Keyboard shortcuts ─────────────────────────────────────────────────────────

const SHORTCUTS = [
  { keys: ['Ctrl', 'Z'],     label: 'Undo'          },
  { keys: ['Ctrl', 'Y'],     label: 'Redo'          },
  { keys: ['Ctrl', 'Shift', 'Z'], label: 'Redo (alt)' },
];

// ── Pro tips ───────────────────────────────────────────────────────────────────

const TIPS = [
  'Keep your resume to 1 page for tech roles',
  'Use action verbs: Led, Built, Reduced, Improved…',
  'Quantify achievements whenever possible',
  'Tailor your resume to each job description',
  'Preview your PDF before downloading',
];

// ── Component ──────────────────────────────────────────────────────────────────

export const GuidePanel: React.FC = () => {
  const importRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { undo, redo, history, future } = useResumeStore();
  const { manualSave } = useSaveStore();
  const { setPdfFile } = usePDFEditorStore();

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (importRef.current) importRef.current.value = '';
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please select a PDF file.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File must be under 20 MB.');
      return;
    }
    setPdfFile(file);
    navigate('/pdf-editor');
  };

  const actions: { icon: React.ElementType; color: string; label: string; desc: string; onClick: () => void; disabled?: boolean }[] = [
    { icon: ArrowDownToLine, color: '#6366f1', label: 'Import',  desc: 'PDF, DOCX, or TXT', onClick: () => importRef.current?.click() },
    { icon: Undo2,           color: '#8b5cf6', label: 'Undo',    desc: 'Ctrl + Z',          onClick: () => { if (history.length) { undo(); toast('Undone', { duration: 1000, icon: '✅' }); } }, disabled: history.length === 0 },
    { icon: Redo2,           color: '#06b6d4', label: 'Redo',    desc: 'Ctrl + Y',          onClick: () => { if (future.length)  { redo();  toast('Redone',  { duration: 1000, icon: '✅' }); } }, disabled: future.length === 0 },
    { icon: Download,        color: '#10b981', label: 'Export',  desc: 'PDF / JSON',        onClick: () => downloadPDF('resume.pdf').catch(() => toast.error('Export failed.')) },
    { icon: History,         color: '#f59e0b', label: 'History', desc: 'Version recovery',  onClick: () => window.dispatchEvent(new Event('freecv:open-history')) },
    { icon: Save,            color: '#ef4444', label: 'Save',    desc: 'Manual snapshot',   onClick: () => { const s = useResumeStore.getState(); manualSave(s.resume).then(() => { s.clearDirty(); toast.success('Version saved!', { icon: '✅', duration: 2000 }); }).catch(() => toast.error('Save failed.')); } },
  ];

  return (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.25 }}
    className="p-4 space-y-5"
  >
    {/* Quick Actions grid */}
    <div>
      <input ref={importRef} type="file" accept=".pdf,.docx,.txt" onChange={handleImport} className="hidden" />
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Quick Actions</h3>
      <div className="grid grid-cols-3 gap-2">
        {actions.map((a, i) => (
          <motion.button
            key={a.label}
            onClick={a.onClick}
            disabled={a.disabled}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm bg-white transition-all text-left ${a.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: a.color + '18' }}>
              <a.icon size={15} style={{ color: a.color }} />
            </div>
            <p className="text-[10px] font-semibold text-gray-700 leading-none">{a.label}</p>
            <p className="text-[9px] text-gray-400 text-center leading-tight">{a.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>

    {/* Keyboard shortcuts */}
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Keyboard size={12} className="text-gray-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Shortcuts</h3>
      </div>
      <div className="space-y-1.5">
        {SHORTCUTS.map(s => (
          <div key={s.label} className="flex items-center justify-between">
            <span className="text-xs text-gray-600">{s.label}</span>
            <div className="flex items-center gap-1">
              {s.keys.map((k, i) => (
                <React.Fragment key={k}>
                  {i > 0 && <span className="text-[9px] text-gray-300">+</span>}
                  <kbd className="text-[9px] font-mono bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-gray-600">{k}</kbd>
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* How to Edit */}
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">How to Edit</h3>
      <div className="space-y-1.5">
        {STEPS.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: step.color + '18' }}>
              <step.icon size={12} style={{ color: step.color }} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-800 leading-tight">{step.title}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>

    {/* Pro Tips */}
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb size={12} className="text-amber-500" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pro Tips</h3>
      </div>
      <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
        <ul className="space-y-1.5">
          {TIPS.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
              <ChevronRight size={12} className="mt-0.5 flex-shrink-0 text-amber-500" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </motion.div>
  );
};
