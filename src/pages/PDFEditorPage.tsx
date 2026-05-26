/**
 * PDF Direct Editor
 *
 * Rendering architecture:
 *   - PDF.js renders each page to an offscreen canvas.
 *     The canvas data URL is used as:
 *       (a) Editor background — <img> shown behind the text overlays so the
 *           PDF renders exactly as-is.
 *       (b) Text-color sampling — pixel-sample each text item's bounding box.
 *       (c) Export base layer  — composited behind edited text on print.
 *
 *   - Text overlay design:
 *       · Default: transparent div positioned over each text item.
 *         The PDF canvas shows through → no double-text.
 *       · Hover: blue tint to indicate the item is editable.
 *       · Editing: white rectangle covers the original PDF text +
 *         contentEditable div with matching font/size/style appears on top.
 *       · Emoji items produce no overlay (PDF shows them from the canvas).
 *
 * Export ("fused PDF") architecture:
 *   - Build a hidden print DOM:
 *       Each page div = <img src={canvasDataUrl}> (background: original PDF with
 *       all graphics, colors, emojis) + white-cover + new-text divs for every
 *       edited item.
 *   - body[data-pdf-printing] CSS hides the app shell, shows only the print DOM.
 *   - window.print() → browser produces a vector-composited PDF.
 */

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle, ArrowLeft, Check, Clock, Download,
  FileText, Info, Loader2, Redo2, RotateCcw, Save, Trash2, Undo2,
  ZoomIn, ZoomOut,
} from 'lucide-react';
import { usePDFEditorStore } from '../store/pdfEditorStore';
import type { PDFEditSnapshot } from '../store/pdfEditorStore';
import { nanoid } from '../utils/nanoid';
import toast from 'react-hot-toast';

// ─── Matrix helper ─────────────────────────────────────────────────────────────

function matMul(a: number[], b: number[]): number[] {
  return [
    a[0]*b[0] + a[2]*b[1],  a[1]*b[0] + a[3]*b[1],
    a[0]*b[2] + a[2]*b[3],  a[1]*b[2] + a[3]*b[3],
    a[0]*b[4] + a[2]*b[5] + a[4],
    a[1]*b[4] + a[3]*b[5] + a[5],
  ];
}

// ─── Font helpers ──────────────────────────────────────────────────────────────

function mapFontFamily(fontName: string): string {
  const n = (fontName ?? '').toLowerCase();
  if (/times|palatino|georgia|garamond|baskerville|minion|charter/i.test(n)) return '"Georgia","Times New Roman",serif';
  if (/courier|mono|code|typewriter/i.test(n)) return '"Courier New","Courier",monospace';
  if (/helvetica|arial|univers|futura|gill|myriad/i.test(n)) return '"Arial","Helvetica",sans-serif';
  if (/merriweather|lora|crimson|libre/i.test(n)) return '"Georgia",serif';
  return '"Arial","Helvetica",sans-serif';
}

function isBoldFont(f: string)   { return /bold|heavy|black|demi|semibold/i.test(f ?? ''); }
function isItalicFont(f: string) { return /italic|oblique|slanted/i.test(f ?? ''); }

// ─── Emoji detection ───────────────────────────────────────────────────────────
// Items containing pictographic / emoji characters are rendered as static overlays.

const EMOJI_RE = /\p{Extended_Pictographic}/u;
function containsEmoji(str: string): boolean {
  return EMOJI_RE.test(str);
}

// ─── Color sampling ────────────────────────────────────────────────────────────
/**
 * Samples the dominant text color from the offscreen canvas at [x, y, w, h].
 *
 * Two-pass strategy:
 *   Pass 1 — compute average brightness of the region.
 *   Pass 2 — on a light background, collect dark pixels (text);
 *             on a dark background, collect pixels brighter than avg+35 (text).
 *   Average the collected pixels → text color.
 */
function sampleTextColor(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
): string {
  const sx = Math.max(0, Math.round(x));
  const sy = Math.max(0, Math.round(y));
  const sw = Math.min(Math.max(1, Math.round(w)), 80);
  const sh = Math.min(Math.max(1, Math.round(h)), 16);
  try {
    const { data } = ctx.getImageData(sx, sy, sw, sh);
    let briSum = 0, nAll = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i+3] < 64) continue;
      briSum += (data[i] + data[i+1] + data[i+2]) / 3; nAll++;
    }
    if (nAll === 0) return '#111111';
    const avgBri = briSum / nAll;

    let rT = 0, gT = 0, bT = 0, nT = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
      if (a < 64) continue;
      const isText = avgBri > 160
        ? (r < 210 || g < 210 || b < 210)       // light bg → dark pixels
        : ((r+g+b)/3 > avgBri + 35);             // dark bg  → bright pixels
      if (isText) { rT += r; gT += g; bT += b; nT++; }
    }
    if (nT === 0) return avgBri > 160 ? '#111111' : '#ffffff';
    return `rgb(${Math.round(rT/nT)},${Math.round(gT/nT)},${Math.round(bT/nT)})`;
  } catch { return '#111111'; }
}

// ─── Bold detection ────────────────────────────────────────────────────────────
/**
 * Canvas pixel-density approach: bold glyphs lay down more ink per unit area.
 * Samples the middle 40% of the character height (skips ascender/descender
 * where both regular and bold look sparse) and counts "ink" pixels.
 * Threshold 0.27 separates regular (~18-22%) from bold (~28-35%) reliably for
 * standard black-on-white resumes.
 */
function sampleIsBold(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
): boolean {
  const sx = Math.max(0, Math.round(x));
  const sy = Math.max(0, Math.round(y + h * 0.25));        // skip ascender area
  const sw = Math.min(Math.max(1, Math.round(w)), 120);    // cap width for perf
  const sh = Math.min(Math.max(1, Math.round(h * 0.45)), 12); // mid-glyph slice
  try {
    const { data } = ctx.getImageData(sx, sy, sw, sh);
    let briSum = 0, nAll = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 64) continue;
      briSum += (data[i] + data[i + 1] + data[i + 2]) / 3; nAll++;
    }
    if (nAll < 15) return false;
    const avgBri = briSum / nAll;
    let ink = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 64) continue;
      const bri = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (avgBri > 160 ? bri < 155 : bri > avgBri + 45) ink++;
    }
    return (ink / nAll) > 0.27;
  } catch { return false; }
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PDFTextItem {
  id: string;
  originalText: string;
  x: number; y: number;
  width: number; height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  color: string;    // sampled from offscreen canvas
  editable: boolean; // false for emoji-containing items
  isLink: boolean;
  linkUrl: string;
}

interface PDFPageData {
  index: number;
  canvasDataUrl: string; // offscreen only — never rendered as <img> in the editor
  width: number;
  height: number;
  textItems: PDFTextItem[];
}

const TARGET_WIDTH = 816;

// ─── Text span (editable) ──────────────────────────────────────────────────────
/**
 * Single-div overlay design — avoids conditional-rendering ref timing bugs:
 *  - The div is always mounted; contentEditable toggles via state.
 *  - Not editing: color transparent → PDF canvas text shows through.
 *    Hover = blue tint to reveal the clickable area.
 *  - Editing: white cover sibling hides original PDF text; the div shows
 *    the editable text with matching font/size/style/color from the PDF.
 */

interface TextItemProps {
  item: PDFTextItem;
  currentText: string;
  isEdited: boolean;
  onChange: (id: string, text: string) => void;
}

const PDFTextSpan: React.FC<TextItemProps> = ({ item, currentText, isEdited, onChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  // coverW: max of (original PDF text width) and (actual CSS-rendered text width).
  // Ensures the white cover fully erases the canvas text even when CSS font metrics
  // differ from the PDF font (e.g., fallback Arial wider than embedded Calibri).
  const [coverW, setCoverW] = useState(item.width);
  useLayoutEffect(() => {
    if (ref.current) setCoverW(Math.max(item.width, ref.current.scrollWidth));
  }, [item.width, currentText, item.fontFamily, item.fontSize, item.fontWeight]);

  // Keep text in sync when NOT editing (undo/redo updates propagate here)
  useEffect(() => {
    if (ref.current && !editing) ref.current.textContent = currentText;
  }, [currentText, editing]);

  // Focus + select-all on edit start
  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      try {
        const r = document.createRange();
        r.selectNodeContents(ref.current);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(r);
      } catch { /* selection optional */ }
    }
  }, [editing]);

  // Emoji / non-editable: PDF canvas shows it — no overlay needed
  if (!item.editable) return null;

  const commitEdit = () => {
    const newText = ref.current?.textContent ?? '';
    setEditing(false);
    onChange(item.id, newText);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (ref.current) ref.current.textContent = currentText;
      ref.current?.blur();
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ref.current?.blur(); }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'y')) e.stopPropagation();
  };

  // Show text (and cover original) whenever the item has been edited OR is being edited
  const showEdited = isEdited || editing;
  const coverPad = 3;

  return (
    <>
      {/* White cover — hides the original PDF canvas text when we're showing edited text */}
      {showEdited && (
        <div style={{
          position: 'absolute',
          left: item.x - coverPad, top: item.y - 2,
          width: coverW + coverPad * 2, height: item.height + 4,
          background: 'white', zIndex: 10, borderRadius: 2,
          pointerEvents: 'none',
        }} />
      )}

      {/* Always-mounted interactive span */}
      <div
        ref={ref}
        contentEditable={editing || undefined}
        suppressContentEditableWarning
        onClick={() => { if (!editing) setEditing(true); }}
        onBlur={editing ? commitEdit : undefined}
        onKeyDown={editing ? onKeyDown : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={item.isLink ? `Link: ${item.linkUrl}` : 'Click to edit'}
        style={{
          position: 'absolute',
          left: item.x, top: item.y,
          minWidth: Math.max(item.width, 8), height: item.height,
          fontSize: item.fontSize,
          fontWeight: item.fontWeight,
          fontStyle: item.fontStyle,
          fontFamily: item.fontFamily,
          lineHeight: 1, whiteSpace: 'pre',
          outline: 'none', borderRadius: 2, padding: '0 1px',
          // Show actual color when edited/editing; transparent otherwise (PDF shows through)
          color: showEdited ? item.color : 'transparent',
          background: editing
            ? 'rgba(239,246,255,0.97)'
            : isEdited && hovered
            ? 'rgba(99,102,241,0.08)'
            : hovered
            ? 'rgba(99,102,241,0.13)'
            : 'transparent',
          boxShadow: editing
            ? '0 0 0 1.5px rgba(99,102,241,0.55)'
            : isEdited
            ? '0 0 0 1px rgba(34,197,94,0.4)'
            : hovered
            ? '0 0 0 1px rgba(99,102,241,0.3)'
            : 'none',
          // Edited text sits above the white cover (z 10); editing goes even higher
          zIndex: editing ? 30 : showEdited ? 11 : hovered ? 5 : 2,
          cursor: editing ? 'text' : 'pointer',
          userSelect: editing ? 'text' : 'none',
        }}
      />
    </>
  );
};

// ─── Sidebar snapshot card ─────────────────────────────────────────────────────

const SnapshotCard: React.FC<{
  snap: PDFEditSnapshot;
  onRestore: () => void;
  onDelete: () => void;
  onRename: (label: string) => void;
}> = ({ snap, onRestore, onDelete, onRename }) => {
  const [editing, setEditing]           = useState(false);
  const [label, setLabel]               = useState(snap.label);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmDel, setConfirmDel]     = useState(false);

  const diff = Date.now() - snap.timestamp;
  const timeStr = diff < 60_000 ? 'Just now'
    : diff < 3_600_000 ? `${Math.floor(diff / 60_000)}m ago`
    : new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const commit = () => { const t = label.trim(); if (t && t !== snap.label) onRename(t); setEditing(false); };

  return (
    <div className="group bg-gray-50 border border-gray-200 rounded-xl p-2.5 hover:border-gray-300 transition-all">
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Save size={11} className="text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <input autoFocus value={label} onChange={e => setLabel(e.target.value)}
              onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
              className="w-full text-xs border border-indigo-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 mb-0.5" />
          ) : (
            <p onClick={() => setEditing(true)} title="Click to rename"
              className="text-xs font-medium text-gray-700 truncate cursor-text hover:text-indigo-600 transition-colors leading-tight">
              {snap.label}
            </p>
          )}
          <p className="text-[10px] text-gray-400 mt-0.5">{snap.editCount} edit{snap.editCount !== 1 ? 's' : ''} · {timeStr}</p>
        </div>
        <div className="flex flex-col gap-1 items-end flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {confirmRestore ? (
            <div className="flex flex-col items-end gap-1">
              <p className="text-[9px] text-red-600 font-medium leading-tight text-right max-w-24">Replaces edits.<br />Irreversible.</p>
              <div className="flex gap-1">
                <button onClick={() => { setConfirmRestore(false); onRestore(); }} className="px-1.5 py-0.5 rounded text-[9px] bg-red-500 text-white font-semibold hover:bg-red-600">Restore</button>
                <button onClick={() => setConfirmRestore(false)} className="px-1.5 py-0.5 rounded text-[9px] bg-gray-200 text-gray-600 hover:bg-gray-300">Cancel</button>
              </div>
            </div>
          ) : confirmDel ? (
            <div className="flex gap-1">
              <button onClick={onDelete} className="p-1 rounded bg-red-500 text-white hover:bg-red-600"><Check size={10} /></button>
              <button onClick={() => setConfirmDel(false)} className="p-1 rounded bg-gray-200 text-gray-500 hover:bg-gray-300 text-[10px]">✕</button>
            </div>
          ) : (
            <div className="flex gap-1">
              <button onClick={() => setConfirmRestore(true)} title="Restore" className="p-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"><RotateCcw size={10} /></button>
              <button onClick={() => setConfirmDel(true)} title="Delete" className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50"><Trash2 size={10} /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────────────────────────

export const PDFEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { pdfFile, clearPdfFile, history, saveSnapshot, deleteSnapshot, renameSnapshot } = usePDFEditorStore();

  const [pages, setPages]                     = useState<PDFPageData[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [loadingProgress, setLoadingProgress] = useState('');
  const [error, setError]                     = useState<string | null>(null);
  const [zoom, setZoom]                       = useState(1);
  const [editedTexts, setEditedTexts]         = useState<Record<string, string>>({});
  const [showBackWarning, setShowBackWarning] = useState(false);
  const [downloading, setDownloading]         = useState(false);

  // ── Undo / Redo ─────────────────────────────────────────────────────────────
  const [undoStack, setUndoStack] = useState<Record<string, string>[]>([]);
  const [redoStack, setRedoStack] = useState<Record<string, string>[]>([]);
  const editedRef = useRef(editedTexts);
  useEffect(() => { editedRef.current = editedTexts; }, [editedTexts]);

  const undo = useCallback(() => {
    setUndoStack(s => {
      if (!s.length) return s;
      const prev = s[s.length - 1];
      setRedoStack(r => [editedRef.current, ...r.slice(0, 49)]);
      setEditedTexts(prev);
      return s.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setRedoStack(s => {
      if (!s.length) return s;
      const next = s[0];
      setUndoStack(r => [...r.slice(-49), editedRef.current]);
      setEditedTexts(next);
      return s.slice(1);
    });
  }, []);

  const undoRef = useRef(undo); const redoRef = useRef(redo);
  useEffect(() => { undoRef.current = undo; }, [undo]);
  useEffect(() => { redoRef.current = redo; }, [redo]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.isContentEditable || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') { e.preventDefault(); undoRef.current(); }
      if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redoRef.current(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // ── Save prompt ──────────────────────────────────────────────────────────────
  const [savingLabel, setSavingLabel] = useState(false);
  const [draftLabel, setDraftLabel]   = useState('');
  const commitSave = () => {
    saveSnapshot(editedRef.current, draftLabel.trim() || undefined);
    setSavingLabel(false);
    toast.success('Snapshot saved', { icon: '✅', duration: 2000 });
  };

  // ── PDF loading ──────────────────────────────────────────────────────────────

  const loadAbortRef = useRef(false);

  useEffect(() => {
    if (!pdfFile) { navigate('/editor', { replace: true }); return; }
    loadAbortRef.current = false;
    loadPDF(pdfFile);
    return () => { loadAbortRef.current = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfFile]);

  const loadPDF = async (file: File) => {
    setLoading(true); setError(null);
    setEditedTexts({}); setUndoStack([]); setRedoStack([]); setPages([]);
    try {
      setLoadingProgress('Loading PDF.js…');
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      const arrayBuffer = await file.arrayBuffer();
      setLoadingProgress('Parsing document…');
      let pdf;
      try { pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise; }
      catch { throw new Error('Could not read PDF — it may be password-protected or corrupted.'); }

      const results: PDFPageData[] = [];

      for (let p = 1; p <= pdf.numPages; p++) {
        if (loadAbortRef.current) { pdf.destroy(); return; }
        setLoadingProgress(`Page ${p}/${pdf.numPages} — sampling colors…`);
        const page = await pdf.getPage(p);

        const naturalVp = page.getViewport({ scale: 1 });
        const scale     = TARGET_WIDTH / naturalVp.width;
        const viewport  = page.getViewport({ scale });

        // ── Offscreen render at device pixel ratio for crisp display ────────
        const dpr    = window.devicePixelRatio || 1;
        const cssW   = Math.round(viewport.width);
        const cssH   = Math.round(viewport.height);
        const canvas = document.createElement('canvas');
        canvas.width  = cssW * dpr;
        canvas.height = cssH * dpr;
        const ctx = canvas.getContext('2d')!;
        ctx.scale(dpr, dpr);
        await page.render({ canvasContext: ctx, viewport }).promise;
        const canvasDataUrl = canvas.toDataURL('image/png');
        // Release canvas backing store immediately after data URL is captured
        canvas.width = 0; canvas.height = 0;

        // ── Text extraction ──────────────────────────────────────────────────
        const textContent = await page.getTextContent();
        const vt = Array.from(viewport.transform) as number[];
        const textItems: PDFTextItem[] = [];

        for (const rawItem of textContent.items) {
          if (!('str' in rawItem)) continue;
          const item = rawItem as {
            str: string; transform: number[]; width: number; height: number; fontName: string;
          };
          if (!item.str.trim()) continue;

          const tx    = matMul(matMul(vt, Array.from(item.transform)), [1, 0, 0, -1, 0, 0]);
          const fontH = Math.sqrt(tx[2]*tx[2] + tx[3]*tx[3]);
          if (fontH < 4) continue;

          const itemX = tx[4];
          // 0.78 ≈ average CSS ascender ratio across Arial/Georgia/Courier web-safe fonts;
          // positions the div top so the text baseline lands at tx[5] (PDF baseline in CSS px).
          const itemY = tx[5] - fontH * 0.78;
          const itemW = Math.max(item.width * scale, item.str.length * fontH * 0.55);

          // ctx.scale(dpr,dpr) shifts drawing coords; getImageData uses physical px → multiply
          const phX = itemX * dpr, phY = itemY * dpr, phW = itemW * dpr, phH = fontH * dpr;
          const color    = sampleTextColor(ctx, phX, phY, phW, phH);
          const editable = !containsEmoji(item.str);

          // Bold: font-name pattern (fast) OR canvas pixel density (catches embedded/subset names)
          const isBoldText = isBoldFont(item.fontName) || sampleIsBold(ctx, phX, phY, phW, phH);

          textItems.push({
            id: nanoid(),
            originalText: item.str,
            x: itemX, y: itemY,
            width: itemW, height: fontH,
            // PDF.js renders the canvas with font-size = fontH (em-square); CSS must match.
            fontSize: fontH,
            fontFamily: mapFontFamily(item.fontName),
            fontWeight: isBoldText              ? 'bold'   : 'normal',
            fontStyle:  isItalicFont(item.fontName) ? 'italic' : 'normal',
            color,
            editable,
            isLink: false, linkUrl: '',
          });
        }

        // ── Link annotation extraction ───────────────────────────────────────
        try {
          const annotations = await page.getAnnotations({ intent: 'display' });
          for (const ann of annotations) {
            if (ann.subtype !== 'Link') continue;
            const rawUrl: string = ann.url ?? ann.unsafeUrl ?? '';
            // Only allow http(s) URLs — block javascript:, data:, etc.
            if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) continue;
            const url = rawUrl;
            const vr = viewport.convertToViewportRectangle(ann.rect);
            const lx = Math.min(vr[0], vr[2]), ly = Math.min(vr[1], vr[3]);
            const lw = Math.abs(vr[2]-vr[0]),  lh = Math.abs(vr[3]-vr[1]);
            for (const ti of textItems) {
              if (ti.x < lx+lw+6 && ti.x+ti.width > lx-6 && ti.y < ly+lh+6 && ti.y+ti.height > ly-6) {
                ti.isLink = true; ti.linkUrl = url;
              }
            }
          }
        } catch { /* annotations optional */ }

        // Store CSS pixel dimensions (not the DPR-upscaled canvas dimensions)
        results.push({ index: p-1, canvasDataUrl, width: cssW, height: cssH, textItems });
        page.cleanup();
      }

      pdf.destroy();
      if (!loadAbortRef.current) setPages(results);
    } catch (err) {
      if (!loadAbortRef.current) {
        const msg = err instanceof Error ? err.message : 'Failed to load PDF.';
        setError(msg);
      }
    } finally {
      if (!loadAbortRef.current) { setLoading(false); setLoadingProgress(''); }
    }
  };

  // ── Edit handler ─────────────────────────────────────────────────────────────

  const handleTextChange = useCallback((id: string, text: string) => {
    const prev     = editedRef.current;
    const original = pages.flatMap(p => p.textItems).find(i => i.id === id)?.originalText ?? '';
    const next: Record<string, string> = text === original
      ? (() => { const n = { ...prev }; delete n[id]; return n; })()
      : { ...prev, [id]: text };
    if (JSON.stringify(next) !== JSON.stringify(prev)) {
      setUndoStack(s => [...s.slice(-49), prev]);
      setRedoStack([]);
    }
    setEditedTexts(next);
  }, [pages]);

  const handleReset = () => {
    setUndoStack(s => [...s, editedRef.current]);
    setRedoStack([]);
    setEditedTexts({});
  };

  // ── Fused PDF export ─────────────────────────────────────────────────────────
  /**
   * Build a hidden print DOM:
   *   Each page = <img> (original canvas — preserves all PDF graphics/colors/emojis)
   *             + white-cover divs + new-text divs for every edited item.
   * Activate body[data-pdf-printing] → CSS hides app shell.
   * window.print() → browser produces vector-composited PDF.
   */
  const handleDownload = async () => {
    if (!pages.length || downloading) return;
    setDownloading(true);

    const printRoot = document.createElement('div');
    printRoot.id = 'pdf-print-root';

    for (const page of pages) {
      const pageEl = document.createElement('div');
      pageEl.style.cssText = [
        `position:relative`,
        `width:${page.width}px`,
        `height:${page.height}px`,
        `background:white`,
        `overflow:hidden`,
      ].join(';');

      // Original PDF canvas → preserves all graphics, colors, emojis, layout
      const bg = document.createElement('img');
      bg.src = page.canvasDataUrl;
      bg.style.cssText = `position:absolute;top:0;left:0;width:${page.width}px;height:${page.height}px;display:block;`;
      pageEl.appendChild(bg);

      // Overlay only EDITED items: white cover (erases old text from canvas) + new text
      for (const item of page.textItems) {
        if (!(item.id in editedTexts)) continue;

        const cover = document.createElement('div');
        cover.style.cssText = [
          `position:absolute`,
          `left:${item.x - 2}px`,
          `top:${item.y - 1}px`,
          `width:${item.width + 8}px`,
          `height:${item.height + 3}px`,
          `background:white`,
          `z-index:1`,
        ].join(';');
        pageEl.appendChild(cover);

        const span = document.createElement('div');
        span.textContent = editedTexts[item.id];
        span.style.cssText = [
          `position:absolute`,
          `left:${item.x}px`,
          `top:${item.y}px`,
          `min-width:${item.width}px`,
          `height:${item.height}px`,
          `font-size:${item.fontSize}px`,
          `font-weight:${item.fontWeight}`,
          `font-style:${item.fontStyle}`,
          `font-family:${item.fontFamily}`,
          `line-height:1.25`,
          `white-space:pre`,
          `color:${item.color}`,
          `padding:0 1px`,
          `z-index:2`,
        ].join(';');
        pageEl.appendChild(span);
      }

      printRoot.appendChild(pageEl);
    }

    document.body.appendChild(printRoot);
    document.body.setAttribute('data-pdf-printing', '1');

    try {
      await new Promise<void>(resolve => {
        let settled = false;
        let safetyTimer: ReturnType<typeof setTimeout>;
        const cleanup = () => {
          if (settled) return;
          settled = true;
          clearTimeout(safetyTimer);
          window.removeEventListener('afterprint', cleanup);
          document.body.removeAttribute('data-pdf-printing');
          printRoot.remove();
          resolve();
        };
        window.addEventListener('afterprint', cleanup);
        safetyTimer = setTimeout(cleanup, 5 * 60 * 1000);
        setTimeout(() => { try { window.print(); } catch { cleanup(); } }, 80);
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleBack = () => {
    if (Object.keys(editedTexts).length > 0) {
      setShowBackWarning(true);
      return;
    }
    clearPdfFile();
    navigate('/editor');
  };

  const confirmBack = () => { clearPdfFile(); navigate('/editor'); };

  const editCount  = Object.keys(editedTexts).length;
  const totalItems = pages.reduce((s, p) => s + p.textItems.filter(i => i.editable).length, 0);
  const emojiCount = pages.reduce((s, p) => s + p.textItems.filter(i => !i.editable).length, 0);

  if (!pdfFile) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#f1f3f5', fontFamily: 'Inter,sans-serif' }}>

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center gap-3 px-4 flex-shrink-0 shadow-sm z-10">
        <button onClick={handleBack} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors flex-shrink-0">
          <ArrowLeft size={16} /><span className="hidden sm:inline">Back</span>
        </button>
        <div className="h-5 w-px bg-gray-200 flex-shrink-0" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center">
            <FileText size={14} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 leading-none">PDF Direct Editor</p>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5 max-w-48 truncate">{pdfFile.name}</p>
          </div>
          <div className="hidden lg:flex items-center gap-2 ml-1">
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-0.5 select-none" title="Made for last-minute edits — spot a spelling error or a stray word, fix it in seconds">
              <span>✦</span> Last-minute edits, in seconds
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 select-none" title="This editor overlays text on a fixed PDF canvas. Editing existing words is safe; adding new words can push text outside its original bounding box and break the layout.">
              <span>⚠</span> Edit existing text only — adding words may break layout
            </span>
          </div>
        </div>
        <div className="flex-1" />

        {/* Zoom */}
        <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1.5">
          <button onClick={() => setZoom(z => Math.max(0.4, +(z-0.1).toFixed(1)))} className="p-1 rounded hover:bg-gray-200 text-gray-500 transition-colors" title="Zoom out"><ZoomOut size={13} /></button>
          <span className="text-xs text-gray-600 font-semibold w-10 text-center select-none">{Math.round(zoom*100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, +(z+0.1).toFixed(1)))} className="p-1 rounded hover:bg-gray-200 text-gray-500 transition-colors" title="Zoom in"><ZoomIn size={13} /></button>
        </div>

        {/* Download — triggers fused print */}
        <button onClick={handleDownload} disabled={loading || downloading || !pages.length}
          className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0">
          <Download size={14} /><span className="hidden sm:inline">Save as PDF</span>
        </button>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Canvas area — HTML-only, no canvas img displayed */}
        <main className="flex-1 overflow-auto flex flex-col items-center py-8 px-4">

          <AnimatePresence>
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 mt-20">
                <Loader2 size={36} className="animate-spin text-red-500" />
                <p className="text-gray-700 font-medium text-sm">{loadingProgress || 'Loading…'}</p>
                <p className="text-gray-400 text-xs">Extracting text, colors and links from PDF</p>
              </motion.div>
            )}
          </AnimatePresence>

          {error && !loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 mt-20 p-8 bg-white rounded-2xl shadow-sm max-w-md text-center">
              <AlertTriangle size={36} className="text-red-500" />
              <p className="font-semibold text-gray-800">Failed to load PDF</p>
              <p className="text-sm text-gray-500">{error}</p>
              <button onClick={handleBack} className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 underline">Go back</button>
            </motion.div>
          )}

          {!loading && !error && pages.length > 0 && (
            <div style={{
              transform: `scale(${zoom})`, transformOrigin: 'top center',
              marginBottom: `${(zoom-1) * pages.reduce((s, p) => s+p.height+28, 0)}px`,
            }}>
              {pages.map(page => (
                <div key={page.index} className="shadow-2xl mb-7"
                  style={{ width: page.width, height: page.height, position: 'relative', background: 'white' }}>
                  {/* PDF canvas rendered as background — preserves all graphics, colors, emojis */}
                  <img
                    src={page.canvasDataUrl}
                    alt=""
                    style={{ position: 'absolute', top: 0, left: 0, width: page.width, height: page.height, display: 'block', pointerEvents: 'none' }}
                  />
                  {/* Transparent text overlays — hover to highlight, click to edit */}
                  {page.textItems.map(item => (
                    <PDFTextSpan key={item.id} item={item}
                      currentText={editedTexts[item.id] ?? item.originalText}
                      isEdited={item.id in editedTexts}
                      onChange={handleTextChange}
                    />
                  ))}
                  {pages.length > 1 && (
                    <div className="absolute top-2 right-2 text-[9px] text-white/70 bg-black/30 px-2 py-0.5 rounded pointer-events-none select-none" style={{ zIndex: 40 }}>
                      {page.index+1}/{pages.length}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>

        {/* ── Sidebar ────────────────────────────────────────────────────────── */}
        <aside className="w-72 bg-white border-l border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-5">

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
              <Info size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-800 leading-tight">Text-only editor</p>
                <p className="text-[10px] text-amber-700 mt-1 leading-relaxed">
                  Hover over text to highlight, click to edit. Graphics, layout, and emoji are preserved from the original PDF.
                  To add new content, use the{' '}
                  <button onClick={handleBack} className="underline font-medium hover:text-amber-900 transition-colors">template editor</button>.
                </p>
              </div>
            </div>

            {/* Edit controls */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Edit Controls</h3>
              <div className="flex gap-2">
                <button onClick={undo} disabled={!undoStack.length}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Undo (Ctrl+Z)">
                  <Undo2 size={12} /> Undo
                </button>
                <button onClick={redo} disabled={!redoStack.length}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Redo (Ctrl+Y)">
                  <Redo2 size={12} /> Redo
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-400">Ctrl+Z · Ctrl+Y · {undoStack.length} steps</p>
                {editCount > 0 && (
                  <button onClick={handleReset} className="text-[10px] text-red-400 hover:text-red-600 transition-colors flex items-center gap-1">
                    <RotateCcw size={9} /> Reset ({editCount})
                  </button>
                )}
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Save history */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Save History</h3>
                <span className="text-[10px] text-gray-400">{history.length}/20</span>
              </div>

              {savingLabel ? (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                  <p className="text-[10px] text-gray-500 font-medium">Name this snapshot</p>
                  <input autoFocus value={draftLabel} onChange={e => setDraftLabel(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitSave(); if (e.key === 'Escape') setSavingLabel(false); }}
                    className="w-full text-xs border border-indigo-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="Snapshot name…" />
                  <div className="flex gap-2">
                    <button onClick={commitSave} className="flex-1 text-xs bg-indigo-600 text-white rounded-lg py-1.5 hover:bg-indigo-700 transition-colors font-medium">Save</button>
                    <button onClick={() => setSavingLabel(false)} className="flex-1 text-xs bg-gray-100 text-gray-600 rounded-lg py-1.5 hover:bg-gray-200 transition-colors">Cancel</button>
                  </div>
                </motion.div>
              ) : (
                <button
                  onClick={() => { setDraftLabel(`Save ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`); setSavingLabel(true); }}
                  disabled={editCount === 0}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-gray-300 text-xs text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  <Save size={12} /> Save snapshot
                </button>
              )}

              {history.length === 0 && (
                <div className="text-center py-4">
                  <Clock size={20} className="text-gray-200 mx-auto mb-1" />
                  <p className="text-[10px] text-gray-400">No snapshots saved yet.</p>
                </div>
              )}

              <div className="space-y-1.5">
                {history.map(snap => (
                  <SnapshotCard key={snap.id} snap={snap}
                    onRestore={() => setEditedTexts({ ...snap.editedTexts })}
                    onDelete={() => deleteSnapshot(snap.id)}
                    onRename={label => renameSnapshot(snap.id, label)}
                  />
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar footer */}
          {!loading && pages.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2 text-[10px] text-gray-400 flex-shrink-0 space-y-0.5">
              <div className="flex items-center justify-between">
                <span>{pages.length}p · {totalItems} editable · {emojiCount} static</span>
                {editCount > 0 && <span className="text-green-600 font-medium">{editCount} edited</span>}
              </div>
              {!editCount && <p className="text-gray-300">Click any text field to edit</p>}
            </div>
          )}
        </aside>

      </div>

      {/* ── Back-navigation warning modal ────────────────────────────────────── */}
      <AnimatePresence>
        {showBackWarning && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
            onClick={() => setShowBackWarning(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <AlertTriangle size={22} className="text-amber-500" />
              </div>

              <h2 className="text-base font-semibold text-gray-900 mb-1">Save before leaving?</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-1">
                You have <span className="font-semibold text-gray-700">{Object.keys(editedTexts).length} unsaved edit{Object.keys(editedTexts).length !== 1 ? 's' : ''}</span>.
              </p>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">
                Snapshots are session-only and will be gone once you leave. Download your PDF first to keep your changes.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowBackWarning(false); handleDownload(); }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                >
                  <Download size={14} /> Save as PDF
                </button>
                <button
                  onClick={() => setShowBackWarning(false)}
                  className="flex-1 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl transition-colors"
                >
                  Keep editing
                </button>
              </div>

              <button
                onClick={confirmBack}
                className="mt-3 w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
              >
                Leave without saving
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
