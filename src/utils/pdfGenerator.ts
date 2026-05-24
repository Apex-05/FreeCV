import { useResumeStore } from '../store/resumeStore';

const PDF_OPTIONS = {
  margin: 0,
  image: { type: 'jpeg' as const, quality: 0.98 },
  html2canvas: {
    scale: 2,
    useCORS: true,
    letterRendering: true,
    backgroundColor: '#ffffff',
  },
  jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const },
  pagebreak: { mode: 'avoid-all' },
};

async function getElement(): Promise<HTMLElement> {
  const store = useResumeStore.getState();
  store.setIsPrinting(true);
  await new Promise(r => setTimeout(r, 200));
  const element = document.getElementById('resume-canvas');
  if (!element) {
    store.setIsPrinting(false);
    throw new Error('Resume canvas not found');
  }
  return element;
}

export async function downloadPDF(filename = 'resume.pdf') {
  const store = useResumeStore.getState();
  const element = await getElement();
  try {
    // @ts-ignore
    const html2pdf = (await import('html2pdf.js')).default;
    await html2pdf().set({ ...PDF_OPTIONS, filename }).from(element).save();
  } finally {
    store.setIsPrinting(false);
  }
}

export async function savePDFDirect(filename?: string) {
  const store = useResumeStore.getState();
  const name = filename ?? `resume-${new Date().toISOString().slice(0, 10)}.pdf`;
  const element = await getElement();
  try {
    // @ts-ignore
    const html2pdf = (await import('html2pdf.js')).default;
    // @ts-ignore
    const blob: Blob = await html2pdf().set({ ...PDF_OPTIONS, filename: name }).from(element).outputPdf('blob');

    // Try File System Access API (Chrome/Edge)
    if ('showSaveFilePicker' in window) {
      try {
        // @ts-ignore
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: name,
          types: [{ description: 'PDF Files', accept: { 'application/pdf': ['.pdf'] } }],
        });
        // @ts-ignore
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') return;
        // Fall through to regular download
      }
    }

    // Fallback: regular download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    store.setIsPrinting(false);
  }
}
