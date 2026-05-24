import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle, ArrowLeft, Download, FileText, Layers,
  Loader2, RotateCcw, ZoomIn, ZoomOut,
} from 'lucide-react';
import { usePDFEditorStore } from '../store/pdfEditorStore';
import { nanoid } from '../utils/nanoid';
import toast from 'react-hot-toast';

// ─── Matrix helpers ────────────────────────────────────────────────────────────

/** Multiply two 2D affine transform matrices stored as [a,b,c,d,e,f] */
function matMul(a: number[], b: number[]): number[] {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}

// ─── Font mapping ──────────────────────────────────────────────────────────────

function mapFontFamily(fontName: string): string {
  const n = (fontName ?? '').toLowerCase();
  if (/times|palatino|georgia|garamond|baskerville|minion|charter/i.test(n))
    return '"Georgia", "Times New Roman", serif';
  if (/courier|mono|code|typewriter/i.test(n))
    return '"Courier New", "Courier", monospace';
  if (/helvetica|arial|univers|futura|gill|myriad/i.test(n))
    return '"Arial", "Helvetica", sans-serif';
  if (/merriweather|lora|crimson|libre/i.test(n))
    return '"Georgia", serif';
  return '"Arial", "Helvetica", sans-serif';
}

function isBoldFont(fontName: string): boolean {
  return /bold|heavy|black|demi|semibold/i.test(fontName ?? '');
}

function isItalicFont(fontName: string): boolean {
  return /italic|oblique|slanted/i.test(fontName ?? '');
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PDFTextItem {
  id: string;
  originalText: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
}

interface PDFPageData {
  index: number;
  canvasDataUrl: string;
  width: number;
  height: number;
  textItems: PDFTextItem[];
}

const TARGET_WIDTH = 816; // same canvas width as resume

// ─── Individual editable text span ────────────────────────────────────────────

interface TextItemProps {
  item: PDFTextItem;
  currentText: string;
  isEdited: boolean;
  /** When the canvas layer is visible we paint white behind each span so the
   *  canvas's own text rendering is fully covered — no double text. */
  canvasActive: boolean;
  onChange: (id: string, text: string) => void;
}

const PDFTextSpan: React.FC<TextItemProps> = ({ item, currentText, isEdited, canvasActive, onChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Keep DOM in sync when not editing
  useEffect(() => {
    if (ref.current && !editing) ref.current.textContent = currentText;
  }, [currentText, editing]);

  // Select all on focus
  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }
  }, [editing]);

  const commitEdit = () => {
    setEditing(false);
    const newText = ref.current?.textContent ?? '';
    onChange(item.id, newText); // always call — handler decides if it's a real edit
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (ref.current) ref.current.textContent = currentText;
      ref.current?.blur();
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ref.current?.blur(); }
  };

  return (
    <div
      ref={ref}
      contentEditable={editing}
      suppressContentEditableWarning
      onClick={() => { if (!editing) setEditing(true); }}
      onBlur={commitEdit}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={editing ? undefined : 'Click to edit'}
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        minWidth: Math.max(item.width, 8),
        minHeight: item.height,
        fontSize: item.fontSize,
        fontWeight: item.fontWeight,
        fontStyle: item.fontStyle,
        fontFamily: item.fontFamily,
        // Text is invisible when canvas is on (canvas renders it); edited text and active states show overlay
        color: canvasActive && !editing && !isEdited ? 'transparent' : '#111',
        lineHeight: 1.25,
        whiteSpace: 'pre',
        cursor: editing ? 'text' : 'pointer',
        outline: 'none',
        borderRadius: 2,
        padding: '1px 2px',
        zIndex: editing ? 30 : hovered ? 20 : 1,
        userSelect: editing ? 'text' : 'none',
        background: editing
          ? 'rgba(239,246,255,0.97)'
          : hovered
            ? 'rgba(99,102,241,0.08)'
            : isEdited
              ? 'rgba(240,253,244,0.95)'
              : 'transparent',
        boxShadow: editing
          ? '0 0 0 1.5px rgba(99,102,241,0.6)'
          : hovered
            ? '0 0 0 1px rgba(99,102,241,0.3)'
            : isEdited
              ? '0 0 0 1px rgba(34,197,94,0.45)'
              : 'none',
      }}
    />
  );
};

// ─── Main page ─────────────────────────────────────────────────────────────────

export const PDFEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { pdfFile, clearPdfFile } = usePDFEditorStore();

  const [pages, setPages] = useState<PDFPageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showCanvas, setShowCanvas] = useState(true);
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});

  // Redirect if no PDF
  useEffect(() => {
    if (!pdfFile) { navigate('/editor', { replace: true }); return; }
    loadPDF(pdfFile);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfFile]);

  const loadPDF = async (file: File) => {
    setLoading(true);
    setError(null);
    setEditedTexts({});
    setPages([]);
    try {
      setLoadingProgress('Loading PDF.js…');
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      const arrayBuffer = await file.arrayBuffer();
      setLoadingProgress('Parsing document…');

      let pdf;
      try {
        pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      } catch {
        throw new Error('Could not read PDF. It may be password-protected or corrupted.');
      }

      const results: PDFPageData[] = [];

      for (let p = 1; p <= pdf.numPages; p++) {
        setLoadingProgress(`Rendering page ${p} of ${pdf.numPages}…`);
        const page = await pdf.getPage(p);

        // Scale so page fits TARGET_WIDTH
        const naturalVp = page.getViewport({ scale: 1 });
        const scale = TARGET_WIDTH / naturalVp.width;
        const viewport = page.getViewport({ scale });

        // Render page to canvas → data URL
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        const canvasDataUrl = canvas.toDataURL('image/png');

        // Extract text items with positions
        const textContent = await page.getTextContent();
        const textItems: PDFTextItem[] = [];

        const vt = Array.from(viewport.transform) as number[];

        for (const rawItem of textContent.items) {
          if (!('str' in rawItem)) continue;
          const item = rawItem as {
            str: string; transform: number[]; width: number; height: number; fontName: string;
          };
          const text = item.str;
          if (!text.trim()) continue;

          // Convert PDF item transform → screen-space coordinates
          // Standard PDF.js approach: Util.transform + flip-y
          const tx = matMul(matMul(vt, Array.from(item.transform)), [1, 0, 0, -1, 0, 0]);

          const screenX = tx[4];
          const screenY = tx[5];
          const fontHeightPx = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);

          if (fontHeightPx < 4) continue; // skip invisible text

          const itemWidthPx = Math.max(item.width * scale, text.length * fontHeightPx * 0.5);

          textItems.push({
            id: nanoid(),
            originalText: text,
            x: screenX,
            // screenY is at the text baseline; shift up by ~80% of font height for div top
            y: screenY - fontHeightPx * 0.82,
            width: itemWidthPx,
            height: fontHeightPx * 1.15,
            fontSize: fontHeightPx * 0.88,
            fontFamily: mapFontFamily(item.fontName),
            fontWeight: isBoldFont(item.fontName) ? 'bold' : 'normal',
            fontStyle: isItalicFont(item.fontName) ? 'italic' : 'normal',
          });
        }

        results.push({ index: p - 1, canvasDataUrl, width: canvas.width, height: canvas.height, textItems });
      }

      setPages(results);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load PDF.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setLoadingProgress('');
    }
  };

  const handleTextChange = useCallback((id: string, text: string) => {
    setEditedTexts(prev => {
      // Find original text
      const originalText = pages.flatMap(p => p.textItems).find(i => i.id === id)?.originalText ?? '';
      if (text === originalText) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: text };
    });
  }, [pages]);

  const handleReset = () => {
    setEditedTexts({});
    toast.success('All edits cleared');
  };

  const handleDownload = async () => {
    if (pages.length === 0) return;
    const toastId = toast.loading('Generating PDF…');
    try {
      // Build a clean export DOM (no zoom transform, all text visible)
      const exportEl = document.createElement('div');
      exportEl.style.cssText = 'position:fixed;left:-9999px;top:0;';

      for (const page of pages) {
        const pageEl = document.createElement('div');
        pageEl.style.cssText = `position:relative;width:${page.width}px;height:${page.height}px;background:white;overflow:hidden;page-break-after:always;`;

        // Include rendered canvas as background if enabled
        if (showCanvas) {
          const img = document.createElement('img');
          img.src = page.canvasDataUrl;
          img.style.cssText = `position:absolute;top:0;left:0;width:${page.width}px;height:${page.height}px;`;
          pageEl.appendChild(img);
        }

        // Overlay text (always shown in export, replaces original with edits)
        for (const item of page.textItems) {
          const span = document.createElement('div');
          span.textContent = editedTexts[item.id] ?? item.originalText;
          const edited = item.id in editedTexts;
          span.style.cssText = [
            `position:absolute`,
            `left:${item.x}px`,
            `top:${item.y}px`,
            `min-width:${item.width}px`,
            `min-height:${item.height}px`,
            `font-size:${item.fontSize}px`,
            `font-weight:${item.fontWeight}`,
            `font-style:${item.fontStyle}`,
            `font-family:${item.fontFamily}`,
            `line-height:1.25`,
            `white-space:pre`,
            // When canvas is shown, only edited text needs to be visible
            `color:${showCanvas ? (edited ? '#111' : 'transparent') : '#111'}`,
            `background:${showCanvas && edited ? 'white' : 'transparent'}`,
            `padding:0 2px`,
          ].join(';');
          pageEl.appendChild(span);
        }

        exportEl.appendChild(pageEl);
      }

      document.body.appendChild(exportEl);

      const html2pdf = (await import('html2pdf.js')).default;
      const totalHeight = pages.reduce((s, p) => s + p.height, 0);
      await html2pdf()
        .set({
          margin: 0,
          filename: (pdfFile?.name.replace(/\.pdf$/i, '') ?? 'resume') + '-edited.pdf',
          image: { type: 'jpeg', quality: 0.97 },
          html2canvas: { scale: 2, useCORS: true, logging: false, allowTaint: true },
          jsPDF: { unit: 'px', format: [TARGET_WIDTH, totalHeight], orientation: 'portrait' },
        })
        .from(exportEl)
        .save();

      document.body.removeChild(exportEl);
      toast.success('PDF downloaded!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Export failed. Try again.', { id: toastId });
    }
  };

  const handleBack = () => {
    clearPdfFile();
    navigate('/editor');
  };

  const editCount = Object.keys(editedTexts).length;
  const totalItems = pages.reduce((s, p) => s + p.textItems.length, 0);

  if (!pdfFile) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#f1f3f5', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center gap-3 px-4 flex-shrink-0 shadow-sm z-10">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors flex-shrink-0"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back to Editor</span>
        </button>

        <div className="h-5 w-px bg-gray-200 flex-shrink-0" />

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center">
            <FileText size={14} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 leading-none">PDF Direct Editor</p>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">Click any text to edit &middot; original layout preserved</p>
          </div>
        </div>

        <div className="flex-1" />

        {/* Zoom controls */}
        <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1.5">
          <button
            onClick={() => setZoom(z => Math.max(0.4, +(z - 0.1).toFixed(1)))}
            className="p-1 rounded hover:bg-gray-200 text-gray-500 transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={13} />
          </button>
          <span className="text-xs text-gray-600 font-semibold w-10 text-center select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(1)))}
            className="p-1 rounded hover:bg-gray-200 text-gray-500 transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={13} />
          </button>
        </div>

        {/* Show canvas toggle */}
        <button
          onClick={() => setShowCanvas(v => !v)}
          title={showCanvas ? 'Hide original PDF rendering' : 'Show original PDF rendering'}
          className={`hidden md:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${showCanvas ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          <Layers size={13} />
          {showCanvas ? 'PDF on' : 'PDF off'}
        </button>

        {/* Reset edits */}
        {editCount > 0 && (
          <button
            onClick={handleReset}
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-all"
          >
            <RotateCcw size={13} />
            Reset {editCount} edit{editCount !== 1 ? 's' : ''}
          </button>
        )}

        <div className="h-5 w-px bg-gray-200 flex-shrink-0" />

        {/* File name */}
        <span className="hidden lg:block text-xs text-gray-400 max-w-32 truncate" title={pdfFile.name}>
          {pdfFile.name}
        </span>

        {/* Download */}
        <button
          onClick={handleDownload}
          disabled={loading || pages.length === 0}
          className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
        >
          <Download size={14} />
          <span>Download PDF</span>
        </button>
      </header>

      {/* ── Main canvas area ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto flex flex-col items-center py-8 px-4 gap-0">

        {/* Loading state */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-4 mt-20"
            >
              <Loader2 size={36} className="animate-spin text-red-500" />
              <p className="text-gray-700 font-medium text-sm">{loadingProgress || 'Loading…'}</p>
              <p className="text-gray-400 text-xs">Extracting text and positions from PDF</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center gap-3 mt-20 p-8 bg-white rounded-2xl shadow-sm max-w-md text-center"
          >
            <AlertTriangle size={36} className="text-red-500" />
            <p className="font-semibold text-gray-800">Failed to load PDF</p>
            <p className="text-sm text-gray-500">{error}</p>
            <button onClick={handleBack} className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 underline">
              Go back to editor
            </button>
          </motion.div>
        )}

        {/* Pages */}
        {!loading && !error && pages.length > 0 && (
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              // Reserve enough vertical space so the scrollbar accounts for zoomed height
              marginBottom: `${(zoom - 1) * pages.reduce((s, p) => s + p.height + 28, 0)}px`,
            }}
          >
            {pages.map((page) => (
              <div
                key={page.index}
                className="bg-white shadow-2xl mb-7"
                style={{ width: page.width, height: page.height, position: 'relative', overflow: 'hidden' }}
              >
                {/* Original PDF canvas rendering */}
                {showCanvas && (
                  <img
                    src={page.canvasDataUrl}
                    alt={`Page ${page.index + 1}`}
                    style={{ position: 'absolute', top: 0, left: 0, width: page.width, height: page.height, pointerEvents: 'none', userSelect: 'none' }}
                    draggable={false}
                  />
                )}

                {/* Editable text overlay */}
                {page.textItems.map(item => (
                  <PDFTextSpan
                    key={item.id}
                    item={item}
                    currentText={editedTexts[item.id] ?? item.originalText}
                    isEdited={item.id in editedTexts}
                    canvasActive={showCanvas}
                    onChange={handleTextChange}
                  />
                ))}

                {/* Page number badge (multi-page) */}
                {pages.length > 1 && (
                  <div
                    className="absolute top-2 right-2 text-[9px] text-gray-400 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded pointer-events-none select-none"
                    style={{ zIndex: 40 }}
                  >
                    Page {page.index + 1} / {pages.length}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Status bar ───────────────────────────────────────────────────────── */}
      {!loading && pages.length > 0 && (
        <div className="bg-white border-t border-gray-100 px-5 py-1.5 flex items-center gap-4 text-xs text-gray-400 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <Layers size={11} />
            <span>{pages.length} page{pages.length !== 1 ? 's' : ''}</span>
          </div>
          <span>&middot;</span>
          <span>{totalItems} text elements</span>
          {editCount > 0 && (
            <>
              <span>&middot;</span>
              <span className="text-green-600 font-medium">{editCount} edited</span>
            </>
          )}
          <span className="ml-auto hidden sm:block text-gray-300">
            Hover to highlight &middot; Click to edit &middot; Enter / Esc to confirm
          </span>
        </div>
      )}
    </div>
  );
};
