import { create } from 'zustand';
import { nanoid } from '../utils/nanoid';

export interface PDFEditSnapshot {
  id: string;
  label: string;
  timestamp: number;
  editedTexts: Record<string, string>;
  editCount: number;
}

interface PDFEditorStore {
  pdfFile: File | null;
  history: PDFEditSnapshot[];
  setPdfFile: (file: File) => void;
  clearPdfFile: () => void;
  saveSnapshot: (editedTexts: Record<string, string>, label?: string) => void;
  deleteSnapshot: (id: string) => void;
  renameSnapshot: (id: string, label: string) => void;
}

export const usePDFEditorStore = create<PDFEditorStore>((set, get) => ({
  pdfFile: null,
  history: [],

  setPdfFile: (file) => set({ pdfFile: file }),

  // Clear history when going back (IDs are per-load so snapshots don't survive reload)
  clearPdfFile: () => set({ pdfFile: null, history: [] }),

  saveSnapshot(editedTexts, label) {
    const ts = Date.now();
    const snap: PDFEditSnapshot = {
      id: `pdf_${ts}_${nanoid()}`,
      label: label ?? `Save ${new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      timestamp: ts,
      editedTexts: { ...editedTexts },
      editCount: Object.keys(editedTexts).length,
    };
    set({ history: [snap, ...get().history].slice(0, 20) });
  },

  deleteSnapshot(id) {
    set({ history: get().history.filter(s => s.id !== id) });
  },

  renameSnapshot(id, label) {
    set({ history: get().history.map(s => s.id === id ? { ...s, label } : s) });
  },
}));
