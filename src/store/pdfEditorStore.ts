import { create } from 'zustand';

interface PDFEditorStore {
  pdfFile: File | null;
  setPdfFile: (file: File) => void;
  clearPdfFile: () => void;
}

export const usePDFEditorStore = create<PDFEditorStore>((set) => ({
  pdfFile: null,
  setPdfFile: (file) => set({ pdfFile: file }),
  clearPdfFile: () => set({ pdfFile: null }),
}));
